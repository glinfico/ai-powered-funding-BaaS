import React from 'react';
import { Link } from 'react-router-dom';
import { TrendingUp, ShieldCheck, PieChart, ArrowRight, DollarSign } from 'lucide-react';

export default function InvestorPortal() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Investor & Capital Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Investor Portfolio & Asset Allocation</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/portal"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs transition-all border border-white/10"
            >
              ← Back to Portal Hub
            </Link>
          </div>
        </div>

        {/* Status Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Total Portfolio Value</span>
              <DollarSign className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">$28,450,000</div>
            <p className="text-xs text-emerald-400 mt-1">+12.4% YTD Return</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Active Tranches</span>
              <PieChart className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">14 Tranches</div>
            <p className="text-xs text-slate-500 mt-1">Diversified BCD Pool</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Monthly Yield</span>
              <TrendingUp className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">$314,500</div>
            <p className="text-xs text-slate-500 mt-1">Distributed via Ledger</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Risk Rating</span>
              <ShieldCheck className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">Class A-Prime</div>
            <p className="text-xs text-blue-400 mt-1">Fully collateralized</p>
          </div>
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Quarterly Financial Reports</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Review audited performance metrics, tax documents, and capital distribution schedules from the BCD analytics engine.
              </p>
            </div>
            <Link
              to="/portal/investor/dashboard"
              className="inline-flex items-center gap-2 text-purple-400 font-bold text-sm hover:text-purple-300 transition-all"
            >
              Open Analytics Dashboard <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Asset Allocation & Tranches</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Manage your active capital allocations across Merchant Cash Advances, real estate portfolios, and debt instruments.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-slate-400 font-semibold text-sm">
              <ShieldCheck className="h-4 w-4 text-purple-400" /> Secure Vault Active
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
