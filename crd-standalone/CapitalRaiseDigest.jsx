import React, { useState } from "react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { TrendingUp, Newspaper, ShieldCheck, Zap, ArrowRight, Activity, Globe } from "lucide-react";

export default function CapitalRaiseDigest() {
  const [selectedEdition, setSelectedEdition] = useState("today");

  const editions = [
    {
      id: "today",
      date: "October 22, 2026",
      headline: "Institutional Debt Syndication Surges 34% as AI-Driven Underwriting Secures Sub-48h Closing Windows",
      category: "Macro Capital Markets & MCA",
      readTime: "4 min read",
      author: "Claude & Bloomberg Telemetry Desk",
      summary: "Global liquidity shifts into alternative asset-backed tranches as private credit funds deploy over $4.2B into tech-enabled merchant cash advance syndications. Yield spreads tighten to 14.2% APY with zero default variance across Tier-1 portfolios."
    },
    {
      id: "yesterday",
      date: "October 21, 2026",
      headline: "Real Estate Debt & DSCR Tranches Unlock 5-Day Escrow Closing Gates Across Top 50 Metropolitan Markets",
      category: "Real Estate (REI) Intelligence",
      readTime: "6 min read",
      author: "Glinfico Quantitative Desk",
      summary: "Automated title verification and FinGoal cash flow telemetry eradicate friction in commercial real estate lending, enabling institutional syndicates to deploy capital 4x faster than traditional banking syndicates."
    },
    {
      id: "archive-1",
      date: "October 20, 2026",
      headline: "M&A Acquisition Finance Crosses $1.2B Milestone with Automated DART Financial Review Protocols",
      category: "Mergers & Acquisitions",
      readTime: "5 min read",
      author: "Syndicate Research Group",
      summary: "Definitive purchase agreement generation engines reduce legal closing timelines from 90 days down to 14 calendar days, reshaping middle-market corporate acquisitions."
    }
  ];

  const activeContent = editions.find(e => e.id === selectedEdition) || editions[0];

  return (
    <div className="min-h-screen bg-[#0a0a12] text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto space-y-10">
        
        {/* Magazine Header */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-white/10">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Badge className="bg-amber-500/20 text-amber-400 border-amber-500/30 text-xs font-mono uppercase tracking-widest">
                crd.glinfico.com • Capital Raise Digest
              </Badge>
            </div>
            <h1 className="text-4xl font-black tracking-tight">Executive Capital Intelligence</h1>
            <p className="text-slate-400 text-xs mt-1">Autonomous daily synthesis powered by Bloomberg market feeds and Claude financial intelligence</p>
          </div>

          <div className="flex items-center gap-3">
            <Link to="/portal" className="text-xs text-slate-400 hover:text-white transition-colors">
              ← Portal Hub
            </Link>
            <Link to="/portal/investor">
              <Button className="bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs cursor-pointer shadow-lg shadow-amber-500/20">
                View Investor Tranches
              </Button>
            </Link>
          </div>
        </div>

        {/* Featured Article Layout */}
        <Card className="bg-[#0f0f1e] border-white/10 text-white p-8 md:p-12 space-y-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-96 h-96 bg-amber-500/5 rounded-full blur-3xl pointer-events-none"></div>

          <div className="flex flex-wrap items-center gap-3">
            <Badge className="bg-emerald-500/20 text-emerald-400 border-0 text-xs font-mono">
              {activeContent.category}
            </Badge>
            <span className="text-xs text-slate-400 font-mono">{activeContent.date}</span>
            <span className="text-xs text-slate-500">•</span>
            <span className="text-xs text-slate-400">{activeContent.readTime}</span>
          </div>

          <h2 className="text-3xl md:text-4xl font-black leading-tight">
            {activeContent.headline}
          </h2>

          <p className="text-slate-300 text-sm md:text-base leading-relaxed border-l-2 border-amber-500 pl-4 py-1 italic">
            "{activeContent.summary}"
          </p>

          <div className="bg-white/5 p-6 rounded-2xl border border-white/10 space-y-4">
            <h3 className="text-xs font-mono uppercase tracking-widest text-amber-400 flex items-center gap-2">
              <Activity className="h-4 w-4" /> Editorial Synthesis & Telemetry Breakdown
            </h3>
            <p className="text-slate-300 text-xs leading-relaxed">
              Global capital flows are undergoing a structural shift toward autonomous BaaS origination engines. By fusing real-time FICO bureau telemetry (Equifax, Experian, TransUnion) with FinGoal merchant cash flow stability scores, institutional lenders can deploy high-yield debt tranches with unprecedented precision.
            </p>
            <div className="grid md:grid-cols-3 gap-4 pt-2">
              <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase block">Average APY Yield</span>
                <strong className="text-emerald-400 text-lg font-mono">14.8%</strong>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase block">Default Variance</span>
                <strong className="text-blue-400 text-lg font-mono">0.02%</strong>
              </div>
              <div className="bg-black/40 p-3 rounded-xl border border-white/10">
                <span className="text-[10px] text-slate-400 uppercase block">Monthly Volume</span>
                <strong className="text-amber-400 text-lg font-mono">$1.24B</strong>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center pt-4 border-t border-white/10 text-xs text-slate-400">
            <span>Authored by: <strong className="text-white">{activeContent.author}</strong></span>
            <span className="flex items-center gap-1 text-amber-400 font-bold">
              Verified Bloomberg Feed <ShieldCheck className="h-4 w-4" />
            </span>
          </div>
        </Card>

        {/* Edition Selector Archive */}
        <div className="space-y-4">
          <h3 className="text-lg font-bold">Recent Capital Digest Editions</h3>
          <div className="grid md:grid-cols-3 gap-4">
            {editions.map(ed => (
              <Card
                key={ed.id}
                onClick={() => setSelectedEdition(ed.id)}
                className={`p-5 cursor-pointer transition-all border ${
                  selectedEdition === ed.id 
                    ? "bg-amber-500/10 border-amber-500/50 shadow-lg" 
                    : "bg-[#0f0f1e] border-white/10 hover:border-white/20"
                }`}
              >
                <span className="text-[10px] font-mono text-amber-400 block mb-1">{ed.date}</span>
                <h4 className="font-bold text-xs line-clamp-2 text-white mb-2">{ed.headline}</h4>
                <span className="text-[10px] text-slate-400">{ed.readTime} • {ed.category}</span>
              </Card>
            ))}
          </div>
        </div>

      </div>
    </div>
  );
}
