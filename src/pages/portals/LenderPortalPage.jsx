import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import DealWorkflow from "@/components/portal/DealWorkflow";
import { Briefcase, DollarSign, TrendingUp, Clock, CheckCircle2, AlertTriangle, Building2 } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

const stageColors = {
  lender_matched: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  term_sheet_sent: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  funded: "bg-green-500/10 text-green-400 border-green-500/20",
  under_review: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  docs_requested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  docs_received: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
};

export default function LenderPortalPage() {
  const [user, setUser] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

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

  const active = deals.filter(d => !['funded', 'declined', 'withdrawn'].includes(d.stage));
  const funded = deals.filter(d => d.stage === 'funded');
  const awaitingResponse = deals.filter(d => d.stage === 'lender_matched');
  const totalFunded = funded.reduce((s, d) => s + (d.approved_amount || d.loan_amount || 0), 0);
  const avgLoanSize = funded.length > 0 ? totalFunded / funded.length : 0;

  // Loan type breakdown
  const byType = funded.reduce((acc, d) => {
    const k = d.loan_type?.replace(/_/g, ' ') || 'Other';
    acc[k] = (acc[k] || 0) + (d.approved_amount || d.loan_amount || 0);
    return acc;
  }, {});

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-16">

        {/* Header */}
        <div className="mb-6">
          <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">Lender Portal</div>
          <h1 className="text-3xl font-extrabold">
            {user.full_name} <span className="text-slate-500 font-normal text-xl">— Lender</span>
          </h1>
          <p className="text-slate-400 mt-1">Review, approve, and fund matched deals from GLINFICO.</p>
        </div>

        {/* Awaiting response alert */}
        {awaitingResponse.length > 0 && (
          <div className="mb-6 flex items-start gap-3 bg-amber-500/10 border border-amber-500/30 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-amber-400 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-amber-300 font-semibold text-sm">{awaitingResponse.length} Deal{awaitingResponse.length !== 1 ? 's' : ''} Awaiting Your Response</p>
              <p className="text-slate-400 text-xs mt-0.5">Please review and respond within 24 hours to avoid auto-reassignment.</p>
            </div>
            <a href="mailto:deals@glinfico.com" className="text-xs text-amber-400 hover:text-amber-300 font-semibold whitespace-nowrap mt-0.5">Contact GLINFICO →</a>
          </div>
        )}

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

        {/* Funded breakdown */}
        {Object.keys(byType).length > 0 && (
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl px-6 py-5 mb-6">
            <div className="flex items-center justify-between mb-4">
              <p className="text-white font-bold text-sm">Funded Portfolio by Type</p>
              <p className="text-slate-500 text-xs">Avg deal: {fmt(avgLoanSize)}</p>
            </div>
            <div className="space-y-2.5">
              {Object.entries(byType).sort((a, b) => b[1] - a[1]).map(([type, val]) => (
                <div key={type} className="flex items-center gap-3">
                  <p className="w-36 text-xs text-slate-300 capitalize truncate">{type}</p>
                  <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
                    <div className="h-full bg-amber-500 rounded-full" style={{ width: `${Math.round((val / totalFunded) * 100)}%` }} />
                  </div>
                  <p className="text-xs font-medium text-amber-400 w-20 text-right">{fmt(val)}</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Deal workflow panel */}
        {selectedDeal && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Deal Detail</p>
              <button onClick={() => setSelectedDeal(null)} className="text-slate-500 text-xs hover:text-white">Close</button>
            </div>
            <DealWorkflow deal={selectedDeal} />
          </div>
        )}

        <Tabs defaultValue="active">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="active" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              Active ({active.length})
            </TabsTrigger>
            <TabsTrigger value="funded" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              Funded ({funded.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="active">
            <div className="space-y-3">
              {active.map(deal => (
                <button
                  key={deal.id}
                  onClick={() => setSelectedDeal(selectedDeal?.id === deal.id ? null : deal)}
                  className="w-full bg-[#0f0f1e] border border-amber-500/20 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/40 transition-all text-left"
                >
                  <div>
                    <p className="font-semibold text-white">{deal.borrower_name}</p>
                    <p className="text-slate-400 text-sm">{deal.loan_type?.replace(/_/g, ' ')} · {deal.industry || 'General'}{deal.state ? ` · ${deal.state}` : ''}</p>
                    <div className="flex gap-3 mt-1 text-xs text-slate-500">
                      {deal.credit_score && <span>FICO: {deal.credit_score}</span>}
                      {deal.years_in_business && <span>{deal.years_in_business}yr biz</span>}
                      {deal.annual_revenue && <span>Rev: {fmt(deal.annual_revenue)}</span>}
                    </div>
                  </div>
                  <div className="text-right flex-shrink-0">
                    <p className="text-amber-400 font-bold">{fmt(deal.loan_amount)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${stageColors[deal.stage] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                      {deal.stage?.replace(/_/g, ' ')}
                    </span>
                  </div>
                </button>
              ))}
              {active.length === 0 && <p className="text-slate-500 text-center py-12">No active deals matched to your institution.</p>}
            </div>
          </TabsContent>

          <TabsContent value="funded">
            <div className="space-y-3">
              {funded.map(deal => (
                <div key={deal.id} className="bg-[#0f0f1e] border border-emerald-500/10 rounded-xl p-4 flex items-center justify-between gap-4">
                  <div>
                    <p className="font-semibold text-white">{deal.borrower_name}</p>
                    <p className="text-slate-400 text-sm capitalize">{deal.loan_type?.replace(/_/g, ' ')}</p>
                    {deal.funded_date && <p className="text-slate-600 text-xs">Funded: {deal.funded_date}</p>}
                  </div>
                  <div className="text-right">
                    <p className="text-emerald-400 font-bold">{fmt(deal.approved_amount || deal.loan_amount)}</p>
                    {deal.interest_rate && <p className="text-slate-500 text-xs">{deal.interest_rate}% rate</p>}
                  </div>
                </div>
              ))}
              {funded.length === 0 && <p className="text-slate-500 text-center py-12">No funded deals yet.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <FodFooter />
    </div>
  );
}