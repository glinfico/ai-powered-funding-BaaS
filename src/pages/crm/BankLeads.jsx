import { useEffect, useState } from 'react';
import { Upload, Search, RefreshCw, AlertTriangle, ChevronLeft, ChevronRight, Database } from 'lucide-react';
import { ccdBankLeadsApi } from '@/lib/ccdBankLeadsApi';
import { previewBankLeadsCsv } from '@/utils/parseBankLeadsCsv';

const BATCH_SIZE = 200;

export default function BankLeads() {
  const [result, setResult] = useState({ data: [], count: 0, pageCount: 1 });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(25);
  const [search, setSearch] = useState('');
  const [query, setQuery] = useState('');
  const [field, setField] = useState('company_name');
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [importing, setImporting] = useState(false);
  const [error, setError] = useState('');
  const [preview, setPreview] = useState(null);
  const [filename, setFilename] = useState('');
  const [sourceName, setSourceName] = useState('');
  const [acknowledged, setAcknowledged] = useState(false);
  const [progress, setProgress] = useState(null);
  const [outcome, setOutcome] = useState(null);

  useEffect(() => {
    const timer = setTimeout(() => { setPage(1); setQuery(search.trim()); }, 280);
    return () => clearTimeout(timer);
  }, [search]);

  useEffect(() => {
    let active = true;
    setLoading(true);
    ccdBankLeadsApi.list({ page, limit, q: query, field })
      .then((data) => { if (active) { setResult(data); setError(''); if (page > data.pageCount) setPage(data.pageCount); } })
      .catch((err) => { if (active) { setError(err.message); setResult({ data: [], count: 0, pageCount: 1 }); } })
      .finally(() => { if (active) setLoading(false); });
    return () => { active = false; };
  }, [page, limit, query, field, refresh]);

  async function inspectFile(event) {
    const file = event.target.files?.[0];
    setError(''); setOutcome(null); setPreview(null); setProgress(null); setAcknowledged(false);
    if (!file) return;
    try {
      if (!file.name.toLowerCase().endsWith('.csv') || file.size > 8 * 1024 * 1024) throw new Error('Use a CSV file no larger than 8 MB.');
      const inspected = previewBankLeadsCsv(await file.text());
      setFilename(file.name);
      setPreview(inspected);
    } catch (err) { setError(err.message); }
  }

  async function importRows() {
    if (!preview?.rows?.length || !sourceName.trim() || !acknowledged || importing) return;
    setError(''); setImporting(true); setOutcome(null);
    let inserted = 0, duplicates = 0, sent = 0;
    try {
      const { batch } = await ccdBankLeadsApi.createBatch(filename, sourceName.trim(), preview.rows.length);
      for (let index = 0; index < preview.rows.length; index += BATCH_SIZE) {
        const rows = preview.rows.slice(index, index + BATCH_SIZE);
        const outcome = await ccdBankLeadsApi.uploadRows(batch.id, rows);
        inserted += outcome.inserted;
        duplicates += outcome.duplicates;
        sent += rows.length;
        setProgress({ sent, total: preview.rows.length, inserted, duplicates, batchId: batch.id });
      }
      const completed = await ccdBankLeadsApi.completeBatch(batch.id);
      setOutcome({ inserted, duplicates, invalid: preview.invalidCount, inFileDuplicates: preview.duplicateCount, savedInBatch: completed.insertedThisBatch });
      setPreview(null);
      setRefresh((v) => v + 1);
    } catch (err) {
      setError(`${err.message} ${sent ? `${sent.toLocaleString()} rows were acknowledged; retrying this source/file skips previously saved emails.` : 'No rows have been acknowledged yet.'}`);
      setRefresh((v) => v + 1);
    } finally { setImporting(false); }
  }

  const start = result.count ? (page - 1) * limit + 1 : 0;
  const end = Math.min(page * limit, result.count);
  const pages = Math.max(1, result.pageCount || 1);

  return (
    <div className="mx-auto max-w-7xl space-y-5 p-6 md:p-8">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-black text-slate-900"><Database className="h-6 w-6 text-amber-500" />Bank Leads Import</h1>
        <p className="text-sm text-slate-500">Staff-only source intake · {loading ? 'Counting…' : `${result.count.toLocaleString()} saved rows`} · no invented loans, scores or consent.</p>
      </div>
      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <AlertTriangle className="mr-2 inline h-4 w-4" />
        Imported prospects remain <strong>Pending Review / consent unverified</strong>. This route never pulls credit, accesses banking, sends messages, or makes funding decisions. Remove SSN, DOB, credit and account numbers; those require the approved sensitive-data workflow.
      </div>
      <section className="space-y-3 rounded-xl border border-slate-200 bg-white p-5">
        <h2 className="font-bold text-slate-900">Import real CSV to private storage</h2>
        <p className="text-xs text-slate-500">Required: email and a company or contact name. Accepted: company_name, contact_name (or first_name + last_name), email, phone, requested_amount. Quoted commas and line breaks are supported; unmatched columns are ignored, sensitive columns block import.</p>
        <div className="flex flex-wrap gap-3">
          <label className="flex-1 text-sm font-medium text-slate-700">Bank/source name
            <input value={sourceName} onChange={(event) => setSourceName(event.target.value)} maxLength={120} placeholder="Source named in your supplier agreement" className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm" />
          </label>
          <label className="flex-1 text-sm font-medium text-slate-700">CSV file (8 MB max)
            <input type="file" accept=".csv,text/csv" onChange={inspectFile} className="mt-1 block w-full rounded-lg border border-slate-300 p-2 text-sm" />
          </label>
        </div>
        {preview && <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-sm">
          <p className="font-bold">Preview only — nothing saved yet</p>
          <p className="mt-1">{preview.total.toLocaleString()} data rows · <b className="text-emerald-700">{preview.valid.toLocaleString()} valid and distinct</b> · <b>{preview.duplicateCount} duplicate emails in file</b> · <b className="text-amber-700">{preview.invalidCount} invalid</b></p>
          {preview.ignoredColumns.length > 0 && <p className="mt-1 text-xs text-slate-500">Ignored non-sensitive columns: {preview.ignoredColumns.join(', ')}</p>}
          {preview.invalid.length > 0 && <p className="mt-1 text-xs text-amber-700">Sample invalid row numbers: {preview.invalid.slice(0, 8).map((row) => `${row.row} (${row.reason})`).join(', ')}</p>}
        </div>}
        <label className="flex items-start gap-2 text-xs text-slate-700">
          <input type="checkbox" checked={acknowledged} onChange={(event) => setAcknowledged(event.target.checked)} className="mt-0.5" />
          <span>I am authorized to process these prospects, the source is accurate, and I understand imported records are unverified and will not be contacted or enriched automatically.</span>
        </label>
        <button onClick={importRows} disabled={!preview?.valid || !acknowledged || !sourceName.trim() || importing} className="flex items-center gap-2 rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white disabled:opacity-40"><Upload className="h-4 w-4" />{importing ? 'Importing in 200-row chunks…' : 'Import validated rows'}</button>
        {progress && <p role="status" className="text-sm text-slate-700">Processed {progress.sent.toLocaleString()} / {progress.total.toLocaleString()} · inserted {progress.inserted.toLocaleString()} · skipped duplicates {progress.duplicates.toLocaleString()}</p>}
        {outcome && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-900">Saved {outcome.inserted.toLocaleString()} new rows. Skipped {outcome.duplicates.toLocaleString()} existing rows, {outcome.inFileDuplicates.toLocaleString()} duplicate emails within the file, and {outcome.invalid.toLocaleString()} invalid rows. Batch contains {outcome.savedInBatch.toLocaleString()} inserted rows.</p>}
      </section>
      <section className="rounded-xl border border-slate-200 bg-white">
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200 p-4">
          <label className="flex items-center gap-2"><Search className="h-4 w-4 text-slate-400" /><input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Search saved rows" aria-label="Search saved bank leads" className="w-48 text-sm outline-none" /></label>
          <select value={field} onChange={(event) => { setField(event.target.value); setPage(1); }} aria-label="Search field" className="rounded-lg border border-slate-300 p-2 text-sm"><option value="company_name">Company</option><option value="contact_name">Contact</option><option value="email">Email</option></select>
          <select value={limit} onChange={(event) => { setLimit(Number(event.target.value)); setPage(1); }} aria-label="Rows per page" className="rounded-lg border border-slate-300 p-2 text-sm"><option value={25}>25 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option></select>
          <button onClick={() => setRefresh((v) => v + 1)} aria-label="Refresh bank leads" className="rounded-lg border border-slate-300 p-2"><RefreshCw className="h-4 w-4" /></button>
        </div>
        {error && <p role="alert" className="m-4 rounded-lg bg-red-50 p-3 text-sm text-red-700">{error}</p>}
        <div className="overflow-x-auto"><table className="w-full min-w-[800px] text-left text-sm">
          <thead><tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold uppercase text-slate-500"><th className="p-3">Company / contact</th><th className="p-3">Email</th><th className="p-3">Requested</th><th className="p-3">Source</th><th className="p-3">Status</th></tr></thead>
          <tbody>
            {!loading && result.data.map((lead) => <tr key={lead.id} className="border-b border-slate-100"><td className="p-3"><b>{lead.company_name || lead.contact_name || '—'}</b><span className="block text-xs text-slate-500">{lead.contact_name}</span></td><td className="p-3">{lead.email}</td><td className="p-3">{lead.requested_amount || '—'}</td><td className="p-3">{lead.source_name}</td><td className="p-3 text-xs font-semibold text-amber-700">{lead.status} · consent {lead.consent_status}</td></tr>)}
            {!loading && !error && !result.data.length && <tr><td colSpan={5} className="p-8 text-center text-slate-500">No saved bank leads match. A browser-only upload does not create durable records.</td></tr>}
            {loading && <tr><td colSpan={5} className="p-8 text-center text-slate-500">Loading saved rows…</td></tr>}
          </tbody>
        </table></div>
        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 p-3 text-xs text-slate-600">
          <span>Showing {start.toLocaleString()}–{end.toLocaleString()} of {result.count.toLocaleString()} saved rows · page {page} of {pages}</span>
          <nav aria-label="Bank leads pages" className="flex items-center gap-1">
            <button onClick={() => setPage(1)} disabled={page <= 1 || loading} className="rounded-lg border px-2 py-1 disabled:opacity-40">First</button>
            <button onClick={() => setPage((v) => Math.max(1, v - 1))} disabled={page <= 1 || loading} aria-label="Previous page" className="rounded-lg border p-1 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <input type="number" value={page} min={1} max={pages} onChange={(event) => { const v = Number(event.target.value); if (Number.isInteger(v) && v >= 1 && v <= pages) setPage(v); }} aria-label="Jump to bank leads page" className="w-16 rounded-lg border px-2 py-1 text-center" />
            <button onClick={() => setPage((v) => Math.min(pages, v + 1))} disabled={page >= pages || loading} aria-label="Next page" className="rounded-lg border p-1 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
            <button onClick={() => setPage(pages)} disabled={page >= pages || loading} className="rounded-lg border px-2 py-1 disabled:opacity-40">Last</button>
          </nav>
        </div>
      </section>
    </div>
  );
}
