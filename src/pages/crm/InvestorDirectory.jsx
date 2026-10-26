import React, { useState } from "react";
import { Landmark, Search, Upload, Download, CheckCircle, Shield, DollarSign, Mail, Phone, ArrowRight, Database } from "lucide-react";

const SAMPLE_INVESTORS = [
  { id: 1, name: "Vanguard Wealth Management", type: "Family Office", checkSize: "$1M - $10M", focus: "CRE & Tech", status: "Active Lead", rating: "A+", contact: "Michael Ross", email: "mross@vanguardwm.com" },
  { id: 2, name: "Horizon Equity Partners", type: "Angel Syndicate", checkSize: "$250K - $2M", focus: "Fintech & BaaS", status: "Verified LP", rating: "A", contact: "Elena Rostova", email: "elena@horizonequity.io" },
  { id: 3, name: "Blackstone Private Capital", type: "Institutional LP", checkSize: "$5M - $50M", focus: "Debt & Asset-Backed", status: "Active LP", rating: "A+", contact: "David Sterling", email: "d.sterling@blackstone-pc.com" },
  { id: 4, name: "Apex Global Growth", type: "High Net Worth", checkSize: "$500K - $3M", focus: "MCA & Direct Lending", status: "Prospect", rating: "B+", contact: "Sarah Jenkins", email: "sjenkins@apexgrowth.com" },
  { id: 5, name: "Summit Private Wealth", type: "Family Office", checkSize: "$2M - $15M", focus: "Real Estate & Mezzanine", status: "Active LP", rating: "A+", contact: "Arthur Pendelton", email: "arthur@summitpw.org" },
];

export default function InvestorDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [investorType, setInvestorType] = useState("All");

  return (
    <div className="p-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3">
            <Landmark className="w-8 h-8 text-amber-500" />
            Accredited Investor Database & LP Directory
          </h1>
          <p className="text-sm text-slate-500 mt-1">
            Manage high-net-worth LPs, family offices, and institutional capital partners.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2">
            <Database className="w-4 h-4 text-amber-600" />
            3,000 Accredited LP Contacts Indexed
          </div>
          <button className="bg-slate-900 hover:bg-slate-800 text-white px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 shadow-sm">
            <Download className="w-4 h-4" /> Export CSV
          </button>
        </div>
      </div>

      {/* Filter Bar */}
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96">
          <Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search 3,000 investors by name, strategy, or contact..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm focus:outline-none focus:border-amber-500 transition-colors"
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0">
          {["All", "Family Office", "Institutional LP", "Angel Syndicate", "High Net Worth"].map((type) => (
            <button
              key={type}
              onClick={() => setInvestorType(type)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                investorType === type ? "bg-amber-500 text-black shadow-sm" : "bg-slate-100 text-slate-600 hover:bg-slate-200"
              }`}
            >
              {type}
            </button>
          ))}
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="py-4 px-6">Investor / Entity</th>
                <th className="py-4 px-6">Category</th>
                <th className="py-4 px-6">Target Check Size</th>
                <th className="py-4 px-6">Asset Focus</th>
                <th className="py-4 px-6">Primary Contact</th>
                <th className="py-4 px-6 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-sm">
              {SAMPLE_INVESTORS.map((inv) => (
                <tr key={inv.id} className="hover:bg-slate-50/80 transition-colors">
                  <td className="py-4 px-6 font-semibold text-slate-900 flex items-center gap-3">
                    <div className="w-9 h-9 rounded-xl bg-slate-900 text-amber-400 font-bold flex items-center justify-center text-xs shadow-sm">
                      {inv.name.charAt(0)}
                    </div>
                    <div>
                      <div>{inv.name}</div>
                      <div className="text-xs text-emerald-600 font-medium">{inv.status}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6">
                    <span className="px-2.5 py-1 rounded-full text-xs font-medium bg-slate-100 text-slate-700">
                      {inv.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-slate-900 font-bold">{inv.checkSize}</td>
                  <td className="py-4 px-6 text-slate-600">{inv.focus}</td>
                  <td className="py-4 px-6 text-slate-600">
                    <div className="font-medium text-slate-900">{inv.contact}</div>
                    <div className="text-xs text-slate-400">{inv.email}</div>
                  </td>
                  <td className="py-4 px-6 text-right">
                    <button className="px-3 py-1.5 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ml-auto">
                      View Profile <ArrowRight className="w-3.5 h-3.5" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
          <span>Showing primary LP entries out of <strong>3,000 indexed investors</strong></span>
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
