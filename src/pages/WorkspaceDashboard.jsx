import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { Users, DollarSign, TrendingUp, Target, CheckCircle2, Clock, Briefcase, ArrowRight, BadgeDollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

const API = import.meta.env.VITE_API_URL || 'https://ai-powered-funding-platform.onrender.com';

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

const fetchApplications = async () => {
  const res = await fetch(`${API}/api/mca/applications?limit=500`);
  const data = await res.json();
  return data.applications || [];
};

const fetchLeads = async () => {
  const res = await fetch(`${API}/api/leads?limit=200`);
  const data = await res.json();
  return data.leads || [];
};

const fetchCommissions = async () => {
  const res = await fetch(`${API}/api/commissions`);
  const data = await res.json();
  return data.commissions || [];
};

export default function WorkspaceDashboard() {
  const { data: applications = [], isLoading: appsLoading } = useQuery({
    queryKey: ['ws-applications'],
    queryFn: fetchApplications,
  });

  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['ws-leads'],
    queryFn: fetchLeads,
  });

  const { data: commissions = [], isLoading: commissionsLoading } = useQuery({
    queryKey: ['ws-commissions'],
    queryFn: fetchCommissions,
  });

  const stats = useMemo(() => {
    const funded = applications.filter(a => a.status === 'funded');
    const active = applications.filter(a => ['submitted','in_review','approved','auto_route','route_with_review'].includes(a.status));
    const totalPipeline = active.reduce((s, a) => s + (a.requested_amount || 0), 0);
    const totalFundedVol = funded.reduce((s, a) => s + (a.funded_amount || 0), 0);
    const totalCommission = commissions.reduce((s, c) => s + (c.broker_share || 0), 0);
    const conversion = applications.length > 0 ? ((funded.length / applications.length) * 100).toFixed(1) : 0;
    const activeLeads = leads.filter(l => !['funded','lost'].includes(l.status));

    return { 
      activeLeads: activeLeads.length, 
      activeDeals: active.length, 
      funded: funded.length, 
      totalPipeline, 
      totalFundedVol, 
      totalCommission, 
      conversion 
    };
  }, [applications, leads, commissions]);

  const volumeChart = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const label = format(day, 'MMM d');
      const dayStr = format(day, 'yyyy-MM-dd');
      const vol = applications
        .filter(a => a.created_at?.startsWith(dayStr))
        .reduce((s, a) => s + (a.requested_amount || 0), 0);
      return { day: label, vol };
    });
  }, [applications]);

  const recentDeals = applications.slice(0, 6);
  const isLoading = appsLoading || leadsLoading || commissionsLoading;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workspace</h1>
          <p className="text-slate-500 mt-1">GLINFICO — Admin Operations Center</p>
        </div>
        <div className="flex gap-2">
          <Link to="/crm/leads">
            <button className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors border border-amber-200">
              + New Lead
            </button>
          </Link>
          <Link to="/crm/deals">
            <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
              + New Deal
            </button>
          </Link>
        </div>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 xl:grid-cols-7 gap-4">
        {[
          { label: "Active Leads", value: stats.activeLeads, icon: Users, color: "text-amber-600", bg: "bg-amber-50 border-amber-100" },
          { label: "Active Deals", value: stats.activeDeals, icon: Briefcase, color: "text-blue-600", bg: "bg-blue-50 border-blue-100" },
          { label: "Funded", value: stats.funded, icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50 border-emerald-100" },
          { label: "Conversion", value: `${stats.conversion}%`, icon: Target, color: "text-purple-600", bg: "bg-purple-50 border-purple-100" },
          { label: "Pipeline", value: fmt(stats.totalPipeline), icon: DollarSign, color: "text-sky-600", bg: "bg-sky-50 border-sky-100" },
          { label: "Funded Vol.", value: fmt(stats.totalFundedVol), icon: TrendingUp, color: "text-green-600", bg: "bg-green-50 border-green-100" },
          { label: "Est. Commission", value: fmt(stats.totalCommission), icon: BadgeDollarSign, color: "text-rose-600", bg: "bg-rose-50 border-rose-100" },
        ].map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className={`rounded-xl border p-4 ${bg}`}>
            <Icon className={`h-4 w-4 ${color} mb-2`} />
            <p className={`text-lg font-bold ${color}`}>{value}</p>
            <p className="text-xs text-slate-500 mt-0.5">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Deal Volume — Last 14 Days</h3>
          <ResponsiveContainer width="100%" height={200}>
            <AreaChart data={volumeChart}>
              <defs>
                <linearGradient id="volGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.15} />
                  <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
              <XAxis dataKey="day" tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <YAxis tickFormatter={v => v >= 1000 ? `$${(v/1000).toFixed(0)}k` : `$${v}`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={v => [fmt(v), 'Volume']} />
              <Area type="monotone" dataKey="vol" stroke="#f59e0b" strokeWidth={2} fill="url(#volGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Recent Commissions</h3>
            <Link to="/crm/commissions" className="text-amber-600 text-xs font-medium hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {commissions.slice(0,5).map(c => (
              <div key={c.id} className="flex items-center justify-between p-2 rounded-lg bg-green-50 border border-green-100">
                <div>
                  <p className="text-xs font-medium text-slate-800">{c.product_label}</p>
                  <p className="text-xs text-slate-400">{c.status}</p>
                </div>
                <p className="text-xs font-bold text-green-700">{fmt(c.broker_share)}</p>
              </div>
            ))}
            {commissions.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-8">No commissions yet</p>
            )}
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Recent MCA Applications</h3>
          <Link to="/crm/deals" className="text-amber-600 text-xs font-medium hover:underline flex items-center gap-0.5">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentDeals.map(app => (
            <div key={app.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">
                  {app.merchant_info?.legalName || app.id}
                </p>
                <p className="text-xs text-slate-400">
                  {app.merchant_info?.industry} · Score: {app.mca_score || '--'}
                </p>
              </div>
              <p className="text-sm font-semibold text-amber-600">{fmt(app.requested_amount)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                app.status === 'funded' ? 'bg-emerald-100 text-emerald-700' :
                app.status === 'auto_route' ? 'bg-green-100 text-green-700' :
                app.status === 'decline' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {app.mca_tier ? `${app.mca_tier}-Paper` : app.status}
              </span>
            </div>
          ))}
          {recentDeals.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No applications yet — submit your first MCA deal!</p>
          )}
        </div>
      </div>
    </div>
  );
}
