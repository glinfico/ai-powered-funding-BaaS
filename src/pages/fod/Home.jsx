import React from "react";
import { Link } from "react-router-dom";
import FodNav from "@/components/public/FodNav";
import FodFooter from "@/components/public/FodFooter";
import Starfield from "@/components/public/Starfield";
import REIDealAnalyzer from "@/components/REIDealAnalyzer";
import { NETWORK, LENDERS } from "@/config/network";

/**
 * Figures below come from the live engine indexes:
 *   22,450 capital partners  (commit c65b47b)
 *    8,000+ indexed leads    (commit 7f13943)
 *    3,000 accredited LPs    (commit b838d42)
 * The old "500+ lenders" copy predated the lender engine scale-up.
 */
const stats = [
  { value: NETWORK.lenders.display, label: "Indexed capital partners" },
  { value: NETWORK.leads.display, label: "Leads under management" },
  { value: NETWORK.investors.display, label: "Accredited LP partners" },
  { value: "Minutes", label: "Deal to term sheet" },
];

const features = [
  {
    label: "Lender Network",
    desc: `${LENDERS} capital partners indexed by buy-box, deal size and asset class.`,
    cta: "Explore →",
    url: "/fod/platform",
  },
  {
    label: "AI Matching Engine",
    desc: "Borrower profiles scored against live lender criteria in real time.",
    cta: "Explore →",
    url: "/fod/platform",
  },
  {
    label: "Smart Deal Portal",
    desc: "One workspace for borrowers, brokers, lenders and investors.",
    cta: "Access Portal →",
    url: "/portal",
  },
];

export default function FodHome() {
  return (
    <div className="relative flex min-h-screen flex-col overflow-hidden bg-[#0a0a12] font-sans text-white">
      <Starfield />
      <FodNav />

      {/* Hero */}
      <section className="relative z-10 mx-auto max-w-6xl px-4 pb-14 pt-20 text-center sm:px-6">
        <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-amber-500/20 bg-amber-500/10 px-4 py-1.5 text-xs font-semibold uppercase tracking-wider text-amber-400">
          <span className="h-1.5 w-1.5 animate-pulse rounded-full bg-amber-400" />
          AI-Powered Funding BaaS Platform
        </div>

        <h1 className="mb-6 text-4xl font-extrabold leading-[1.08] tracking-tight sm:text-6xl">
          From Deal to{" "}
          <span className="bg-gradient-to-r from-amber-400 to-amber-200 bg-clip-text text-transparent">
            Term Sheet
          </span>
          <br />
          in Minutes
        </h1>

        <p className="mx-auto mb-9 max-w-2xl text-lg leading-relaxed text-slate-300 sm:text-xl">
          Match any borrower profile against {LENDERS} indexed capital partners, underwrite
          automatically, and issue term sheets — without the broker back-and-forth.
        </p>

        <div className="mb-14 flex flex-wrap items-center justify-center gap-3">
          <a
            href="#deal-analyzer"
            className="rounded-xl bg-amber-500 px-7 py-3.5 text-base font-bold text-black shadow-lg shadow-amber-500/25 transition hover:bg-amber-400"
          >
            Analyze a Deal — Free
          </a>
          <Link
            to="/portal"
            className="rounded-xl border border-white/15 px-7 py-3.5 text-base font-semibold text-white transition hover:bg-white/5"
          >
            Access Portal
          </Link>
          <Link
            to="/fod/submit"
            className="rounded-xl px-5 py-3.5 text-base font-semibold text-slate-300 transition hover:text-white"
          >
            Submit a Deal
          </Link>
        </div>

        {/* Traction */}
        <div className="mx-auto mb-14 grid max-w-4xl grid-cols-2 gap-4 lg:grid-cols-4">
          {stats.map((s) => (
            <div
              key={s.label}
              className="rounded-2xl border border-white/10 bg-[#0f0f1e]/80 px-4 py-5"
            >
              <div className="text-2xl font-extrabold text-amber-400 sm:text-3xl">{s.value}</div>
              <div className="mt-1 text-xs leading-snug text-slate-400">{s.label}</div>
            </div>
          ))}
        </div>

        {/* Capability cards */}
        <div className="mx-auto grid max-w-5xl gap-6 sm:grid-cols-3">
          {features.map((f) => (
            <div
              key={f.label}
              className="rounded-2xl border border-white/10 bg-[#0f0f1e]/80 p-6 text-left transition-all hover:border-amber-500/30"
            >
              <p className="mb-2 text-lg font-bold text-white">{f.label}</p>
              <p className="mb-4 text-sm leading-relaxed text-slate-400">{f.desc}</p>
              <Link to={f.url} className="text-sm font-semibold text-amber-400 hover:underline">
                {f.cta}
              </Link>
            </div>
          ))}
        </div>
      </section>

      {/* Deal Analyzer */}
      <section
        id="deal-analyzer"
        className="relative z-20 mx-auto w-full max-w-6xl scroll-mt-20 px-4 py-10 sm:px-6"
      >
        <REIDealAnalyzer onNavigateToSubmit={() => (window.location.href = "/fod/submit")} />
      </section>

      {/* Demos — kept behind the button */}
      <section className="relative z-10 mx-auto max-w-4xl px-4 py-16 pb-24 text-center sm:px-6">
        <div className="rounded-3xl border border-white/10 bg-[#0f0f1e] p-10 shadow-2xl shadow-amber-500/5">
          <p className="mb-4 text-sm uppercase tracking-[0.2em] text-amber-400">
            See the platform in motion
          </p>
          <h2 className="mb-6 text-3xl font-bold sm:text-4xl">
            Watch Our <span className="text-amber-400">Demos / Videos</span>
          </h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-slate-300">
            Browse the product walkthroughs and see how our funding workflow works in practice.
          </p>
          <Link to="/demos">
            <button className="cursor-pointer rounded-full bg-amber-500 px-8 py-4 text-lg font-bold text-black shadow-lg shadow-amber-500/25 transition-all hover:bg-amber-400">
              Watch Our Demos / Videos
            </button>
          </Link>
        </div>
      </section>

      <FodFooter />
    </div>
  );
}
