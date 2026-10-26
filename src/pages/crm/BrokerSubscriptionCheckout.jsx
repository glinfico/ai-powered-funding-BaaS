import React, { useState } from "react";
import { Check, Sparkles, ShieldCheck, Zap, ArrowRight, Lock, CheckCircle2, X } from "lucide-react";

export default function BrokerSubscriptionCheckout() {
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | annual
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [isCheckingOut, setIsCheckingOut] = useState(false);
  const [paymentSuccess, setPaymentSuccess] = useState(false);

  const plans = [
    {
      id: "starter",
      code: "S-XXXXX",
      name: "Starter",
      tagline: "Perfect for new brokers and small operators entering the funding space.",
      priceMonthly: 999,
      priceAnnual: 799,
      features: [
        "25 leads/month",
        "Basic CRM access",
        "MCA deal submissions",
        "Standard lender matching",
        "Email support",
        "100% Commission Payouts (post-subscription)"
      ],
      popular: false,
      btnCode: "S-XXXX"
    },
    {
      id: "growth",
      code: "G-XXXXX",
      name: "Growth",
      tagline: "Built for active brokers looking to scale deal flow and lender access.",
      priceMonthly: 1499,
      priceAnnual: 1199,
      features: [
        "100 leads/month",
        "MCA + CRE/REI access",
        "Advanced CRM tools",
        "Priority lender routing",
        "AI scoring & matching",
        "Pipeline dashboard",
        "100% Commission Payouts (post-subscription)"
      ],
      popular: true,
      btnCode: "G-XXXX"
    },
    {
      id: "pro",
      code: "P-XXXXX",
      name: "Pro",
      tagline: "For high-volume broker teams requiring full pipeline and multi-tier tools.",
      priceMonthly: 2999,
      priceAnnual: 2399,
      features: [
        "Unlimited leads/month",
        "Full Multi-Vertical Access",
        "Advanced commission tracking",
        "Dedicated broker support",
        "Custom ad placements (5/mo)",
        "API & webhook access",
        "100% Commission Payouts (post-subscription)"
      ],
      popular: false,
      btnCode: "P-XXXX"
    },
    {
      id: "enterprise",
      code: "E-XXXXX",
      name: "Enterprise",
      tagline: "Full-service brokerage infrastructure with white-label portal and custom SLA.",
      priceMonthly: 7999,
      priceAnnual: 6399,
      features: [
        "White-label portal setup",
        "Custom domain & branding",
        "Dedicated account manager",
        "Unlimited ad placements",
        "Custom integrations & SLA",
        "Direct lender syndicate access",
        "100% Commission Payouts across desk"
      ],
      popular: false,
      btnCode: "E-XXXX"
    }
  ];

  const handlePayPalCheckout = (plan) => {
    setSelectedPlan(plan);
    setIsCheckingOut(true);
  };

  const simulatePayPalPaymentCompletion = () => {
    setIsCheckingOut(false);
    setPaymentSuccess(true);
    // Save subscriber status in persistent storage
    try {
      localStorage.setItem("glinfico_broker_subscribed", "true");
      localStorage.setItem("glinfico_subscription_tier", selectedPlan.name);
    } catch (e) {}
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 fill-amber-500" /> PayPal Secure Subscription Gateway Active
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Select Your Broker Subscription Plan
        </h1>
        <p className="text-sm text-slate-500">
          Subscribe securely via PayPal to vest 100% commission payouts on future submissions, run automated term sheets, and access our 22,450 lender network.
        </p>

        {/* Billing Toggle */}
        <div className="pt-4 flex items-center justify-center gap-3">
          <span className={`text-xs font-bold ${billingCycle === "monthly" ? "text-slate-900" : "text-slate-400"}`}>Monthly Billing</span>
          <button
            onClick={() => setBillingCycle(billingCycle === "monthly" ? "annual" : "monthly")}
            className="w-12 h-6 bg-slate-900 rounded-full p-1 transition-colors relative"
          >
            <div className={`w-4 h-4 bg-amber-400 rounded-full transition-transform ${billingCycle === "annual" ? "translate-x-6" : "translate-x-0"}`} />
          </button>
          <span className={`text-xs font-bold flex items-center gap-1.5 ${billingCycle === "annual" ? "text-slate-900" : "text-slate-400"}`}>
            Annual Billing <span className="bg-emerald-100 text-emerald-800 text-[10px] px-2 py-0.5 rounded-full font-extrabold">Save 20%</span>
          </span>
        </div>
      </div>

      {/* Success Notification Banner if Subscribed */}
      {paymentSuccess && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-6 text-center max-w-2xl mx-auto shadow-sm">
          <div className="w-12 h-12 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <h3 className="text-base font-black text-slate-900">Subscription Active via PayPal!</h3>
          <p className="text-xs text-slate-600 mt-1">
            Your account is now verified under the <strong className="text-slate-900">{selectedPlan?.name}</strong> plan. 100% commission payouts are locked and active for all future deal submissions.
          </p>
        </div>
      )}

      {/* Pricing Cards Grid (4 Tiers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {plans.map((plan) => {
          const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              className={`rounded-3xl p-6 relative transition-all flex flex-col justify-between border ${
                plan.popular
                  ? "bg-slate-900 text-white border-amber-500/50 shadow-2xl ring-2 ring-amber-500"
                  : "bg-white text-slate-900 border-slate-200 shadow-md hover:border-slate-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
                  Most Popular
                </div>
              )}

              <div>
                <div className="mb-4">
                  <div className="text-[10px] font-mono font-bold tracking-widest text-amber-500 uppercase">
                    Code: {plan.code}
                  </div>
                  <h3 className={`text-xl font-black ${plan.popular ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                  <p className={`text-xs mt-1 min-h-[36px] ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>{plan.tagline}</p>
                </div>

                <div className="my-5">
                  <div className="flex items-baseline gap-1">
                    <span className="text-3xl font-black">${price.toLocaleString()}</span>
                    <span className={`text-xs ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>/month</span>
                  </div>
                  <div className={`text-[10px] mt-0.5 ${plan.popular ? "text-slate-400" : "text-slate-400"}`}>
                    {billingCycle === "annual" ? "Billed annually via PayPal" : "Billed monthly via PayPal"}
                  </div>
                </div>

                <div className="space-y-2.5 pt-4 border-t border-slate-100/10 mb-8 text-xs">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-amber-400" : "text-emerald-600"}`} />
                      <span className={plan.popular ? "text-slate-200" : "text-slate-700"}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={() => handlePayPalCheckout(plan)}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                }`}
              >
                Pay with PayPal ({plan.btnCode})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* PayPal Checkout Modal Popup */}
      {isCheckingOut && selectedPlan && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-md w-full p-8 relative shadow-2xl border border-slate-200">
            <button 
              onClick={() => setIsCheckingOut(false)} 
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-blue-50 text-blue-600 rounded-2xl border border-blue-100 font-black text-sm">
                PayPal
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-slate-400">Secure Checkout</div>
                <h3 className="text-lg font-black text-slate-900">{selectedPlan.name} Subscription</h3>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-4 mb-6 space-y-2 text-xs">
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Selected Plan Code:</span>
                <span className="font-mono text-slate-900">{selectedPlan.code}</span>
              </div>
              <div className="flex justify-between font-semibold text-slate-700">
                <span>Billing Frequency:</span>
                <span className="capitalize">{billingCycle}</span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex justify-between font-black text-slate-900 text-sm">
                <span>Total Due Today:</span>
                <span className="text-amber-600">
                  ${(billingCycle === "annual" ? selectedPlan.priceAnnual : selectedPlan.priceMonthly).toLocaleString()} /mo
                </span>
              </div>
            </div>

            <div className="space-y-3">
              <button
                onClick={simulatePayPalPaymentCompletion}
                className="w-full bg-[#0070BA] hover:bg-[#005ea6] text-white font-bold py-3.5 px-6 rounded-xl text-sm transition-all shadow-md flex items-center justify-center gap-2"
              >
                Complete Subscription via PayPal
              </button>
              <button
                onClick={() => setIsCheckingOut(false)}
                className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 py-1"
              >
                Cancel & Return
              </button>
            </div>

            <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" /> Encrypted & Verified by PayPal Recurring Billing
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
