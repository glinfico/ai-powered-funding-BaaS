import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";

const features = [
  { label: "500+ Lenders Network", cta: "Explore →", url: "/fod/platform" },
  { label: "AI Matching Engine", cta: "Explore →", url: "/fod/platform" },
  { label: "Real-Time Deal Flow", cta: "Explore →", url: "/fod/platform" },
  { label: "MCA Funding", cta: "Apply →", url: "/fod/submit" },
  { label: "Real Estate Capital", cta: "Apply →", url: "/fod/submit" },
  { label: "M&A Deals", cta: "Apply →", url: "/fod/submit" },
  { label: "Loan Servicing", cta: "Apply →", url: "/fod/contact" },
];

const steps = [
  { number: 1, label: "Submit your deal" },
  { number: 2, label: "Get matched with lenders" },
  { number: 3, label: "Close faster" },
];

export default function FodHome() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white">
      <FodNav />

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center text-center px-4 pt-16 overflow-hidden">
        <Starfield />
        <div className="relative z-10 max-w-4xl mx-auto space-y-8">
          <div className="inline-flex items-center gap-2 bg-amber-500/10 border border-amber-500/30 rounded-full px-4 py-1.5 text-amber-400 text-sm font-medium">
            <span className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
            AI-Powered Funding Platform
          </div>

          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-extrabold leading-tight tracking-tight">
            Where Funding Meets{" "}
            <span className="text-amber-400">Intelligence</span>
          </h1>

          <p className="text-slate-300 text-lg sm:text-xl max-w-2xl mx-auto leading-relaxed">
            AI-powered platform connecting brokers, lenders, and investors.<br />
            Built for dealmakers looking to move capital faster.
          </p>

          <div className="flex flex-wrap gap-3 justify-center pt-2">
            <Link to="/fod/submit">
              <button className="px-7 py-3 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold transition-all shadow-lg shadow-amber-500/25">
                Submit a Deal
              </button>
            </Link>
            <Link to="/fod/platform">
              <button className="px-7 py-3 rounded-full border border-white/20 hover:border-amber-400/50 hover:text-amber-400 text-white font-medium transition-all">
                Start Smart Funding Router
              </button>
            </Link>
            <Link to="/portal">
              <button className="px-7 py-3 rounded-full border border-white/20 hover:border-white/40 text-white font-medium transition-all">
                Sign In
              </button>
            </Link>
            <Link to="/fod/contact">
              <button className="px-7 py-3 rounded-full border border-white/20 hover:border-white/40 text-white font-medium transition-all">
                Book a Demo
              </button>
            </Link>
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          How It <span className="text-amber-400">Works</span>
        </h2>
        <div className="grid sm:grid-cols-3 gap-6">
          {steps.map(s => (
            <div key={s.number} className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 text-center hover:border-amber-500/40 transition-all">
              <div className="w-14 h-14 rounded-2xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center mx-auto mb-4">
                <span className="text-amber-400 font-extrabold text-2xl">{s.number}</span>
              </div>
              <p className="text-white font-semibold text-lg">{s.label}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Built for Performance */}
      <section className="max-w-6xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-12">
          Built for <span className="text-amber-400">Performance</span>
        </h2>
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {features.map(f => (
            <div key={f.label} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-5 flex items-center justify-between hover:border-amber-500/40 transition-all group">
              <span className="text-white font-medium text-sm">{f.label}</span>
              <Link to={f.url} className="text-amber-400 text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap ml-2">
                {f.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Watch Our Demos */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 py-8 pb-24">
        <h2 className="text-3xl sm:text-4xl font-bold text-center mb-4">
          Watch Our <span className="text-amber-400">Demos</span>
        </h2>
        <p className="text-slate-400 text-center mb-12">See the platform in action — from deal submission to funding.</p>
        <div className="grid sm:grid-cols-2 gap-6">
          {[
            "HeyGen | GLINFICO.FOD Short Demo",
            "HeyGen | GLINFICO DEMO2",
            "HeyGen | FOD Portal Virtual Tour",
            "HeyGen | GLINFICO.FOD Getting Started Guide",
          ].map((title, i) => (
            <div key={i} className="bg-[#0f0f1e] border border-white/10 rounded-xl p-6 flex items-center gap-4 hover:border-amber-500/40 transition-all cursor-pointer">
              <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-center shrink-0">
                <span className="text-amber-400 font-bold">▶</span>
              </div>
              <div>
                <p className="text-slate-400 text-xs mb-1">Demo {i + 1}</p>
                <p className="text-white text-sm font-medium">{title}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <FodFooter />
    </div>
  );
}