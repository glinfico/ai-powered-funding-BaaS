import { useEffect, useState } from "react";
import { base44 } from "@/api/base44Client";
import { useQuery } from "@tanstack/react-query";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import DealWorkflow from "@/components/portal/DealWorkflow";
import BorrowerConsentForm from "@/components/legal/BorrowerConsentForm";
import { DollarSign, FileText, Clock, CheckCircle2, Shield, ChevronRight, AlertTriangle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const stageColors = {
  submitted: "bg-blue-500/10 text-blue-400 border-blue-500/20",
  under_review: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
  docs_requested: "bg-orange-500/10 text-orange-400 border-orange-500/20",
  docs_received: "bg-indigo-500/10 text-indigo-400 border-indigo-500/20",
  lender_matched: "bg-purple-500/10 text-purple-400 border-purple-500/20",
  term_sheet_sent: "bg-cyan-500/10 text-cyan-400 border-cyan-500/20",
  approved: "bg-emerald-500/10 text-emerald-400 border-emerald-500/20",
  funded: "bg-green-500/10 text-green-400 border-green-500/20",
  declined: "bg-red-500/10 text-red-400 border-red-500/20",
  withdrawn: "bg-slate-500/10 text-slate-400 border-slate-500/20",
};

const fmt = (v) => v ? new Intl.NumberFormat('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 0 }).format(v) : '—';

export default function BorrowerPortal() {
  const [user, setUser] = useState(null);
  const [hasConsent, setHasConsent] = useState(false);
  const [activeTab, setActiveTab] = useState("overview");

  useEffect(() => {
    base44.auth.me().then(u => {
      setUser(u);
      setHasConsent(!!u?.consent_idiq_soft_pull);
    }).catch(() => base44.auth.redirectToLogin('/portal/borrower'));
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

  const activeDeals = deals.filter(d => !['funded', 'declined', 'withdrawn'].includes(d.stage));
  const fundedDeals = deals.filter(d => d.stage === 'funded');
  const activeDeal = activeDeals[0];
  const needsDocs = deals.some(d => d.stage === 'docs_requested');

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />
      <div className="flex-1 max-w-4xl mx-auto w-full px-4 pt-24 pb-16">

        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center gap-2 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-1">
            <Shield className="h-3.5 w-3.5" /> Borrower Portal
          </div>
          <h1 className="text-3xl font-extrabold">
            Welcome back, <span className="text-amber-400">{user.full_name?.split(' ')[0]}</span>
          </h1>
          <p className="text-slate-400 mt-1">Track your funding applications and manage your profile.</p>
        </div>

        {/* Urgent banner: docs requested */}
        {needsDocs && (
          <div className="mb-6 flex items-start gap-3 bg-orange-500/10 border border-orange-500/30 rounded-xl px-4 py-3">
            <AlertTriangle className="h-4 w-4 text-orange-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-orange-300 font-semibold text-sm">Action Required — Documents Requested</p>
              <p className="text-slate-400 text-xs mt-0.5">GLINFICO needs supporting documents to continue processing your application.</p>
            </div>
            <a href="/fod/submit" className="text-xs text-orange-400 hover:text-orange-300 font-semibold whitespace-nowrap mt-0.5">Upload Now →</a>
          </div>
        )}

        {/* Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-8">
          {[
            { label: "Active Deals", value: activeDeals.length, Icon: Clock, color: "text-amber-400" },
            { label: "Funded Deals", value: fundedDeals.length, Icon: CheckCircle2, color: "text-emerald-400" },
            { label: "Total Requested", value: fmt(deals.reduce((s, d) => s + (d.loan_amount || 0), 0)), Icon: DollarSign, color: "text-blue-400" },
            { label: "Total Funded", value: fmt(fundedDeals.reduce((s, d) => s + (d.approved_amount || 0), 0)), Icon: FileText, color: "text-purple-400" },
          ].map(({ label, value, Icon, color }) => (
            <div key={label} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-5">
              <Icon className={`h-5 w-5 ${color} mb-2`} />
              <p className={`text-xl font-bold ${color}`}>{value}</p>
              <p className="text-slate-400 text-xs mt-0.5">{label}</p>
            </div>
          ))}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className="bg-white/5 border border-white/10 mb-6">
            <TabsTrigger value="overview" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              Overview
            </TabsTrigger>
            <TabsTrigger value="deals" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              All Deals ({deals.length})
            </TabsTrigger>
            <TabsTrigger value="consent" className="data-[state=active]:bg-amber-500 data-[state=active]:text-black text-white text-xs">
              {hasConsent ? "✓ Consent" : "⚠ Consent Required"}
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview">
            {activeDeal ? (
              <div>
                <p className="text-amber-400 text-xs font-semibold uppercase tracking-wider mb-3">Active Application</p>
                <DealWorkflow deal={activeDeal} />
                {activeDeals.length > 1 && (
                  <button onClick={() => setActiveTab('deals')} className="mt-3 text-xs text-slate-400 hover:text-white flex items-center gap-1">
                    +{activeDeals.length - 1} more active deal{activeDeals.length > 2 ? 's' : ''} <ChevronRight className="h-3 w-3" />
                  </button>
                )}
              </div>
            ) : (
              <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-12 text-center">
                <FileText className="h-10 w-10 text-slate-600 mx-auto mb-3" />
                <p className="text-slate-300 font-semibold mb-1">No active applications</p>
                <p className="text-slate-500 text-sm mb-4">Submit a deal to get started with your funding journey.</p>
                <a href="/fod/submit" className="inline-block px-5 py-2 bg-amber-500 hover:bg-amber-400 text-black font-semibold rounded-full text-sm transition-all">
                  Submit a Deal →
                </a>
              </div>
            )}
          </TabsContent>

          {/* All Deals Tab */}
          <TabsContent value="deals">
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
                      <p className="font-semibold text-white capitalize">{deal.loan_type?.replace(/_/g, ' ')}</p>
                      <p className="text-slate-400 text-sm">{deal.lender_name ? `Lender: ${deal.lender_name}` : 'Pending lender match'}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      <p className="text-amber-400 font-bold text-sm">{fmt(deal.loan_amount)}</p>
                      <span className={`px-3 py-1 rounded-full text-xs font-medium border whitespace-nowrap ${stageColors[deal.stage] || 'bg-slate-500/10 text-slate-400 border-slate-500/20'}`}>
                        {deal.stage?.replace(/_/g, ' ')}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </TabsContent>

          {/* Consent Tab */}
          <TabsContent value="consent">
            {hasConsent ? (
              <div className="bg-[#0f0f1e] border border-emerald-500/20 rounded-2xl p-8 text-center">
                <div className="w-14 h-14 bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4">
                  <CheckCircle2 className="h-7 w-7 text-emerald-400" />
                </div>
                <p className="text-white font-bold text-lg mb-2">Consent on File</p>
                <p className="text-slate-400 text-sm max-w-md mx-auto">
                  You have authorized GLINFICO LP and its partners (IDIQ, Plaid, CBRE/CoStar, American Eagle) to perform the data pulls required to process your funding application.
                </p>
                <p className="text-slate-600 text-xs mt-4">Valid for 90 days from date of submission · <a href="mailto:compliance@glinfico.com" className="text-amber-500">compliance@glinfico.com</a></p>
              </div>
            ) : (
              <div>
                <div className="bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 mb-6">
                  <p className="text-amber-300 text-sm font-semibold">Consent Required to Process Your Application</p>
                  <p className="text-slate-400 text-xs mt-1">Please review and sign the data authorization form below to enable GLINFICO to run your application through our AI-powered underwriting pipeline.</p>
                </div>
                <BorrowerConsentForm onConsentComplete={() => setHasConsent(true)} />
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      <FodFooter />
    </div>
  );
}