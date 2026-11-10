import express from 'express';
import { createHash, randomUUID } from 'node:crypto';
import { supabaseAdmin } from '../middleware/requireAdmin.js';
import { requireCcdStaff } from '../middleware/requireCcdStaff.js';
import { DOCUMENT_TYPES, MAX_DOCUMENT_BYTES, validateDocType, validateLeadId, validateUpload } from '../engines/dpe/validation.js';

const BUCKET = 'ccd-client-documents';
const metaColumns = 'id,lead_id,document_type,file_name,mime_type,size_bytes,sha256,uploaded_by,created_at';
const requestsColumns = 'id,lead_id,document_type,status,requested_at,received_at';

function failure(res, status, code, message) {
  return res.status(status).json({ success: false, error: code, message });
}
function safeDocumentId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(String(id || ''));
}

async function findLead(leadId) {
  const { data, error } = await supabaseAdmin().from('leads')
    .select('id,company_name,contact_name').eq('id', leadId).maybeSingle();
  if (error) throw error;
  return data;
}

export function createCcdDocumentsRouter() {
  const router = express.Router();
  router.use(requireCcdStaff);

  router.get('/', async (req, res) => {
    let leadId;
    try { leadId = validateLeadId(req.query.leadId); }
    catch { return failure(res, 400, 'invalid_lead', 'Enter a valid lead ID.'); }
    try {
      const lead = await findLead(leadId);
      if (!lead) return failure(res, 404, 'not_found', 'Lead not found.');
      const [docsResult, requestsResult] = await Promise.all([
        supabaseAdmin().from('ccd_documents').select(metaColumns).eq('lead_id', leadId).order('created_at', { ascending: false }).limit(100),
        supabaseAdmin().from('ccd_document_requests').select(requestsColumns).eq('lead_id', leadId).order('requested_at', { ascending: false }),
      ]);
      if (docsResult.error || requestsResult.error) throw docsResult.error || requestsResult.error;
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, lead, documents: docsResult.data || [], requests: requestsResult.data || [], canDelete: req.ccdStaff.role === 'admin', documentTypes: DOCUMENT_TYPES });
    } catch (err) {
      console.error('[DPE list]', err.message);
      return failure(res, 503, 'document_store_unavailable', 'Document storage is unavailable. Apply migrations/ccd_dpe_documents.sql in a staging database before use.');
    }
  });

  // Create a request checklist. Never send SMS/email: communications consent must
  // be verified separately by the existing platform before outbound contact.
  router.post('/request', async (req, res) => {
    let leadId, types;
    try {
      leadId = validateLeadId(req.body?.leadId);
      types = Array.isArray(req.body?.types) ? [...new Set(req.body.types.map(validateDocType))] : Object.keys(DOCUMENT_TYPES).filter(t => t !== 'other');
      if (!types.length) throw new Error('Select at least one document.');
    } catch (err) { return failure(res, 400, 'invalid_request', err.message); }
    try {
      const lead = await findLead(leadId);
      if (!lead) return failure(res, 404, 'not_found', 'Lead not found.');
      const { error } = await supabaseAdmin().from('ccd_document_requests').upsert(
        types.map(document_type => ({ lead_id: leadId, document_type, status: 'requested', requested_by: req.ccdStaff.id })),
        { onConflict: 'lead_id,document_type', ignoreDuplicates: true }
      );
      if (error) throw error;
      return res.json({ success: true, leadId, requested: types, message: 'Checklist saved internally. No SMS or email was sent.' });
    } catch (err) {
      console.error('[DPE request]', err.message);
      return failure(res, 503, 'document_store_unavailable', 'Cannot save document requests. Check the DPE migration.');
    }
  });

  // The global express.json() parser ignores octet-stream; scoped raw parser
  // caps uploads before any file reaches storage.
  router.post('/upload/:leadId/:type', express.raw({ type: 'application/octet-stream', limit: MAX_DOCUMENT_BYTES }), async (req, res) => {
    let leadId, type, file;
    try {
      leadId = validateLeadId(req.params.leadId);
      type = validateDocType(req.params.type);
      const rawName = decodeURIComponent(req.get('x-file-name') || 'document.pdf');
      file = validateUpload(req.body, rawName, req.get('x-file-type'));
    } catch (err) { return failure(res, 400, 'invalid_document', err.message); }
    try {
      const lead = await findLead(leadId);
      if (!lead) return failure(res, 404, 'not_found', 'Lead not found.');
      const storagePath = `${leadId}/${randomUUID()}-${file.name}`;
      const storage = supabaseAdmin().storage.from(BUCKET);
      const { error: uploadError } = await storage.upload(storagePath, req.body, { contentType: file.mime, upsert: false });
      if (uploadError) throw uploadError;

      const { data, error } = await supabaseAdmin().from('ccd_documents').insert({
        lead_id: leadId, document_type: type, file_name: file.name, mime_type: file.mime,
        size_bytes: req.body.length, storage_path: storagePath,
        sha256: createHash('sha256').update(req.body).digest('hex'), uploaded_by: req.ccdStaff.id,
      }).select(metaColumns).single();
      if (error) {
        await storage.remove([storagePath]).catch(() => {});
        throw error;
      }
      const { error: requestError } = await supabaseAdmin().from('ccd_document_requests')
        .update({ status: 'received', received_at: new Date().toISOString() })
        .eq('lead_id', leadId).eq('document_type', type);
      if (requestError) console.error('[DPE checklist update]', requestError.message);
      res.set('Cache-Control', 'no-store');
      return res.status(201).json({ success: true, document: data });
    } catch (err) {
      console.error('[DPE upload]', err.message);
      return failure(res, 503, 'document_store_unavailable', 'The private document could not be stored. Check the DPE bucket and migration.');
    }
  });

  router.get('/:id/download', async (req, res) => {
    if (!safeDocumentId(req.params.id)) return failure(res, 400, 'invalid_document', 'Invalid document ID.');
    try {
      const { data, error } = await supabaseAdmin().from('ccd_documents')
        .select('id,storage_path').eq('id', req.params.id).maybeSingle();
      if (error) throw error;
      if (!data) return failure(res, 404, 'not_found', 'Document not found.');
      const result = await supabaseAdmin().storage.from(BUCKET).createSignedUrl(data.storage_path, 60);
      if (result.error) throw result.error;
      res.set('Cache-Control', 'no-store');
      return res.json({ success: true, url: result.data.signedUrl, expiresIn: 60 });
    } catch (err) {
      console.error('[DPE download]', err.message);
      return failure(res, 503, 'document_store_unavailable', 'Document download is unavailable.');
    }
  });

  router.delete('/:id', async (req, res) => {
    if (req.ccdStaff.role !== 'admin') return failure(res, 403, 'forbidden', 'Only admins can delete documents.');
    if (!safeDocumentId(req.params.id)) return failure(res, 400, 'invalid_document', 'Invalid document ID.');
    try {
      const { data, error } = await supabaseAdmin().from('ccd_documents')
        .select('id,lead_id,document_type,storage_path').eq('id', req.params.id).maybeSingle();
      if (error) throw error;
      if (!data) return failure(res, 404, 'not_found', 'Document not found.');
      const { error: removeError } = await supabaseAdmin().storage.from(BUCKET).remove([data.storage_path]);
      if (removeError) throw removeError;
      const { error: deleteError } = await supabaseAdmin().from('ccd_documents').delete().eq('id', data.id);
      if (deleteError) throw deleteError;
      const { count, error: countError } = await supabaseAdmin().from('ccd_documents')
        .select('id', { count: 'exact', head: true }).eq('lead_id', data.lead_id).eq('document_type', data.document_type);
      if (!countError && !count) await supabaseAdmin().from('ccd_document_requests')
        .update({ status: 'requested', received_at: null }).eq('lead_id', data.lead_id).eq('document_type', data.document_type);
      return res.json({ success: true });
    } catch (err) {
      console.error('[DPE delete]', err.message);
      return failure(res, 503, 'document_store_unavailable', 'Document deletion failed.');
    }
  });

  return router;
}
