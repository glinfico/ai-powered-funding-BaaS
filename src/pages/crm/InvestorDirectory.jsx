import React, { useState } from "react";
import { Landmark, Search, Upload, Download, CheckCircle, Shield, DollarSign, Mail, Phone, ArrowRight, Database, ChevronLeft, ChevronRight } from "lucide-react";

const SAMPLE_INVESTORS = Array.from({ length: 75 }, (_, i) => ({
  id: i + 1,
  name: `Vanguard Wealth Partner ${i + 1}`,
  type: i % 2 === 0 ? "Family Office" : "Angel Syndicate",
  checkSize: `$${(i % 5 + 1) * 500}K - $${(i % 5 + 2) * 2}M`,
  focus: i % 3 === 0 ? "CRE & Tech" : "Fintech & BaaS",
  status: i % 4 === 0 ? "Verified LP" : "Active Lead",
  rating: i % 2 === 0 ? "A+" : "A",
  contact: `Representative ${i + 1}`,
  email: `lp${i + 1}@vanguardwealth.com`
}));

export default function InvestorDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 15;

  const filteredInvestors = SAMPLE_INVESTORS.filter(inv => 
    inv.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.type.toLowerCase().includes(searchTerm.toLowerCase()) ||
    inv.focus.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const totalPages = Math.ceil(filteredInvestors.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedInvestors = filteredInvestors.slice(startIndex, startIndex + itemsPerPage);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Institutional Investor Directory</h1>
          <p className="text-sm text-gray-600 mt-1">Manage LP syndicates, family offices, and venture capital partners.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-72">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search investors..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Investor Name</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Type</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check Size</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Focus</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Contact</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedInvestors.length > 0 ? (
                paginatedInvestors.map(inv => (
                  <tr key={inv.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{inv.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.type}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-600">{inv.checkSize}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.focus}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium bg-amber-50 text-amber-800 rounded-full border border-amber-200">
                        {inv.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{inv.contact} ({inv.email})</td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                    No investors found matching your search criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{filteredInvestors.length > 0 ? startIndex + 1 : 0}</span> to{" "}
            <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredInvestors.length)}</span> of{" "}
            <span className="font-semibold">{filteredInvestors.length}</span> indexed investors (out of <span className="font-semibold">3,000</span> total LP network)
          </div>

          <div className="flex items-center space-x-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-1"
            >
              <ChevronLeft className="h-4 w-4" /> Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map(num => (
                <button
                  key={num}
                  onClick={() => setCurrentPage(num)}
                  className={`px-3 py-1.5 text-xs font-semibold rounded-md border ${
                    currentPage === num
                      ? "bg-amber-600 text-white border-amber-600 shadow-sm"
                      : "bg-white text-gray-700 border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  {num}
                </button>
              ))}
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
