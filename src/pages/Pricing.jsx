import React, { useState } from "react";
import { Check, ShieldCheck, Zap } from "lucide-react";

export default function Pricing() {
  const [isAnnual, setIsAnnual] = useState(false);

  const plans = [
    {
      code: "S-XXXXX",
      name: "Starter",
      monthlyPrice: "$999",
      annualPrice: "$" + (999 * 10).toLocaleString(), // 10 months for annual (2 months rebate)
      monthlyNum: 999,
      annualNum: 999 * 10,
      period: isAnnual ? "/year" : "/month",
      desc: "Perfect for new brokers and small operators entering the funding space.",
      features: [
        "25 leads/month",
        "Basic CRM access",
        "MCA deal submissions",
        "Standard lender matching",
        "Email support"
      ],
      badge: "Starter",
      cta: "Get Started (S-XXXX)"
    },
    {
      code: "G-XXXXX",
      name: "Growth",
      monthlyPrice: "$1,499",
      annualPrice: "$" + (1499 * 10).toLocaleString(),
      monthlyNum: 1499,
      annualNum: 1499 * 10,
      period: isAnnual ? "/year" : "/month",
      desc: "Built for active brokers looking to scale deal flow and lender access.",
      features: [
        "100 leads/month",
        "MCA + CRE/REI access",
        "Advanced CRM tools",
        "Priority lender routing",
        "AI scoring & matching",
        "Pipeline dashboard"
      ],
      badge: "Most Popular",
      highlight: true,
      cta: "Get Started (G-XXXX)"
    },
    {
      code: "P-XXXXX",
      name: "Pro",
      monthlyPrice: "$2,999",
      annualPrice: "$" + (2999 * 10).toLocaleString(),
      monthlyNum: 2999,
      annualNum: 2999 * 10,
      period: isAnnual ? "/year" : "/month",
      desc: "For high-volume broker teams requiring full pipeline and multi-tier tools.",
      features: [
        "Unlimited leads/month",
        "Full Multi-Vertical Access",
        "Advanced commission tracking",
        "Dedicated broker support",
        "Custom ad placements (5/mo)",
        "API & webhook access"
      ],
      badge: "Pro",
      cta: "Get Started (P-XXXX)"
    },
    {
      code: "E-XXXXX",
      name: "Enterprise",
      monthlyPrice: "$7,999",
      annualPrice: "$" + (7999 * 10).toLocaleString(),
      monthlyNum: 7999,
      annualNum: 7999 * 10,
      period: isAnnual ? "/year" : "/month",
      desc: "Full-service brokerage infrastructure with white-label portal and custom SLA.",
      features: [
        "White-label portal setup",
        "Custom domain & branding",
        "Dedicated account manager",
        "Unlimited ad placements",
        "Custom integrations & SLA",
        "Direct lender syndicate access"
      ],
      badge: "Enterprise",
      cta: "Get Started (E-XXXX)"
    }
  ];

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "white", padding: "60px 20px" }}>
      <div style={{ maxWidth: "1300px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ textAlign: "center", marginBottom: "40px" }}>
          <span style={{ backgroundColor: "rgba(217, 119, 6, 0.15)", color: "#f59e0b", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700", textTransform: "uppercase" }}>
            Transparent Subscription Plans
          </span>
          <h1 style={{ fontSize: "38px", fontWeight: "900", margin: "16px 0 12px 0" }}>Accelerate Your Funding Business</h1>
          <p style={{ color: "#94a3b8", fontSize: "16px", maxWidth: "600px", margin: "0 auto" }}>
            Select your plan below and complete setup instantly with PayPal, Credit Card, or ACH Direct Debit.
          </p>

          {/* Billing Toggle (Monthly vs Annual with 2 Months Free) */}
          <div style={{ display: "inline-flex", alignItems: "center", backgroundColor: "#1e293b", padding: "6px", borderRadius: "14px", border: "1px solid #334155", marginTop: "28px" }}>
            <button
              onClick={() => setIsAnnual(false)}
              style={{
                backgroundColor: !isAnnual ? "#d97706" : "transparent",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                transition: "all 0.2s"
              }}
            >
              Monthly Billing
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              style={{
                backgroundColor: isAnnual ? "#d97706" : "transparent",
                color: "white",
                border: "none",
                padding: "10px 20px",
                borderRadius: "10px",
                fontWeight: "700",
                fontSize: "14px",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
                transition: "all 0.2s"
              }}
            >
              Annual Billing <span style={{ backgroundColor: "#22c55e", color: "black", fontSize: "10px", padding: "2px 6px", borderRadius: "6px", fontWeight: "800" }}>Save 2 Months</span>
            </button>
          </div>

          {/* Payment Badges Bar */}
          <div style={{ display: "flex", justifyContent: "center", gap: "16px", marginTop: "24px", flexWrap: "wrap" }}>
            {["PayPal Checkout", "Visa / Mastercard", "American Express", "ACH Direct Debit", "Secure SSL Encrypted"].map((badge, idx) => (
              <span key={idx} style={{ backgroundColor: "#1e293b", border: "1px solid #334155", padding: "6px 14px", borderRadius: "8px", fontSize: "12px", fontWeight: "600", color: "#cbd5e1", display: "flex", alignItems: "center", gap: "6px" }}>
                <ShieldCheck size={14} color="#f59e0b" /> {badge}
              </span>
            ))}
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(270px, 1fr))", gap: "24px", alignItems: "stretch" }}>
          {plans.map((plan, i) => (
            <div key={i} style={{
              backgroundColor: "#1e293b",
              borderRadius: "20px",
              border: plan.highlight ? "2px solid #d97706" : "1px solid #334155",
              padding: "28px 24px",
              display: "flex",
              flexDirection: "column",
              justifyContent: "space-between",
              position: "relative",
              boxShadow: plan.highlight ? "0 15px 30px -10px rgba(217, 119, 6, 0.3)" : "0 10px 20px -5px rgba(0,0,0,0.3)"
            }}>
              {plan.highlight && (
                <div style={{ position: "absolute", top: "-14px", left: "50%", transform: "translateX(-50%)", backgroundColor: "#d97706", color: "white", padding: "4px 16px", borderRadius: "12px", fontSize: "12px", fontWeight: "800", textTransform: "uppercase" }}>
                  {plan.badge}
                </div>
              )}

              <div>
                <div style={{ fontSize: "11px", fontWeight: "700", color: "#f59e0b", letterSpacing: "1px", marginBottom: "4px" }}>
                  CODE: {plan.code}
                </div>
                <h3 style={{ fontSize: "22px", fontWeight: "800", margin: "0 0 8px 0" }}>{plan.name}</h3>
                <p style={{ color: "#94a3b8", fontSize: "13px", minHeight: "42px", margin: "0 0 18px 0" }}>{plan.desc}</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: "4px", marginBottom: "20px" }}>
                  <span style={{ fontSize: "36px", fontWeight: "900", color: "white" }}>
                    {isAnnual ? plan.annualPrice : plan.monthlyPrice}
                  </span>
                  <span style={{ color: "#94a3b8", fontSize: "14px" }}>{plan.period}</span>
                </div>

                <div style={{ borderTop: "1px solid #334155", paddingTop: "16px", marginBottom: "20px" }}>
                  {plan.features.map((feat, idx) => (
                    <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#cbd5e1", marginBottom: "10px" }}>
                      <Check size={15} color="#34d399" /> {feat}
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <button 
                  onClick={() => alert(`Initiating PayPal payment flow for ${plan.name} (${isAnnual ? plan.annualPrice + "/year (2 months free)" : plan.monthlyPrice + "/mo"})...`)}
                  style={{
                    width: "100%",
                    padding: "12px",
                    backgroundColor: plan.highlight ? "#d97706" : "#0f172a",
                    color: "white",
                    border: plan.highlight ? "none" : "1px solid #475569",
                    borderRadius: "10px",
                    fontWeight: "700",
                    fontSize: "14px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    gap: "8px",
                    transition: "all 0.2s"
                  }}
                >
                  <Zap size={15} color="#f59e0b" /> {plan.cta} →
                </button>
              </div>
            </div>
          ))}
        </div>

        <div style={{ textAlign: "center", marginTop: "40px" }}>
          <a href="/portal" style={{ color: "#94a3b8", textDecoration: "none", fontSize: "14px" }}>← Back to Portal Hub</a>
        </div>

      </div>
    </div>
  );
}
