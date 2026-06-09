import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import DealWorkflow from "@/components/portal/DealWorkflow";
import { DollarSign, FileText, Clock, CheckCircle2 } from "lucide-react";

const stageColors = {
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  under_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  lender_matched: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  funded: "bg-green-500/10 text-green-400 border-green-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
  withdrawn: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};
// stageColors retained for deal list badges below

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

export default function BorrowerPortal() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin('/portal/borrower'));
  }, []);

  const { data: deals = [], isLoading } = useQuery({
    queryKey: ['borrower-deals', user?.email],
    queryFn: () => base44.entities.Deal.filter({ borrower_email: user.email }, '-created_date'),
    enabled: !!user?.email,
  });

  if (!user || isLoading) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeDeal = deals.find(d => !['funded','declined','withdrawn'].includes(d.stage));

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-16">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">
            Welcome back, <span className="text-amber-400">{user.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 mt-1">Track your funding application and deal status below.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Deals", value: deals.filter(d => !['funded','declined','withdrawn'].includes(d.stage)).length, Icon: Clock, color: "text-amber-400" },
            { label: "Funded Deals", value: deals.filter(d => d.stage === 'funded').length, Icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Total Requested", value: fmt(deals.reduce((s,d) => s+(d.loan_amount||0),0)), Icon: DollarSign, color: "text-blue-400" },
            { label: "Total Funded", value: fmt(deals.filter(d=>d.stage==='funded').reduce((s,d)=>s+(d.approved_amount||0),0)), Icon: FileText, color: "text-purple-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Active Deal Workflow */}
        {activeDeal && (
          <div className="mb-8">
            <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">Active Application</p>
            <DealWorkflow deal={activeDeal} />
          </div>
        )}

        {/* All Deals */}
        <h2 className="text-lg font-bold text-white mb-4">Your Deals</h2>
        {deals.length === 0 ? (
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-12 text-center">
            <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">No deals on file yet.</p>
            <a href="/fod/submit" className="inline-block mt-4 px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full text-sm transition-all">
              Submit a Deal →
            </a>
          </div>
        ) : (
          <div className="space-y-3">
            {deals.map(deal => (
              <div key={deal.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
                <div>
                  <p className="font-semibold text-white">{deal.loan_type?.replace(/_/g,' ')} — {fmt(deal.loan_amount)}</p>
                  <p className="text-slate-400 text-sm">{deal.lender_name ? `Lender: ${deal.lender_name}` : 'Pending lender match'}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${stageColors[deal.stage] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                  {deal.stage?.replace(/_/g,' ')}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <FodFooter />
    </div>
  );
}