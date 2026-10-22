import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, Shield, Zap, CreditCard, Landmark, CheckCircle2, History } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    prefix: "S",
    monthly: 999,
    annual: 9990,
    description: "Perfect for independent brokers",
    features: ["Up to 25 active deals", "Lender matching", "Basic reports", "Email support", "1 ad placement / month"],
    highlight: false,
    adPosition: "Sidebar Banner",
  },
  {
    id: "growth",
    name: "Growth",
    prefix: "G",
    monthly: 1499,
    annual: 14990,
    description: "For scaling broker operations",
    features: ["Up to 100 active deals", "AI lender matching", "Commission tracking", "Priority support", "Basic analytics", "2 ad placements / month"],
    highlight: false,
    adPosition: "Sidebar + In-Feed Banner",
  },
  {
    id: "professional",
    name: "Pro",
    prefix: "P",
    monthly: 2999,
    annual: 29990,
    description: "For growing broker teams",
    features: ["Unlimited deals", "Advanced AI matching", "Full commission tracking", "Priority support", "Advanced analytics", "Bulk lead upload", "5 ad placements / month"],
    highlight: true,
    adPosition: "Hero + Sidebar + In-Feed",
  },
  {
    id: "enterprise",
    name: "Enterprise",
    prefix: "E",
    monthly: 7999,
    annual: 79990,
    description: "Full-service brokerage infrastructure",
    features: ["Everything in Pro", "White-label portal", "Dedicated account manager", "API access", "Custom integrations", "SLA guarantee", "Unlimited ad placements"],
    highlight: false,
    adPosition: "Full-Page Takeover + All Positions",
  },
];

export default function BrokerSubscription() {
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [brokerEmail, setBrokerEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [successData, setSuccessData] = useState(null);

  const handleSubscribe = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const planObj = PLANS.find(p => p.id === selectedPlan);

      // Load existing account history if present
      const existingRaw = localStorage.getItem("glinfico_broker_account");
      let historyObj = {};
      if (existingRaw) {
        try {
          const parsed = JSON.parse(existingRaw);
          if (parsed.codeHistory) historyObj = parsed.codeHistory;
        } catch (e) {
          console.error(e);
        }
      }

      // Check if code for this tier already exists in history
      let brokerCode = historyObj[planObj.name];
      let isRestoredCode = false;

      if (!brokerCode) {
        const randomNum = Math.floor(10000 + Math.random() * 90000);
        brokerCode = `${planObj.prefix}-${randomNum}`;
        historyObj[planObj.name] = brokerCode;
      } else {
        isRestoredCode = true;
      }

      const brokerProfile = {
        email: brokerEmail,
        plan: planObj.name,
        code: brokerCode,
        isRestoredCode,
        codeHistory: historyObj,
        billing,
        subscribedAt: new Date().toISOString()
      };

      localStorage.setItem("glinfico_broker_account", JSON.stringify(brokerProfile));
      localStorage.setItem("glinfico_user", JSON.stringify({ email: brokerEmail, role: 'broker', code: brokerCode }));

      setTimeout(() => {
        setSuccessData(brokerProfile);
        setLoading(false);
      }, 800);
    } catch (e) {
      setError("Payment processing error. Please try again.");
      setLoading(false);
    }
  };

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  if (successData) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] to-[#0f1020] py-16 px-4 flex items-center justify-center">
        <Card className="bg-[#0f0f1e] border-white/10 text-white max-w-md w-full p-6 text-center">
          <div className="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="h-8 w-8" />
          </div>
          <h2 className="text-2xl font-bold mb-2">Subscription Active!</h2>
          <p className="text-slate-400 text-sm mb-6">
            {successData.isRestoredCode
              ? "Welcome back! Your previous verified broker code for this tier has been restored:"
              : "Welcome to Glinfico Broker Network. Your official broker account ID has been generated:"}
          </p>
          
          <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-4 mb-6">
            <span className="text-xs text-amber-400 uppercase tracking-wider font-semibold block mb-1">
              {successData.isRestoredCode ? "Restored Broker Code" : "Assigned Broker Code"}
            </span>
            <span className="text-3xl font-extrabold text-amber-300 tracking-widest">{successData.code}</span>
          </div>

          {Object.keys(successData.codeHistory || {}).length > 1 && (
            <div className="bg-white/5 border border-white/10 rounded-xl p-3 mb-6 text-left">
              <span className="text-[10px] text-slate-400 uppercase tracking-wider font-bold block mb-2 flex items-center gap-1">
                <History className="h-3 w-3 text-amber-400" /> Saved Tier History
              </span>
              <div className="grid grid-cols-2 gap-2 text-xs">
                {Object.entries(successData.codeHistory).map(([tier, code]) => (
                  <div key={tier} className="flex justify-between bg-white/5 p-1.5 rounded border border-white/5">
                    <span className="text-slate-400">{tier}:</span>
                    <strong className="text-amber-400">{code}</strong>
                  </div>
                ))}
              </div>
            </div>
          )}

          <Button 
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3"
            onClick={() => window.location.href = '/portal/broker'}
          >
            Enter Broker Portal →
          </Button>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] to-[#0f1020] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">Broker Portal Access & Membership</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Choose Your Broker Plan</h1>
          <p className="text-slate-400 text-lg">Full pipeline, lender matching & commission tracking</p>

          <div className="inline-flex items-center gap-3 mt-6 bg-white/5 rounded-xl p-1">
            <button
              onClick={() => setBilling("monthly")}
              className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all", billing === "monthly" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white")}
            >Monthly</button>
            <button
              onClick={() => setBilling("annual")}
              className={cn("px-5 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2", billing === "annual" ? "bg-amber-500 text-black" : "text-slate-400 hover:text-white")}
            >
              Annual
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Save 2 months</Badge>
            </button>
          </div>
        </div>

        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {PLANS.map(plan => {
            const price = billing === "annual" ? plan.annual : plan.monthly;
            const displayPrice = billing === "annual" ? Math.round(plan.annual / 12) : plan.monthly;
            const isSelected = selectedPlan === plan.id;
            return (
              <div
                key={plan.id}
                onClick={() => setSelectedPlan(plan.id)}
                className={cn(
                  "relative rounded-2xl p-6 border cursor-pointer transition-all",
                  isSelected
                    ? "bg-amber-500/10 border-amber-500/50 shadow-lg shadow-amber-500/10"
                    : "bg-white/5 border-white/10 hover:border-white/20",
                  plan.highlight && !isSelected && "border-amber-500/20"
                )}
              >
                {plan.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-black text-xs font-bold border-0 px-3">Most Popular</Badge>
                  </div>
                )}
                <div className="mb-4">
                  <div className="flex justify-between items-center mb-1">
                    <h3 className="text-white font-bold text-lg">{plan.name}</h3>
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">Code: {plan.prefix}-XXXXX</Badge>
                  </div>
                  <p className="text-slate-500 text-sm">{plan.description}</p>
                </div>
                <div className="mb-6">
                  <span className="text-4xl font-bold text-white">${displayPrice}</span>
                  <span className="text-slate-400 text-sm">/mo</span>
                  {billing === "annual" && <p className="text-emerald-400 text-xs mt-1">Billed ${plan.annual}/yr</p>}
                </div>
                <ul className="space-y-2">
                  {plan.features.map(f => (
                    <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                      <Check className="h-3.5 w-3.5 text-emerald-400 flex-shrink-0" />
                      {f}
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>

        <Card className="bg-[#0f0f1e] border-white/10 text-white max-w-xl mx-auto shadow-2xl">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center justify-between">
              <span className="flex items-center gap-2">
                <Shield className="h-4 w-4 text-amber-400" /> Secure PayPal Checkout
              </span>
              <div className="flex items-center gap-1.5 bg-white/5 px-2.5 py-1 rounded-lg border border-white/10">
                <CreditCard className="h-4 w-4 text-amber-400" />
                <Landmark className="h-4 w-4 text-blue-400" />
                <span className="text-[10px] text-slate-300 font-bold tracking-wider ml-1">CC · DC · ACH</span>
              </div>
            </CardTitle>
            <CardDescription className="text-slate-400">
              {selectedPlanData?.name} plan ({selectedPlanData?.prefix}-XXXXX) · {billing === "annual" ? `$${selectedPlanData?.annual}/yr` : `$${selectedPlanData?.monthly}/mo`}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubscribe} className="space-y-4">
              <div>
                <label className="block text-sm text-slate-400 mb-2 font-medium">Broker Account Email</label>
                <input
                  type="email"
                  required
                  value={brokerEmail}
                  onChange={e => setBrokerEmail(e.target.value)}
                  placeholder="broker@company.com"
                  className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 text-white placeholder:text-slate-500 focus:outline-none focus:border-amber-400 text-sm"
                />
              </div>

              <div className="bg-white/5 rounded-xl p-3 border border-white/10 flex items-center justify-between text-xs text-slate-300">
                <span>Accepted Payment Methods:</span>
                <div className="flex gap-2 font-semibold">
                  <span className="text-amber-400">💳 Credit Card</span>
                  <span className="text-amber-400">💳 Debit Card</span>
                  <span className="text-blue-400">🏦 ACH Transfer</span>
                </div>
              </div>

              {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

              <Button
                type="submit"
                disabled={loading}
                className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3.5 text-base shadow-lg shadow-amber-500/20 cursor-pointer"
              >
                {loading ? "Processing via PayPal..." : `Pay & Activate Code — ${billing === "annual" ? `$${selectedPlanData?.annual}/yr` : `$${selectedPlanData?.monthly}/mo`}`}
              </Button>
            </form>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
