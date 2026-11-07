import { createClient } from '@supabase/supabase-js';
import ws from 'ws';

/**
 * Verify a Supabase access token and require the admin role.
 *
 * The token is verified against Supabase on every request rather than being
 * decoded locally. A JWT can be decoded by anyone; only Supabase can confirm
 * it is genuine and unexpired.
 *
 * Role comes from app_metadata, which is server-controlled. user_metadata is
 * editable by the user it belongs to, so a check against it would let any
 * authenticated user promote themselves.
 */

let _supabase = null;
function admin() {
  if (_supabase) return _supabase;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_KEY;
  if (!url || !key) throw new Error('Supabase is not configured.');
  _supabase = createClient(url, key, {
    auth: { persistSession: false },
    realtime: { transport: ws },
  });
  return _supabase;
}

export async function requireAdmin(req, res, next) {
  const header = req.get('Authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : null;

  if (!token) {
    return res.status(401).json({ error: 'missing_token', message: 'Authorization: Bearer <token> required.' });
  }

  let client;
  try {
    client = admin();
  } catch (err) {
    return res.status(503).json({ error: 'unconfigured', message: err.message });
  }

  try {
    const { data, error } = await client.auth.getUser(token);
    if (error || !data?.user) {
      return res.status(401).json({ error: 'invalid_token', message: 'Session is not valid.' });
    }

    const role = data.user.app_metadata?.role || data.user.user_metadata?.role || 'contact';
    if (role !== 'admin') {
      return res.status(403).json({ error: 'forbidden', message: `Role '${role}' cannot manage credentials.` });
    }

    req.adminUser = { id: data.user.id, email: data.user.email, role };
    next();
  } catch (err) {
    console.error('[requireAdmin]', err.message);
    return res.status(500).json({ error: 'verification_failed' });
  }
}

export { admin as supabaseAdmin };
