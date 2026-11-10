import { supabase } from '@/lib/AuthContext';

async function request(path, options = {}) {
  if (!supabase) throw new Error('Supabase sign-in is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error('Your session expired. Sign in again.');
  const response = await fetch(`/api/ccd/documents${path}`, {
    ...options,
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...options.headers },
    cache: 'no-store',
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || `Document request failed (${response.status}).`);
  return body;
}

export const ccdDocumentsApi = {
  list: (leadId) => request(`?leadId=${encodeURIComponent(leadId)}`),
  requestChecklist: (leadId, types) => request('/request', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ leadId, types }),
  }),
  upload: (leadId, type, file) => request(`/upload/${encodeURIComponent(leadId)}/${encodeURIComponent(type)}`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/octet-stream',
      'X-File-Name': encodeURIComponent(file.name),
      'X-File-Type': file.type,
    },
    body: file,
  }),
  signedDownload: (id) => request(`/${encodeURIComponent(id)}/download`),
  remove: (id) => request(`/${encodeURIComponent(id)}`, { method: 'DELETE' }),
};
