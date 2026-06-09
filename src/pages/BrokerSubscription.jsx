import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Check, CreditCard, Building2, Zap, Shield, Users, BarChart2 } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "starter",
    name: "Starter",
    monthly: 99,
    annual: 990,
    description: "Perfect for independent brokers",
    features: ["Up to 25 active deals", "Lender matching", "Basic reports", "Email support"],
    highlight: false,
  },
  {
    id: "growth",
    name: "Growth",
    monthly: 149,
    annual: 1490,
    description: "For scaling broker operations",
    features: ["Up to 100 active deals", "AI lender matching", "Commission tracking", "Priority support", "Basic analytics"],
    highlight: false,
  },
  {
    id: "professional",
    name: "Pro",
    monthly: 299,
    annual: 2990,
    description: "For growing broker teams",
    features: ["Unlimited deals", "Advanced AI matching", "Full commission tracking", "Priority support", "Advanced analytics", "Bulk lead upload"],
    highlight: true,
  },
  {
    id: "enterprise",
    name: "Enterprise",
    monthly: 799,
    annual: 7990,
    description: "Full-service brokerage infrastructure",
    features: ["Everything in Pro", "White-label portal", "Dedicated account manager", "API access", "Custom integrations", "SLA guarantee"],
    highlight: false,
  },
];

const PAYMENT_METHODS = [
  { id: "stripe_card", label: "Credit / Debit Card", icon: CreditCard, provider: "stripe", method_types: ["card"] },
  { id: "stripe_ach", label: "ACH Bank Transfer (Stripe)", icon: Building2, provider: "stripe", method_types: ["us_bank_account"] },
  { id: "paypal_paypal", label: "PayPal", icon: () => <span className="text-[#003087] font-bold text-sm">PP</span>, provider: "paypal" },
  { id: "paypal_ach", label: "ACH via PayPal", icon: Building2, provider: "paypal", ach: true },
];

export default function BrokerSubscription() {
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("professional");
  const [selectedMethod, setSelectedMethod] = useState("stripe_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    const method = PAYMENT_METHODS.find(m => m.id === selectedMethod);
    try {
      if (method.provider === "stripe") {
        const res = await base44.functions.invoke("stripeCheckout", {
          plan: selectedPlan,
          billing,
          payment_method_types: method.method_types,
        });
        if (res.data?.url) window.location.href = res.data.url;
        else setError("Could not create Stripe session. Please try again.");
      } else {
        const res = await base44.functions.invoke("paypalCheckout", {
          plan: selectedPlan,
          billing,
        });
        if (res.data?.url) window.location.href = res.data.url;
        else setError("Could not create PayPal order. Please try again.");
      }
    } catch (e) {
      setError(e.message || "Payment error. Please try again.");
    }
    setLoading(false);
  };

  const selectedPlanData = PLANS.find(p => p.id === selectedPlan);

  return (
    <div className="min-h-screen bg-gradient-to-br from-[#0a0a12] to-[#0f1020] py-16 px-4">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/20 rounded-full px-4 py-1.5 mb-4">
            <Zap className="h-4 w-4 text-amber-400" />
            <span className="text-amber-300 text-sm font-medium">Broker Portal Access</span>
          </div>
          <h1 className="text-4xl font-bold text-white mb-3">Choose Your Plan</h1>
          <p className="text-slate-400 text-lg">Full pipeline, lender matching & commission tracking</p>

          {/* Billing toggle */}
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
              <Badge className="bg-emerald-500/20 text-emerald-400 text-[10px] border-0">Save 17%</Badge>
            </button>
          </div>
        </div>

        {/* Plans */}
        <div className="grid md:grid-cols-4 gap-6 mb-10">
          {PLANS.map(plan => {
            const price = billing === "annual" ? plan.annual : plan.monthly * (billing === "annual" ? 10 : 1);
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
                  <h3 className="text-white font-bold text-lg">{plan.name}</h3>
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
                {isSelected && (
                  <div className="absolute top-3 right-3 w-5 h-5 rounded-full bg-amber-500 flex items-center justify-center">
                    <Check className="h-3 w-3 text-black" />
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Payment method + checkout */}
        <Card className="bg-white/5 border-white/10 text-white max-w-xl mx-auto">
          <CardHeader>
            <CardTitle className="text-white text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-amber-400" /> Secure Payment
            </CardTitle>
            <CardDescription className="text-slate-400">
              {selectedPlanData?.name} plan · {billing === "annual" ? `$${selectedPlanData?.annual}/yr` : `$${selectedPlanData?.monthly}/mo`}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <p className="text-sm text-slate-400 mb-3 font-medium">Payment Method</p>
              <div className="grid grid-cols-2 gap-2">
                {PAYMENT_METHODS.map(m => {
                  const Icon = m.icon;
                  const isSelected = selectedMethod === m.id;
                  return (
                    <button
                      key={m.id}
                      onClick={() => setSelectedMethod(m.id)}
                      className={cn(
                        "flex items-center gap-2 px-3 py-2.5 rounded-xl border text-sm font-medium transition-all text-left",
                        isSelected ? "bg-amber-500/15 border-amber-500/50 text-white" : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20"
                      )}
                    >
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      {m.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {error && <p className="text-red-400 text-sm bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">{error}</p>}

            <Button
              className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold py-3 text-base"
              onClick={handleSubscribe}
              disabled={loading}
            >
              {loading ? "Redirecting..." : `Subscribe — ${billing === "annual" ? `$${selectedPlanData?.annual}/yr` : `$${selectedPlanData?.monthly}/mo`}`}
            </Button>
            <p className="text-xs text-slate-500 text-center">
              Cancel anytime. Commission fees (MCA 5%, CRE 3%, M&A 5%) are collected at closing via PayPal.
            </p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}