import React, { useState } from "react";
import { MessageSquare, Send, CheckCircle2, Archive, Search, ShieldCheck, Sparkles, RefreshCw, Hash, FileText } from "lucide-react";

export default function AiCommsVault() {
  const [activeMessage, setActiveMessage] = useState(
    "Reviewing funding criteria for Apex Manufacturing LLC ($1,100,000 requested). AI matching engine is synchronizing with institutional lenders across the 22,450 network."
  );
  const [recipient, setRecipient] = useState("Apex Manufacturing LLC (Lead #ACE-1004)");
  
  // Archived vault records stored in state / localStorage
  const [vaultRecords, setVaultRecords] = useState([
    {
      refNo: "COMM-90142",
      recipient: "Summit Energy Group",
      summary: "Term sheet dispatched and verified under 50% intent score threshold.",
      timestamp: "2026-10-27 08:15 AM",
      status: "Archived & Verified"
    },
    {
      refNo: "COMM-88320",
      recipient: "Meridian Retail Group",
      summary: "IDIQ soft-pull credit alert processed. Clean UCC status confirmed.",
      timestamp: "2026-10-27 07:42 AM",
      status: "Archived & Verified"
    }
  ]);

  const [searchTerm, setSearchTerm] = useState("");

  const handleCompleteAndArchive = () => {
    if (!activeMessage.trim()) return;

    const randomRef = `COMM-${Math.floor(10000 + Math.random() * 90000)}`;
    const newRecord = {
      refNo: randomRef,
      recipient: recipient,
      summary: activeMessage,
      timestamp: new Date().toLocaleString(),
      status: "Archived & Verified"
    };

    const updatedVault = [newRecord, ...vaultRecords];
    setVaultRecords(updatedVault);

    // Reset active screen for the next communication
    setActiveMessage("");
    setRecipient("Select or enter next active lead / recipient...");
  };

  const filteredVault = vaultRecords.filter(rec => 
    rec.refNo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.recipient.toLowerCase().includes(searchTerm.toLowerCase()) ||
    rec.summary.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
          <MessageSquare className="w-7 h-7 text-amber-500" />
          AI Communications & Reference Vault
        </h1>
        <p className="text-xs text-slate-500 mt-1">
          Single active communication workspace. Completed comms automatically archive into a reference-numbered vault.
        </p>
      </div>

      {/* Single Active Screen Workspace */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex items-center justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-2">
            <div className="w-3 h-3 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-xs font-black uppercase tracking-wider text-slate-900">Active Communication Workspace</span>
          </div>
          <span className="text-[10px] font-mono bg-amber-500/10 text-amber-600 px-2.5 py-1 rounded-full font-bold">
            1 Active Screen Limit Enforced
          </span>
        </div>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">Active Recipient / Deal</label>
            <input
              type="text"
              value={recipient}
              onChange={(e) => setRecipient(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl px-4 py-2.5 text-xs font-bold text-slate-900 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div>
            <label className="text-xs font-semibold text-slate-500 block mb-1">AI Transmission / Message Script</label>
            <textarea
              rows={4}
              value={activeMessage}
              onChange={(e) => setActiveMessage(e.target.value)}
              placeholder="Type or generate active communication..."
              className="w-full bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs font-medium text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
            />
          </div>

          <div className="flex justify-end pt-2">
            <button
              onClick={handleCompleteAndArchive}
              disabled={!activeMessage.trim()}
              className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-black px-6 py-3 rounded-xl text-xs transition-all shadow-md flex items-center gap-2 disabled:opacity-50"
            >
              <Archive className="w-4 h-4" /> Complete & Archive to Vault
            </button>
          </div>
        </div>
      </div>

      {/* Searchable Vault Section */}
      <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-sm space-y-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <h2 className="text-sm font-black text-slate-900 flex items-center gap-2">
            <FileText className="w-4 h-4 text-amber-500" /> Completed Communications Archive Vault
          </h2>
          <div className="relative w-full md:w-80">
            <Search className="w-4 h-4 absolute left-3.5 top-2.5 text-slate-400" />
            <input
              type="text"
              placeholder="Search ref #, recipient, or summary..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3 px-4">Reference Number</th>
                <th className="py-3 px-4">Recipient</th>
                <th className="py-3 px-4">Communication Summary</th>
                <th className="py-3 px-4">Timestamp</th>
                <th className="py-3 px-4 text-right">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {filteredVault.map((record, idx) => (
                <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-3.5 px-4 font-mono font-bold text-amber-600">{record.refNo}</td>
                  <td className="py-3.5 px-4 font-bold text-slate-900">{record.recipient}</td>
                  <td className="py-3.5 px-4 text-slate-600 max-w-md truncate">{record.summary}</td>
                  <td className="py-3.5 px-4 text-slate-400 text-[11px]">{record.timestamp}</td>
                  <td className="py-3.5 px-4 text-right">
                    <span className="px-2.5 py-1 rounded-full text-[10px] font-bold bg-emerald-100 text-emerald-800">
                      {record.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
