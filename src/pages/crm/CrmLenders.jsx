import React, { useState } from "react";
import { Building2, Search, Filter, ShieldCheck, ArrowRight, CheckCircle, Star, Database } from "lucide-react";

const INITIAL_LENDERS = [
  { id: 1, name: "Apex Capital Partners", type: "Debt Fund", minDeal: "$500K", maxDeal: "$25M", rate: "8.5% - 12%", status: "Active", rating: 4.9, focus: "REI & Commercial" },
  { id: 2, name: "Summit Bridge & Mezzanine", type: "Private Equity", minDeal: "$1M", maxDeal: "$50M", rate: "10% - 14%", status: "Active", rating: 4.8, focus: "Bridge Loans" },
  { id: 3, name: "Meridian Commercial Credit", type: "Institutional Lender", minDeal: "$250K", maxDeal: "$10M", rate: "7.2% - 9.8%", status: "Active", rating: 4.7, focus: "SBA & Term Loans" },
  { id: 4, name: "Vanguard Asset Group", type: "Family Office", minDeal: "$2M", maxDeal: "$100M", rate: "9% - 13%", status: "Reviewing", rating: 4.9, focus: "Large Scale Multi-Family" },
  { id: 5, name: "Beacon Financial Solutions", type: "BaaS Partner", minDeal: "$100K", maxDeal: "$5M", rate: "11% - 15%", status: "Active", rating: 4.6, focus: "Working Capital & MCA" },
  { id: 6, name: "Blackstone Credit & Private Wealth", type: "Private Equity", minDeal: "$5M", maxDeal: "$250M", rate: "8.0% - 11.5%", status: "Active", rating: 4.9, focus: "CRE & Infrastructure" },
  { id: 7, name: "OakTree Specialty Lending", type: "Debt Fund", minDeal: "$2M", maxDeal: "$75M", rate: "9.5% - 13.0%", status: "Active", rating: 4.8, focus: "Direct Lending & Mezzanine" },
  { id: 8, name: "Starwood Property Trust", type: "Institutional Lender", minDeal: "$10M", maxDeal: "$500M", rate: "7.8% - 10.5%", status: "Active", rating: 4.9, focus: "Commercial Mortgage REIT" },
];

export default function CrmLenders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterType, setFilterType] = useState("All");

  const filteredLenders = INITIAL_LENDERS.filter(lender => {
    const matchesSearch = lender.name.toLowerCase().includes(searchTerm.toLowerCase()) || lender.focus.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = filterType === "All" || lender.type === filterType;
    return matchesSearch && matchesType;
  });

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Building2 className="w-8 h-8 text-amber-500" />
            Lender Matching Engine & Network Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Real-time capital partner network, criteria matching, and syndication database.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            22,450 Active Institutional Lenders Indexed
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search 22,450+ lenders by name, strategy or focus..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 w-full md:w-auto overflow-x-auto pb-2 md:pb-0">
          {["All", "Debt Fund", "Private Equity", "Institutional Lender", "Family Office", "BaaS Partner"].map((type) => (
            <button
              key={type}
              onClick={() => setFilterType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                filterType === type
                  ? "bg-amber-500 text-black shadow-sm"
                  : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Lenders Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Capital Partner</th>
                <th className="py-4 px-6">Type</th>
                <th className="py-4 px-6">Min / Max Deal</th>
                <th className="py-4 px-6">Target Rate</th>
                <th className="py-4 px-6">Focus Area</th>
                <th className="py-4 px-6">Rating</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {filteredLenders.map((lender) => (
                <tr key={lender.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-sm shadow-sm">
                      {lender.name.charAt(0)}
                    </div>
                    <div>
                      <div>{lender.name}</div>
                      <div className="text-xs text-emerald-600 font-medium flex items-center gap-1 mt-0.5">
                        <CheckCircle className="w-3 h-3" /> {lender.status}
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {lender.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-600 font-medium">
                    {lender.minDeal} - {lender.maxDeal}
                  </td>
                  <td className="py-4 px-6 text-slate-900 font-bold">
                    {lender.rate}
                  </td>
                  <td className="py-4 px-6 text-slate-600">
                    {lender.focus}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-1 text-amber-500 font-bold">
                      <Star className="w-4 h-4 fill-amber-400 text-amber-400" />
                      {lender.rating}
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1.5 ml-auto">
                      Match Deal <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing primary matched entries out of <strong>22,450 indexed lenders</strong></span>
          <div className="flex gap-2">
            <button className="px-3 py-1 bg-white border rounded text-slate-700 font-medium hover:bg-slate-100">Previous</button>
            <button className="px-3 py-1 bg-amber-500 text-black font-semibold rounded shadow-sm">1</button>
            <button className="px-3 py-1 bg-white border rounded text-slate-700 font-medium hover:bg-slate-100">2</button>
            <button className="px-3 py-1 bg-white border rounded text-slate-700 font-medium hover:bg-slate-100">3</button>
            <button className="px-3 py-1 bg-white border rounded text-slate-700 font-medium hover:bg-slate-100">Next</button>
          </div>
        </div>
      </div>
    </div>
  );
}
