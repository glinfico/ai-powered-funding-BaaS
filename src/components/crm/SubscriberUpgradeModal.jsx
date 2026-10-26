import React, { useState } from "react";
import { Lock, Sparkles, ArrowRight, CheckCircle2, ShieldCheck, DollarSign, X } from "lucide-react";

export default function SubscriberUpgradeModal({ isOpen, onClose, dealAmount = "$750,000", estimatedCommission = "$37,500" }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-3xl max-w-lg w-full p-8 relative shadow-2xl border border-slate-200 overflow-hidden">
        {/* Background Accent */}
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />

        <button 
          onClick={onClose} 
          className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Lock Banner Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
            <Lock className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Non-Subscriber Deal Submission</div>
            <h2 className="text-xl font-black text-slate-900">Commission Earnings Locked</h2>
          </div>
        </div>

        {/* Dynamic Earned Commission Card */}
        <div className="bg-slate-900 text-white rounded-2xl p-5 mb-6 border border-slate-800 relative overflow-hidden shadow-inner">
          <div className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">Estimated Deal Commission (5%)</div>
          <div className="text-3xl font-black text-amber-400 flex items-center gap-1">
            <DollarSign className="w-7 h-7 text-amber-400 -ml-1" />
            {estimatedCommission.replace('$', '')}
          </div>
          <p className="text-[11px] text-slate-400 mt-2 leading-relaxed">
            Based on a <strong className="text-slate-200">{dealAmount}</strong> funded facility. Currently assigned to <strong className="text-slate-200">House Account Retention</strong>.
          </p>
        </div>

        {/* Value Proposition List */}
        <div className="space-y-3 mb-8 text-xs text-slate-700">
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Unlock 100% Commission Payouts</strong> on this deal and all future client submissions.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Full ACE Auto-Closing Suite</strong>: Automated term sheets sent directly to your clients.</span>
          </div>
          <div className="flex items-start gap-2.5">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 flex-shrink-0 mt-0.5" />
            <span><strong>Direct Access to 22,450 Lenders</strong> & 3,000 Accredited LP Capital Directory.</span>
          </div>
        </div>

        {/* Subscription Upgrade CTA Button */}
        <div className="space-y-3">
          <button 
            onClick={() => alert("Redirecting to Broker Subscription Portal...")}
            className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3.5 px-6 rounded-xl text-sm transition-all shadow-lg flex items-center justify-center gap-2 group"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" />
            Upgrade to Broker Plan & Claim {estimatedCommission}
            <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
          </button>
          
          <button 
            onClick={onClose} 
            className="w-full text-center text-xs font-semibold text-slate-400 hover:text-slate-600 py-1 transition-colors"
          >
            Continue as Non-Subscriber (House Retains 100% Commission)
          </button>
        </div>

        {/* Legal Subtext */}
        <div className="mt-6 pt-4 border-t border-slate-100 text-[10px] text-slate-400 text-center flex items-center justify-center gap-1.5">
          <ShieldCheck className="w-3.5 h-3.5 text-slate-400" />
          Subscribers receive direct 100% payout wiring upon deal settlement.
        </div>
      </div>
    </div>
  );
}
