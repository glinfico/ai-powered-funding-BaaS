import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { base44 } from "@/api/base44Client";
import { calcCommission } from "@/utils/commissionCalc";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from "recharts";
import { DollarSign, TrendingUp, Clock, CheckCircle2, Award } from "lucide-react";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '$0';

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

export default function CommissionDashboard() {
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['deals-commission'],
    queryFn: () => base44.entities.Deal.list('-created_date', 500),
  });

  const stats = useMemo(() => {
    const funded = deals.filter(d => d.stage === 'funded');
    const active = deals.filter(d => !['funded', 'declined', 'withdrawn'].includes(d.stage));

    const totalEarned = funded.reduce((s, d) => s + (d.commission_amount || calcCommission(d).amount), 0);
    const totalPending = active.reduce((s, d) => s + (d.commission_amount || calcCommission(d).amount), 0);

    const byType = {};
    funded.forEach(d => {
      const label = LOAN_LABELS[d.loan_type] || d.loan_type;
      if (!byType[label]) byType[label] = { type: label, amount: 0, count: 0 };
      byType[label].amount += d.commission_amount || calcCommission(d).amount;
      byType[label].count++;
    });

    const byBroker = {};
    funded.forEach(d => {
      const name = d.broker_name || 'Direct';
      if (!byBroker[name]) byBroker[name] = { name, amount: 0, count: 0 };
      byBroker[name].amount += d.commission_amount || calcCommission(d).amount;
      byBroker[name].count++;
    });

    const allDeals = deals.map(d => ({
      ...d,
      _commission: d.commission_amount || calcCommission(d).amount,
      _rate: d.commission_rate ?? (calcCommission(d).rate * 100),
    })).sort((a, b) => b._commission - a._commission);

    return {
      totalEarned, totalPending,
      fundedCount: funded.length,
      activeCount: active.length,
      avgCommission: funded.length > 0 ? totalEarned / funded.length : 0,
      byType: Object.values(byType).sort((a, b) => b.amount - a.amount),
      byBroker: Object.values(byBroker).sort((a, b) => b.amount - a.amount),
      allDeals,
    };
  }, [deals]);

  if (isLoading) return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="w-8 h-8 border-4 border-amber-500 border-t-transparent rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">Commission Dashboard</h1>
        <p className="text-slate-500 mt-1">Track earned, pending, and projected broker commissions</p>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {[
          { label: "Total Earned", value: fmt(stats.totalEarned), Icon: CheckCircle2, color: "text-emerald-600", bg: "bg-emerald-50" },
          { label: "Pending Pipeline", value: fmt(stats.totalPending), Icon: Clock, color: "text-amber-600", bg: "bg-amber-50" },
          { label: "Avg per Deal", value: fmt(stats.avgCommission), Icon: Award, color: "text-purple-600", bg: "bg-purple-50" },
          { label: "Funded Deals", value: stats.fundedCount, Icon: TrendingUp, color: "text-blue-600", bg: "bg-blue-50" },
          { label: "Active Deals", value: stats.activeCount, Icon: DollarSign, color: "text-rose-600", bg: "bg-rose-50" },
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
                <XAxis dataKey="type" tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <YAxis tickFormatter={v => `$${(v / 1000).toFixed(0)}k`} tick={{ fontSize: 11, fill: '#94a3b8' }} />
                <Tooltip formatter={v => [fmt(v), 'Commission']} />
                <Bar dataKey="amount" fill="#f59e0b" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <p className="text-slate-400 text-sm text-center py-12">No funded deals yet</p>
          )}
        </div>

        {/* By Broker */}
        <div className="bg-white rounded-xl border border-slate-100 shadow-sm p-5">
          <h3 className="text-sm font-semibold text-slate-700 mb-4">Top Brokers by Commission Earned</h3>
          <div className="space-y-3">
            {stats.byBroker.slice(0, 6).map((b, i) => (
              <div key={b.name} className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-amber-100 flex items-center justify-center text-xs font-bold text-amber-700 flex-shrink-0">
                  {i + 1}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-0.5">
                    <p className="text-sm font-medium text-slate-700 truncate">{b.name}</p>
                    <p className="text-sm font-bold text-emerald-600 ml-2">{fmt(b.amount)}</p>
                  </div>
                  <div className="h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-amber-400 to-amber-500 rounded-full"
                      style={{ width: `${(b.amount / stats.byBroker[0]?.amount) * 100}%` }}
                    />
                  </div>
                </div>
                <span className="text-xs text-slate-400 flex-shrink-0">{b.count} deal{b.count !== 1 ? 's' : ''}</span>
              </div>
            ))}
            {stats.byBroker.length === 0 && (
              <p className="text-slate-400 text-sm text-center py-8">No funded deals yet</p>
            )}
          </div>
        </div>
      </div>

      {/* Deal Commission Table */}
      <div className="bg-white rounded-xl border border-slate-100 shadow-sm">
        <div className="px-5 py-4 border-b border-slate-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-slate-700">All Deals — Commission Breakdown</h3>
          <span className="text-xs text-slate-400">{stats.allDeals.length} deals</span>
        </div>
        <div className="divide-y divide-slate-50">
          {/* Header */}
          <div className="hidden md:flex items-center gap-4 px-5 py-2 text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <div className="flex-1">Borrower / Broker</div>
            <div className="w-28 text-right">Loan Amount</div>
            <div className="w-28 text-right">Commission</div>
            <div className="w-20 text-center">Status</div>
          </div>
          {stats.allDeals.slice(0, 50).map(deal => {
            const isFunded = deal.stage === 'funded';
            return (
              <div key={deal.id} className="flex items-center gap-4 px-5 py-3 hover:bg-slate-50 transition-colors">
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-slate-900 truncate">{deal.borrower_name}</p>
                  <p className="text-xs text-slate-400">{LOAN_LABELS[deal.loan_type] || deal.loan_type} · {deal.broker_name || 'Direct'}</p>
                </div>
                <div className="text-right w-28">
                  <p className="text-sm font-semibold text-slate-700">{fmt(deal.loan_amount)}</p>
                  <p className="text-xs text-slate-400">requested</p>
                </div>
                <div className="text-right w-28">
                  <p className={`text-sm font-bold ${isFunded ? 'text-emerald-600' : 'text-amber-500'}`}>{fmt(deal._commission)}</p>
                  <p className="text-xs text-slate-400">{deal._rate?.toFixed(0)}% rate</p>
                </div>
                <div className={`w-20 text-center text-xs px-2 py-1 rounded-full font-medium flex-shrink-0 ${isFunded ? 'bg-emerald-100 text-emerald-700' : 'bg-amber-100 text-amber-700'}`}>
                  {isFunded ? 'Earned' : 'Pending'}
                </div>
              </div>
            );
          })}
          {stats.allDeals.length === 0 && (
            <p className="text-center text-slate-400 py-12 text-sm">No deals found</p>
          )}
        </div>
      </div>
    </div>
  );
}