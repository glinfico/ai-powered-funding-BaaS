import React, { useState } from "react";
import { Check, Sparkles, ShieldCheck, Zap, ArrowRight, DollarSign, Building2, Users } from "lucide-react";

export default function BrokerSubscriptionCheckout() {
  const [billingCycle, setBillingCycle] = useState("monthly"); // monthly | annual
  const [selectedPlan, setSelectedPlan] = useState("pro");

  const plans = [
    {
      id: "starter",
      name: "Broker Starter",
      tagline: "Essential tools for independent brokers and single operators.",
      priceMonthly: 299,
      priceAnnual: 249,
      features: [
        "100% Commission Payouts on all submitted deals",
        "Up to 50 active lead submissions / month",
        "Access to 22,450 Lender Matching Engine",
        "Autonomous Closing Engine (ACE) term sheets",
        "Standard IDIQ credit soft-pull alerts",
        "Email & Chat Support"
      ],
      popular: false
    },
    {
      id: "pro",
      name: "Pro Capital Broker",
      tagline: "Full-scale pipeline automation for high-volume deal originators.",
      priceMonthly: 499,
      priceAnnual: 399,
      features: [
        "100% Commission Payouts on all submitted deals",
        "Unlimited Lead & Pipeline Submissions",
        "Priority ACE Auto-Closing & Matched-Bank Dispatch",
        "Full 3,000 Accredited LP / Family Office Directory",
        "Real-Time IDIQ Bureau Monitoring & UCC Alerts",
        "Blind System Lead Allocations (Random Distribution)",
        "Dedicated Account Executive"
      ],
      popular: true
    },
    {
      id: "enterprise",
      name: "Brokerage Desk / ISO",
      tagline: "Multi-seat infrastructure for teams, ISOs, and institutional desks.",
      priceMonthly: 999,
      priceAnnual: 799,
      features: [
        "100% Commission Payouts across all desk brokers",
        "Up to 10 Sub-Broker / Team Seats included",
        "Custom White-Label Term Sheets & Notifications",
        "Direct API Access to Lender Guideline Engine",
        "Dedicated Underwriting & Closing Coordinator",
        "Custom State-Law Referral & Split Workflows"
      ],
      popular: false
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
          Subscribe today to claim 100% commission payouts on all future deal submissions, run automated term sheets, and tap into our 22,450 institutional lenders.
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

      {/* Pricing Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-8 pt-4">
        {plans.map((plan) => {
          const price = billingCycle === "annual" ? plan.priceAnnual : plan.priceMonthly;

          return (
            <div
              key={plan.id}
              onClick={() => setSelectedPlan(plan.id)}
              className={`rounded-3xl p-8 relative transition-all cursor-pointer flex flex-col justify-between border ${
                plan.popular
                  ? "bg-slate-900 text-white border-amber-500/50 shadow-2xl ring-2 ring-amber-500"
                  : "bg-white text-slate-900 border-slate-200 shadow-md hover:border-slate-300"
              }`}
            >
              {plan.popular && (
                <div className="absolute -top-3.5 left-1/2 -translate-x-1/2 bg-amber-500 text-slate-950 text-[10px] font-black uppercase tracking-widest px-3.5 py-1 rounded-full shadow-sm">
                  Most Popular for Brokers
                </div>
              )}

              <div>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className={`text-xl font-black ${plan.popular ? "text-white" : "text-slate-900"}`}>{plan.name}</h3>
                    <p className={`text-xs mt-1 ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>{plan.tagline}</p>
                  </div>
                </div>

                <div className="my-6">
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black">${price}</span>
                    <span className={`text-xs ${plan.popular ? "text-slate-400" : "text-slate-500"}`}>/ month</span>
                  </div>
                  <div className={`text-[10px] mt-1 ${plan.popular ? "text-slate-400" : "text-slate-400"}`}>
                    {billingCycle === "annual" ? "Billed annually" : "Billed monthly, cancel anytime"}
                  </div>
                </div>

                <div className="space-y-3 pt-4 border-t border-slate-100/10 mb-8 text-xs">
                  {plan.features.map((feat, idx) => (
                    <div key={idx} className="flex items-start gap-2.5">
                      <Check className={`w-4 h-4 flex-shrink-0 mt-0.5 ${plan.popular ? "text-amber-400" : "text-emerald-600"}`} />
                      <span className={plan.popular ? "text-slate-200" : "text-slate-700"}>{feat}</span>
                    </div>
                  ))}
                </div>
              </div>

              <button
                onClick={(e) => {
                  e.stopPropagation();
                  alert(`Selected ${plan.name} (${billingCycle}). Directing to Stripe checkout...`);
                }}
                className={`w-full py-3.5 px-6 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 ${
                  plan.popular
                    ? "bg-amber-500 hover:bg-amber-400 text-slate-950 shadow-lg"
                    : "bg-slate-900 hover:bg-slate-800 text-white shadow-sm"
                }`}
              >
                Subscribe Now & Activate 100% Commissions
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          );
        })}
      </div>

      {/* Onboarding Preview Section */}
      <div className="bg-slate-900 text-white rounded-3xl p-8 border border-slate-800 shadow-xl mt-12 flex flex-col md:flex-row items-center justify-between gap-8">
        <div className="space-y-2 max-w-xl">
          <div className="text-xs font-extrabold uppercase tracking-wider text-amber-400 flex items-center gap-2">
            <Zap className="w-4 h-4" /> Instant Activation & Onboarding
          </div>
          <h3 className="text-xl font-black text-white">What Happens After You Subscribe?</h3>
          <p className="text-xs text-slate-400 leading-relaxed">
            1. Your broker ID is immediately tagged as an <strong>Active Commission Receiver</strong>.<br />
            2. You receive an automated welcome email with direct access to your customized lead submission portal.<br />
            3. All future submitted deals automatically lock <strong>100% commission payouts</strong> directly to your account.
          </p>
        </div>
        <div className="bg-slate-800 border border-slate-700 p-5 rounded-2xl w-full md:w-80 text-xs space-y-2 font-mono text-slate-300">
          <div className="text-amber-400 font-bold font-sans">Automated Onboarding Sequence:</div>
          <div>✓ Stripe Subscription Verified</div>
          <div>✓ Broker ID Persisted in Master DB</div>
          <div>✓ 100% Commission Policy Activated</div>
          <div>✓ ACE Auto-Closing Suite Unlocked</div>
        </div>
      </div>
    </div>
  );
}
