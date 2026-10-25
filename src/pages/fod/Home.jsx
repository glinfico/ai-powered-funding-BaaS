import React from "react";
import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import REIDealAnalyzer from "@/components/REIDealAnalyzer";

const features = [
  { label: "500+ Lenders Network", cta: "Explore →", url: "/fod/platform" },
  { label: "AI Matching Engine", cta: "Explore →", url: "/fod/platform" },
  { label: "Instant Term Sheets", cta: "Explore →", url: "/fod/pricing" },
];

export default function FodHome() {
  return (
    <div className="min-h-screen bg-[#0a0a12] text-white flex flex-col relative overflow-hidden font-sans">
      <Starfield />
      <FodNav />

      {/* Hero Section */}
      <section className="relative z-10 max-w-6xl mx-auto px-4 sm:px-6 pt-20 pb-16 text-center">
        <div className="inline-block mb-4 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold tracking-wider uppercase">
          AI-Powered Funding BaaS Platform
        </div>
        
        <h1 className="text-4xl sm:text-6xl font-extrabold tracking-tight mb-6 leading-tight">
          Funding Infrastructure <br />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-amber-400 to-amber-200">
            Engineered for Modern Deals
          </span>
        </h1>
        
        <p className="text-slate-300 text-lg sm:text-xl max-w-3xl mx-auto mb-10 leading-relaxed">
          Streamline capital deployment, match borrower profiles against 500+ lender buy-boxes, and issue automated term sheets in minutes.
        </p>

        {/* Features Row */}
        <div className="grid sm:grid-cols-3 gap-6 max-w-4xl mx-auto mb-12">
          {features.map((f, i) => (
            <div key={i} className="bg-[#0f0f1e]/80 border border-white/10 rounded-2xl p-6 text-left hover:border-amber-500/30 transition-all">
              <p className="text-white font-bold text-lg mb-2">{f.label}</p>
              <Link to={f.url} className="text-amber-400 font-semibold text-sm hover:underline">
                {f.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Copilot's Deal Analyzer Block */}
      <section style={{ width: '100%', maxWidth: '1200px', margin: '40px auto', padding: '0 20px', display: 'block', position: 'relative', zIndex: 20 }}>
        <REIDealAnalyzer onNavigateToSubmit={() => window.location.href = "/fod/submit"} />
      </section>

      {/* Copilot's Cleaned Demo Section with Link to Video Landing Page */}
      <section className="max-w-4xl mx-auto px-4 sm:px-6 py-16 pb-24 text-center relative z-10">
        <div className="bg-[#0f0f1e] border border-white/10 rounded-3xl p-10 shadow-2xl shadow-amber-500/5">
          <p className="text-sm uppercase tracking-[0.2em] text-amber-400 mb-4">See the platform in motion</p>
          <h2 className="text-3xl sm:text-4xl font-bold mb-6">
            Watch Our <span className="text-amber-400">Demos / Videos</span>
          </h2>
          <p className="text-slate-300 text-lg max-w-2xl mx-auto mb-8">
            Browse the product walkthroughs and see how our funding workflow works in practice.
          </p>
          <Link to="/demos">
            <button className="px-8 py-4 rounded-full bg-amber-500 hover:bg-amber-400 text-black font-bold text-lg transition-all shadow-lg shadow-amber-500/25 cursor-pointer">
              Watch Our Demos / Videos
            </button>
          </Link>
        </div>
      </section>

      <FodFooter />
    </div>
  );
}
