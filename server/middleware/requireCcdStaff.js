import { supabaseAdmin } from './requireAdmin.js';

// The existing Supabase sign-in is the only sign-in. Read server-controlled
// app_metadata from the VERIFIED user; never trust editable user_metadata.
export async function requireCcdStaff(req, res, next) {
  const header = req.get('authorization') || '';
  const token = header.startsWith('Bearer ') ? header.slice(7).trim() : '';
  if (!token) return res.status(401).json({ success: false, error: 'missing_token', message: 'Sign in to the CCD first.' });
  try {
    const { data, error } = await supabaseAdmin().auth.getUser(token);
    if (error || !data?.user) return res.status(401).json({ success: false, error: 'invalid_token', message: 'Sign in again.' });
    const role = data.user.app_metadata?.role;
    if (role !== 'admin' && role !== 'staff') return res.status(403).json({ success: false, error: 'forbidden', message: 'Admin or staff permission required.' });
    req.ccdStaff = { id: data.user.id, role };
    next();
  } catch (err) {
    console.error('[CCD staff auth]', err.message);
    return res.status(503).json({ success: false, error: 'auth_unavailable', message: 'Staff authorization is unavailable.' });
  }
}
