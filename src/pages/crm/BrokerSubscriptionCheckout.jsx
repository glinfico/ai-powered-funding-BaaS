import React, { useState } from "react";
import { Check, Sparkles, ShieldCheck, Zap, ArrowRight, DollarSign, Building2, Users } from "lucide-react";

export default function BrokerSubscriptionCheckout() {
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | annual
  const [selectedPlan, setSelectedPlan] = useState("growth");

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

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="text-center max-w-3xl mx-auto space-y-3">
        <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-600 text-xs font-bold uppercase tracking-wider">
          <Sparkles className="w-4 h-4 fill-amber-500" /> Unlock 100% Commission Payouts
        </div>
        <h1 className="text-3xl font-black text-slate-900 tracking-tight">
          Select Your Broker Subscription Plan
        </h1>
        <p className="text-sm text-slate-500">
          Subscribe today to vest 100% commission payouts on future submissions, run automated term sheets, and access our 22,450 lender network.
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

      {/* Pricing Cards Grid (4 Tiers) */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 pt-4">
        {plans.map((plan) => {
          const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-3xl p-6 relative transition-all cursor-pointer flex flex-col justify-between border ${
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
                    {billingCycle === "annual" ? "Billed annually" : "Billed monthly"}
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
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Selected ${plan.name} Package (${plan.code}). Redirecting to Checkout...`);
                }}
                className={`w-full py-3 px-4 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                }`}
              >
                Get Started ({plan.btnCode})
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Policy Reminder Banner */}
      <div className="bg-slate-900 text-white rounded-3xl p-6 border border-slate-800 shadow-xl mt-8 flex flex-col md:flex-row items-center justify-between gap-6">
        <div className="space-y-1 max-w-2xl">
          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Forward-Looking Commission Policy
          </div>
          <h3 className="text-lg font-black text-white">Active Subscription Required for Commission Vesting</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            100% broker commissions vest exclusively on deal submissions accepted <strong>after</strong> an active subscription plan is verified. Prior non-subscriber submissions remain retained by the house account.
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-4 rounded-2xl w-full md:w-72 text-xs font-mono text-slate-300">
          <div className="text-amber-400 font-bold font-sans mb-1">Instant Plan Features:</div>
          <div>✓ Full ACE Auto-Closing Access</div>
          <div>✓ 22,450 Lender Matching Pool</div>
          <div>✓ 100% Broker Payout Lock</div>
        </div>
      </div>
    </div>
  );
}
