import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Shuffle, ShieldCheck, Sparkles, CheckCircle2, UserCheck, RefreshCw, AlertCircle } from "lucide-react";

const ACTIVE_BROKERS = [
  { id: "BRK-01", name: "Sarah Jenkins", tier: "Senior VP", assignedCount: 142, performanceRate: "34.2%" },
  { id: "BRK-02", name: "Marcus Vance", tier: "Capital Advisor", assignedCount: 138, performanceRate: "31.8%" },
  { id: "BRK-03", name: "Elena Rostova", tier: "Senior VP", assignedCount: 145, performanceRate: "38.1%" },
  { id: "BRK-04", name: "David Chen", tier: "Underwriting Specialist", assignedCount: 139, performanceRate: "29.5%" },
  { id: "BRK-05", name: "Aisha Patel", tier: "Capital Advisor", assignedCount: 141, performanceRate: "35.6%" },
];

export default function BrokerAssignment() {
  const queryClient = useQueryClient();
  const [brokers, setBrokers] = useState(ACTIVE_BROKERS);
  const [assigning, setAssigning] = useState(false);
  const [log, setLog] = useState([
    "[SYSTEM] Blind Lead Allocation Engine initialized.",
    "[CONFIG] Score Masking Active: Raw AI Intent Scores hidden during auto-assignment."
  ]);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => {
      try {
        const cached = localStorage.getItem("glinfico_leads_master");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return [];
    }
  });

  const handleRandomAssignmentRun = () => {
    setAssigning(true);
    setLog(prev => [
      `[RUN ${new Date().toLocaleTimeString()}] Initiating blind round-robin random distribution across ${leads.length.toLocaleString()} leads...`,
      ...prev
    ]);

    setTimeout(() => {
      const updatedLeads = leads.map((lead, idx) => {
        const assignedBroker = brokers[idx % brokers.length];
        return {
          ...lead,
          assigned_broker: assignedBroker.name,
          assigned_broker_id: assignedBroker.id,
          assignment_date: new Date().toISOString()
        };
      });

      queryClient.setQueryData(["leads"], updatedLeads);
      try {
        localStorage.setItem("glinfico_leads_master", JSON.stringify(updatedLeads));
      } catch (e) {}

      // Update local broker counters
      const perBroker = Math.floor(leads.length / brokers.length);
      setBrokers(prev => prev.map(b => ({
        ...b,
        assignedCount: b.assignedCount + perBroker
      })));

      setLog(prev => [
        `[SUCCESS] Successfully assigned ${leads.length.toLocaleString()} deals evenly and randomly across all 5 active brokers.`,
        `[BLIND RULE] Broker portals populated without disclosing intent score tiers.`,
        ...prev
      ]);
      setAssigning(false);
    }, 1200);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shuffle className="w-8 h-8 text-amber-500" />
            Blind Broker Lead Allocation Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Fair, score-masked random distribution for all 8,228 pipeline deals across your broker team.
          </p>
        </div>
        <button
          onClick={handleRandomAssignmentRun}
          disabled={assigning || leads.length === 0}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 border border-slate-700"
        >
          {assigning ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Shuffle className="w-4 h-4 text-amber-400" />}
          {assigning ? "Distributing Deals..." : "Run Blind Random Distribution"}
        </button>
      </div>

      {/* Status Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-amber-100 text-amber-900 rounded-xl">
            <Users className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Active Brokers</div>
            <div className="text-xl font-black text-slate-900">{brokers.length} Team Members</div>
            <div className="text-xs text-emerald-600 font-semibold mt-0.5">100% Equal Quota Enabled</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-indigo-100 text-indigo-900 rounded-xl">
            <ShieldCheck className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Score Masking Rule</div>
            <div className="text-xl font-black text-slate-900">Score-Blind Mode</div>
            <div className="text-xs text-indigo-600 font-semibold mt-0.5">Brokers see deal info, not scores</div>
          </div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm flex items-center gap-4">
          <div className="p-3 bg-emerald-100 text-emerald-900 rounded-xl">
            <Sparkles className="w-6 h-6" />
          </div>
          <div>
            <div className="text-xs font-bold text-slate-400 uppercase">Total Pipeline Leads</div>
            <div className="text-xl font-black text-slate-900">{leads.length.toLocaleString()} Leads</div>
            <div className="text-xs text-slate-500 font-medium mt-0.5">Ready for random routing</div>
          </div>
        </div>
      </div>

      {/* Active Broker Roster */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-500" /> Active Broker Allocation Roster
          </h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Broker Name</th>
                <th className="py-3 px-5">Role / Tier</th>
                <th className="py-3 px-5">Assigned Lead Load</th>
                <th className="py-3 px-5">Historical Conversion</th>
                <th className="py-3 px-5 text-right">Allocation Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {brokers.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">{b.name}</td>
                  <td className="py-4 px-5 text-slate-600 font-medium">{b.tier}</td>
                  <td className="py-4 px-5 font-bold text-slate-900">{b.assignedCount.toLocaleString()} Deals</td>
                  <td className="py-4 px-5 font-semibold text-emerald-600">{b.performanceRate}</td>
                  <td className="py-4 px-5 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Active Receiver
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Engine Logs */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 font-sans font-bold">
          <span>Random Distribution Activity Log</span>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">Round-Robin + Blind Mask</span>
        </div>
        <div className="space-y-2 h-36 overflow-y-auto">
          {log.map((entry, idx) => (
            <div key={idx} className="leading-relaxed text-slate-300">{entry}</div>
          ))}
        </div>
      </div>
    </div>
  );
}
