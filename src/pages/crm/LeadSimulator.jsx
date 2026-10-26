import React, { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Play, Zap, Lock, DollarSign, CheckCircle2, ArrowRight, ShieldCheck, UserPlus, RefreshCw, AlertCircle } from "lucide-react";
import SubscriberUpgradeModal from "../../components/crm/SubscriberUpgradeModal";

export default function LeadSimulator() {
  const [selectedLeadId, setSelectedLeadId] = useState("ACE-1004");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [simulationLog, setSimulationLog] = useState([
    "[INIT] Lead Simulator initialized.",
    "[STATUS] Non-Subscriber test environment ready."
  ]);
  const [step, setStep] = useState(1);

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => {
      try {
        const cached = localStorage.getItem("glinfico_leads_master");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return [
        { id: "ACE-1004", company_name: "Apex Manufacturing LLC", requested_amount: "$1,100,000", score: 62, status: "Pending" },
        { id: "ACE-1005", company_name: "Meridian Retail Group", requested_amount: "$1,150,000", score: 55, status: "Pending" },
        { id: "ACE-1006", company_name: "Institutional Enterprise 18", requested_amount: "$450,000", score: 58, status: "Pending" },
      ];
    }
  });

  const selectedLead = leads.find(l => (l.id === selectedLeadId || l.company_name === selectedLeadId)) || leads[0] || {
    id: "ACE-1004",
    company_name: "Apex Manufacturing LLC",
    requested_amount: "$1,100,000",
    score: 62
  };

  const runSimulation = () => {
    setStep(2);
    setSimulationLog(prev => [
      `[STEP 1] Non-Subscriber submitting deal: "${selectedLead.company_name}" (${selectedLead.requested_amount})...`,
      `[ACE ENGINE] Evaluating AI Intent Score: ${selectedLead.score || 62}% (Threshold ≥ 50% PASSED).`,
      `[ACE DISPATCH] Generating automated term sheet and notifying 22,450 lender network...`,
      ...prev
    ]);

    setTimeout(() => {
      setStep(3);
      setSimulationLog(prev => [
        `[COMMISSION RULE] Non-subscriber submission detected. Gross fee calculated at 5%.`,
        `[HOUSE RETENTION] $55,000 commission assigned to House Account. Subscriber upgrade required to vest future 100% payouts.`,
        `[SIMULATION COMPLETE] Launching Subscriber Upgrade Modal...`,
        ...prev
      ]);
      setIsModalOpen(true);
    }, 1500);
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Play className="w-8 h-8 text-amber-500 fill-amber-500" />
            End-to-End Non-Subscriber & ACE Lifecycle Simulator
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Pick a lead from your 8,228 pipeline, run it through ACE as a non-subscriber, observe house retention, and test PayPal activation.
          </p>
        </div>
      </div>

      {/* Control Panel Card */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
          <Zap className="w-4 h-4 text-amber-500" /> Step 1: Select a Lead from Pipeline
        </h3>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1.5">Pick Pipeline Lead</label>
            <select
              value={selectedLeadId}
              onChange={(e) => setSelectedLeadId(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-3.5 py-2.5 text-xs font-bold text-slate-800 focus:outline-none"
            >
              {leads.map((l, idx) => (
                <option key={idx} value={l.id || l.company_name}>
                  {l.company_name} ({l.requested_amount || "$500,000"}) - Score: {l.score || 65}%
                </option>
              ))}
            </select>
          </div>

          <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs space-y-1">
            <div className="text-slate-400 font-semibold">Lead Details:</div>
            <div className="font-bold text-slate-900">{selectedLead.company_name}</div>
            <div className="text-slate-600">Funding Requested: <strong className="text-emerald-600">{selectedLead.requested_amount || "$1,100,000"}</strong></div>
          </div>

          <div className="flex items-end">
            <button
              onClick={runSimulation}
              disabled={step === 2}
              className="w-full bg-amber-500 hover:bg-amber-400 text-slate-950 font-black py-3 px-5 rounded-xl text-xs transition-all shadow-md flex items-center justify-center gap-2"
            >
              {step === 2 ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4 fill-slate-950" />}
              {step === 2 ? "Simulating ACE Closing..." : "Run Non-Subscriber Submission"}
            </button>
          </div>
        </div>
      </div>

      {/* Real-Time Event Log Stream */}
      <div className="bg-slate-900 text-slate-200 rounded-2xl p-6 border border-slate-800 shadow-sm font-mono text-xs space-y-3">
        <div className="flex items-center justify-between pb-3 border-b border-slate-800 text-slate-400 font-sans font-bold">
          <span className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-400" /> Lifecycle Simulation Execution Log
          </span>
          <span className="text-[10px] bg-amber-500/20 text-amber-400 px-2 py-0.5 rounded">ACE Threshold ≥ 50%</span>
        </div>
        <div className="space-y-2 h-44 overflow-y-auto">
          {simulationLog.map((entry, idx) => (
            <div key={idx} className="leading-relaxed text-slate-300">{entry}</div>
          ))}
        </div>
      </div>

      {/* Upgrade Modal Instance */}
      <SubscriberUpgradeModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        dealAmount={selectedLead.requested_amount || "$1,100,000"}
        estimatedCommission="$55,000"
      />
    </div>
  );
}
