import React from 'react';
import { Link } from 'react-router-dom';
import { Briefcase, ShieldCheck, FileText, CheckCircle, ArrowRight, DollarSign, Activity } from 'lucide-react';

export default function LenderPortalPage() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Lender & Underwriting Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Lender Portal & Risk Dispatch</h1>
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
              <span className="text-slate-400 text-xs font-semibold uppercase">Inbound Deal Flow</span>
              <Activity className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">42 Queue</div>
            <p className="text-xs text-blue-400 mt-1">Ready for underwriting</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Capital Deployed</span>
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">$14.2M</div>
            <p className="text-xs text-slate-500 mt-1">Across active tranches</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Term Sheets Issued</span>
              <FileText className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-2xl font-black text-white">18 Live</div>
            <p className="text-xs text-emerald-400 mt-1">Awaiting borrower sign-off</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Portfolio Health</span>
              <ShieldCheck className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-emerald-400">99.4%</div>
            <p className="text-xs text-slate-500 mt-1">Low default variance</p>
          </div>
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Automated Underwriting Matrix</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Review automated scoring matrices, adjust risk thresholds, and evaluate incoming commercial loan applications instantly.
              </p>
            </div>
            <Link
              to="/crm/deals"
              className="inline-flex items-center gap-2 text-blue-400 font-bold text-sm hover:text-blue-300 transition-all"
            >
              Launch Master Deals Hub <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Term Sheet Portal & Issuance</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Generate binding term sheets, manage capital tranches, and track execution milestones through the BCD ledger.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-slate-400 font-semibold text-sm">
              <CheckCircle className="h-4 w-4 text-blue-400" /> API Synchronized
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
