import { supabase } from '@/lib/AuthContext';

async function call(path, options = {}) {
  if (!supabase) throw new Error('Supabase sign-in is not configured.');
  const { data, error } = await supabase.auth.getSession();
  if (error || !data?.session?.access_token) throw new Error('Session expired. Sign in again.');
  const response = await fetch(`/api/ccd/bank-leads${path}`, {
    ...options,
    cache: 'no-store',
    headers: { Authorization: `Bearer ${data.session.access_token}`, ...options.headers },
  });
  const body = await response.json().catch(() => ({}));
  if (!response.ok) throw new Error(body.message || body.error || `Bank leads request failed (${response.status}).`);
  return body;
}

const post = (path, value, method = 'POST') => call(path, {
  method,
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(value),
});

export const ccdBankLeadsApi = {
  list: ({ page = 1, limit = 25, q = '', field = 'company_name' } = {}) => {
    const params = new URLSearchParams({ page: String(page), limit: String(limit), field });
    if (q) params.set('q', q);
    return call(`?${params}`);
  },
  createBatch: (filename, sourceName, expectedRows) => post('/batches', { filename, sourceName, expectedRows }),
  uploadRows: (batchId, rows) => post(`/batches/${encodeURIComponent(batchId)}/rows`, { rows }),
  completeBatch: (batchId) => post(`/batches/${encodeURIComponent(batchId)}/complete`, {}, 'PATCH'),
};
