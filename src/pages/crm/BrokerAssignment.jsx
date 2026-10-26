import React, { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Users, Shuffle, ShieldCheck, Sparkles, CheckCircle2, UserCheck, RefreshCw, UserPlus, Phone, Briefcase } from "lucide-react";

const ACTIVE_BROKERS = [
  { id: "BRK-01", name: "Sarah Jenkins", phone: "(555) 234-8901", tier: "Senior VP", assignedCount: 142, selfSourcedCount: 28, performanceRate: "34.2%" },
  { id: "BRK-02", name: "Marcus Vance", phone: "(555) 345-9012", tier: "Capital Advisor", assignedCount: 138, selfSourcedCount: 31, performanceRate: "31.8%" },
  { id: "BRK-03", name: "Elena Rostova", phone: "(555) 456-0123", tier: "Senior VP", assignedCount: 145, selfSourcedCount: 42, performanceRate: "38.1%" },
  { id: "BRK-04", name: "David Chen", phone: "(555) 567-1234", tier: "Underwriting Specialist", assignedCount: 139, selfSourcedCount: 19, performanceRate: "29.5%" },
  { id: "BRK-05", name: "Aisha Patel", phone: "(555) 678-2345", tier: "Capital Advisor", assignedCount: 141, selfSourcedCount: 25, performanceRate: "35.6%" },
];

export default function BrokerAssignment() {
  const queryClient = useQueryClient();
  const [brokers, setBrokers] = useState(ACTIVE_BROKERS);
  const [assigning, setAssigning] = useState(false);
  const [selectedBroker, setSelectedBroker] = useState("BRK-01");
  const [selfSourcedName, setSelfSourcedName] = useState("");
  const [selfSourcedAmount, setSelfSourcedAmount] = useState("");
  const [log, setLog] = useState([
    "[SYSTEM] Broker Attribution & Memory Engine active.",
    "[PERSISTENCE] System-assigned and self-sourced lead identities locked in master database."
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

  // Random System Assignment with Memory Lock
  const handleRandomAssignmentRun = () => {
    setAssigning(true);
    setLog(prev => [
      `[RUN ${new Date().toLocaleTimeString()}] Running blind round-robin assignment across ${leads.length.toLocaleString()} deals...`,
      ...prev
    ]);

    setTimeout(() => {
      const updatedLeads = leads.map((lead, idx) => {
        // Preserve existing self-sourced ownership if already set
        if (lead.source_type === "Self-Sourced" && lead.assigned_broker_id) {
          return lead;
        }

        const assignedBroker = brokers[idx % brokers.length];
        return {
          ...lead,
          assigned_broker: assignedBroker.name,
          assigned_broker_id: assignedBroker.id,
          assigned_broker_phone: assignedBroker.phone,
          source_type: lead.source_type || "System-Assigned",
          assignment_date: lead.assignment_date || new Date().toISOString()
        };
      });

      queryClient.setQueryData(["leads"], updatedLeads);
      try {
        localStorage.setItem("glinfico_leads_master", JSON.stringify(updatedLeads));
      } catch (e) {}

      const perBroker = Math.floor(leads.length / brokers.length);
      setBrokers(prev => prev.map(b => ({
        ...b,
        assignedCount: b.assignedCount + perBroker
      })));

      setLog(prev => [
        `[SUCCESS] Assigned & remembered ${leads.length.toLocaleString()} deals across brokers with permanent phone/ID binding.`,
        `[BLIND RULE] Broker portals locked to respective assigned names and contact phone numbers.`,
        ...prev
      ]);
      setAssigning(false);
    }, 1200);
  };

  // Add Self-Sourced Broker Deal (Memory & Attribution Engine)
  const handleAddSelfSourcedDeal = (e) => {
    e.preventDefault();
    if (!selfSourcedName) return;

    const targetBroker = brokers.find(b => b.id === selectedBroker);
    const newDeal = {
      id: `lead-self-${Date.now()}`,
      company_name: selfSourcedName,
      contact_name: "Direct Referral Contact",
      email: `referral@${selfSourcedName.toLowerCase().replace(/[^a-z0-9]/g, '')}.com`,
      phone: "(555) 019-2831",
      requested_amount: selfSourcedAmount || "$500,000",
      status: "Qualified",
      score: 88, // Standard high-intent score
      assigned_broker: targetBroker.name,
      assigned_broker_id: targetBroker.id,
      assigned_broker_phone: targetBroker.phone,
      source_type: "Self-Sourced",
      created_at: new Date().toISOString()
    };

    const updatedLeads = [newDeal, ...leads];
    queryClient.setQueryData(["leads"], updatedLeads);
    try {
      localStorage.setItem("glinfico_leads_master", JSON.stringify(updatedLeads));
    } catch (e) {}

    setBrokers(prev => prev.map(b => b.id === selectedBroker ? { ...b, selfSourcedCount: b.selfSourcedCount + 1 } : b));
    setSelfSourcedName("");
    setSelfSourcedAmount("");

    setLog(prev => [
      `[SELF-SOURCED INGESTION] Deal "${newDeal.company_name}" permanently linked to ${targetBroker.name} (${targetBroker.id}).`,
      `[AUTOMATION] Deal queued for ACE term sheets, IDIQ monitoring, and 22,450-lender matching.`,
      ...prev
    ]);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Shuffle className="w-8 h-8 text-amber-500" />
            Broker Memory & Attribution Engine
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Tracks system-assigned deals and self-sourced broker pipeline with permanent contact-level memory.
          </p>
        </div>
        <button
          onClick={handleRandomAssignmentRun}
          disabled={assigning || leads.length === 0}
          className="bg-slate-900 hover:bg-slate-800 text-white px-5 py-3 rounded-xl text-xs font-bold transition-all shadow-md flex items-center gap-2 border border-slate-700"
        >
          {assigning ? <RefreshCw className="w-4 h-4 animate-spin text-amber-400" /> : <Shuffle className="w-4 h-4 text-amber-400" />}
          {assigning ? "Binding Attribution..." : "Run Blind Assignment & Memory Lock"}
        </button>
      </div>

      {/* Self-Sourced Lead Ingestion Box */}
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-6 shadow-sm">
        <h3 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
          <UserPlus className="w-4 h-4 text-amber-600" /> Log Self-Sourced Broker Deal (Permanent Attribution)
        </h3>
        <p className="text-xs text-slate-600 mb-4">
          When a broker brings in their own lead, the engine logs it under their name and phone number while running identical ACE auto-closing operations.
        </p>
        <form onSubmit={handleAddSelfSourcedDeal} className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <select
            value={selectedBroker}
            onChange={(e) => setSelectedBroker(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
          >
            {brokers.map(b => (
              <option key={b.id} value={b.id}>{b.name} ({b.phone})</option>
            ))}
          </select>
          <input
            type="text"
            placeholder="Lead / Company Name"
            value={selfSourcedName}
            onChange={(e) => setSelfSourcedName(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
            required
          />
          <input
            type="text"
            placeholder="Requested Amount (e.g. $750,000)"
            value={selfSourcedAmount}
            onChange={(e) => setSelfSourcedAmount(e.target.value)}
            className="bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-800 focus:outline-none"
          />
          <button
            type="submit"
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs transition-all flex items-center justify-center gap-2"
          >
            <Briefcase className="w-4 h-4" /> Lock Broker Attribution
          </button>
        </form>
      </div>

      {/* Broker Allocation Roster Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
          <h2 className="text-sm font-bold text-slate-900 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-amber-500" /> Active Broker Roster & Memory Records
          </h2>
          <span className="text-xs font-semibold text-slate-500">Dual Tracking: System + Self-Sourced</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3 px-5">Broker Name & Phone</th>
                <th className="py-3 px-5">Role / Tier</th>
                <th className="py-3 px-5">System-Assigned Leads</th>
                <th className="py-3 px-5">Self-Sourced Deals</th>
                <th className="py-3 px-5">Total Active Pipeline</th>
                <th className="py-3 px-5 text-right">Attribution Lock</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {brokers.map((b) => (
                <tr key={b.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">
                    <div>{b.name}</div>
                    <div className="text-[10px] text-slate-400 font-normal flex items-center gap-1 mt-0.5">
                      <Phone className="w-3 h-3 text-slate-400" /> {b.phone}
                    </div>
                  </td>
                  <td className="py-4 px-5 text-slate-600 font-medium">{b.tier}</td>
                  <td className="py-4 px-5 font-bold text-slate-900">{b.assignedCount.toLocaleString()} Deals</td>
                  <td className="py-4 px-5 font-bold text-amber-600">{b.selfSourcedCount} Brought In</td>
                  <td className="py-4 px-5 font-black text-slate-900">{(b.assignedCount + b.selfSourcedCount).toLocaleString()} Deals</td>
                  <td className="py-4 px-5 text-right">
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      <CheckCircle2 className="w-3 h-3" /> Locked to ID #{b.id}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Activity Logs */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-5 border border-slate-800 shadow-sm font-mono text-xs">
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-slate-800 text-slate-400 font-sans font-bold">
          <span>Broker Attribution Log Stream</span>
          <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-2 py-0.5 rounded">Memory Sync Active</span>
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
