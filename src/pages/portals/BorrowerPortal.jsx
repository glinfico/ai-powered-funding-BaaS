import React from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, ShieldCheck, FileText, UploadCloud, CheckCircle2, Clock } from "lucide-react";

export default function BorrowerPortal() {
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
              <h1 className="text-2xl font-black tracking-tight">Borrower & Client Workspace</h1>
              <p className="text-xs text-slate-400">Application ID: APP-2026-8941 • Verified via FinGoal & IDIQ</p>
            </div>
          </div>
          <div className="bg-emerald-500/10 border border-emerald-500/30 px-3 py-1.5 rounded-xl text-emerald-400 text-xs font-bold flex items-center gap-1.5">
            <ShieldCheck className="w-4 h-4" /> Telemetry Connected
          </div>
        </div>

        {/* Status Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Underwriting Status</p>
            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2">
              <Clock className="w-5 h-5 animate-pulse" /> AI Scoring in Progress
            </h3>
            <p className="text-xs text-slate-500 mt-2">Evaluating MCA & Debt Tranche match.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Bank Statements</p>
            <h3 className="text-lg font-bold text-emerald-400 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5" /> 120 Days Synced
            </h3>
            <p className="text-xs text-slate-500 mt-2">Secure open banking sync active.</p>
          </div>
          <div className="bg-slate-900 border border-slate-800 p-6 rounded-2xl">
            <p className="text-xs text-slate-400 mb-1">Assigned Broker</p>
            <h3 className="text-lg font-bold text-white">GLINCO Capital Desk</h3>
            <p className="text-xs text-slate-500 mt-2">Direct syndication liaison.</p>
          </div>
        </div>

        {/* Active Documents & Actions */}
        <div className="bg-slate-900 border border-slate-800 p-8 rounded-2xl mb-8">
          <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
            <FileText className="w-5 h-5 text-amber-400" /> Active Application Files
          </h3>
          <div className="space-y-3">
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div>
                <p className="font-semibold text-sm">Merchant Cash Advance Application (Q4)</p>
                <p className="text-xs text-slate-400">Submitted via secure telemetry</p>
              </div>
              <span className="text-xs bg-amber-500/10 text-amber-400 border border-amber-500/30 px-3 py-1 rounded-full font-bold">Under Review</span>
            </div>
            <div className="flex justify-between items-center bg-slate-950 p-4 rounded-xl border border-slate-800/80">
              <div>
                <p className="font-semibold text-sm">FinGoal Open Banking Telemetry</p>
                <p className="text-xs text-slate-400">120-day historical transaction parse</p>
              </div>
              <span className="text-xs bg-emerald-500/10 text-emerald-400 border border-emerald-500/30 px-3 py-1 rounded-full font-bold">Verified</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
