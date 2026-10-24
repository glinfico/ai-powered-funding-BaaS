import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import REIDealAnalyzer from "@/components/REIDealAnalyzer";

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
            The AI-Automated{" "}
            <span className="text-amber-400">Funding Platform</span>
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
            <Link to="/fod/solutions">
              <button className="px-7 py-3 rounded-full border border-white/20 hover:border-amber-400/50 hover:text-amber-400 text-white font-medium transition-all">
                Explore Solutions
              </button>
            </Link>
            <Link to="/crm/login">
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

      {/* Visible Block Container for Deal Analyzer */}
      <section style={{
        width: '100%',
        maxWidth: '1200px',
        margin: '40px auto',
        padding: '0 20px',
        display: 'block',
        minHeight: '600px',
        position: 'relative',
        zIndex: 20
      }}>
        <REIDealAnalyzer onNavigateToSubmit={() => window.location.href = "/fod/submit"} />
      </section>

      {/* CTA for demos/videos section */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 pb-24 text-center">
        <div className="bg-[#0f0f1e] border border-white/10 rounded-3xl p-10 shadow-2xl shadow-amber-500/5">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-400 mb-4">See the platform in motion</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Watch Our <span className="text-amber-400">Demos / Videos</span>
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Browse the product walkthroughs and see how our funding workflow works in practice.
          </p>
          <Link to="/fod/contact">
            <button className="px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg transition-all shadow-lg shadow-amber-500/25">
              Watch Our Demos / Videos
            </button>
          </Link>
        </div>
      </section>

      <FodFooter />
    </div>
  );
}
