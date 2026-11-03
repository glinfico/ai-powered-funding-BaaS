import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Users, Building2, Briefcase, TrendingUp, Zap, ArrowRight, Lock } from 'lucide-react';

export default function PortalHub() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-500/10 border border-amber-500/20 text-amber-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Glinfico Master Infrastructure Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Enterprise Portal Control Center</h1>
          </div>
          <div className="flex items-center gap-3">
            <Link
              to="/checkout"
              className="px-4 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-bold text-xs transition-all shadow-lg shadow-amber-500/20"
            >
              Subscription & Tiers →
            </Link>
            <Link
              to="/login"
              className="px-4 py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-slate-300 font-semibold text-xs transition-all border border-white/10"
            >
              Admin Sign In
            </Link>
          </div>
        </div>

        {/* Portal Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          
          {/* Broker Portal */}
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-amber-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
                  <Users className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-amber-400 bg-amber-500/10 px-2.5 py-1 rounded-full">Active Hub</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Broker Portal</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Manage capital dispatch, lead scoring pipelines, term sheets, and verified subscription codes (S, G, P, E).
              </p>
            </div>
            <Link
              to="/portal/broker"
              className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-400 font-bold text-xs transition-all border border-amber-500/20"
            >
              <span>Access Broker Hub</span> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Borrower Portal */}
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-emerald-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl bg-emerald-500/10 text-emerald-400">
                  <Building2 className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full">Secure</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Borrower Portal</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Submit funding applications, upload financial records, track deal milestones, and review active loan offers.
              </p>
            </div>
            <Link
              to="/portal/borrower"
              className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all border border-white/10"
            >
              <span>Access Borrower Hub</span> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Lender Portal */}
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-blue-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl bg-blue-500/10 text-blue-400">
                  <Briefcase className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-blue-400 bg-blue-500/10 px-2.5 py-1 rounded-full">Underwriting</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Lender Portal</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Review automated underwriting guidelines, evaluate risk matrices, and issue binding term sheets instantly.
              </p>
            </div>
            <Link
              to="/portal/lender"
              className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all border border-white/10"
            >
              <span>Access Lender Hub</span> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          {/* Investor Portal */}
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl flex flex-col justify-between hover:border-purple-500/50 transition-all">
            <div>
              <div className="flex items-center justify-between mb-4">
                <span className="p-3 rounded-xl bg-purple-500/10 text-purple-400">
                  <TrendingUp className="h-6 w-6" />
                </span>
                <span className="text-xs font-bold text-purple-400 bg-purple-500/10 px-2.5 py-1 rounded-full">Capital</span>
              </div>
              <h3 className="text-xl font-bold mb-2">Investor Portal</h3>
              <p className="text-slate-400 text-xs leading-relaxed mb-6">
                Monitor capital distributions, portfolio performance, asset allocation, and quarterly financial reports.
              </p>
            </div>
            <Link
              to="/portal/investor"
              className="inline-flex items-center justify-between w-full px-4 py-3 rounded-xl bg-white/5 hover:bg-white/10 text-slate-300 font-bold text-xs transition-all border border-white/10"
            >
              <span>Access Investor Hub</span> <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

        </div>

        {/* Master Database & Supabase Status Banner */}
        <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 flex items-center justify-between shadow-xl">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-amber-500/10 text-amber-400">
              <Lock className="h-6 w-6" />
            </div>
            <div>
              <h4 className="font-bold text-sm">Supabase Core Schema & Vault Security</h4>
              <p className="text-slate-400 text-xs mt-0.5">All portal connections are protected by Row-Level Security (RLS) and live BCD ledger routing.</p>
            </div>
          </div>
          <Link
            to="/crm/dashboard"
            className="px-5 py-2.5 rounded-xl bg-amber-500 hover:bg-amber-400 text-black font-extrabold text-xs transition-all shadow-lg shadow-amber-500/20"
          >
            Launch Master DB CRM →
          </Link>
        </div>

      </div>
    </div>
  );
}
