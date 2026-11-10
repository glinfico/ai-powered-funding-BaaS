import express from 'express';
import { createHash } from 'node:crypto';
import { supabaseAdmin } from '../middleware/requireAdmin.js';
import { requireCcdStaff } from '../middleware/requireCcdStaff.js';

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const FIELDS = new Set(['companyName', 'contactName', 'email', 'phone', 'requestedAmount']);
const SEARCH_FIELDS = new Set(['company_name', 'contact_name', 'email']);
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const fail = (res, code, message, status = 400) => res.status(status).json({ success: false, error: code, message });
const limitOf = (value, fallback = 25) => Math.min(100, Math.max(1, Number.parseInt(value, 10) || fallback));

export function validateBankLeadRow(row) {
  if (!row || typeof row !== 'object' || Array.isArray(row)) throw new Error('Invalid CSV row.');
  const extras = Object.keys(row).filter(key => !FIELDS.has(key));
  // Fail rather than silently accepting sensitive columns or inventing values.
  if (extras.length) throw new Error('Unsupported or sensitive columns in import. Use only company, contact, email, phone and requested amount.');
  const email = String(row.email || '').trim().toLowerCase();
  const companyName = String(row.companyName || '').trim();
  if (!EMAIL.test(email) || email.length > 254) throw new Error('A valid email is required for every row.');
  const contactName = String(row.contactName || '').trim();
  if ((!companyName && !contactName) || companyName.length > 160) throw new Error('A company or contact name is required for every row.');
  const phone = String(row.phone || '').trim();
  const requestedAmount = String(row.requestedAmount || '').trim();
  if (contactName.length > 160 || phone.length > 40 || requestedAmount.length > 40) throw new Error('A field exceeds the approved length.');
  return { company_name: companyName, contact_name: contactName, email, phone, requested_amount: requestedAmount };
}

export function createCcdBankLeadsRouter() {
  const router = express.Router();
  router.use(requireCcdStaff);

  // Real Supabase count and server-side pagination; no fallback records.
  router.get('/', async (req, res) => {
    const limit = limitOf(req.query.limit);
    const page = Math.max(1, Number.parseInt(req.query.page, 10) || 1);
    const field = SEARCH_FIELDS.has(req.query.field) ? req.query.field : 'company_name';
    const term = String(req.query.q || '').trim().slice(0, 80).replace(/[%_\\]/g, '');
    try {
      let query = supabaseAdmin().from('ccd_bank_leads')
        .select('id,company_name,contact_name,email,phone,requested_amount,status,consent_status,source_name,batch_id,created_at', { count: 'exact' })
        .order('created_at', { ascending: false })
        .range((page - 1) * limit, page * limit - 1);
      if (term) query = query.ilike(field, `%${term}%`);
      const { data, count, error } = await query;
      if (error) throw error;
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, data: data || [], count: count ?? 0, page, limit, pageCount: Math.max(1, Math.ceil((count || 0) / limit)) });
    } catch (err) {
      console.error('[bank leads list]', err.code || err.message);
      return fail(res, 'store_unavailable', 'Bank leads storage is unavailable. Apply the bank-leads migration in staging before use.', 503);
    }
  });

  router.post('/batches', async (req, res) => {
    const filename = String(req.body?.filename || '').trim().slice(0, 120);
    const sourceName = String(req.body?.sourceName || '').trim().slice(0, 120);
    const expectedRows = Number(req.body?.expectedRows);
    if (!filename || !sourceName || !Number.isInteger(expectedRows) || expectedRows < 1 || expectedRows > 20000) {
      return fail(res, 'invalid_batch', 'Provide a filename, approved source name and 1–20,000 valid rows.');
    }
    try {
      const { data, error } = await supabaseAdmin().from('ccd_bank_import_batches')
        .insert({ original_file_name: filename, source_name: sourceName, expected_rows: expectedRows, imported_by: req.ccdStaff.id })
        .select('id,source_name,expected_rows,status,created_at').single();
      if (error) throw error;
      return res.status(201).json({ success: true, batch: data });
    } catch (err) {
      console.error('[bank import batch]', err.code || err.message);
      return fail(res, 'store_unavailable', 'Could not create an import batch.', 503);
    }
  });

  // Client sends at most 200 validated rows per request (50 requests for 10k).
  // Idempotent by normalized email: a retry or different source label does not
  // silently create a second prospect. Original source is preserved on first insert.
  router.post('/batches/:id/rows', async (req, res) => {
    if (!UUID.test(req.params.id)) return fail(res, 'invalid_batch', 'Invalid batch ID.');
    if (!Array.isArray(req.body?.rows) || req.body.rows.length < 1 || req.body.rows.length > 200) {
      return fail(res, 'invalid_rows', 'Send 1–200 rows per request.');
    }
    let clean;
    try {
      clean = req.body.rows.map(validateBankLeadRow);
      if (new Set(clean.map(row => row.email)).size !== clean.length) throw new Error('Duplicate email within this chunk.');
    } catch (err) { return fail(res, 'invalid_rows', err.message, 422); }
    try {
      const admin = supabaseAdmin();
      const { data: batch, error: batchError } = await admin.from('ccd_bank_import_batches')
        .select('id,source_name,status').eq('id', req.params.id).maybeSingle();
      if (batchError) throw batchError;
      if (!batch || batch.status !== 'uploading') return fail(res, 'invalid_batch', 'Upload batch not found or already completed.', 409);
      // Never insert an existing primary lead again.
      const { data: existing, error: existingError } = await admin.from('leads')
        .select('email').in('email', clean.map(row => row.email));
      if (existingError) throw existingError;
      const known = new Set((existing || []).map(row => String(row.email || '').toLowerCase()));
      const candidates = clean.filter(row => !known.has(row.email)).map(row => ({
        ...row,
        source_key: createHash('sha256').update(row.email).digest('hex'),
        batch_id: batch.id,
        source_name: batch.source_name,
        status: 'Pending Review',
        consent_status: 'unverified',
      }));
      let inserted = 0;
      if (candidates.length) {
        const { data, error } = await admin.from('ccd_bank_leads')
          .upsert(candidates, { onConflict: 'source_key', ignoreDuplicates: true }).select('id');
        if (error) throw error;
        inserted = (data || []).length;
      }
      return res.json({ success: true, received: clean.length, inserted, duplicates: clean.length - inserted, existingPrimary: known.size, note: 'Rows are Pending Review. No consent, scoring, messaging or credit pull was started.' });
    } catch (err) {
      console.error('[bank import rows]', err.code || err.message);
      return fail(res, 'store_unavailable', 'Could not save this chunk. Previously acknowledged chunks remain; retrying the file skips duplicates.', 503);
    }
  });

  router.patch('/batches/:id/complete', async (req, res) => {
    if (!UUID.test(req.params.id)) return fail(res, 'invalid_batch', 'Invalid batch ID.');
    try {
      const admin = supabaseAdmin();
      const { data: batch, error: batchError } = await admin.from('ccd_bank_import_batches')
        .select('id,source_name,expected_rows,status').eq('id', req.params.id).maybeSingle();
      if (batchError) throw batchError;
      if (!batch) return fail(res, 'not_found', 'Batch not found.', 404);
      const { count, error } = await admin.from('ccd_bank_leads').select('id', { count: 'exact', head: true }).eq('batch_id', batch.id);
      if (error) throw error;
      const { error: updatedError } = await admin.from('ccd_bank_import_batches')
        .update({ status: 'completed', completed_at: new Date().toISOString() }).eq('id', batch.id);
      if (updatedError) throw updatedError;
      return res.json({ success: true, batchId: batch.id, insertedThisBatch: count || 0, note: 'All inserted rows are still Pending Review. No prospect was contacted or sent to an engine.' });
    } catch (err) {
      console.error('[bank import complete]', err.code || err.message);
      return fail(res, 'store_unavailable', 'Could not finalize the import batch.', 503);
    }
  });

  return router;
}
