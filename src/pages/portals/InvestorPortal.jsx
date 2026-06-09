import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import { TrendingUp, DollarSign, BarChart2, Briefcase, CheckCircle2, Clock, PieChart } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PieChart as RePieChart, Pie, Cell, Tooltip, ResponsiveContainer, Legend } from "recharts";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

const PIE_COLORS = ["#f59e0b", "#3b82f6", "#8b5cf6", "#10b981", "#ef4444", "#ec4899", "#06b6d4"];

const stageBadge = {
  funded: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  declined: "bg-red-500/20 text-red-300 border-red-500/30",
  lender_matched: "bg-purple-500/20 text-purple-300 border-purple-500/30",
};

export default function InvestorPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin('/portal/investor'));
  }, []);

  const { data: allDeals = [], isLoading } = useQuery({
    queryKey: ['investor-deals-all'],
    queryFn: () => base44.entities.Deal.list('-created_date', 500),
    enabled: !!user,
  });

  if (!user || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const funded = allDeals.filter(d => d.stage === 'funded');
  const active = allDeals.filter(d => !['funded', 'declined', 'withdrawn'].includes(d.stage));
  const totalValue = allDeals.reduce((s, d) => s + (d.loan_amount || 0), 0);
  const fundedValue = funded.reduce((s, d) => s + (d.approved_amount || d.loan_amount || 0), 0);
  const conversionRate = allDeals.length > 0 ? ((funded.length / allDeals.length) * 100).toFixed(1) : 0;
  const avgDealSize = funded.length > 0 ? fundedValue / funded.length : 0;

  // Breakdown by loan type
  const byType = allDeals.reduce((acc, d) => {
    const k = d.loan_type?.replace(/_/g, ' ') || 'Other';
    if (!acc[k]) acc[k] = { count: 0, value: 0 };
    acc[k].count++;
    acc[k].value += (d.loan_amount || 0);
    return acc;
  }, {});

  const pieData = Object.entries(byType)
    .sort((a, b) => b[1].value - a[1].value)
    .map(([name, d]) => ({ name, value: d.value, count: d.count }));

  // Stage breakdown
  const byStage = allDeals.reduce((acc, d) => {
    const k = d.stage || 'unknown';
    acc[k] = (acc[k] || 0) + 1;
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">

        {/* Header */}
        <div className="mb-6">
          <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">Investor Dashboard</div>
          <h1 className="text-3xl font-extrabold">
            {user.full_name} <span className="text-slate-500 font-normal text-xl">— Investor</span>
          </h1>
          <p className="text-slate-400 mt-1">Full pipeline visibility — portfolio performance and deal flow analytics.</p>
        </div>

        {/* KPI Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Deals", value: allDeals.length, Icon: Briefcase, color: "text-amber-400" },
            { label: "Pipeline Value", value: fmt(totalValue), Icon: DollarSign, color: "text-blue-400" },
            { label: "Funded Volume", value: fmt(fundedValue), Icon: TrendingUp, color: "text-emerald-400" },
            { label: "Conversion Rate", value: `${conversionRate}%`, Icon: CheckCircle2, color: "text-purple-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Analytics row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Pie chart — portfolio by type */}
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6">
            <p className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <PieChart className="h-4 w-4 text-amber-400" /> Portfolio by Loan Type
            </p>
            {pieData.length > 0 ? (
              <div className="h-52">
                <ResponsiveContainer width="100%" height="100%">
                  <RePieChart>
                    <Pie data={pieData} cx="50%" cy="50%" outerRadius={75} dataKey="value" nameKey="name">
                      {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                    </Pie>
                    <Tooltip formatter={(v, n) => [fmt(v), n]} contentStyle={{ background: '#0f0f1e', border: '1px solid rgba(255,255,255,0.1)', borderRadius: 8 }} />
                    <Legend iconType="circle" iconSize={8} formatter={v => <span className="text-slate-300 text-xs">{v}</span>} />
                  </RePieChart>
                </ResponsiveContainer>
              </div>
            ) : <p className="text-slate-500 text-sm text-center py-16">No data available</p>}
          </div>

          {/* Stage breakdown */}
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6">
            <p className="text-white font-bold text-sm mb-4 flex items-center gap-2">
              <BarChart2 className="h-4 w-4 text-blue-400" /> Pipeline Stage Distribution
            </p>
            <div className="space-y-2.5">
              {Object.entries(byStage)
                .sort((a, b) => b[1] - a[1])
                .map(([stage, count]) => (
                  <div key={stage} className="flex items-center gap-3">
                    <p className="w-32 text-xs text-slate-400 capitalize truncate">{stage.replace(/_/g, ' ')}</p>
                    <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                      <div className="h-full bg-amber-500/70 rounded-full" style={{ width: `${Math.round((count / allDeals.length) * 100)}%` }} />
                    </div>
                    <p className="text-xs text-white font-semibold w-6 text-right">{count}</p>
                  </div>
                ))
              }
            </div>
            <div className="mt-4 pt-3 border-t border-white/10 grid grid-cols-2 gap-2 text-xs">
              <div>
                <p className="text-slate-500">Avg Deal Size</p>
                <p className="text-white font-semibold">{fmt(avgDealSize)}</p>
              </div>
              <div>
                <p className="text-slate-500">Active Deals</p>
                <p className="text-white font-semibold">{active.length}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Deal table */}
        <Tabs defaultValue="active">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="active" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="funded" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              Funded ({funded.length})
            </TabsTrigger>
            <TabsTrigger value="all" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              All Deals ({allDeals.length})
            </TabsTrigger>
          </TabsList>

          {[
            { key: "active", data: active },
            { key: "funded", data: funded },
            { key: "all", data: allDeals },
          ].map(({ key, data }) => (
            <TabsContent key={key} value={key}>
              <div className="space-y-2">
                {data.map(deal => (
                  <div key={deal.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
                    <div>
                      <p className="font-semibold text-white text-sm">{deal.borrower_name}</p>
                      <p className="text-slate-400 text-xs capitalize">{deal.loan_type?.replace(/_/g, ' ')} · {deal.lender_name || 'Pending'}{deal.broker_name ? ` · via ${deal.broker_name}` : ''}</p>
                    </div>
                    <div className="flex items-center gap-3 flex-shrink-0">
                      <p className="text-amber-400 font-bold text-sm">{fmt(deal.loan_amount)}</p>
                      <span className={`px-2 py-0.5 rounded-full text-xs border ${stageBadge[deal.stage] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                        {deal.stage?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
                {data.length === 0 && <p className="text-slate-500 text-center py-12">No deals in this view.</p>}
              </div>
            </TabsContent>
          ))}
        </Tabs>
      </div>
      <FodFooter />
    </div>
  );
}