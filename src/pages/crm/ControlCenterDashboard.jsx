import { useCallback, useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/lib/AuthContext';
import { crmApi } from '@/lib/crmApi';
import { ccdBankLeadsApi } from '@/lib/ccdBankLeadsApi';
import { Activity, Building2, Briefcase, Database, Handshake, RefreshCw, Users, AlertCircle } from 'lucide-react';

function CountCard({ label, value, href, icon: Icon, detail }) {
  return <Link to={href} className="rounded-xl border border-slate-200 bg-white p-4 shadow-sm hover:border-amber-300">
    <div className="flex items-center justify-between text-xs font-bold uppercase tracking-wide text-slate-500"><span>{label}</span><Icon className="h-4 w-4 text-amber-600" /></div>
    <div className="mt-2 text-3xl font-black text-slate-900">{value}</div>
    {detail && <div className="mt-1 text-xs text-slate-500">{detail}</div>}
  </Link>;
}

// Private WSD dashboard: source-table counts only. No generated fallback leads,
// lender book, deals or commission figures when a real API is unavailable.
export default function ControlCenterDashboard() {
  const { user } = useAuth();
  const staff = ['admin', 'staff'].includes(user?.role);
  const [summary, setSummary] = useState(null);
  const [bankCount, setBankCount] = useState(null);
  const [leadRows, setLeadRows] = useState([]);
  const [dealRows, setDealRows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [updated, setUpdated] = useState('');

  const refresh = useCallback(async () => {
    setLoading(true); setError('');
    const reads = await Promise.allSettled([
      crmApi.summary(),
      crmApi.leads({ limit: 6, offset: 0 }),
      crmApi.deals({ limit: 6, offset: 0 }),
      staff ? ccdBankLeadsApi.list({ page: 1, limit: 1 }) : Promise.resolve(null),
    ]);
    const [s, l, d, b] = reads;
    setSummary(s.status === 'fulfilled' ? s.value.counts : null);
    setLeadRows(l.status === 'fulfilled' ? l.value.data || [] : []);
    setDealRows(d.status === 'fulfilled' ? d.value.data || [] : []);
    setBankCount(staff && b.status === 'fulfilled' ? b.value.count : null);
    const failures = reads.slice(0, staff ? 4 : 3).filter(x => x.status === 'rejected');
    if (failures.length || s.status === 'fulfilled' && !s.value.success) {
      setError('Some source tables are unavailable. No demonstration totals are being substituted.');
    }
    setUpdated(new Date().toLocaleString());
    setLoading(false);
  }, [staff]);

  useEffect(() => { refresh(); }, [refresh]);
  const count = (key) => loading ? '…' : summary?.[key] == null ? '—' : Number(summary[key]).toLocaleString();
  const pending = loading ? '…' : bankCount == null ? '—' : Number(bankCount).toLocaleString();

  return <main className="mx-auto max-w-7xl space-y-6 p-6 md:p-8">
    <div className="flex flex-wrap items-center justify-between gap-3">
      <div><p className="text-xs font-bold uppercase tracking-wider text-amber-600">GLINFICO · PRIVATE CCD</p><h1 className="mt-1 text-3xl font-black text-slate-900">Control Center Dashboard</h1><p className="mt-1 text-sm text-slate-500">Verified counts from existing Supabase tables, not browser-generated examples.</p></div>
      <button onClick={refresh} disabled={loading} className="flex items-center gap-2 rounded-lg border border-slate-300 bg-white px-4 py-2 text-sm font-bold disabled:opacity-50"><RefreshCw className="h-4 w-4" />Refresh</button>
    </div>
    {error && <div role="alert" className="flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900"><AlertCircle className="h-5 w-5" />{error}</div>}
    <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
      <CountCard label="Source leads" value={count('leads')} href="/crm/leads" icon={Users} detail="Existing canonical leads table" />
      {staff && <CountCard label="Bank leads · pending review" value={pending} href="/crm/bank-leads" icon={Database} detail="CSV imports saved durably; no consent presumed" />}
      <CountCard label="Deals" value={count('deals')} href="/crm/deals" icon={Briefcase} />
      <CountCard label="Lenders" value={count('lenders')} href="/crm/lenders" icon={Building2} />
      <CountCard label="Investors" value={count('investors')} href="/crm/investors" icon={Handshake} />
      <CountCard label="Commission records" value={count('commissions')} href="/crm/commissions" icon={Activity} detail="Count only — no invented payout totals" />
    </div>
    <div className="grid gap-4 lg:grid-cols-2">
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex justify-between"><h2 className="font-bold text-slate-900">Recent source leads</h2><Link to="/crm/leads" className="text-sm font-bold text-amber-700">All leads →</Link></div>
        <div className="mt-3 divide-y divide-slate-100">
          {leadRows.map(l => <div key={l.id} className="flex justify-between gap-2 py-2 text-sm"><span className="truncate font-semibold text-slate-700">{l.company_name || l.contact_name || `Lead #${l.id}`}</span><span className="shrink-0 text-slate-500">{l.status || '—'}</span></div>)}
          {!loading && !leadRows.length && <p className="py-6 text-sm text-slate-500">No source leads returned; check the lead table or API status.</p>}
        </div>
      </section>
      <section className="rounded-xl border border-slate-200 bg-white p-5">
        <div className="flex justify-between"><h2 className="font-bold text-slate-900">Recent deals</h2><Link to="/crm/deals" className="text-sm font-bold text-amber-700">All deals →</Link></div>
        <div className="mt-3 divide-y divide-slate-100">
          {dealRows.map(d => <div key={d.id} className="flex justify-between gap-2 py-2 text-sm"><span className="truncate font-semibold text-slate-700">{d.business_name || d.company_name || `Deal #${d.id}`}</span><span className="shrink-0 text-slate-500">{d.status || '—'}</span></div>)}
          {!loading && !dealRows.length && <p className="py-6 text-sm text-slate-500">No deals returned; no sample deals substituted.</p>}
        </div>
      </section>
    </div>
    <p className="text-xs text-slate-500">Updated {updated || 'after the first successful read'} · Bank imports stay separate and pending review until a verified promotion process is approved.</p>
  </main>;
}
