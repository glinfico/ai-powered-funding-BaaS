import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import DealWorkflow from "@/components/portal/DealWorkflow";
import { Users, Building2, Briefcase, DollarSign, TrendingUp, ChevronRight, FileText } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

const stageBadge = {
  funded: "bg-emerald-500/20 text-emerald-300 border-emerald-500/30",
  approved: "bg-green-500/20 text-green-300 border-green-500/30",
  declined: "bg-red-500/20 text-red-300 border-red-500/30",
  lender_matched: "bg-purple-500/20 text-purple-300 border-purple-500/30",
  term_sheet_sent: "bg-cyan-500/20 text-cyan-300 border-cyan-500/30",
};

export default function BrokerPortal() {
  const [user, setUser] = useState(null);
  const [selectedDeal, setSelectedDeal] = useState(null);

  useEffect(() => {
    base44.auth.me().then(setUser).catch(() => base44.auth.redirectToLogin('/portal/broker'));
  }, []);

  const { data: leads = [] } = useQuery({
    queryKey: ['broker-leads', user?.full_name],
    queryFn: () => base44.entities.Lead.filter({ assigned_to: user.full_name }, '-created_date'),
    enabled: !!user?.full_name,
  });

  const { data: deals = [] } = useQuery({
    queryKey: ['broker-deals', user?.full_name],
    queryFn: () => base44.entities.Deal.filter({ broker_name: user.full_name }, '-created_date'),
    enabled: !!user?.full_name,
  });

  const { data: lenders = [] } = useQuery({
    queryKey: ['lenders-broker'],
    queryFn: () => base44.entities.Lender.filter({ status: 'active' }, 'name', 100),
    enabled: !!user,
  });

  if (!user) {
    return (
      <div className="fixed inset-0 flex items-center justify-center bg-[#0a0a12]">
        <div className="w-8 h-8 border-4 border-amber-500/30 border-t-amber-500 rounded-full animate-spin" />
      </div>
    );
  }

  const activeDeals = deals.filter(d => !['funded', 'declined', 'withdrawn'].includes(d.stage));
  const fundedDeals = deals.filter(d => d.stage === 'funded');
  const totalCommission = deals.reduce((s, d) => s + (d.commission_amount || 0), 0);
  const totalVolume = fundedDeals.reduce((s, d) => s + (d.approved_amount || d.loan_amount || 0), 0);
  const conversionRate = deals.length > 0 ? ((fundedDeals.length / deals.length) * 100).toFixed(0) : 0;

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">

        {/* Header */}
        <div className="mb-6">
          <div className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">Broker Dashboard</div>
          <h1 className="text-3xl font-extrabold">
            {user.full_name} <span className="text-slate-500 font-normal text-xl">— Broker</span>
          </h1>
          <p className="text-slate-400 mt-1">Your leads, pipeline, commissions, and lender network.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-4 mb-8">
          {[
            { label: "Assigned Leads", value: leads.length, Icon: Users, color: "text-amber-400" },
            { label: "Active Deals", value: activeDeals.length, Icon: Briefcase, color: "text-blue-400" },
            { label: "Funded", value: fundedDeals.length, Icon: TrendingUp, color: "text-emerald-400" },
            { label: "Conversion", value: `${conversionRate}%`, Icon: ChevronRight, color: "text-purple-400" },
            { label: "Est. Commission", value: fmt(totalCommission), Icon: DollarSign, color: "text-rose-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Volume bar */}
        {totalVolume > 0 && (
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl px-6 py-4 mb-6 flex items-center gap-6">
            <div>
              <p className="text-slate-500 text-xs uppercase tracking-wider">Total Funded Volume</p>
              <p className="text-2xl font-extrabold text-emerald-400">{fmt(totalVolume)}</p>
            </div>
            <div className="flex-1 h-1.5 bg-white/5 rounded-full overflow-hidden">
              <div className="h-full bg-gradient-to-r from-emerald-500 to-amber-400 rounded-full" style={{ width: '100%' }} />
            </div>
          </div>
        )}

        {/* Deal Workflow Panel */}
        {selectedDeal && (
          <div className="mb-6">
            <div className="flex items-center justify-between mb-3">
              <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider">Deal Workflow</p>
              <button onClick={() => setSelectedDeal(null)} className="text-slate-500 text-xs hover:text-white">Close</button>
            </div>
            <DealWorkflow deal={selectedDeal} />
          </div>
        )}

        <Tabs defaultValue="leads">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="leads" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              My Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="deals" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              My Deals ({deals.length})
            </TabsTrigger>
            <TabsTrigger value="lenders" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              Lender Network ({lenders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <div className="space-y-3">
              {leads.map(lead => (
                <div key={lead.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
                  <div>
                    <p className="font-semibold text-white">{lead.first_name} {lead.last_name}</p>
                    <p className="text-slate-400 text-sm">{lead.company} · {lead.loan_type?.replace(/_/g, ' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-semibold">{fmt(lead.loan_amount)}</p>
                    <p className="text-slate-400 text-xs capitalize">{lead.status?.replace(/_/g, ' ')}</p>
                  </div>
                </div>
              ))}
              {leads.length === 0 && <p className="text-slate-500 text-center py-12">No leads assigned to you yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="deals">
            <div className="space-y-3">
              {deals.map(deal => (
                <button
                  key={deal.id}
                  onClick={() => setSelectedDeal(selectedDeal?.id === deal.id ? null : deal)}
                  className="w-full bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all text-left"
                >
                  <div>
                    <p className="font-semibold text-white">{deal.borrower_name}</p>
                    <p className="text-slate-400 text-sm">{deal.loan_type?.replace(/_/g, ' ')} · {deal.lender_name || 'Pending match'}</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="text-amber-400 font-semibold text-sm">{fmt(deal.loan_amount)}</p>
                    <span className={`px-2 py-0.5 rounded-full text-xs border ${stageBadge[deal.stage] || 'bg-slate-500/20 text-slate-400 border-slate-500/30'}`}>
                      {deal.stage?.replace(/_/g, ' ')}
                    </span>
                    {deal.commission_amount > 0 && (
                      <span className="text-emerald-400 text-xs font-semibold">{fmt(deal.commission_amount)}</span>
                    )}
                  </div>
                </button>
              ))}
              {deals.length === 0 && <p className="text-slate-500 text-center py-12">No deals found for your account.</p>}
            </div>
          </TabsContent>

          <TabsContent value="lenders">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lenders.map(lender => (
                <div key={lender.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center flex-shrink-0">
                      <Building2 className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{lender.name}</p>
                      <p className="text-slate-500 text-xs capitalize">{lender.lender_type?.replace(/_/g, ' ')}</p>
                    </div>
                  </div>
                  <div className="space-y-1 text-xs text-slate-400">
                    {lender.min_loan_amount && lender.max_loan_amount && (
                      <p>Range: <span className="text-white">{fmt(lender.min_loan_amount)} – {fmt(lender.max_loan_amount)}</span></p>
                    )}
                    {lender.typical_rate_min && (
                      <p>Rate: <span className="text-white">{lender.typical_rate_min}–{lender.typical_rate_max}%</span></p>
                    )}
                    {lender.funding_speed_days && (
                      <p>Speed: <span className="text-emerald-400">{lender.funding_speed_days} days</span></p>
                    )}
                  </div>
                </div>
              ))}
              {lenders.length === 0 && <p className="text-slate-500 col-span-full text-center py-12">No active lenders in network.</p>}
            </div>
          </TabsContent>
        </Tabs>
      </div>
      <FodFooter />
    </div>
  );
}