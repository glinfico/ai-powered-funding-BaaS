import express from 'express';
import { requireAdmin, supabaseAdmin } from '../middleware/requireAdmin.js';

/**
 * Server-side credential store.
 *
 * Replaces the previous arrangement, where AdminSettings.jsx wrote every
 * secret straight into browser localStorage:
 *
 *     localStorage.setItem("glinfico_paypal_secret",  paypalSecret);
 *     localStorage.setItem("glinfico_idiq_secret",    idiqSecret);
 *     localStorage.setItem("glinfico_fingoal_secret", fingoalSecret);
 *
 * Anything in localStorage is readable by any script on the page, any browser
 * extension, and anyone with access to the machine, and it persists until
 * manually cleared. A PayPal secret moves money; an IDIQ secret pulls credit
 * reports on real people. Those are the worst possible values to keep there.
 *
 * Secrets now live in a table reachable only by the service_role key, which
 * never leaves the server. The browser can write a secret and ask whether one
 * is set — it can never read one back.
 */

const SECRET_FIELDS = new Set([
  'paypal_secret',
  'idiq_secret',
  'fingoal_secret',
]);

const PUBLIC_FIELDS = new Set([
  'paypal_client_id',
  'payout_email',
  'idiq_key',
  'fingoal_key',
]);

const ALL_FIELDS = new Set([...SECRET_FIELDS, ...PUBLIC_FIELDS]);

/** Show enough to recognise a value, never enough to use it. */
function mask(value) {
  if (!value) return null;
  const s = String(value);
  if (s.length <= 4) return '••••';
  return `••••${s.slice(-4)}`;
}

export function createAdminCredentialsRouter() {
  const router = express.Router();

  /**
   * GET /api/admin/credentials
   * Returns which credentials are configured. Secret values are never
   * returned — only a masked tail so an admin can tell one key from another.
   */
  router.get('/admin/credentials', requireAdmin, async (req, res) => {
    try {
      const { data, error } = await supabaseAdmin()
        .from('platform_credentials')
        .select('key, value, updated_at');

      if (error) {
        return res.status(503).json({ error: 'store_unavailable', message: error.message });
      }

      const out = {};
      for (const row of data || []) {
        out[row.key] = SECRET_FIELDS.has(row.key)
          ? { configured: Boolean(row.value), preview: mask(row.value), updated_at: row.updated_at }
          : { configured: Boolean(row.value), value: row.value, updated_at: row.updated_at };
      }

      for (const f of ALL_FIELDS) {
        if (!(f in out)) out[f] = { configured: false, ...(SECRET_FIELDS.has(f) ? { preview: null } : { value: '' }) };
      }

      res.json({ success: true, credentials: out });
    } catch (err) {
      console.error('[admin/credentials GET]', err.message);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  /**
   * PUT /api/admin/credentials
   * Accepts any subset. An empty string clears a field; omitting a field
   * leaves it untouched, so the UI never has to resend a secret it cannot read.
   */
  router.put('/admin/credentials', requireAdmin, async (req, res) => {
    const body = req.body || {};
    const updates = [];
    const rejected = [];

    for (const [key, value] of Object.entries(body)) {
      if (!ALL_FIELDS.has(key)) {
        rejected.push(key);
        continue;
      }
      updates.push({
        key,
        value: value === null ? '' : String(value),
        updated_at: new Date().toISOString(),
        updated_by: req.adminUser.email,
      });
    }

    if (rejected.length) {
      return res.status(400).json({
        error: 'unknown_fields',
        message: `Not credential fields: ${rejected.join(', ')}`,
      });
    }
    if (!updates.length) {
      return res.status(400).json({ error: 'empty_request', message: 'No credential fields supplied.' });
    }

    try {
      const { error } = await supabaseAdmin()
        .from('platform_credentials')
        .upsert(updates, { onConflict: 'key' });

      if (error) {
        return res.status(503).json({ error: 'store_unavailable', message: error.message });
      }

      // Log the field names, never the values.
      console.log(
        `[admin/credentials] ${req.adminUser.email} updated: ${updates.map((u) => u.key).join(', ')}`
      );

      res.json({ success: true, updated: updates.map((u) => u.key) });
    } catch (err) {
      console.error('[admin/credentials PUT]', err.message);
      res.status(500).json({ error: 'internal_error' });
    }
  });

  return router;
}

/**
 * Read a credential for server-side use (PayPal calls, IDIQ pulls, …).
 * Falls back to the environment variable, so platform-level config can still
 * come from Render without going through this table.
 */
export async function getCredential(key, envFallback) {
  if (envFallback && process.env[envFallback]) return process.env[envFallback];
  try {
    const { data, error } = await supabaseAdmin()
      .from('platform_credentials')
      .select('value')
      .eq('key', key)
      .single();
    if (error || !data) return null;
    return data.value || null;
  } catch {
    return null;
  }
}
