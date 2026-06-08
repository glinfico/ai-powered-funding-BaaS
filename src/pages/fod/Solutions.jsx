import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";

const roles = [
  { role: "For Brokers", desc: "Access deals and lenders. Manage your pipeline and close faster.", cta: "Get Started →", url: "/portal", icon: "🤝" },
  { role: "For Businesses", desc: "Get funding faster with AI-matched lenders for your specific needs.", cta: "Get Started →", url: "/fod/submit", icon: "🏢" },
  { role: "For Investors", desc: "Review curated investment opportunities in the GLINFICO deal room.", cta: "Get Started →", url: "/portal", icon: "📈" },
  { role: "For Lenders", desc: "Receive better, pre-qualified deals matched to your lending criteria.", cta: "Get Started →", url: "/portal", icon: "🏦" },
];

export default function FodSolutions() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <FodNav />

      <section className="relative pt-32 pb-16 px-4 text-center overflow-hidden">
        <Starfield />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6">Solutions</h1>
          <p className="text-slate-300 text-xl">Built for brokers, businesses, lenders, and investors.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid sm:grid-cols-2 gap-6">
        {roles.map(r => (
          <div key={r.role} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 hover:border-amber-500/40 transition-all">
            <div className="text-4xl mb-4">{r.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{r.role}</h3>
            <p className="text-slate-400 leading-relaxed mb-4">{r.desc}</p>
            <Link to={r.url} className="text-amber-400 text-sm font-medium hover:text-amber-300">{r.cta}</Link>
          </div>
        ))}
      </section>

      <div className="text-center pb-20">
        <Link to="/" className="text-amber-400 hover:text-amber-300 text-sm font-medium">← Return to Home</Link>
      </div>

      <FodFooter />
    </div>
  );
}