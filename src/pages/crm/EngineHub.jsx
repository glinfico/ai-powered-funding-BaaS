import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Activity, Fingerprint, GitBranch, FileText, ShieldCheck, RefreshCw } from 'lucide-react';

const ENGINES = [
  { id: 'IDE', title: 'Identification Engine', text: 'Existing IDE pipeline: identity verification, IDIQ / FinGoal adapters, and AAI sequence.', path: '/crm/leads', link: 'Open the real leads table', icon: Fingerprint },
  { id: 'LAE', title: 'Leads Assignment Engine', text: 'Existing broker and lender assignment workspace; review the assignments before acting.', path: '/crm/brokers', link: 'Open assignment workspace', icon: GitBranch },
  { id: 'ACE', title: 'Automated Closing Engine', text: 'Existing guarded underwriting and closing workflow.', path: '/crm/autonomous-closing', link: 'Open closing workflow', icon: ShieldCheck },
  { id: 'DPE', title: 'Documents Processing Engine', text: 'Private document checklist and client-supplied files. Government ID is not generated.', path: '/crm/documents', link: 'Open document vault', icon: FileText },
];

export default function EngineHub() {
  const [api, setApi] = useState({ state: 'checking', label: 'Checking existing Render API…' });
  const [checking, setChecking] = useState(false);
  async function check() {
    setChecking(true);
    try {
      const r = await fetch('/api/health', { cache: 'no-store' });
      const body = await r.json();
      setApi({ state: r.ok && (body.status === 'ok' || body.ok) ? 'ok' : 'error', label: body.service || body.platform || `API HTTP ${r.status}` });
    } catch { setApi({ state: 'error', label: 'Existing API is unavailable' }); }
    finally { setChecking(false); }
  }
  useEffect(() => { check(); }, []);
  return <main className="mx-auto max-w-6xl space-y-5 p-6 md:p-8">
    <header className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">PRIVATE CCD · EXISTING BACKEND</p><h1 className="mt-1 text-2xl font-black text-slate-900">Engines</h1><p className="mt-1 text-sm text-slate-500">A directory to the existing IDE, LAE, ACE and DPE workspaces. No duplicate engine stack.</p></div>
      <button onClick={check} disabled={checking} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold"><RefreshCw className={`h-4 w-4 ${checking ? 'animate-spin' : ''}`} />Check API</button>
    </header>
    <div role="status" className={`flex items-center gap-2 rounded-xl border p-3 text-sm ${api.state === 'ok' ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-amber-200 bg-amber-50 text-amber-900'}`}><Activity className="h-4 w-4" />{api.label}</div>
    <section className="grid gap-4 md:grid-cols-2">{ENGINES.map((engine) => <article key={engine.id} className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between"><div><span className="text-xs font-black text-amber-700">{engine.id}</span><h2 className="mt-1 text-lg font-bold text-slate-900">{engine.title}</h2></div><engine.icon className="h-6 w-6 text-amber-600" /></div>
      <p className="mt-2 min-h-12 text-sm text-slate-600">{engine.text}</p>
      <Link to={engine.path} className="mt-4 inline-flex rounded-lg bg-slate-900 px-4 py-2 text-sm font-bold text-white">{engine.link} →</Link>
    </article>)}</section>
    <p className="text-xs text-slate-500">This is a navigation and health view. It never auto-pulls credit, initiates bank access, sends messages, or advances deals.</p>
  </main>;
}
