import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import { TrendingUp, DollarSign, BarChart2, Briefcase } from "lucide-react";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

export default function InvestorPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin('/portal/investor'));
  }, []);

  // Investors see deals where they are assigned as admin or where deal is funded/approved
  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['investor-deals', user?.full_name],
    queryFn: () => base44.entities.Deal.filter({ assigned_admin: user.full_name }, '-created_date'),
    enabled: !!user?.full_name,
  });

  if (!user || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const totalValue = deals.reduce((s, d) => s + (d.loan_amount || 0), 0);
  const fundedValue = deals.filter(d => d.stage === 'funded').reduce((s, d) => s + (d.approved_amount || d.loan_amount || 0), 0);
  const byType = deals.reduce((acc, d) => {
    const k = d.loan_type?.replace(/_/g,' ') || 'Other';
    acc[k] = (acc[k] || 0) + (d.loan_amount || 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">
            Investor Portal — <span className="text-amber-400">{user.full_name}</span>
          </h1>
          <p className="text-slate-400 mt-1">Your deal portfolio and performance overview.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Deals", value: deals.length, Icon: Briefcase, color: "text-amber-400" },
            { label: "Portfolio Value", value: fmt(totalValue), Icon: DollarSign, color: "text-blue-400" },
            { label: "Funded Amount", value: fmt(fundedValue), Icon: TrendingUp, color: "text-emerald-400" },
            { label: "Deal Types", value: Object.keys(byType).length, Icon: BarChart2, color: "text-purple-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Portfolio breakdown */}
        {Object.keys(byType).length > 0 && (
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 mb-6">
            <h2 className="text-white font-bold mb-4">Portfolio Breakdown</h2>
            <div className="space-y-3">
              {Object.entries(byType).sort((a,b)=>b[1]-a[1]).map(([type, val]) => (
                <div key={type} className="flex items-center gap-3">
                  <p className="w-40 text-sm text-slate-300 capitalize truncate">{type}</p>
                  <div className="flex-1 h-2 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((val/totalValue)*100)}%` }} />
                  </div>
                  <p className="text-sm font-medium text-amber-400 w-24 text-right">{fmt(val)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deal list */}
        <h2 className="text-lg font-bold text-white mb-4">Assigned Deals</h2>
        <div className="space-y-3">
          {deals.map(deal => (
            <div key={deal.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
              <div>
                <p className="font-semibold text-white">{deal.borrower_name}</p>
                <p className="text-slate-400 text-sm capitalize">{deal.loan_type?.replace(/_/g,' ')} · {deal.lender_name || 'Pending'}</p>
              </div>
              <div className="text-right">
                <p className="text-amber-400 font-bold">{fmt(deal.loan_amount)}</p>
                <p className="text-slate-400 text-xs capitalize">{deal.stage?.replace(/_/g,' ')}</p>
              </div>
            </div>
          ))}
          {deals.length === 0 && (
            <p className="text-slate-500 text-center py-12">No deals assigned to your account yet.</p>
          )}
        </div>
      </div>
      <FodFooter />
    </div>
  );
}