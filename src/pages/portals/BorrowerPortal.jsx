import React from 'react';
import { Link } from 'react-router-dom';
import { Building2, ShieldCheck, FileText, UploadCloud, CheckCircle, ArrowRight, DollarSign } from 'lucide-react';

export default function BorrowerPortal() {
  return (
    <div className="min-h-screen bg-[#09090b] text-white p-8">
      <div className="max-w-6xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center justify-between border-b border-white/10 pb-6 mb-8">
          <div>
            <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold uppercase tracking-wider mb-2">
              <ShieldCheck className="h-3.5 w-3.5" /> Secure Borrower Hub
            </div>
            <h1 className="text-3xl font-extrabold tracking-tight">Borrower Portal & Funding Tracker</h1>
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
              <span className="text-slate-400 text-xs font-semibold uppercase">Application Status</span>
              <Building2 className="h-5 w-5 text-emerald-400" />
            </div>
            <div className="text-xl font-black text-emerald-400">Under Review</div>
            <p className="text-xs text-slate-500 mt-1">Multi-lender routing active</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Requested Capital</span>
              <DollarSign className="h-5 w-5 text-amber-400" />
            </div>
            <div className="text-2xl font-black text-white">$250,000</div>
            <p className="text-xs text-slate-500 mt-1">Working Capital & MCA</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Documents Uploaded</span>
              <UploadCloud className="h-5 w-5 text-blue-400" />
            </div>
            <div className="text-2xl font-black text-white">4 / 5</div>
            <p className="text-xs text-blue-400 mt-1">1 pending verification</p>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-6 shadow-xl">
            <div className="flex items-center justify-between mb-4">
              <span className="text-slate-400 text-xs font-semibold uppercase">Active Term Sheets</span>
              <FileText className="h-5 w-5 text-purple-400" />
            </div>
            <div className="text-2xl font-black text-white">2 Ready</div>
            <p className="text-xs text-purple-400 mt-1">Review & sign offers</p>
          </div>
        </div>

        {/* Action Sections */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Submit New Funding Request</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Initiate a new commercial loan, merchant cash advance, or real estate financing request directly through the BCD scoring engine.
              </p>
            </div>
            <Link
              to="/crm/deals"
              className="inline-flex items-center gap-2 text-emerald-400 font-bold text-sm hover:text-emerald-300 transition-all"
            >
              Open Application Engine <ArrowRight className="h-4 w-4" />
            </Link>
          </div>

          <div className="bg-[#0f0f1e] border border-white/10 rounded-2xl p-8 shadow-xl flex flex-col justify-between">
            <div>
              <h3 className="text-xl font-bold mb-2">Secure Document Vault</h3>
              <p className="text-slate-400 text-sm mb-6 leading-relaxed">
                Upload bank statements, tax returns, and corporate verification documents securely via Supabase encrypted storage.
              </p>
            </div>
            <span className="inline-flex items-center gap-2 text-slate-400 font-semibold text-sm">
              <CheckCircle className="h-4 w-4 text-emerald-400" /> Vault Synchronized
            </span>
          </div>
        </div>

      </div>
    </div>
  );
}
