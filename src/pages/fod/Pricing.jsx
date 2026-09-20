import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import { Badge } from "@/components/ui/badge";

const plans = [
  {
    name: "Starter",
    price: "$299",
    period: "/month",
    desc: "Perfect for new brokers and small operators entering the funding space.",
    features: [
      "25 leads/month",
      "Basic CRM access",
      "MCA deal submissions",
      "Standard lender matching",
      "Email support"
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Pro",
    price: "$499",
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
    cta: "Get Started",
    badge: "Most Popular",
    highlight: true,
  },
  {
    name: "Business",
    price: "$999",
    period: "/month",
    desc: "The complete funding operating system for serious dealmakers.",
    features: [
      "Unlimited leads",
      "Full MCA + CRE + M&A access",
      "AI scoring & matching",
      "Marketplace visibility",
      "White-label options",
      "Priority support"
    ],
    cta: "Get Started",
    highlight: false,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    desc: "For teams, institutions, and strategic funding operations.",
    features: [
      "Dedicated onboarding",
      "Custom workflows",
      "API integrations",
      "Multi-user access",
      "Priority infrastructure",
      "Dedicated account manager"
    ],
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
            className={`relative rounded-2xl p-6 flex flex-col gap-4 border transition-all duration-300
              ${p.highlight
                ? "bg-amber-400/10 border-amber-400 shadow-lg shadow-amber-400/20"
                : "bg-white/5 border-white/10 hover:border-white/20"}`}>

            {p.badge && (
              <Badge className="absolute -top-3 left-1/2 -translate-x-1/2 bg-amber-400 text-black font-bold px-4">
                {p.badge}
              </Badge>
            )}

            <div>
              <h3 className="text-xl font-bold mb-1">{p.name}</h3>
              <div className="flex items-end gap-1">
                <span className={`text-4xl font-extrabold ${p.highlight ? "text-amber-400" : "text-white"}`}>
                  {p.price}
                </span>
                <span className="text-slate-400 text-sm mb-1">{p.period}</span>
              </div>
              <p className="text-slate-400 text-sm mt-2">{p.desc}</p>
            </div>

            <ul className="flex flex-col gap-2 flex-1">
              {p.features.map(f => (
                <li key={f} className="flex items-start gap-2 text-sm text-slate-300">
                  <span className="text-amber-400 mt-0.5">✓</span>
                  {f}
                </li>
              ))}
            </ul>

            <Link
              to={p.name === "Enterprise" ? "/fod/contact" : "/fod/portal"}
              className={`mt-2 text-center py-3 rounded-xl font-semibold transition-all
                ${p.highlight
                  ? "bg-amber-400 text-black hover:bg-amber-300"
                  : "bg-white/10 text-white hover:bg-white/20"}`}>
              {p.cta}
            </Link>
          </div>
        ))}
      </section>

      <FodFooter />
    </div>
  );
}
