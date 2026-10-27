import React, { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { 
  Building2, DollarSign, Zap, Search, Filter, ChevronLeft, ChevronRight, 
  FileText, CheckCircle2, Lock, Sparkles, RefreshCw, AlertCircle, Eye, X
} from "lucide-react";

export default function Leads() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;
  const [selectedCCDLead, setSelectedCCDLead] = useState(null);

  // Master Lead Ingestion & Database Hydration
  const { data: leads = [], isLoading } = useQuery({
    queryKey: ["leads"],
    queryFn: () => {
      try {
        const cached = localStorage.getItem("glinfico_leads_master");
        if (cached) {
          const parsed = JSON.parse(cached);
          if (Array.isArray(parsed) && parsed.length > 0) return parsed;
        }
      } catch (e) {}

      // Default master seed generator if storage empty
      const defaultLeads = Array.from({ length: 1000 }, (_, i) => ({
        id: `ACE-${1000 + i}`,
        company_name: i % 3 === 0 ? `Apex Capital Group ${i+1}` : i % 3 === 1 ? `Meridian Logistics ${i+1}` : `Summit Manufacturing ${i+1}`,
        contact_name: `Executive Contact ${i+1}`,
        phone: `(555) 01${(i % 90) + 10}-99${(i % 90) + 10}`,
        email: `lead${i+1}@fundingpartner.com`,
        requested_amount: `$${((i % 20) * 50000 + 250000).toLocaleString()}`,
        score: (i * 7) % 55 + 45, // AI Intent Scores ranging 45% - 99%
        status: i % 4 === 0 ? "Auto-Closed & Unlocked" : i % 4 === 1 ? "In Underwriting" : i % 4 === 2 ? "Term Sheet Dispatched" : "Pending Evaluation",
        assigned_broker: i % 2 === 0 ? "Broker Desk A (Subscribed)" : "House Account (Unassigned)",
        broker_id: i % 2 === 0 ? "BRK-8821" : "HOUSE-001",
        credit_score: 650 + (i % 120),
        monthly_revenue: `$${((i % 15) * 25000 + 85000).toLocaleString()}`,
        ucc_filings: i % 5 === 0 ? "1 Active Filing" : "Clean / No Liens"
      }));

      try {
        localStorage.setItem("glinfico_leads_master", JSON.stringify(defaultLeads));
      } catch (e) {}
      return defaultLeads;
    }
  });

  // Filter Logic across full master list
  const filteredLeads = leads.filter((lead) => {
    const matchesSearch = 
      (lead.company_name && lead.company_name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.id && lead.id.toLowerCase().includes(searchTerm.toLowerCase())) ||
      (lead.contact_name && lead.contact_name.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "all" || lead.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // Pagination Calculation
  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const paginatedLeads = filteredLeads.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const handleFixScoresAndRecalc = () => {
    const isSubscribed = localStorage.getItem("glinfico_broker_subscribed") === "true";
    const repaired = leads.map(l => ({
      ...l,
      score: l.score < 50 ? l.score + 15 : l.score,
      status: (l.score >= 50) ? "Auto-Closed & Unlocked" : l.status,
      commission_routing: isSubscribed ? "100% Broker Payout" : "100% House Retention"
    }));

    queryClient.setQueryData(["leads"], repaired);
    try {
      localStorage.setItem("glinfico_leads_master", JSON.stringify(repaired));
    } catch (e) {}
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-6">
      {/* Top Header & Actions */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <Building2 className="w-7 h-7 text-amber-500" />
            Master Lead Database & Pipeline
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Displaying full active dataset ({leads.length.toLocaleString()} leads) with real-time ACE intent scoring.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleFixScoresAndRecalc}
            className="bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2.5 rounded-xl text-xs transition-all shadow-sm flex items-center gap-2"
          >
            <Sparkles className="w-4 h-4 fill-slate-950" /> Calc Amounts & Fix Low Scores
          </button>
        </div>
      </div>

      {/* Filter & Search Controls */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search company, ID, or contact name..."
            value={searchTerm}
            onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
            className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs font-semibold text-slate-800 focus:outline-none focus:ring-2 focus:ring-amber-500/20"
          />
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-bold text-slate-700 focus:outline-none"
          >
            <option value="all">All Pipeline Statuses</option>
            <option value="Auto-Closed & Unlocked">Auto-Closed & Unlocked</option>
            <option value="In Underwriting">In Underwriting</option>
            <option value="Term Sheet Dispatched">Term Sheet Dispatched</option>
            <option value="Pending Evaluation">Pending Evaluation</option>
          </select>
        </div>
      </div>

      {/* Master Leads Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-3.5 px-5">Lead ID / Company</th>
                <th className="py-3.5 px-5">Funding Request</th>
                <th className="py-3.5 px-5">AI Score</th>
                <th className="py-3.5 px-5">Status</th>
                <th className="py-3.5 px-5">Broker Attribution</th>
                <th className="py-3.5 px-5 text-right">Credit & Closing Doc (CCD)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {paginatedLeads.map((lead) => (
                <tr key={lead.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-5 font-bold text-slate-900">
                    <div className="text-amber-600 font-mono text-[10px]">{lead.id}</div>
                    <div>{lead.company_name}</div>
                    <div className="text-[11px] text-slate-400 font-normal">{lead.contact_name}</div>
                  </td>
                  <td className="py-4 px-5 font-bold text-emerald-600">{lead.requested_amount}</td>
                  <td className="py-4 px-5 font-bold">
                    <span className={`px-2 py-0.5 rounded text-[11px] ${
                      lead.score >= 50 ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"
                    }`}>
                      {lead.score}%
                    </span>
                  </td>
                  <td className="py-4 px-5 font-semibold text-slate-700">{lead.status}</td>
                  <td className="py-4 px-5 text-slate-600 font-medium">{lead.assigned_broker}</td>
                  <td className="py-4 px-5 text-right">
                    <button
                      onClick={() => setSelectedCCDLead(lead)}
                      className="bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-1.5 rounded-lg text-[11px] transition-all inline-flex items-center gap-1.5 shadow-sm"
                    >
                      <Eye className="w-3.5 h-3.5 text-amber-400" /> Open CCD
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between text-xs font-semibold text-slate-600">
          <div>
            Showing Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong> ({filteredLeads.length.toLocaleString()} total entries)
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages}
              className="p-2 bg-white border border-slate-200 rounded-lg hover:bg-slate-100 disabled:opacity-50"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Credit & Closing Document (CCD) Popup Modal */}
      {selectedCCDLead && (
        <div className="fixed inset-0 bg-slate-900/80 backdrop-blur-md z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-xl w-full p-6 relative shadow-2xl border border-slate-200">
            <button 
              onClick={() => setSelectedCCDLead(null)}
              className="absolute top-5 right-5 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-6">
              <div className="p-3 bg-amber-500/10 text-amber-600 rounded-2xl border border-amber-500/20">
                <FileText className="w-6 h-6" />
              </div>
              <div>
                <div className="text-xs font-extrabold uppercase tracking-wider text-amber-600">Credit & Closing Document (CCD)</div>
                <h2 className="text-lg font-black text-slate-900">{selectedCCDLead.company_name} ({selectedCCDLead.id})</h2>
              </div>
            </div>

            <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 space-y-3 text-xs mb-6 font-mono">
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Requested Amount:</span>
                <span className="font-bold text-emerald-600">{selectedCCDLead.requested_amount}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">AI Intent Score:</span>
                <span className="font-bold text-amber-600">{selectedCCDLead.score}% (Threshold ≥ 50%)</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Soft-Pull Credit Score:</span>
                <span className="font-bold text-slate-900">{selectedCCDLead.credit_score || "720 FICO"}</span>
              </div>
              <div className="flex justify-between border-b border-slate-200 pb-2">
                <span className="text-slate-500">Monthly Revenue:</span>
                <span className="font-bold text-slate-900">{selectedCCDLead.monthly_revenue || "$125,000/mo"}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-slate-500">UCC Lien Status:</span>
                <span className="font-bold text-slate-900">{selectedCCDLead.ucc_filings || "Clean"}</span>
              </div>
            </div>

            <button
              onClick={() => setSelectedCCDLead(null)}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl text-xs transition-all shadow-md"
            >
              Close Document View
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
