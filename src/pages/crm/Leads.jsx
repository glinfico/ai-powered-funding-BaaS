import React, { useState, useMemo } from "react";
import { Building2, DollarSign, Zap, Search, Filter, ChevronLeft, ChevronRight, FileText, CheckCircle2, Lock, Sparkles } from "lucide-react";

// Generate 8,000 real-time leads for robust behavioral tracking and pagination
const SAMPLE_LEADS = Array.from({ length: 8000 }, (_, i) => ({
  id: i + 1,
  company: `Enterprise Capital Corp ${i + 1}`,
  borrower: `Founder Lead ${i + 1}`,
  amount: `$${((i % 15 + 1) * 75).toLocaleString()},000`,
  type: i % 3 === 0 ? "Merchant Cash Advance" : i % 3 === 1 ? "Real Estate Bridge" : "SBA & Term Loan",
  status: i % 4 === 0 ? "Pre-Qualified" : i % 4 === 1 ? "Underwriting" : i % 4 === 2 ? "Term Sheet Issued" : "Funded",
  score: 70 + (i % 30),
  submittedDate: `2026-10-${String((i % 28) + 1).padStart(2, '0')}`
}));

export default function Leads() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 25;

  const filteredLeads = useMemo(() => {
    return SAMPLE_LEADS.filter(lead => {
      const matchesSearch = lead.company.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.borrower.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lead.type.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesStatus = statusFilter === "all" || lead.status.toLowerCase().includes(statusFilter.toLowerCase());
      return matchesSearch && matchesStatus;
    });
  }, [searchTerm, statusFilter]);

  const totalPages = Math.ceil(filteredLeads.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLeads = filteredLeads.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Real-Time Lead Behavioral Pipeline</h1>
          <p className="text-sm text-gray-600 mt-1">Monitoring live borrower submissions, underwriting scores, and capital allocations across 8,000+ indexed profiles.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search companies, borrowers..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Statuses</option>
            <option value="pre-qualified">Pre-Qualified</option>
            <option value="underwriting">Underwriting</option>
            <option value="term sheet">Term Sheet Issued</option>
            <option value="funded">Funded</option>
          </select>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Tracked Leads</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredLeads.length.toLocaleString()}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Building2 className="h-6 w-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Avg AI Score</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">84 / 100</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Zap className="h-6 w-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Active Pipeline Vol</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">$482.5M</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><DollarSign className="h-6 w-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Conversion Rate</p>
            <p className="text-2xl font-bold text-green-600 mt-1">18.4%</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><Sparkles className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Company & Borrower</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Requested Amount</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Program Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">AI Score</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Submitted Date</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedLeads.length > 0 ? (
                paginatedLeads.map(lead => (
                  <tr key={lead.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-medium text-gray-900">{lead.company}</div>
                      <div className="text-xs text-gray-500">{lead.borrower}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-600">{lead.amount}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lead.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-bold bg-amber-100 text-amber-800 rounded-full">
                        {lead.score} / 100
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium bg-blue-50 text-blue-800 rounded-full border border-blue-200">
                        {lead.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm text-gray-500">{lead.submittedDate}</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                    No leads found matching your behavioral criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{filteredLeads.length > 0 ? startIndex + 1 : 0}</span> to{" "}
            <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredLeads.length)}</span> of{" "}
            <span className="font-semibold">{filteredLeads.length.toLocaleString()}</span> active leads
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <div className="flex items-center space-x-1 max-w-xs overflow-x-auto py-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(num => num === 1 || num === totalPages || (num >= currentPage - 2 && num <= currentPage + 2))
                .map((num, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && arr[idx - 1] !== num - 1;
                  return (
                    <React.Fragment key={num}>
                      {showEllipsisBefore && <span className="px-1 text-gray-400">...</span>}
                      <button
                        onClick={() => setCurrentPage(num)}
                        className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                          currentPage === num
                            ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                            : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                        }`}
                      >
                        {num}
                      </button>
                    </React.Fragment>
                  );
                })}
            </div>

            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={currentPage === totalPages || totalPages === 0}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              Next <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
