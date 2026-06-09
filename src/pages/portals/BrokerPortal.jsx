import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import { Users, Building2, Briefcase, DollarSign, TrendingUp } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

const stageColor = (stage) => ({
  funded: "text-emerald-400", approved: "text-green-400", declined: "text-red-400"
}[stage] || "text-amber-400");

export default function BrokerPortal() {
  const [user, setUser] = useState(null);

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

  const totalCommission = deals.reduce((s, d) => s + (d.commission_amount || 0), 0);

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-5xl mx-auto w-full px-4 pt-24 pb-16">
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold">
            Broker Portal — <span className="text-amber-400">{user.full_name}</span>
          </h1>
          <p className="text-slate-400 mt-1">Your leads, deals, and lender network in one place.</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Assigned Leads", value: leads.length, Icon: Users, color: "text-amber-400" },
            { label: "Active Deals", value: deals.filter(d=>!['funded','declined','withdrawn'].includes(d.stage)).length, Icon: Briefcase, color: "text-blue-400" },
            { label: "Funded Deals", value: deals.filter(d=>d.stage==='funded').length, Icon: TrendingUp, color: "text-emerald-400" },
            { label: "Est. Commissions", value: fmt(totalCommission), Icon: DollarSign, color: "text-purple-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        <Tabs defaultValue="leads">
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="leads" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white">
              My Leads ({leads.length})
            </TabsTrigger>
            <TabsTrigger value="deals" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white">
              My Deals ({deals.length})
            </TabsTrigger>
            <TabsTrigger value="lenders" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white">
              Lenders ({lenders.length})
            </TabsTrigger>
          </TabsList>

          <TabsContent value="leads">
            <div className="space-y-3">
              {leads.map(lead => (
                <div key={lead.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
                  <div>
                    <p className="font-semibold text-white">{lead.first_name} {lead.last_name}</p>
                    <p className="text-slate-400 text-sm">{lead.company} · {lead.loan_type?.replace(/_/g,' ')}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-amber-400 font-semibold">{fmt(lead.loan_amount)}</p>
                    <p className="text-slate-400 text-xs capitalize">{lead.status?.replace(/_/g,' ')}</p>
                  </div>
                </div>
              ))}
              {leads.length === 0 && <p className="text-slate-500 text-center py-12">No leads assigned to you yet.</p>}
            </div>
          </TabsContent>

          <TabsContent value="deals">
            <div className="space-y-3">
              {deals.map(deal => (
                <div key={deal.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 flex items-center justify-between gap-4 hover:border-amber-500/30 transition-all">
                  <div>
                    <p className="font-semibold text-white">{deal.borrower_name}</p>
                    <p className="text-slate-400 text-sm">{deal.loan_type?.replace(/_/g,' ')} · {deal.lender_name || 'Pending match'}</p>
                  </div>
                  <div className="text-right">
                    <p className={`font-semibold ${stageColor(deal.stage)}`}>{fmt(deal.loan_amount)}</p>
                    <p className="text-slate-400 text-xs capitalize">{deal.stage?.replace(/_/g,' ')}</p>
                  </div>
                </div>
              ))}
              {deals.length === 0 && <p className="text-slate-500 text-center py-12">No deals found for your account.</p>}
            </div>
          </TabsContent>

          <TabsContent value="lenders">
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {lenders.map(lender => (
                <div key={lender.id} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-4 hover:border-amber-500/30 transition-all">
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-9 h-9 rounded-xl bg-amber-500/10 flex items-center justify-center">
                      <Building2 className="h-4 w-4 text-amber-400" />
                    </div>
                    <div>
                      <p className="font-semibold text-white text-sm">{lender.name}</p>
                      <p className="text-slate-500 text-xs capitalize">{lender.lender_type?.replace(/_/g,' ')}</p>
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