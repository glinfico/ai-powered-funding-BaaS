import React, { useState } from "react";
import { Zap, Send, ShieldCheck, Activity, Building2, FileCheck, CheckCircle2, Clock, AlertTriangle, Play, RefreshCw } from "lucide-react";

const INITIAL_ACE_QUEUE = [
  { id: "ACE-1001", company: "Summit Energy Group", contact: "Executive Director 5", score: 92, amount: "$2,100,000", matchLender: "Capital One Business Credit", idiqStatus: "Monitored - Clean (FICO 740+)", termSheetStatus: "Dispatched", bankNotified: true },
  { id: "ACE-1002", company: "Institutional Enterprise 6 Corp", contact: "Executive Director 6", score: 97, amount: "$550,000", matchLender: "FastTrack MCA Funding", idiqStatus: "Monitored - Flagged 1 Bureau Alert", termSheetStatus: "Pending Dispatch", bankNotified: false },
  { id: "ACE-1003", company: "Institutional Enterprise 7 Corp", contact: "Executive Director 7", score: 92, amount: "$1,950,000", matchLender: "JPMorgan Commercial Capital", idiqStatus: "Monitored - Clean (FICO 765)", termSheetStatus: "Dispatched", bankNotified: true },
  { id: "ACE-1004", company: "Institutional Enterprise 13 Corp", contact: "Executive Director 13", score: 90, amount: "$600,000", matchLender: "BlueVine Business Line", idiqStatus: "Monitored - Active Monitoring", termSheetStatus: "Generating...", bankNotified: false },
  { id: "ACE-1005", company: "Institutional Enterprise 16 Corp", contact: "Executive Director 16", score: 92, amount: "$1,650,000", matchLender: "PNC Treasury Management", idiqStatus: "Monitored - Clean (FICO 750)", termSheetStatus: "Pending Dispatch", bankNotified: false },
];

export default function AutonomousClosingEngine() {
  const [queue, setQueue] = useState(INITIAL_ACE_QUEUE);
  const [executing, setExecuting] = useState(false);
  const [systemLog, setSystemLog] = useState([
    "[SYSTEM] ACE Pipeline Active. IDIQ Real-Time Monitoring feed online.",
    "[IDIQ Engine] 8,228 Leads synced with credit bureau & UCC filing triggers."
  ]);

  const triggerAceCycle = () => {
    setExecuting(true);
    setSystemLog(prev => [
      `[ACE Run ${new Date().toLocaleTimeString()}] Executing auto-dispatch for high-scoring leads (Score >= 80)...`,
      ...prev
    ]);

    setTimeout(() => {
      setQueue(prev => prev.map(item => ({
        ...item,
        termSheetStatus: "Dispatched",
        bankNotified: true,
        idiqStatus: "Monitored - Verified"
      })));

      setSystemLog(prev => [
        `[ACE Dispatched] Term sheets emailed to 5/5 leads. Notifications delivered to 22,450-lender matching engine.`,
        `[IDIQ Sync] No major negative credit events detected across active high-score queue.`,
        ...prev
      ]);
      setExecuting(false);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
            Autonomous Closing Engine (ACE) & IDIQ Monitor
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Automated Term Sheet Generation, Matched-Bank Direct Dispatch, and Real-Time IDIQ Credit Tracking.
          </p>
        </div>
        <button
          onClick={triggerAceCycle}
          disabled={executing}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 border border-slate-700"
        >
          {executing ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Play className="w-4 h-4 text-amber-400" />}
          {executing ? "Processing ACE Auto-Closing..." : "Run ACE Auto-Dispatch Cycle"}
        </button>
      </div>

      {/* Metric Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Automated Term Sheets</div>
          <div className="text-2xl font-black text-slate-900 mt-1">1,482 Sent</div>
          <div className="text-xs text-emerald-600 font-semibold mt-1 flex items-center gap-1">
            <CheckCircle2 className="w-3.5 h-3.5" /> High-Intent Trigger (Score ≥ 80)
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Matched-Bank Alerts</div>
          <div className="text-2xl font-black text-slate-900 mt-1">22,450 Lenders</div>
          <div className="text-xs text-amber-600 font-semibold mt-1 flex items-center gap-1">
            <Building2 className="w-3.5 h-3.5" /> Real-time API Notification
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">IDIQ Monitored Leads</div>
          <div className="text-2xl font-black text-slate-900 mt-1">8,228 Contacts</div>
          <div className="text-xs text-indigo-600 font-semibold mt-1 flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5" /> Active Bureau & Soft-Pull Monitoring
          </div>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Auto-Match Conversion</div>
          <div className="text-2xl font-black text-slate-900 mt-1">38.4%</div>
          <div className="text-xs text-slate-500 font-medium mt-1">Inquiry to Underwritten Term Sheet</div>
        </div>
      </div>

      {/* Main Execution Queue */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Activity className="w-4 h-4 text-amber-500" /> High-Scoring Auto-Closing Queue
          </h2>
          <span className="text-xs font-semibold text-slate-500">Auto-filtered: Intent Score ≥ 80</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Lead / Entity</th>
                <th className="py-3 px-5">AI Score</th>
                <th className="py-3 px-5">Requested Funding</th>
                <th className="py-3 px-5">Auto-Matched Lender</th>
                <th className="py-3 px-5">IDIQ Monitoring</th>
                <th className="py-3 px-5">Term Sheet Status</th>
                <th className="py-3 px-5 text-right">Bank Alert</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {queue.map((row) => (
                <tr key={row.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">
                    {row.company}
                    <div className="text-[10px] text-slate-400 font-normal">{row.contact}</div>
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-0.5 rounded-full font-extrabold bg-amber-100 text-amber-900">
                      ⭐ {row.score}
                    </span>
                  </td>
                  <td className="py-4 px-5 font-bold text-slate-900">{row.amount}</td>
                  <td className="py-4 px-5 font-medium text-slate-700 flex items-center gap-1.5 mt-2">
                    <Building2 className="w-3.5 h-3.5 text-slate-400" /> {row.matchLender}
                  </td>
                  <td className="py-4 px-5">
                    <span className="px-2 py-1 rounded-md text-[10px] font-semibold bg-indigo-50 text-indigo-700 border border-indigo-100">
                      {row.idiqStatus}
                    </span>
                  </td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      row.termSheetStatus === 'Dispatched' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800 animate-pulse'
                    }`}>
                      {row.termSheetStatus}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    {row.bankNotified ? (
                      <span className="inline-flex items-center gap-1 text-emerald-600 font-bold text-[11px]">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Sent
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-slate-400 font-medium text-[11px]">
                        <Clock className="w-3.5 h-3.5" /> Queued
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* IDIQ Live Monitoring Stream & System Logs */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-sm font-mono text-xs">
          <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 font-sans font-bold">
            <span className="flex items-center gap-2"><Activity className="w-4 h-4 text-amber-400" /> ACE System Log Feed</span>
            <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Live Engine</span>
          </div>
          <div className="space-y-2 h-40 overflow-y-auto">
            {systemLog.map((log, index) => (
              <div key={index} className="leading-relaxed text-slate-300">{log}</div>
            ))}
          </div>
        </div>

        <div className="bg-white rounded-2xl p-5 border border-slate-200 shadow-sm">
          <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-indigo-600" /> IDIQ Automated Continuous Monitoring Protocol
          </h3>
          <p className="text-xs text-slate-500 mb-4 leading-relaxed">
            Continuously monitors soft credit inquiry updates, UCC filings, bank statement cash flows, and liquidity shifts across all 8,228 pipeline leads.
          </p>
          <div className="space-y-3 text-xs">
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Tri-Bureau Soft-Pull Updates</span>
              <span className="text-emerald-600 font-bold">Enabled (Daily Sync)</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">UCC Lien & Debt Alert Scanner</span>
              <span className="text-emerald-600 font-bold">Active</span>
            </div>
            <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="font-semibold text-slate-700">Auto Term-Sheet Recalibration on Credit Shift</span>
              <span className="text-amber-600 font-bold">Auto-Trigger</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
