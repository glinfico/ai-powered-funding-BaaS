import { useState } from "react";
import { base44 } from "@/api/base44Client";
import { CreditCard, Building2, Shield, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const PLANS = [
  {
    id: "digest_reader",
    name: "Reader",
    monthly: 9.99,
    annual: 99,
    description: "Full access to all articles",
    features: ["All daily articles", "Full article archive", "Morning email digest"],
  },
  {
    id: "digest_pro",
    name: "Pro",
    monthly: 19.99,
    annual: 199,
    description: "Premium experience",
    features: ["Everything in Reader", "No advertisements", "PDF downloads", "Analyst briefings"],
    highlight: true,
  },
];

const METHODS = [
  { id: "stripe_card", label: "Credit Card", provider: "stripe", method_types: ["card"] },
  { id: "stripe_ach", label: "ACH Transfer", provider: "stripe", method_types: ["us_bank_account"] },
  { id: "paypal", label: "PayPal", provider: "paypal" },
];

export default function MagazineSubscribeBlock({ publication = "capital_digest" }) {
  const [billing, setBilling] = useState("monthly");
  const [selectedPlan, setSelectedPlan] = useState("digest_pro");
  const [selectedMethod, setSelectedMethod] = useState("stripe_card");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const successPath = publication === "capital_digest" ? "/capital-digest" : "/finventure";
  const plan = PLANS.find(p => p.id === selectedPlan);

  const handleSubscribe = async () => {
    setLoading(true);
    setError(null);
    const method = METHODS.find(m => m.id === selectedMethod);
    try {
      if (method.provider === "stripe") {
        const res = await base44.functions.invoke("stripeCheckout", {
          plan: selectedPlan,
          billing,
          payment_method_types: method.method_types,
          success_path: successPath,
          cancel_path: successPath,
        });
        if (res.data?.url) window.location.href = res.data.url;
        else setError("Could not create payment session. Please try again.");
      } else {
        const res = await base44.functions.invoke("paypalCheckout", {
          plan: selectedPlan,
          billing,
          success_path: successPath,
          cancel_path: successPath,
        });
        if (res.data?.url) window.location.href = res.data.url;
        else setError("Could not create PayPal order. Please try again.");
      }
    } catch (e) {
      setError(e.message || "Payment error. Please try again.");
    }
    setLoading(false);
  };

  return (
    <div className="border-t-2 border-black bg-slate-900 text-white p-8 mb-8 font-sans">
      <div className="max-w-3xl mx-auto">
        <div className="text-center mb-6">
          <div className="text-[9px] tracking-widest text-amber-400 mb-2 font-bold">SUBSCRIBE</div>
          <h2 className="text-2xl font-black text-white font-serif">Subscribe to Capital Digest</h2>
          <p className="text-slate-400 text-sm mt-1">Executive financial intelligence, delivered daily.</p>

          <div className="inline-flex items-center gap-1 mt-4 bg-white/10 rounded-full p-0.5">
            <button onClick={() => setBilling("monthly")}
              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                billing === "monthly" ? "bg-amber-500 text-black" : "text-slate-400")}>
              Monthly
            </button>
            <button onClick={() => setBilling("annual")}
              className={cn("px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                billing === "annual" ? "bg-amber-500 text-black" : "text-slate-400")}>
              Annual · Save 17%
            </button>
          </div>
        </div>

        <div className="grid sm:grid-cols-2 gap-4 mb-6">
          {PLANS.map(p => (
            <div key={p.id} onClick={() => setSelectedPlan(p.id)}
              className={cn("relative border rounded-lg p-5 cursor-pointer transition-all",
                selectedPlan === p.id
                  ? "bg-amber-500/10 border-amber-500/60"
                  : "bg-white/5 border-white/10 hover:border-white/20")}>
              {p.highlight && (
                <div className="absolute -top-2.5 left-1/2 -translate-x-1/2">
                  <span className="bg-amber-500 text-black text-[9px] font-bold px-2 py-0.5 tracking-widest">RECOMMENDED</span>
                </div>
              )}
              <div className="flex justify-between items-start mb-3">
                <div>
                  <div className="font-black text-white text-lg">{p.name}</div>
                  <div className="text-slate-400 text-xs">{p.description}</div>
                </div>
                <div className="text-right">
                  <span className="text-2xl font-black text-white">
                    ${billing === "annual" ? Math.round(p.annual / 12) : p.monthly}
                  </span>
                  <span className="text-slate-400 text-xs">/mo</span>
                  {billing === "annual" && (
                    <p className="text-amber-400 text-[10px] mt-0.5">Billed ${p.annual}/yr</p>
                  )}
                </div>
              </div>
              <ul className="space-y-1.5">
                {p.features.map(f => (
                  <li key={f} className="flex items-center gap-2 text-xs text-slate-300">
                    <Check className="w-3 h-3 text-amber-400 flex-shrink-0" />
                    {f}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>

        <div className="border-t border-white/10 pt-5">
          <p className="text-xs text-slate-400 mb-3">Payment Method</p>
          <div className="flex gap-2 mb-4 flex-wrap">
            {METHODS.map(m => (
              <button key={m.id} onClick={() => setSelectedMethod(m.id)}
                className={cn("flex items-center gap-1.5 px-3 py-2 text-xs font-medium border rounded transition-all",
                  selectedMethod === m.id
                    ? "bg-amber-500/15 border-amber-500/50 text-white"
                    : "bg-white/5 border-white/10 text-slate-400 hover:border-white/20")}>
                {m.id === "paypal"
                  ? <span className="text-[#00A8E0] font-extrabold text-xs">PP</span>
                  : <CreditCard className="w-3 h-3" />}
                {m.label}
              </button>
            ))}
          </div>

          {error && (
            <p className="text-red-400 text-xs mb-3 bg-red-500/10 border border-red-500/20 rounded px-3 py-2">
              {error}
            </p>
          )}

          <button onClick={handleSubscribe} disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-sm py-3 rounded transition-colors disabled:opacity-60">
            {loading
              ? "Redirecting…"
              : `Subscribe ${plan?.name} — ${billing === "annual" ? `$${plan?.annual}/yr` : `$${plan?.monthly}/mo`}`}
          </button>
          <p className="text-[10px] text-slate-500 text-center mt-2 flex items-center justify-center gap-1">
            <Shield className="w-3 h-3" /> Secure payment · Cancel anytime
          </p>
        </div>
      </div>
    </div>
  );
}