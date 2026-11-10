import { useCallback, useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import { FileText, FolderLock, Upload, Download, Trash2, RefreshCw, ShieldCheck } from 'lucide-react';
import { ccdDocumentsApi } from '@/lib/ccdDocumentsApi';

const TYPES = [
  ['bank_statement', 'Bank statements'],
  ['tax_return', 'Tax returns'],
  ['business_license', 'Business license'],
  ['voided_check', 'Voided check'],
  ['government_id', 'Government ID (manual only)'],
  ['other', 'Other supporting document'],
];
const CHECKLIST = TYPES.filter(([type]) => type !== 'other').map(([type]) => type);
const formatDate = (value) => value ? new Date(value).toLocaleString() : '—';

export default function DocumentsProcessing() {
  const [params, setParams] = useSearchParams();
  const [leadId, setLeadId] = useState(params.get('leadId') || '');
  const [details, setDetails] = useState(null);
  const [loading, setLoading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [notice, setNotice] = useState('');
  const [type, setType] = useState('bank_statement');
  const [file, setFile] = useState(null);

  const load = useCallback(async (id) => {
    if (!id?.trim()) return;
    setLoading(true);
    setError('');
    try {
      setDetails(await ccdDocumentsApi.list(id.trim()));
    } catch (err) {
      setDetails(null);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const id = params.get('leadId');
    if (id) { setLeadId(id); load(id); }
  }, [params, load]);

  const run = async (fn, success) => {
    setBusy(true);
    setError('');
    setNotice('');
    try {
      await fn();
      setNotice(success);
      if (details?.lead?.id) await load(String(details.lead.id));
    } catch (err) {
      setError(err.message);
    } finally {
      setBusy(false);
    }
  };

  const openLead = (event) => {
    event.preventDefault();
    const id = leadId.trim();
    if (id) setParams({ leadId: id });
  };

  const upload = async (event) => {
    event.preventDefault();
    if (!file || !details) return;
    await run(() => ccdDocumentsApi.upload(details.lead.id, type, file), 'Document received and stored in the private vault.');
    setFile(null);
    event.target.reset();
  };

  const download = async (id) => {
    try {
      const { url } = await ccdDocumentsApi.signedDownload(id);
      const link = document.createElement('a');
      link.href = url;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.click();
    } catch (err) { setError(err.message); }
  };

  const requestFor = (typeId) => details?.requests?.find((item) => item.document_type === typeId);
  const countFor = (typeId) => details?.documents?.filter((item) => item.document_type === typeId).length || 0;

  return (
    <div className="mx-auto max-w-5xl space-y-5 p-6 md:p-8">
      <div className="flex items-center gap-3">
        <div className="rounded-xl bg-amber-100 p-3 text-amber-700"><FolderLock className="h-6 w-6" /></div>
        <div>
          <h1 className="text-2xl font-extrabold text-slate-900">Documents Processing Engine</h1>
          <p className="text-sm text-slate-500">Private DPE · existing CCD · verified staff session · Supabase private storage</p>
        </div>
      </div>

      <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
        <ShieldCheck className="mr-2 inline h-4 w-4" />
        Requests are saved internally; <strong>no text or email is sent</strong> without a separately verified communications permission.
        ID documents must be supplied by the client or an approved IDV flow—never auto-generated.
      </div>

      <form onSubmit={openLead} className="flex flex-wrap gap-2 rounded-xl border border-slate-200 bg-white p-4">
        <label htmlFor="dpe-lead-id" className="w-full text-sm font-semibold text-slate-700">Open a lead’s document file</label>
        <input id="dpe-lead-id" value={leadId} onChange={(e) => setLeadId(e.target.value)} placeholder="Enter lead ID from the Leads view"
          className="min-w-56 flex-1 rounded-lg border border-slate-300 px-3 py-2 text-sm focus:border-amber-500 focus:outline-none" />
        <button type="submit" className="rounded-lg bg-slate-900 px-5 py-2 text-sm font-bold text-white">Open case</button>
        {details && <button type="button" onClick={() => load(String(details.lead.id))} disabled={loading} className="rounded-lg border border-slate-300 px-3 py-2 text-sm"><RefreshCw className="h-4 w-4" /></button>}
      </form>

      {loading && <p className="text-sm text-slate-500">Loading real documents…</p>}
      {error && <div role="alert" className="rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">{error}</div>}
      {notice && <div role="status" className="rounded-xl border border-emerald-200 bg-emerald-50 p-4 text-sm text-emerald-700">{notice}</div>}

      {details && (
        <>
          <div className="rounded-xl border border-slate-200 bg-white p-5">
            <p className="text-xs font-bold uppercase tracking-wide text-amber-700">Lead #{details.lead.id}</p>
            <h2 className="mt-1 text-lg font-bold text-slate-900">{details.lead.company_name || 'Company not recorded'}</h2>
            <p className="text-sm text-slate-500">{details.lead.contact_name || 'Contact not recorded'} · {details.documents.length} uploaded document{details.documents.length === 1 ? '' : 's'}</p>
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <div className="mb-4 flex items-center justify-between gap-2">
                <h3 className="font-bold text-slate-900">Lender document checklist</h3>
                <button type="button" disabled={busy} onClick={() => run(() => ccdDocumentsApi.requestChecklist(details.lead.id, CHECKLIST), 'Checklist saved. No message was sent.')}
                  className="rounded-lg bg-slate-900 px-3 py-2 text-xs font-bold text-white disabled:opacity-50">Save checklist</button>
              </div>
              <div className="space-y-2">
                {TYPES.map(([id, label]) => {
                  const uploaded = countFor(id);
                  const request = requestFor(id);
                  return <div key={id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-100 p-3 text-sm">
                    <span>{label}</span>
                    <span className={`shrink-0 rounded-full px-2 py-1 text-xs font-semibold ${uploaded ? 'bg-emerald-100 text-emerald-800' : request ? 'bg-amber-100 text-amber-800' : 'bg-slate-100 text-slate-500'}`}>
                      {uploaded ? `${uploaded} received` : request ? 'Requested' : 'Not requested'}
                    </span>
                  </div>;
                })}
              </div>
            </section>
            <section className="rounded-xl border border-slate-200 bg-white p-5">
              <h3 className="font-bold text-slate-900">Add a client-supplied document</h3>
              <p className="mt-1 text-xs text-slate-500">PDF, PNG or JPEG · max 8 MB · private storage · original file and hash retained.</p>
              <form onSubmit={upload} className="mt-4 space-y-3">
                <label htmlFor="dpe-doc-type" className="block text-sm font-semibold text-slate-700">Document type</label>
                <select id="dpe-doc-type" value={type} onChange={(e) => setType(e.target.value)} className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                  {TYPES.map(([id, label]) => <option value={id} key={id}>{label}</option>)}
                </select>
                <label htmlFor="dpe-file" className="block text-sm font-semibold text-slate-700">File</label>
                <input id="dpe-file" type="file" accept=".pdf,.png,.jpg,.jpeg,application/pdf,image/png,image/jpeg" required
                  onChange={(e) => setFile(e.target.files?.[0] || null)} className="block w-full text-sm text-slate-600" />
                <button disabled={!file || busy} className="flex items-center gap-2 rounded-lg bg-amber-500 px-4 py-2 text-sm font-bold text-slate-950 disabled:opacity-50"><Upload className="h-4 w-4" />Store document</button>
              </form>
            </section>
          </div>
          <section className="rounded-xl border border-slate-200 bg-white p-5">
            <h3 className="mb-4 font-bold text-slate-900">Stored documents</h3>
            <div className="divide-y divide-slate-100">
              {details.documents.map((doc) => (
                <div key={doc.id} className="flex flex-wrap items-center gap-3 py-3 text-sm">
                  <FileText className="h-5 w-5 text-amber-600" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-semibold text-slate-800">{doc.file_name}</p>
                    <p className="text-xs text-slate-500">{details.documentTypes[doc.document_type] || doc.document_type} · {(doc.size_bytes / 1024).toFixed(1)} KB · {formatDate(doc.created_at)}</p>
                  </div>
                  <button type="button" onClick={() => download(doc.id)} className="flex items-center gap-1 text-xs font-bold text-blue-700"><Download className="h-4 w-4" />Open</button>
                  {details.canDelete && <button type="button" disabled={busy} onClick={() => { if (window.confirm(`Remove ${doc.file_name}?`)) run(() => ccdDocumentsApi.remove(doc.id), 'Document removed.'); }} className="flex items-center gap-1 text-xs font-bold text-red-600"><Trash2 className="h-4 w-4" />Delete</button>}
                </div>
              ))}
              {!details.documents.length && <p className="py-6 text-sm text-slate-500">No uploaded documents. Files appear here only after an authorized upload.</p>}
            </div>
          </section>
        </>
      )}
    </div>
  );
}
