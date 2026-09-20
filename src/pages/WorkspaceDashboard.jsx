import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Users, DollarSign, TrendingUp, CheckCircle2, Briefcase, BadgeDollarSign, ArrowRight } from "lucide-react";

const API = import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com';

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

export default function WorkspaceDashboard() {
  const [applications, setApplications] = useState([]);
  const [leads, setLeads] = useState([]);
  const [commissions, setCommissions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const [appsRes, leadsRes, commsRes] = await Promise.all([
          fetch(`${API}/api/mca/applications`),
          fetch(`${API}/api/leads`),
          fetch(`${API}/api/commissions`)
        ]);
        const apps = await appsRes.json();
        const lds = await leadsRes.json();
        const cms = await commsRes.json();
        setApplications(apps.applications || []);
        setLeads(lds.leads || []);
        setCommissions(cms.commissions || []);
      } catch(e) {
        console.error('Dashboard load error:', e);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const funded = applications.filter(a => a.status === 'funded');
  const active = applications.filter(a => a.status !== 'funded');
  const totalPipeline = active.reduce((s, a) => s + (a.requested_amount || 0), 0);
  const totalFunded = funded.reduce((s, a) => s + (a.funded_amount || 0), 0);
  const totalCommission = commissions.reduce((s, c) => s + (c.broker_share || 0), 0);
  const conversion = applications.length > 0 ? ((funded.length / applications.length) * 100).toFixed(1) : 0;

  if (loading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">

      <div>
        <h1 className="text-3xl font-bold text-slate-900">Workspace</h1>
        <p className="text-slate-500 mt-1">GLINFICO — Admin Operations Center</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
        {[
          { label: "Active Leads", value: leads.length, icon: Users, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { label: "Active Deals", value: active.length, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
          { label: "Funded", value: funded.length, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Conversion", value: `${conversion}%`, icon: TrendingUp, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
          { label: "Pipeline", value: fmt(totalPipeline), icon: DollarSign, color: "text-sky-600", bg: "bg-sky-50 border-sky-100" },
          { label: "Commission", value: fmt(totalCommission), icon: BadgeDollarSign, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <Icon className={`h-4 w-4 ${color} mb-2`} />
            <p className={`text-xl font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent MCA Applications</h3>
            <Link to="/crm/deals" className="text-amber-600 text-xs font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {applications.slice(0, 6).map(app => (
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
                  app.status === 'funded' ? 'bg-emerald-100 text-emerald-700' :
                  app.mca_tier === 'A' ? 'bg-green-100 text-green-700' :
                  app.mca_tier === 'B' ? 'bg-blue-100 text-blue-700' :
                  'bg-slate-100 text-slate-600'
                }`}>
                  {app.mca_tier ? `${app.mca_tier}-Paper` : app.status}
                </span>
              </div>
            ))}
            {applications.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-slate-400 text-sm">No applications yet</p>
                <p className="text-slate-300 text-xs mt-1">Submit your first MCA deal to get started</p>
              </div>
            )}
          </div>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
          <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-slate-700">Recent Commissions</h3>
            <Link to="/crm/commissions" className="text-amber-600 text-xs font-medium hover:underline flex items-center gap-1">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="divide-y divide-slate-50">
            {commissions.slice(0, 6).map(c => (
              <div key={c.id} className="flex items-center gap-4 px-5 py-3">
                <div className="flex-1">
                  <p className="text-sm font-medium text-slate-900">{c.product_label}</p>
                  <p className="text-xs text-slate-400">{c.status}</p>
                </div>
                <p className="text-sm font-bold text-green-600">{fmt(c.broker_share)}</p>
              </div>
            ))}
            {commissions.length === 0 && (
              <div className="px-5 py-12 text-center">
                <p className="text-slate-400 text-sm">No commissions yet</p>
                <p className="text-slate-300 text-xs mt-1">Fund your first deal to earn commission</p>
              </div>
            )}
          </div>
        </div>

      </div>

      <div className="bg-amber-50 border border-amber-200 rounded-xl p-6 flex items-center justify-between">
        <div>
          <h3 className="font-bold text-amber-900">🚀 Ready to Launch!</h3>
          <p className="text-amber-700 text-sm mt-1">Your MCA engine is live. Start onboarding brokers and submitting deals.</p>
        </div>
        <Link to="/crm/leads" className="bg-amber-500 hover:bg-amber-400 text-white font-bold px-4 py-2 rounded-xl text-sm transition-all">
          View Leads →
        </Link>
      </div>

    </div>
  );
}
