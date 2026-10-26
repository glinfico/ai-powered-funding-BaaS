import React, { useState } from "react";
import { DollarSign, ShieldCheck, Building, UserCheck, Percent, HelpCircle, FileText, CheckCircle2 } from "lucide-react";

const DEMO_COMMISSIONS = [
  { id: "COMM-801", dealName: "Summit Energy Group", amount: "$2,100,000", totalFee: "$105,000 (5%)", partyType: "Licensed Broker", brokerName: "Sarah Jenkins", brokerPayout: "$105,000 (100%)", platformRetention: "$0 (0%)", stateCompliance: "Full Brokerage Agreement Active" },
  { id: "COMM-802", dealName: "Institutional Enterprise 6 Corp", amount: "$550,000", totalFee: "$27,500 (5%)", partyType: "Licensed Broker", brokerName: "Marcus Vance", brokerPayout: "$27,500 (100%)", platformRetention: "$0 (0%)", stateCompliance: "Full Brokerage Agreement Active" },
  { id: "COMM-803", dealName: "Direct Inbound Lead #8203", amount: "$1,200,000", totalFee: "$60,000 (5%)", partyType: "Non-Broker / Direct Inbound", brokerName: "N/A (House Account)", brokerPayout: "$0 (0%)", platformRetention: "$60,000 (100%)", stateCompliance: "House Retention (Referral Tier Pending State Law)" },
  { id: "COMM-804", dealName: "Apex Manufacturing LLC", amount: "$1,100,000", totalFee: "$55,000 (5%)", partyType: "Licensed Broker", brokerName: "Elena Rostova", brokerPayout: "$55,000 (100%)", platformRetention: "$0 (0%)", stateCompliance: "Full Brokerage Agreement Active" },
  { id: "COMM-805", dealName: "Self-Submitted Inquirer #8205", amount: "$750,000", totalFee: "$37,500 (5%)", partyType: "Non-Broker / Direct Inbound", brokerName: "N/A (House Account)", brokerPayout: "$0 (0%)", platformRetention: "$37,500 (100%)", stateCompliance: "House Retention (Referral Tier Pending State Law)" },
];

export default function CommissionDashboard() {
  const [commissions] = useState(DEMO_COMMISSIONS);

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <DollarSign className="w-8 h-8 text-amber-500" />
            Commission Split & Platform Revenue Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated 100% broker payout rules and house commission retention for non-broker submissions.
          </p>
        </div>
      </div>

      {/* Logic Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-amber-500 text-black rounded-lg font-bold">100%</div>
            <h3 className="text-sm font-bold text-slate-900">Contracted Broker Payout Rule</h3>
          </div>
          <p className="text-xs text-slate-600 leading-relaxed">
            Deals assigned to or brought in by contracted Brokers pay out <strong>100% of the earned broker commission</strong> directly to the broker of record.
          </p>
        </div>

        <div className="bg-slate-900 text-slate-100 border border-slate-800 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-emerald-500 text-black rounded-lg font-bold">100%</div>
            <h3 className="text-sm font-bold text-white">House Account Retention (Non-Broker Deals)</h3>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Deals submitted by non-broker third parties retain <strong>100% of gross origination fees for the platform</strong>. A state-by-state compliant referral fee structure can be linked here seamlessly.
          </p>
        </div>
      </div>

      {/* Commission Ledger Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" /> Live Commission Audit Ledger
          </h2>
          <span className="text-xs font-semibold text-slate-500">Automated Attribution Matching</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Deal Name</th>
                <th className="py-3 px-5">Origination Fee</th>
                <th className="py-3 px-5">Submission Type</th>
                <th className="py-3 px-5">Broker Payout (100%)</th>
                <th className="py-3 px-5">Platform Retention</th>
                <th className="py-3 px-5 text-right">Compliance Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {commissions.map((c) => (
                <tr key={c.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">{c.dealName}</td>
                  <td className="py-4 px-5 font-bold text-slate-900">{c.totalFee}</td>
                  <td className="py-4 px-5 font-semibold">
                    <span className={`px-2 py-0.5 rounded-full text-[10px] ${
                      c.partyType.includes('Licensed') ? 'bg-amber-100 text-amber-900' : 'bg-slate-200 text-slate-800'
                    }`}>
                      {c.partyType}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-bold text-amber-600">{c.brokerPayout}</td>
                  <td className="py-4 px-5 font-bold text-emerald-600">{c.platformRetention}</td>
                  <td className="py-4 px-5 text-right font-medium text-slate-500">{c.stateCompliance}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
