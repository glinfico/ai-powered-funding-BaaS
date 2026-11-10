import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Users, Search, FolderLock, RefreshCw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';
import { crmApi } from '@/lib/crmApi';
import { useAuth } from '@/lib/AuthContext';

const cell = (value) => value === null || value === undefined || value === '' ? '—' : String(value);

// Private CCD view. Never invent missing rows or substitute demo scores.
// A source table with 10,000 rows gives 400 pages at 25 rows per page.
export default function VerifiedLeads() {
  const { user } = useAuth();
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [result, setResult] = useState({ data: [], count: 0 });
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [field, setField] = useState('company_name');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [refreshKey, setRefreshKey] = useState(0);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); setQuery(search.trim()); }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError('');
    crmApi.leads({ limit: pageSize, offset: (page - 1) * pageSize, q: query, field })
      .then((response) => {
        if (!active) return;
        const count = Number(response.count) || 0;
        setResult({ data: response.data || [], count });
        if (page > Math.max(1, Math.ceil(count / pageSize))) setPage(Math.max(1, Math.ceil(count / pageSize)));
      })
      .catch((err) => { if (active) { setResult({ data: [], count: 0 }); setError(err.message); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, pageSize, query, field, refreshKey]);

  const pageCount = Math.max(1, Math.ceil(result.count / pageSize));
  const canManageDocs = ['admin', 'staff'].includes(user?.role);
  const start = result.count ? (page - 1) * pageSize + 1 : 0;
  const end = Math.min(page * pageSize, result.count);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 md:p-8">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Users className="h-6 w-6 text-amber-500" />Leads</h1>
          <p className="text-sm text-slate-500">{loading ? 'Loading records…' : error ? 'Lead count unavailable' : `${result.count.toLocaleString()} ${query ? 'matching' : 'stored'} leads`} · page {page} of {pageCount}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          {canManageDocs && <Link to="/crm/bank-leads" className="rounded-xl bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950">Bank leads imports →</Link>}
          <button onClick={() => setRefreshKey((key) => key + 1)} className="flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-4 py-2 text-sm font-bold text-slate-700"><RefreshCw className="h-4 w-4" />Refresh</button>
        </div>
      </div>
      <div className="rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="ccd-lead-filter" className="mb-1 block text-xs font-bold text-slate-500">Search the full leads table</label>
        <div className="flex flex-wrap items-center gap-2">
          <Search className="h-4 w-4 text-slate-400" />
          <select value={field} onChange={(event) => { setField(event.target.value); setPage(1); }} aria-label="Search field" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value="company_name">Company</option><option value="contact_name">Contact</option><option value="email">Email</option>
          </select>
          <input id="ccd-lead-filter" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search existing records"
            className="min-w-48 flex-1 bg-transparent text-sm outline-none" />
          <select value={pageSize} onChange={(event) => { setPageSize(Number(event.target.value)); setPage(1); }} aria-label="Leads per page" className="rounded-lg border border-slate-300 px-2 py-1.5 text-sm">
            <option value={25}>25 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option>
          </select>
        </div>
      </div>
      {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700"><AlertCircle className="h-5 w-5" />{error} · No test records were substituted.</div>}
      <div className="overflow-x-auto rounded-xl border border-slate-200 bg-white">
        <table className="w-full min-w-[780px] text-left text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase tracking-wide text-slate-500">
            <th className="px-4 py-3">Company / ID</th><th className="px-4 py-3">Contact</th><th className="px-4 py-3">Email</th><th className="px-4 py-3">Requested</th><th className="px-4 py-3">Status</th>{canManageDocs && <th className="px-4 py-3">Documents</th>}
          </tr></thead>
          <tbody>
            {!loading && result.data.map((lead) => <tr key={lead.id} className="border-b border-slate-100 hover:bg-slate-50">
              <td className="px-4 py-3"><span className="font-semibold">{cell(lead.company_name || lead.business_name)}</span><span className="block text-xs text-slate-400">#{cell(lead.id)}</span></td>
              <td className="px-4 py-3">{cell(lead.contact_name)}</td>
              <td className="px-4 py-3">{cell(lead.email)}</td>
              <td className="px-4 py-3">{cell(lead.requested_amount || lead.loan_amount)}</td>
              <td className="px-4 py-3">{cell(lead.status)}</td>
              {canManageDocs && <td className="px-4 py-3"><Link to={`/crm/documents?leadId=${encodeURIComponent(lead.id)}`} className="inline-flex items-center gap-1 font-bold text-amber-700 hover:underline"><FolderLock className="h-4 w-4" />DPE</Link></td>}
            </tr>)}
            {!loading && !error && !result.data.length && <tr><td colSpan={canManageDocs ? 6 : 5} className="px-4 py-12 text-center text-slate-500">{query ? 'No existing leads match this search.' : 'No leads found in the existing source table. A load-test run elsewhere does not import prospects here.'}</td></tr>}
            {loading && <tr><td colSpan={canManageDocs ? 6 : 5} className="px-4 py-8 text-center text-slate-500">Loading page {page}…</td></tr>}
          </tbody>
        </table>
        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 bg-slate-50 p-3 text-xs text-slate-600">
          <span>{error ? 'Source table unavailable' : `Showing ${start.toLocaleString()}–${end.toLocaleString()} of ${result.count.toLocaleString()} ${query ? 'matching ' : ''}records · page ${page} of ${pageCount}`}</span>
          <nav aria-label="Leads pages" className="flex items-center gap-2">
            <button onClick={() => setPage(1)} disabled={loading || page <= 1} className="rounded-lg border border-slate-300 bg-white px-2 py-2 font-bold disabled:opacity-40">First</button>
            <button onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={loading || page <= 1} className="rounded-lg border border-slate-300 bg-white p-2 disabled:opacity-40" aria-label="Previous page"><ChevronLeft className="h-4 w-4" /></button>
            <input aria-label="Jump to page" type="number" min={1} max={pageCount} value={page} onChange={(event) => {
              const next = Number(event.target.value);
              if (Number.isInteger(next) && next >= 1 && next <= pageCount) setPage(next);
            }} className="w-16 rounded-lg border border-slate-300 bg-white px-2 py-2 text-center" />
            <button onClick={() => setPage((p) => Math.min(pageCount, p + 1))} disabled={loading || page >= pageCount} className="rounded-lg border border-slate-300 bg-white p-2 disabled:opacity-40" aria-label="Next page"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(pageCount)} disabled={loading || page >= pageCount} className="rounded-lg border border-slate-300 bg-white px-2 py-2 font-bold disabled:opacity-40">Last</button>
          </nav>
        </div>
      </div>
    </div>
  );
}
