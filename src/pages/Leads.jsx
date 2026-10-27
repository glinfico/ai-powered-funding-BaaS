import { useState, useMemo, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Plus, Search, LayoutGrid, List, X, Download, Upload, Calculator, Sparkles, RefreshCw } from "lucide-react";
import LeadBulkUpload from "@/components/crm/LeadBulkUpload";
import { supabase } from "@/lib/supabase";

export default function Leads() {
  const queryClient = useQueryClient();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loanTypeFilter, setLoanTypeFilter] = useState("all");
  const [showUploadModal, setShowUploadModal] = useState(false);

  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 100;

  // Load every real database page; never substitute generated sample records.
  const { data: leadResult = { leads: [], total: 0 }, isLoading, error } = useQuery({
    queryKey: ["leads"],
    queryFn: async () => {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (sessionError || !token) throw new Error("Your secure session is unavailable. Please sign in again.");

      const fetchPage = async (page) => {
        const response = await fetch(`/api/leads?limit=500&page=${page}`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        if (!response.ok) throw new Error(`Could not load database leads (HTTP ${response.status}).`);
        return response.json();
      };

      const first = await fetchPage(1);
      const allLeads = Array.isArray(first.leads) ? [...first.leads] : [];
      const total = Number(first.total) || allLeads.length;
      const pages = Math.ceil(total / 500);
      for (let page = 2; page <= pages; page += 1) {
        const result = await fetchPage(page);
        allLeads.push(...(Array.isArray(result.leads) ? result.leads : []));
      }
      return { leads: allLeads, total };
    },
    staleTime: 30000,
  });
  const leads = leadResult.leads;

  const refreshLeads = () => queryClient.invalidateQueries({ queryKey: ["leads"] });

  const filteredLeads = useMemo(() => {
    return leads.filter(lead => {
      const matchesSearch = 
        (lead.company_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.contact_name || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
        (lead.email || "").toLowerCase().includes(searchTerm.toLowerCase());
      
      const matchesStatus = statusFilter === "all" || (lead.status || "").toLowerCase() === statusFilter.toLowerCase();
      const matchesLoan = loanTypeFilter === "all" || (lead.loan_type || "").toLowerCase().includes(loanTypeFilter.toLowerCase());

      return matchesSearch && matchesStatus && matchesLoan;
    });
  }, [leads, searchTerm, statusFilter, loanTypeFilter]);

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Sparkles className="w-8 h-8 text-amber-500" />
            Leads Command Center & Pipeline ({leadResult.total.toLocaleString()} Database Records)
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Institutional capital leads, automated lender matching, and high-intent scoring.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={refreshLeads}
            className="bg-amber-500 hover:bg-amber-400 text-black px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <RefreshCw className="w-4 h-4" /> Refresh Database Leads
          </button>
          <button
            onClick={() => setShowUploadModal(true)}
            className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2.5 rounded-xl text-xs font-bold transition-all shadow-sm flex items-center gap-2"
          >
            <Upload className="w-4 h-4" /> Bulk Import
          </button>
        </div>
      </div>

      {/* Upload Modal Overlay */}
      {showUploadModal && (
        <div className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-3xl max-w-lg w-full p-6 relative shadow-2xl">
            <button onClick={() => setShowUploadModal(false)} className="absolute top-4 right-4 text-slate-400 hover:text-slate-600">
              <X className="w-5 h-5" />
            </button>
            <LeadBulkUpload onClose={() => setShowUploadModal(false)} onUploadSuccess={() => setShowUploadModal(false)} />
          </div>
        </div>
      )}

      {/* Filters & Search */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search leads by company, contact, or email..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Statuses</option>
            <option value="qualified">Qualified</option>
            <option value="underwriting">Underwriting</option>
            <option value="new inquiry">New Inquiry</option>
          </select>
          <select
            value={loanTypeFilter}
            onChange={(e) => setLoanTypeFilter(e.target.value)}
            className="bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs font-semibold text-slate-700 focus:outline-none"
          >
            <option value="all">All Loan Types</option>
            <option value="term loan">Term Loan / MCA</option>
            <option value="asset-backed">Asset-Backed Line</option>
          </select>
        </div>
      </div>

      {/* Leads Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto max-h-[600px] overflow-y-auto">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider z-10">
              <tr>
                <th className="py-4 px-6">Company / Lead</th>
                <th className="py-4 px-6">Contact Person</th>
                <th className="py-4 px-6">Contact Info</th>
                <th className="py-4 px-6">Requested Funding</th>
                <th className="py-4 px-6">AI Intent Score</th>
                <th className="py-4 px-6">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLeads.slice((currentPage - 1) * PAGE_SIZE, currentPage * PAGE_SIZE).map((lead, idx) => (
                <tr key={lead.id || idx} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-sm">
                        {(lead.company_name || "L").charAt(0)}
                      </div>
                      <div>
                        <div>{lead.company_name}</div>
                        <div className="text-xs text-slate-400 font-normal">ID: {String(lead.id || "").slice(0, 12)}</div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-slate-700 font-medium">
                    {lead.contact_name}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    <div className="text-xs">{lead.email}</div>
                    <div className="text-xs text-slate-400 mt-0.5">{lead.phone}</div>
                  </td>
                  <td className="py-4 px-6 text-slate-900 font-bold">
                    {lead.requested_amount || "—"}
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                      {lead.score == null ? "Not scored" : `⭐ ${lead.score} / 100`}
                    </span>
                  </td>
                  <td className="py-4 px-6">
                    <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                      lead.status === 'Qualified' ? 'bg-emerald-100 text-emerald-800' :
                      lead.status === 'Underwriting' ? 'bg-purple-100 text-purple-800' :
                      'bg-amber-100 text-amber-800'
                    }`}>
                      {lead.status || "Qualified"}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors">
                      Review
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col md:flex-row gap-3 justify-between items-center">
          <span>
            {isLoading ? "Loading database records…" : error ? "Database leads could not be loaded." : `Showing ${filteredLeads.length ? (currentPage - 1) * PAGE_SIZE + 1 : 0}–${Math.min(currentPage * PAGE_SIZE, filteredLeads.length)} of ${filteredLeads.length.toLocaleString()} filtered leads · ${leadResult.total.toLocaleString()} total database records`}
          </span>
          <div className="flex items-center gap-3">
            <button disabled={currentPage <= 1} onClick={() => setCurrentPage(p => Math.max(1, p - 1))} className="px-3 py-2 rounded-lg border disabled:opacity-40">Previous</button>
            <span>Page {currentPage} of {Math.max(1, Math.ceil(filteredLeads.length / PAGE_SIZE))}</span>
            <button disabled={currentPage >= Math.ceil(filteredLeads.length / PAGE_SIZE)} onClick={() => setCurrentPage(p => p + 1)} className="px-3 py-2 rounded-lg border disabled:opacity-40">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
