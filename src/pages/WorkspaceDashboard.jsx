import { useMemo } from "react";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcCommission } from "@/utils/commissionCalc";
import { Users, DollarSign, TrendingUp, Target, CheckCircle2, Clock, Briefcase, ArrowRight, BadgeDollarSign } from "lucide-react";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { format, subDays } from "date-fns";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

const DEAL_STAGES_ACTIVE = ['submitted', 'under_review', 'docs_requested', 'docs_received', 'lender_matched', 'term_sheet_sent', 'approved'];

export default function WorkspaceDashboard() {
  const { data: leads = [], isLoading: leadsLoading } = useQuery({
    queryKey: ['ws-leads'],
    queryFn: () => base44.entities.Lead.list('-created_date', 200),
  });

  const { data: deals = [], isLoading: dealsLoading } = useQuery({
    queryKey: ['ws-deals'],
    queryFn: () => base44.entities.Deal.list('-created_date', 500),
  });

  const { data: tasks = [] } = useQuery({
    queryKey: ['ws-tasks-pending'],
    queryFn: () => base44.entities.Task.filter({ status: 'pending' }, '-due_date', 50),
  });

  const stats = useMemo(() => {
    const activeLeads = leads.filter(l => !['funded', 'lost'].includes(l.status));
    const fundedDeals = deals.filter(d => d.stage === 'funded');
    const activeDeals = deals.filter(d => DEAL_STAGES_ACTIVE.includes(d.stage));
    const totalPipeline = activeDeals.reduce((s, d) => s + (d.loan_amount || 0), 0);
    const totalFundedVol = fundedDeals.reduce((s, d) => s + (d.approved_amount || d.loan_amount || 0), 0);
    const totalCommission = deals.reduce((s, d) => s + (d.commission_amount || calcCommission(d).amount), 0);
    const conversion = deals.length > 0 ? ((fundedDeals.length / deals.length) * 100).toFixed(1) : 0;

    return { activeLeads: activeLeads.length, activeDeals: activeDeals.length, funded: fundedDeals.length, totalPipeline, totalFundedVol, totalCommission, conversion };
  }, [leads, deals]);

  // Build last-14-day volume chart from deals
  const volumeChart = useMemo(() => {
    return Array.from({ length: 14 }, (_, i) => {
      const day = subDays(new Date(), 13 - i);
      const label = format(day, 'MMM d');
      const dayStr = format(day, 'yyyy-MM-dd');
      const vol = deals.filter(d => d.created_date?.startsWith(dayStr)).reduce((s, d) => s + (d.loan_amount || 0), 0);
      return { day: label, vol };
    });
  }, [deals]);

  const recentDeals = deals.slice(0, 6);
  const overdueTasks = tasks.filter(t => t.due_date && new Date(t.due_date) < new Date()).slice(0, 5);

  const isLoading = leadsLoading || dealsLoading;

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-slate-900">Workspace</h1>
          <p className="text-slate-500 mt-1">GLINFICO LP — Admin Operations Center</p>
        </div>
        <div className="flex gap-2">
          <Link to="/Leads">
            <button className="px-4 py-2 rounded-lg bg-amber-50 text-amber-700 text-sm font-medium hover:bg-amber-100 transition-colors border border-amber-200">
              + New Lead
            </button>
          </Link>
          <Link to="/Deals">
            <button className="px-4 py-2 rounded-lg bg-slate-900 text-white text-sm font-medium hover:bg-slate-800 transition-colors">
              + New Deal
            </button>
          </Link>
        </div>
      </div>

      {/* KPI Cards */}
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

      {/* Chart + Overdue Tasks */}
      <div className="grid lg:grid-cols-3 gap-6">
        {/* Volume Chart */}
        <div className="lg:col-span-2 bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Deal Volume — Last 14 Days</h3>
          </div>
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
              <YAxis tickFormatter={v => v >= 1000 ? `$${(v / 1000).toFixed(0)}k` : `$${v}`} tick={{ fontSize: 10, fill: '#94a3b8' }} />
              <Tooltip formatter={v => [fmt(v), 'Volume']} />
              <Area type="monotone" dataKey="vol" stroke="#f59e0b" strokeWidth={2} fill="url(#volGrad)" />
            </AreaChart>
          </ResponsiveContainer>
        </div>

        {/* Overdue / Urgent Tasks */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-sm font-semibold text-slate-700">Overdue Tasks</h3>
            <Link to="/Tasks" className="text-amber-600 text-xs font-medium hover:underline flex items-center gap-0.5">
              View all <ArrowRight className="h-3 w-3" />
            </Link>
          </div>
          <div className="space-y-2">
            {overdueTasks.map(t => (
              <div key={t.id} className="flex items-start gap-2 p-2 rounded-lg bg-red-50 border border-red-100">
                <Clock className="h-3.5 w-3.5 text-red-400 mt-0.5 flex-shrink-0" />
                <div className="min-w-0">
                  <p className="text-xs font-medium text-slate-800 truncate">{t.title}</p>
                  <p className="text-xs text-red-400">{t.due_date ? format(new Date(t.due_date), 'MMM d') : '—'}</p>
                </div>
              </div>
            ))}
            {overdueTasks.length === 0 && (
              <p className="text-slate-400 text-xs text-center py-8">No overdue tasks</p>
            )}
          </div>
        </div>
      </div>

      {/* Recent Deals */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">Recent Deals</h3>
          <Link to="/Deals" className="text-amber-600 text-xs font-medium hover:underline flex items-center gap-0.5">
            View all <ArrowRight className="h-3 w-3" />
          </Link>
        </div>
        <div className="divide-y divide-slate-50">
          {recentDeals.map(deal => (
            <div key={deal.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-900 truncate">{deal.borrower_name}</p>
                <p className="text-xs text-slate-400">{deal.loan_type?.replace(/_/g, ' ')} · {deal.broker_name || 'Direct'}</p>
              </div>
              <p className="text-sm font-semibold text-amber-600">{fmt(deal.loan_amount)}</p>
              <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                deal.stage === 'funded' ? 'bg-emerald-100 text-emerald-700' :
                deal.stage === 'approved' ? 'bg-green-100 text-green-700' :
                deal.stage === 'declined' ? 'bg-red-100 text-red-700' :
                'bg-slate-100 text-slate-600'
              }`}>
                {deal.stage?.replace(/_/g, ' ')}
              </span>
            </div>
          ))}
          {recentDeals.length === 0 && (
            <p className="text-slate-400 text-sm text-center py-8">No deals yet</p>
          )}
        </div>
      </div>
    </div>
  );
}