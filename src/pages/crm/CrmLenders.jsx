import React, { useState, useMemo } from "react";
import { Building2, Search, ChevronLeft, ChevronRight, DollarSign, ShieldCheck } from "lucide-react";

const SAMPLE_LENDERS = Array.from({ length: 60 }, (_, i) => ({
  id: i + 1,
  name: `Global Capital Partner ${i + 1}`,
  category: i % 3 === 0 ? "Merchant Cash Advance" : i % 3 === 1 ? "Real Estate Bridge" : "SBA & Term Loan",
  minCheck: `$${(i % 4 + 1) * 50}K`,
  maxCheck: `$${(i % 5 + 2) * 500}K`,
  rate: `${8 + (i % 5)}% - ${12 + (i % 5)}%`,
  status: i % 7 === 0 ? "Under Review" : "Active & Funding",
  totalVolume: (i + 1) * 1250000
}));

export default function CrmLenders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("all");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  const filteredLenders = useMemo(() => {
    return SAMPLE_LENDERS.filter(lender => {
      const matchesSearch = lender.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                            lender.category.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesCategory = categoryFilter === "all" || lender.category.toLowerCase().includes(categoryFilter.toLowerCase());
      return matchesSearch && matchesCategory;
    });
  }, [searchTerm, categoryFilter]);

  const totalPages = Math.ceil(filteredLenders.length / itemsPerPage) || 1;
  const startIndex = (currentPage - 1) * itemsPerPage;
  const paginatedLenders = filteredLenders.slice(startIndex, startIndex + itemsPerPage);

  const totalVolumeSum = filteredLenders.reduce((acc, l) => acc + l.totalVolume, 0);

  return (
    <div className="p-6 max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-6 rounded-xl border border-gray-200 shadow-sm">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">CRM Lender Network Directory</h1>
          <p className="text-sm text-gray-600 mt-1">Explore active lending institutions, credit facilities, and capital partners.</p>
        </div>
        <div className="flex items-center gap-3 w-full md:w-auto">
          <div className="relative flex-1 md:w-64">
            <Search className="absolute left-3 top-2.5 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search lenders..."
              value={searchTerm}
              onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
              className="pl-9 pr-4 py-2 w-full border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setCurrentPage(1); }}
            className="py-2 px-3 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-amber-500"
          >
            <option value="all">All Categories</option>
            <option value="merchant">Merchant Cash Advance</option>
            <option value="real estate">Real Estate Bridge</option>
            <option value="sba">SBA & Term Loan</option>
          </select>
        </div>
      </div>

      {/* Stats Summary Bar */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Total Active Lenders</p>
            <p className="text-2xl font-bold text-gray-900 mt-1">{filteredLenders.length}</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><Building2 className="h-6 w-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Indexed Network Volume</p>
            <p className="text-2xl font-bold text-amber-600 mt-1">${(totalVolumeSum / 1000000).toFixed(1)}M</p>
          </div>
          <div className="p-3 bg-amber-50 text-amber-600 rounded-xl"><DollarSign className="h-6 w-6" /></div>
        </div>
        <div className="bg-white p-5 rounded-xl border border-gray-200 shadow-sm flex items-center justify-between">
          <div>
            <p className="text-xs font-medium text-gray-500 uppercase">Verification Status</p>
            <p className="text-2xl font-bold text-green-600 mt-1">100% Verified</p>
          </div>
          <div className="p-3 bg-green-50 text-green-600 rounded-xl"><ShieldCheck className="h-6 w-6" /></div>
        </div>
      </div>

      {/* Table & Pagination Container */}
      <div className="bg-white rounded-xl border border-gray-200 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Lender Institution</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Category</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Check Range</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Target Yield / Rate</th>
                <th className="px-6 py-3 text-left text-xs font-semibold text-gray-500 uppercase">Status</th>
                <th className="px-6 py-3 text-right text-xs font-semibold text-gray-500 uppercase">Total Volume</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              {paginatedLenders.length > 0 ? (
                paginatedLenders.map(lender => (
                  <tr key={lender.id} className="hover:bg-gray-50 transition">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">{lender.name}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lender.category}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-semibold text-amber-600">{lender.minCheck} - {lender.maxCheck}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">{lender.rate}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2.5 py-1 text-xs font-medium bg-green-50 text-green-800 rounded-full border border-green-200">
                        {lender.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-semibold text-gray-900">
                      ${lender.totalVolume.toLocaleString()}
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center text-sm text-gray-500">
                    No lenders found matching your filter criteria.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex flex-col sm:flex-row justify-between items-center gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-semibold">{filteredLenders.length > 0 ? startIndex + 1 : 0}</span> to{" "}
            <span className="font-semibold">{Math.min(startIndex + itemsPerPage, filteredLenders.length)}</span> of{" "}
            <span className="font-semibold">{filteredLenders.length}</span> total lenders
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
