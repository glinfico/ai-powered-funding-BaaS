import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";

const features = [
  { title: "AI Matching Engine", desc: "Match deals to lenders instantly with AI-powered scoring against 500+ lender criteria.", icon: "🤖" },
  { title: "Deal Pipeline Tracking", desc: "Track every deal from submission to funding in real-time.", icon: "📊" },
  { title: "Lender Network Access", desc: "500+ lenders across MCA, REI, M&A, and more.", icon: "🏦" },
  { title: "Automated Workflows", desc: "Automate outreach, scoring, and term sheets with intelligent workflows.", icon: "⚡" },
];

export default function FodPlatform() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <FodNav />

      <section className="relative pt-32 pb-20 px-4 text-center overflow-hidden">
        <Starfield />
        <div className="relative z-10 max-w-3xl mx-auto">
          <h1 className="text-5xl sm:text-6xl font-extrabold mb-6">
            The <span className="text-amber-400">GLINFICO</span> Platform
          </h1>
          <p className="text-slate-300 text-xl">One system connecting funding, deals, and capital.</p>
        </div>
      </section>

      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-24 grid sm:grid-cols-2 gap-6">
        {features.map(f => (
          <div key={f.title} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 hover:border-amber-500/40 transition-all">
            <div className="text-4xl mb-4">{f.icon}</div>
            <h3 className="text-xl font-bold text-white mb-2">{f.title}</h3>
            <p className="text-slate-400 leading-relaxed">{f.desc}</p>
            <Link to="/fod/portal" className="inline-block mt-4 text-amber-400 text-sm font-medium hover:text-amber-300">
              Open →
            </Link>
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