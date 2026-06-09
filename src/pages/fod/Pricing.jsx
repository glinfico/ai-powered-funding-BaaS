import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    price: "$49",
    period: "/month",
    desc: "Perfect for new brokers and small operators entering the funding space.",
    features: ["25 leads/month", "Basic CRM access", "Standard lender matching", "Email support"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Growth",
    price: "$149",
    period: "/month",
    desc: "Built for active brokers looking to scale deal flow and lender access.",
    features: ["100 leads/month", "Advanced CRM tools", "Priority lender routing", "Pipeline dashboard"],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$299",
    period: "/month",
    desc: "The complete funding operating system for serious dealmakers.",
    features: ["Unlimited leads", "Full MCA + REI + M&A access", "AI scoring & matching", "Marketplace visibility", "White-label options"],
    cta: "Get Started",
    badge: "Most Popular",
    highlight: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For teams, institutions, and strategic funding operations.",
    features: ["Dedicated onboarding", "Custom workflows", "API integrations", "Multi-user access", "Priority infrastructure"],
    cta: "Contact Sales",
    highlight: false,
  },
];

export default function FodPricing() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <FodNav />

      <section className="relative pt-32 pb-16 px-4 text-center overflow-hidden">
        <Starfield />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-4">
            Simple <span className="text-amber-400">Pricing</span>.
          </h1>
          <p className="text-slate-300 text-xl">Powerful Results. Choose the plan that fits your growth.</p>
        </div>
      </section>

      <section className="max-w-6xl mx-auto px-4 sm:px-6 pb-24 grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {plans.map(p => (
          <div key={p.name}
            className={`relative rounded-2xl p-8 flex flex-col ${
              p.highlight
                ? "bg-gradient-to-b from-amber-500/10 to-[#0f0f1e] border-2 border-amber-500/60"
                : "bg-[#0f0f1e] border border-white/10 hover:border-white/20"
            } transition-all`}>
            {p.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-500 text-black text-xs font-bold px-3">
                {p.badge}
              </Badge>
            )}
            <h3 className="text-lg font-bold text-white mb-1">{p.name}</h3>
            <div className="mb-3">
              <span className="text-4xl font-extrabold text-white">{p.price}</span>
              <span className="text-slate-400 text-sm">{p.period}</span>
            </div>
            <p className="text-slate-400 text-sm mb-5 leading-relaxed">{p.desc}</p>
            <ul className="space-y-2 flex-1 mb-6">
              {p.features.map(f => (
                <li key={f} className="flex items-center gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 text-xs">✓</span>{f}
                </li>
              ))}
            </ul>
            <Link to="/fod/portal">
              <button className={`w-full py-2.5 rounded-xl font-semibold text-sm transition-all ${
                p.highlight
                  ? "bg-amber-500 hover:bg-amber-400 text-black"
                  : "border border-white/20 hover:border-amber-400/50 hover:text-amber-400 text-white"
              }`}>
                {p.cta}
              </button>
            </Link>
          </div>
        ))}
      </section>

      <FodFooter />
    </div>
  );
}