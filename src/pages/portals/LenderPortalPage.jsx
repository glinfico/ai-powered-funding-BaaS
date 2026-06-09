import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import { Briefcase, DollarSign, TrendingUp, Clock } from "lucide-react";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

const stageColors = {
  lender_matched: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  term_sheet_sent: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  funded: "bg-green-500/10 text-green-400 border-green-500/20",
  under_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  docs_requested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
};

export default function LenderPortalPage() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin('/portal/lender'));
  }, []);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['lender-deals', user?.full_name],
    queryFn: () => base44.entities.Deal.filter({ lender_name: user.full_name }, '-created_date'),
    enabled: !!user?.full_name,
  });

  if (!user || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const active = deals.filter(d => !['funded','declined','withdrawn'].includes(d.stage));
  const funded = deals.filter(d => d.stage === 'funded');
  const totalFunded = funded.reduce((s, d) => s + (d.approved_amount || d.loan_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">
            Lender Portal — <span className="text-amber-400">{user.full_name}</span>
          </h1>
          <p className="text-slate-400 mt-1">Deals matched and assigned to your institution.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Total Deals", value: deals.length, Icon: Briefcase, color: "text-amber-400" },
            { label: "Active Pipeline", value: active.length, Icon: Clock, color: "text-blue-400" },
            { label: "Funded Deals", value: funded.length, Icon: TrendingUp, color: "text-emerald-400" },
            { label: "Total Funded", value: fmt(totalFunded), Icon: DollarSign, color: "text-purple-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Active deals first */}
        {active.length > 0 && (
          <>
            <h2 className="text-lg font-bold text-white mb-4">Active Deals</h2>
            <div className="space-y-3 mb-8">
              {active.map(deal => (
                <div key={deal.id} className="bg-[#0f0f1e] border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-all">
                  <div>
                    <p className="font-semibold text-white">{deal.borrower_name}</p>
                    <p className="text-slate-400 text-sm">{deal.loan_type?.replace(/_/g,' ')} · {deal.industry || 'General'} · {deal.state || ''}</p>
                    {deal.credit_score && <p className="text-slate-500 text-xs">FICO: {deal.credit_score}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-bold">{fmt(deal.loan_amount)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${stageColors[deal.stage] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {deal.stage?.replace(/_/g,' ')}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Funded deals */}
        <h2 className="text-lg font-bold text-white mb-4">Funded Deals</h2>
        <div className="space-y-3">
          {funded.map(deal => (
            <div key={deal.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4">
              <div>
                <p className="font-semibold text-white">{deal.borrower_name}</p>
                <p className="text-slate-400 text-sm">{deal.loan_type?.replace(/_/g,' ')}</p>
              </div>
              <p className="text-emerald-400 font-bold">{fmt(deal.approved_amount || deal.loan_amount)}</p>
            </div>
          ))}
          {deals.length === 0 && (
            <p className="text-slate-500 text-center py-12">No deals matched to your institution yet.</p>
          )}
        </div>
      </div>
      <FodFooter />
    </div>
  );
}