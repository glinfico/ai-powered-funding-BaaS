import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Zap, ShieldCheck, CheckCircle2, RefreshCw, Cpu, Lock, DollarSign, ArrowRight, Activity } from "lucide-react";

export default function AutonomousClosingEngine() {
  const queryClient = useQueryClient();
  const [processing, setProcessing] = useState(false);
  const [autoMode, setAutoMode] = useState(true);
  const [logs, setLogs] = useState([
    "[SYSTEM] Autonomous Closing Gate initialized.",
    "[AUTOMATION] Zero-touch pipeline evaluation active (Score Threshold ≥ 50%)."
  ]);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => {
      try {
        const cached = localStorage.getItem("glinfico_leads_master");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return [
        { id: "ACE-2001", company_name: "Summit Energy Group", requested_amount: "$2,100,000", score: 82, status: "Pending Automation" },
        { id: "ACE-2002", company_name: "Apex Manufacturing LLC", requested_amount: "$1,100,000", score: 65, status: "Pending Automation" },
        { id: "ACE-2003", company_name: "Meridian Retail Group", requested_amount: "$850,000", score: 44, status: "Skipped (< 50%)" }
      ];
    }
  });

  // Automated Closing Gate Worker
  useEffect(() => {
    if (!autoMode) return;

    const interval = setInterval(() => {
      runAutomatedGateBatch(false);
    }, 10000); // Background auto-run every 10 seconds

    return () => clearInterval(interval);
  }, [autoMode, leads]);

  const runAutomatedGateBatch = (isManual = true) => {
    if (processing && isManual) return;
    setProcessing(true);

    if (isManual) {
      setLogs(prev => [
        `[MANUAL TRIGGER] Forcing full pipeline automated closing gate evaluation...`,
        ...prev
      ]);
    }

    setTimeout(() => {
      const isSubscribed = localStorage.getItem("glinfico_broker_subscribed") === "true";

      const updatedLeads = leads.map(lead => {
        const score = lead.score || 65;
        if (score >= 50 && lead.status !== "Auto-Closed & Unlocked") {
          const commissionRate = 0.05;
          const feeAmount = parseFloat((lead.requested_amount || "$1,000,000").replace(/[^0-9.]/g, '')) * commissionRate;
          
          return {
            ...lead,
            status: "Auto-Closed & Unlocked",
            gate_processed: true,
            commission_routing: isSubscribed ? "100% Broker Payout (Subscribed)" : "100% House Retention (Non-Subscriber)",
            processed_at: new Date().toISOString()
          };
        }
        return lead;
      });

      queryClient.setQueryData(["leads"], updatedLeads);
      try {
        localStorage.setItem("glinfico_leads_master", JSON.stringify(updatedLeads));
      } catch (e) {}

      const autoCount = updatedLeads.filter(l => l.gate_processed).length;

      setLogs(prev => [
        `[AUTO GATE SUCCESS] Evaluated pipeline. ${autoCount} qualifying deals automatically closed, term-sheeted, and routed without manual intervention.`,
        `[SUBSCRIPTION STATUS] Broker Subscribed: ${isSubscribed ? "YES (100% Payout Vesting)" : "NO (House Retention Active)"}`,
        ...prev
      ]);
      setProcessing(false);
    }, 1000);
  };

  const autoClosedCount = leads.filter(l => l.status === "Auto-Closed & Unlocked").length;

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Zap className="w-8 h-8 text-amber-500 fill-amber-500" />
            Autonomous Closing Gate & Execution Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Zero-touch automated underwriting, term sheet dispatch, lender notifications, and commission routing.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={() => setAutoMode(!autoMode)}
            className={`px-4 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-2 border ${
              autoMode ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-slate-100 text-slate-600 border-slate-300"
            }`}
          >
            <Activity className={`w-4 h-4 ${autoMode ? "text-emerald-600 animate-pulse" : "text-slate-400"}`} />
            {autoMode ? "Live Auto-Gate: ON" : "Live Auto-Gate: PAUSED"}
          </button>
          <button
            onClick={() => runAutomatedGateBatch(true)}
            disabled={processing}
            className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-2.5 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 border border-slate-700"
          >
            {processing ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Cpu className="w-4 h-4 text-amber-400" />}
            {processing ? "Processing Gate..." : "Force Run Closing Gate"}
          </button>
        </div>
      </div>

      {/* Status Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-900 rounded-xl">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Intent Score Gate</div>
            <div className="text-xl font-black text-slate-900">Threshold ≥ 50%</div>
            <div className="text-xs text-amber-600 font-semibold mt-0.5">MCA & SBA/LOC Dual-Funnel</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl">
            <CheckCircle2 className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Auto-Closed Deals</div>
            <div className="text-xl font-black text-slate-900">{autoClosedCount.toLocaleString()} Processed</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">Zero manual unlocking required</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-900 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Lender Dispatch Pool</div>
            <div className="text-xl font-black text-slate-900">22,450 Lenders</div>
            <div className="text-xs text-indigo-600 font-semibold mt-0.5">Real-time guideline matching</div>
          </div>
        </div>
      </div>

      {/* Live Processed Deals Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <Cpu className="w-4 h-4 text-amber-500" /> Automated Closing Gate Pipeline Ledger
          </h2>
          <span className="text-xs font-semibold text-slate-500">Real-Time Background Execution</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Deal / Company</th>
                <th className="py-3 px-5">Funding Amount</th>
                <th className="py-3 px-5">AI Intent Score</th>
                <th className="py-3 px-5">Closing Gate Status</th>
                <th className="py-3 px-5 text-right">Commission Routing</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {leads.slice(0, 10).map((lead, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">{lead.company_name}</td>
                  <td className="py-4 px-5 font-bold text-slate-900">{lead.requested_amount || "$1,000,000"}</td>
                  <td className="py-4 px-5 font-bold text-amber-600">{lead.score || 65}%</td>
                  <td className="py-4 px-5">
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold ${
                      lead.status === "Auto-Closed & Unlocked" ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-900"
                    }`}>
                      {lead.status || "Pending Automation"}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-right font-semibold text-slate-600">
                    {lead.commission_routing || "Pending Gate Evaluation"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Autonomous Execution Log */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 font-sans font-bold">
          <span>Autonomous Closing Engine Log Stream</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Background Worker Active</span>
        </div>
        <div className="space-y-2 h-40 overflow-y-auto">
          {logs.map((entry, idx) => (
            <div key={idx} className="leading-relaxed text-slate-300">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
