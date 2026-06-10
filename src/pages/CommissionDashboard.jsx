import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcCommission } from "@/utils/commissionCalc";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { DollarSign, TrendingUp, Clock, CheckCircle2, Award, Users } from "lucide-react";

const fmt = (v) =>
  v ? new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(v) : "$0";

const LOAN_LABELS = {
  merchant_cash_advance: "MCA", mca: "MCA",
  commercial_real_estate: "CRE",
  bridge_loan: "Bridge/M&A",
  business_loan: "Business Loan",
  equipment_financing: "Equipment",
  sba_loan: "SBA",
  line_of_credit: "LOC",
  invoice_factoring: "Invoice",
  other: "Other",
};

const STAGE_COLORS = {
  funded: "#10b981",
  approved: "#3b82f6",
  term_sheet_sent: "#8b5cf6",
  lender_matched: "#f59e0b",
  docs_received: "#f97316",
  docs_requested: "#ec4899",
  under_review: "#64748b",
  submitted: "#94a3b8",
  declined: "#ef4444",
  withdrawn: "#cbd5e1",
};

const PIE_COLORS = ["#f59e0b", "#10b981", "#3b82f6", "#8b5cf6", "#f97316", "#ec4899", "#64748b"];

const FILTERS = ["All", "Funded", "Active", "Declined"];

export default function CommissionDashboard() {
  const [activeFilter, setActiveFilter] = useState("All");

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ["deals-commission"],
    queryFn: () => base44.entities.Deal.list("-created_date", 500),
  });

  const stats = useMemo(() => {
    const funded = deals.filter((d) => d.stage === "funded");
    const active = deals.filter((d) => !["funded", "declined", "withdrawn"].includes(d.stage));
    const declined = deals.filter((d) => d.stage === "declined");

    const totalEarned = funded.reduce((s, d) => s + (d.commission_amount || calcCommission(d).amount), 0);
    const totalPending = active.reduce((s, d) => s + (d.commission_amount || calcCommission(d).amount), 0);

    // By loan type
    const byType = {};
    funded.forEach((d) => {
      const label = LOAN_LABELS[d.loan_type] || d.loan_type;
      if (!byType[label]) byType[label] = { type: label, amount: 0, count: 0 };
      byType[label].amount += d.commission_amount || calcCommission(d).amount;
      byType[label].count++;
    });

    // By agent/broker
    const byAgent = {};
    deals.forEach((d) => {
      const name = d.broker_name || d.assigned_admin || "Direct";
      if (!byAgent[name]) byAgent[name] = { name, earned: 0, pending: 0, declined: 0, deals: 0 };
      const comm = d.commission_amount || calcCommission(d).amount;
      byAgent[name].deals++;
      if (d.stage === "funded") byAgent[name].earned += comm;
      else if (d.stage === "declined" || d.stage === "withdrawn") byAgent[name].declined += comm;
      else byAgent[name].pending += comm;
    });

    // By deal outcome for pie
    const byOutcome = {};
    deals.forEach((d) => {
      const stage = d.stage || "unknown";
      if (!byOutcome[stage]) byOutcome[stage] = { name: stage.replace(/_/g, " "), value: 0 };
      byOutcome[stage].value++;
    });

    const filteredDeals = deals
      .filter((d) => {
        if (activeFilter === "Funded") return d.stage === "funded";
        if (activeFilter === "Active") return !["funded", "declined", "withdrawn"].includes(d.stage);
        if (activeFilter === "Declined") return d.stage === "declined" || d.stage === "withdrawn";
        return true;
      })
      .map((d) => ({
        ...d,
        _commission: d.commission_amount || calcCommission(d).amount,
        _rate: d.commission_rate ?? calcCommission(d).rate * 100,
      }))
      .sort((a, b) => b._commission - a._commission);

    return {
      totalEarned, totalPending,
      fundedCount: funded.length,
      activeCount: active.length,
      declinedCount: declined.length,
      avgCommission: funded.length > 0 ? totalEarned / funded.length : 0,
      byType: Object.values(byType).sort((a, b) => b.amount - a.amount),
      byAgent: Object.values(byAgent).sort((a, b) => b.earned - a.earned),
      byOutcome: Object.values(byOutcome),
      filteredDeals,
    };
  }, [deals, activeFilter]);

  if (isLoading)
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Agent Earnings & Commissions</h1>
        <p className="text-slate-500 mt-1">Track earned, pending, and projected commissions by agent, loan type, and deal outcome</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
        {[
          { label: "Total Earned", value: fmt(stats.totalEarned), Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Pipeline", value: fmt(stats.totalPending), Icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Avg per Deal", value: fmt(stats.avgCommission), Icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Funded Deals", value: stats.fundedCount, Icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Deals", value: stats.activeCount, Icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
          { label: "Total Agents", value: stats.byAgent.length, Icon: Users, color: "text-indigo-600", bg: "bg-indigo-50" },
        ].map(({ label, value, Icon, color, bg }) => (
          <div key={label} className="bg-white rounded-xl border border-slate-100 shadow-sm p-4">
            <div className={`inline-flex p-2 rounded-lg ${bg} mb-2`}>
              <Icon className={`h-4 w-4 ${color}`} />
            </div>
            <p className="text-xl font-bold text-slate-900">{value}</p>
            <p className="text-xs text-slate-500">{label}</p>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-2 gap-6">
        {/* By Loan Type Chart */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Commissions by Loan Type (Funded)</h3>
          {stats.byType.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <BarChart data={stats.byType}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <YAxis tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: "#94a3b8" }} />
                <Tooltip formatter={(v) => [fmt(v), "Commission"]} />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-12">No funded deals yet</p>
          )}
        </div>

        {/* Deal Outcome Distribution */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Deal Outcome Distribution</h3>
          {stats.byOutcome.length > 0 ? (
            <ResponsiveContainer width="100%" height={220}>
              <PieChart>
                <Pie data={stats.byOutcome} dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={80} label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                  {stats.byOutcome.map((entry, i) => (
                    <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-12">No deals yet</p>
          )}
        </div>
      </div>

      {/* Agent Earnings Breakdown */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
        <h3 className="text-sm font-semibold text-slate-700 mb-4">Agent Earnings Breakdown</h3>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs font-semibold text-slate-400 uppercase tracking-wider border-b border-slate-100">
                <th className="text-left pb-3 pr-4">#</th>
                <th className="text-left pb-3 pr-4">Agent / Broker</th>
                <th className="text-right pb-3 pr-4">Deals</th>
                <th className="text-right pb-3 pr-4">Earned (Funded)</th>
                <th className="text-right pb-3 pr-4">Pending</th>
                <th className="text-right pb-3">Total Pipeline</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {stats.byAgent.map((a, i) => (
                <tr key={a.name} className="hover:bg-slate-50 transition-colors">
                  <td className="py-3 pr-4">
                    <span className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 inline-flex">
                      {i + 1}
                    </span>
                  </td>
                  <td className="py-3 pr-4 font-medium text-slate-800">{a.name}</td>
                  <td className="py-3 pr-4 text-right text-slate-500">{a.deals}</td>
                  <td className="py-3 pr-4 text-right font-bold text-emerald-600">{fmt(a.earned)}</td>
                  <td className="py-3 pr-4 text-right text-amber-500 font-medium">{fmt(a.pending)}</td>
                  <td className="py-3 text-right font-semibold text-slate-700">{fmt(a.earned + a.pending)}</td>
                </tr>
              ))}
              {stats.byAgent.length === 0 && (
                <tr><td colSpan={6} className="py-12 text-center text-slate-400">No deal data yet</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Deal Commission Table with filter */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between flex-wrap gap-2">
          <h3 className="text-sm font-semibold text-slate-700">Deal Commission Breakdown</h3>
          <div className="flex gap-1">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`px-3 py-1 rounded-full text-xs font-medium transition-all ${
                  activeFilter === f
                    ? "bg-amber-500 text-black"
                    : "bg-slate-100 text-slate-500 hover:bg-slate-200"
                }`}
              >
                {f}
              </button>
            ))}
          </div>
        </div>
        <div className="divide-y divide-slate-50">
          <div className="hidden md:flex items-center gap-4 px-5 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="flex-1">Borrower / Agent</div>
            <div className="w-28 text-right">Loan Amount</div>
            <div className="w-28 text-right">Commission</div>
            <div className="w-24 text-center">Stage</div>
            <div className="w-20 text-center">Status</div>
          </div>
          {stats.filteredDeals.slice(0, 50).map((deal) => {
            const isFunded = deal.stage === "funded";
            const isDeclined = deal.stage === "declined" || deal.stage === "withdrawn";
            const stageColor = STAGE_COLORS[deal.stage] || "#94a3b8";
            return (
              <div key={deal.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{deal.borrower_name}</p>
                  <p className="text-xs text-slate-400">
                    {LOAN_LABELS[deal.loan_type] || deal.loan_type} · {deal.broker_name || deal.assigned_admin || "Direct"}
                  </p>
                </div>
                <div className="text-right w-28">
                  <p className="text-sm font-semibold text-slate-700">{fmt(deal.loan_amount)}</p>
                </div>
                <div className="text-right w-28">
                  <p className={`text-sm font-bold ${isFunded ? "text-emerald-600" : isDeclined ? "text-slate-400" : "text-amber-500"}`}>
                    {fmt(deal._commission)}
                  </p>
                  <p className="text-xs text-slate-400">{deal._rate?.toFixed(0)}% rate</p>
                </div>
                <div className="w-24 text-center">
                  <span className="text-xs px-2 py-0.5 rounded-full" style={{ backgroundColor: stageColor + "20", color: stageColor }}>
                    {(deal.stage || "").replace(/_/g, " ")}
                  </span>
                </div>
                <div className={`w-20 text-center text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${
                  isFunded ? "bg-emerald-100 text-emerald-700" :
                  isDeclined ? "bg-slate-100 text-slate-500" :
                  "bg-amber-100 text-amber-700"
                }`}>
                  {isFunded ? "Earned" : isDeclined ? "Lost" : "Pending"}
                </div>
              </div>
            );
          })}
          {stats.filteredDeals.length === 0 && (
            <p className="text-center text-slate-400 py-12 text-sm">No deals match this filter</p>
          )}
        </div>
      </div>
    </div>
  );
}