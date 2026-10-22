import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import { Badge } from "@/components/ui/badge";
import { CreditCard, Landmark, ShieldCheck, Check } from "lucide-react";

const plans = [
  {
    name: "Starter",
    prefix: "S",
    price: "$999",
    period: "/month",
    desc: "Perfect for new brokers and small operators entering the funding space.",
    features: [
      "25 leads/month",
      "Basic CRM access",
      "MCA deal submissions",
      "Standard lender matching",
      "Email support"
    ],
    cta: "Get Started (S-XXXX)",
    highlight: false,
  },
  {
    name: "Growth",
    prefix: "G",
    price: "$1,499",
    period: "/month",
    desc: "Built for active brokers looking to scale deal flow and lender access.",
    features: [
      "100 leads/month",
      "MCA + CRE/REI access",
      "Advanced CRM tools",
      "Priority lender routing",
      "AI scoring & matching",
      "Pipeline dashboard"
    ],
    cta: "Get Started (G-XXXX)",
    badge: "Most Popular",
    highlight: true,
  },
  {
    name: "Pro",
    prefix: "P",
    price: "$2,999",
    period: "/month",
    desc: "For high-volume broker teams requiring full pipeline and multi-tier tools.",
    features: [
      "Unlimited leads/month",
      "Full Multi-Vertical Access",
      "Advanced commission tracking",
      "Dedicated broker support",
      "Custom ad placements (5/mo)",
      "API & webhook access"
    ],
    cta: "Get Started (P-XXXX)",
    highlight: false,
  },
  {
    name: "Enterprise",
    prefix: "E",
    price: "$7,999",
    period: "/month",
    desc: "Full-service brokerage infrastructure with white-label portal and custom SLA.",
    features: [
      "White-label portal setup",
      "Custom domain & branding",
      "Dedicated account manager",
      "Unlimited ad placements",
      "Custom integrations & SLA",
      "Direct lender syndicate access"
    ],
    cta: "Get Started (E-XXXX)",
    highlight: false,
  },
];

export default function Pricing() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col">
      <FodNav />

      <div className="flex-1 px-4 py-20 relative">
        <Starfield />
        
        <div className="max-w-6xl mx-auto relative z-10">
          
          {/* Header */}
          <div className="text-center max-w-3xl mx-auto mb-16">
            <Badge className="bg-amber-500/10 text-amber-400 border-amber-500/30 mb-4 px-4 py-1 text-sm font-medium">
              Transparent Broker Pricing
            </Badge>
            <h1 className="text-4xl md:text-5xl font-extrabold tracking-tight mb-4">
              Invest in Your <span className="text-amber-400">Funding Pipeline</span>
            </h1>
            <p className="text-slate-400 text-lg">
              Unlock powerful lender networks, automated matching, and verified broker codes with instant PayPal checkout.
            </p>

            {/* PayPal Payment Signs Banner */}
            <div className="mt-8 inline-flex items-center gap-4 bg-white/5 border border-white/10 rounded-2xl px-6 py-3">
              <span className="text-xs text-slate-400 font-semibold uppercase tracking-wider">Accepted via PayPal:</span>
              <div className="flex items-center gap-3 text-xs font-bold">
                <span className="flex items-center gap-1 text-amber-400"><CreditCard className="h-4 w-4" /> Credit Card (CC)</span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-amber-400"><CreditCard className="h-4 w-4" /> Debit Card (DC)</span>
                <span className="text-slate-600">|</span>
                <span className="flex items-center gap-1 text-blue-400"><Landmark className="h-4 w-4" /> ACH Bank Transfer</span>
              </div>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="grid md:grid-cols-4 gap-6 mb-16">
            {plans.map((plan, i) => (
              <div
                key={i}
                className={`relative rounded-3xl p-6 flex flex-col justify-between border transition-all ${
                  plan.highlight
                    ? "bg-amber-500/10 border-amber-500/50 shadow-2xl shadow-amber-500/10 scale-105 z-20"
                    : "bg-[#0f0f1e] border-white/10 hover:border-white/20"
                }`}
              >
                {plan.badge && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2">
                    <Badge className="bg-amber-500 text-black font-bold text-xs border-0 px-3">
                      {plan.badge}
                    </Badge>
                  </div>
                )}

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <h3 className="text-xl font-bold text-white">{plan.name}</h3>
                    <Badge variant="outline" className="text-[10px] text-amber-400 border-amber-500/30">
                      Code: {plan.prefix}-XXXXX
                    </Badge>
                  </div>
                  <p className="text-slate-400 text-xs mb-4">{plan.desc}</p>
                  
                  <div className="mb-6">
                    <span className="text-4xl font-extrabold text-white">{plan.price}</span>
                    <span className="text-slate-400 text-sm">{plan.period}</span>
                  </div>

                  <ul className="space-y-3 mb-8">
                    {plan.features.map((feat, idx) => (
                      <li key={idx} className="flex items-center gap-2.5 text-sm text-slate-300">
                        <Check className="h-4 w-4 text-emerald-400 flex-shrink-0" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <Link
                  to="/broker/subscribe"
                  className={`w-full py-3 rounded-xl font-bold text-center transition-all text-sm block ${
                    plan.highlight
                      ? "bg-amber-500 text-black hover:bg-amber-400 shadow-lg shadow-amber-500/20"
                      : "bg-white/10 text-white hover:bg-white/20"
                  }`}
                >
                  {plan.cta} →
                </Link>
              </div>
            ))}
          </div>

          {/* Secure Trust Box */}
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 max-w-2xl mx-auto text-center">
            <div className="flex items-center justify-center gap-2 text-amber-400 mb-2">
              <ShieldCheck className="h-5 w-5" />
              <span className="font-bold text-sm">Secure PayPal Subscription & Automated Code Generation</span>
            </div>
            <p className="text-slate-400 text-xs leading-relaxed">
              Every subscription instantly provisions your unique broker identification code (<strong className="text-white">S-XXXXX</strong>, <strong className="text-white">G-XXXXX</strong>, <strong className="text-white">P-XXXXX</strong>, or <strong className="text-white">E-XXXXX</strong>) backed by verified PayPal CC, DC, and ACH checkout security.
            </p>
          </div>

        </div>
      </div>

      <FodFooter />
    </div>
  );
}
