/**
 * CRM data client.
 *
 * Replaces the generated arrays the CRM screens were built on
 * (generate1000Leads, generate22KLenders, MOCK_LEADS, MOCK_FUNDERS …).
 * Everything here hits the real Supabase tables through the staff-gated
 * server API, which runs with the service_role key so RLS does not block
 * legitimate reads.
 *
 * On failure these throw. They never return invented rows — a dashboard that
 * silently shows fabricated numbers is worse than one that says it could not
 * load.
 */

import { supabase } from '@/lib/AuthContext';

async function authHeaders() {
  const { data } = await supabase.auth.getSession();
  const token = data?.session?.access_token;
  if (!token) throw new Error('Session expired — sign in again.');
  return { Authorization: `Bearer ${token}` };
}

async function get(path, params = {}) {
  const qs = new URLSearchParams(
    Object.entries(params).filter(([, v]) => v !== undefined && v !== null && v !== '')
  ).toString();
  const res = await fetch(`/api/${path}${qs ? `?${qs}` : ''}`, { headers: await authHeaders() });

  let body = null;
  try { body = await res.json(); } catch { /* non-JSON error page */ }

  if (!res.ok) {
    throw new Error(body?.message || body?.error || `Request failed (${res.status})`);
  }
  return body;
}

export const crmApi = {
  leads:       (p) => get('leads', p),
  deals:       (p) => get('deals', p),
  commissions: (p) => get('commissions', p),
  investors:   (p) => get('investors', p),
  funders:     (p) => get('funders', p),
  lenders:     (p) => get('lenders', p),
  summary:     ()  => get('crm/summary'),
};

export default crmApi;
