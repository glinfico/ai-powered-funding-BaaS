import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Zap, Users, FileText, ArrowRight, DollarSign } from 'lucide-react';

export default function BrokerPortal() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Verified Broker Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Broker Portal & Capital Dispatch</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/checkout"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              Upgrade Tier / Billing →
            </Link>
            <Link
              to="/portal"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs transition-all border border-white/10"
            >
              Back to Home
            </Link>
          </div>
        </div>

        {/* Quick Stats Grid */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Broker ID Code</span>
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-amber-400 font-mono">S-999</div>
            <p className="text-xs text-slate-500 mt-1">Active Starter Tier</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Assigned Leads</span>
              <Users className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">128</div>
            <p className="text-xs text-emerald-400 mt-1">+14% this week</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Active Term Sheets</span>
              <FileText className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">24</div>
            <p className="text-xs text-blue-400 mt-1">Pending lender review</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Commission Earned</span>
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">$42,500</div>
            <p className="text-xs text-slate-500 mt-1">Cleared via BCD Ledger</p>
          </div>
        </div>

        {/* Action Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Automated Matching & Routing</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Submit inbound borrower scenarios directly into the automated underwriting pipeline with instant multi-lender scoring matrices.
              </p>
            </div>
            <Link
              to="/portal/broker"
              className="inline-flex items-center gap-2 text-amber-400 font-bold text-sm hover:text-amber-300 transition-all"
            >
              Leads Assigned <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Subscription & API Management</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Manage your billing cycle, upgrade your broker tier (Starter, Gold, Platinum, Enterprise), and pull API credentials.
              </p>
            </div>
            <Link
              to="/checkout"
              className="inline-flex items-center gap-2 text-amber-400 font-bold text-sm hover:text-amber-300 transition-all"
            >
              Open Checkout & Tiers <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
}
