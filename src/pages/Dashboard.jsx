import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

const API = import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com';
const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

export default function WorkspaceDashboard() {
  const [applications, setApplications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [apiStatus, setApiStatus] = useState('checking');

  useEffect(() => {
    const load = async () => {
      try {
        const [appsRes, leadsRes, commsRes, healthRes] = await Promise.all([
          fetch(`${API}/api/mca/applications`),
          fetch(`${API}/api/leads`),
          fetch(`${API}/api/commissions`),
          fetch(`${API}/health`)
        ]);
        const apps = await appsRes.json();
        const lds = await leadsRes.json();
        const cms = await commsRes.json();
        const health = await healthRes.json();
        setApplications(apps.applications || []);
        setLeads(lds.leads || []);
        setCommissions(cms.commissions || []);
        setApiStatus(health.status === 'ok' ? 'live' : 'error');
      } catch(e) {
        console.error(e);
        setApiStatus('error');
      }
    };
    load();
  }, []);

  const funded = applications.filter(a => a.status === 'funded');
  const active = applications.filter(a => a.status !== 'funded');
  const totalPipeline = active.reduce((s, a) => s + (a.requested_amount || 0), 0);
  const totalFunded = funded.reduce((s, a) => s + (a.funded_amount || 0), 0);
  const totalCommission = commissions.reduce((s, c) => s + (c.broker_share || 0), 0);

  const stats = [
    { label: 'Active Leads', value: leads.length, color: 'bg-amber-50 border-amber-200 text-amber-700' },
    { label: 'Active Deals', value: active.length, color: 'bg-blue-50 border-blue-200 text-blue-700' },
    { label: 'Funded Deals', value: funded.length, color: 'bg-green-50 border-green-200 text-green-700' },
    { label: 'Pipeline', value: fmt(totalPipeline), color: 'bg-sky-50 border-sky-200 text-sky-700' },
    { label: 'Funded Volume', value: fmt(totalFunded), color: 'bg-emerald-50 border-emerald-200 text-emerald-700' },
    { label: 'Commissions', value: fmt(totalCommission), color: 'bg-rose-50 border-rose-200 text-rose-700' },
  ];

  return (
    <div className="space-y-6 p-2">

      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workspace</h1>
          <p className="text-slate-500 mt-1">GLINFICO — Admin Operations Center</p>
        </div>
        <div className="flex items-center gap-2">
          <div className={`w-2 h-2 rounded-full ${apiStatus === 'live' ? 'bg-green-400' : 'bg-red-400'}`} />
          <span className="text-sm text-slate-500">API {apiStatus}</span>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {stats.map(s => (
          <div key={s.label} className={`rounded-xl border p-4 ${s.color}`}>
            <p className="text-2xl font-bold">{s.value}</p>
            <p className="text-xs mt-1 opacity-75">{s.label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent MCA Applications</h3>
            <Link to="/crm/deals" className="text-amber-600 text-xs font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {applications.slice(0, 5).map(app => (
              <div key={app.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">
                    {app.merchant_info?.legalName || app.id}
                  </p>
                  <p className="text-xs text-slate-400">
                    Score: {app.mca_score || '--'} · {app.merchant_info?.industry || ''}
                  </p>
                </div>
                <p className="text-sm font-semibold text-amber-600">{fmt(app.requested_amount)}</p>
                <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                  app.mca_tier === 'A' ? 'bg-green-100 text-green-700' :
                  app.mca_tier === 'B' ? 'bg-blue-100 text-blue-700' :
                  app.mca_tier === 'F' ? 'bg-red-100 text-red-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {app.mca_tier ? `${app.mca_tier}-Paper` : app.status}
                </span>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-slate-400 text-sm">No applications yet</p>
                <p className="text-slate-300 text-xs mt-1">Submit your first MCA deal to get started</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Commissions</h3>
            <Link to="/crm/commissions" className="text-amber-600 text-xs font-medium hover:underline">View all →</Link>
          </div>
          <div className="divide-y divide-slate-50">
            {commissions.slice(0, 5).map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{c.product_label}</p>
                  <p className="text-xs text-slate-400">{c.status}</p>
                </div>
                <p className="text-sm font-bold text-green-600">{fmt(c.broker_share)}</p>
              </div>
            ))}
            {commissions.length === 0 && (
              <div className="px-5 py-8 text-center">
                <p className="text-slate-400 text-sm">No commissions yet</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-amber-500 to-amber-600 rounded-xl p-6 text-white flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg">🚀 GLINFICO is LIVE!</h3>
          <p className="text-amber-100 text-sm mt-1">MCA engine running · Supabase connected · Ready for brokers</p>
        </div>
        <Link to="/crm/leads" className="bg-white text-amber-600 font-bold px-4 py-2 rounded-xl text-sm hover:bg-amber-50 transition-all">
          View Leads →
        </Link>
      </div>

    </div>
  );
}
