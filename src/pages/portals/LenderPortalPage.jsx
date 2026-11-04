import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, Building2, TrendingUp, CheckCircle2, Layers } from "lucide-react";

export default function LenderPortalPage() {
  return (
    <div className="min-h-screen bg-slate-950 text-white p-6 md:p-12">
      <div className="max-w-5xl mx-auto">
        {/* Header */}
        <div className="flex justify-between items-center mb-8 border-b border-slate-800 pb-6">
          <div className="flex items-center gap-4">
            <Link to="/portal" className="bg-slate-900 border border-slate-800 hover:bg-slate-800 p-2.5 rounded-xl text-slate-300 transition-all flex items-center gap-2 text-xs font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to Master Portal
            </Link>
            <div>
              <h1 className="text-2xl font-black tracking-tight">Lender Matching & Syndication Workspace</h1>
              <p className="text-xs text-slate-400">IDE Active Node: L-1126-N100001 • 22,000+ Lenders Indexed</p>
            </div>
          </div>
          <div className="bg-blue-500/10 border border-blue-500/30 px-3 py-1.5 rounded-xl text-blue-400 text-xs font-bold flex items-center gap-1.5">
            <Building2 className="w-4 h-4" /> Lender Node Active
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Matched Deal Flow</p>
            <h3 className="text-2xl font-black text-white">14 Tranches</h3>
            <p className="text-xs text-emerald-400 mt-2">↑ 4 new today matching criteria</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Target Yield Range</p>
            <h3 className="text-2xl font-black text-amber-400">14.2% - 18.5%</h3>
            <p className="text-xs text-slate-500 mt-2">Verified via FinGoal & IDIQ</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Settlement Framework</p>
            <h3 className="text-2xl font-black text-blue-400">2.0% ALS</h3>
            <p className="text-xs text-slate-500 mt-2">Automated liquidity syndication</p>
          </div>
        </div>

        {/* Available Deal Flow */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Layers className="w-5 h-5 text-blue-400" /> Incoming Matched Tranches
          </h3>
          <div className="space-y-4">
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex justify-between items-center">
              <div>
                <span className="text-xs text-amber-400 font-bold uppercase tracking-wider">MCA Tranche A</span>
                <h4 className="font-bold text-base mt-1">Q4 High-Yield Merchant Portfolio ($2.5M)</h4>
                <p className="text-xs text-slate-400 mt-1">42 Merchants Verified • Avg 720 FICO</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                Review Underwriting
              </button>
            </div>
            <div className="bg-slate-950 p-5 rounded-xl border border-slate-800/80 flex justify-between items-center">
              <div>
                <span className="text-xs text-blue-400 font-bold uppercase tracking-wider">Real Estate Portfolio B</span>
                <h4 className="font-bold text-base mt-1">Commercial Debt Tranche ($5.0M)</h4>
                <p className="text-xs text-slate-400 mt-1">12 Properties Verified • 14.2% Target Yield</p>
              </div>
              <button className="bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all">
                Review Underwriting
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
