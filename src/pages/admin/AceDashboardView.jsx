import React, { useState, useEffect } from 'react';
import { runAceBatchProcessing } from '../../lib/aceEngine.js';
import Pagination from '../../components/common/Pagination.jsx';
import { ShieldCheck, Zap, TrendingUp, Users, DollarSign, Database } from 'lucide-react';

export default function AceDashboardView() {
  const [aceData, setAceData] = useState(null);
  const [currentPage, setCurrentPage] = useState(1);
  const pageSize = 15;

  useEffect(() => {
    // Run ACE batch generation on load
    const results = runAceBatchProcessing(8000);
    // Generate full list of mock leads for table viewing
    const detailedLeads = [];
    for (let i = 1; i <= 8000; i++) {
      const seq = 100000 + i;
      let tier = i > 6000 ? 'E' : i > 4000 ? 'P' : i > 2000 ? 'G' : 'S';
      detailedLeads.push({
        id: i,
        aai: `${tier}-1126-N${seq}`,
        company: `Enterprise Capital Client #${i}`,
        score: Math.floor(Math.random() * 330) + 520,
        amount: Math.floor(Math.random() * 425000) + 25000,
        status: Math.random() > 0.3 ? 'APPROVED_MATCHED' : 'MANUAL_REVIEW'
      });
    }
    setAceData({ ...results, leads: detailedLeads });
  }, []);

  if (!aceData) {
    return (
      <div className="min-h-screen bg-slate-950 text-white flex items-center justify-center">
        <div className="flex items-center gap-3 text-cyan-400 font-mono text-lg animate-pulse">
          <Zap className="w-6 h-6 animate-spin" /> Igniting Autonomous Capital Engine (ACE)...
        </div>
      </div>
    );
  }

  const paginatedLeads = aceData.leads.slice((currentPage - 1) * pageSize, currentPage * pageSize);

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 p-6 md:p-10 font-sans">
      <div className="max-w-7xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6">
          <div>
            <div className="flex items-center gap-2 text-cyan-400 text-xs font-mono uppercase tracking-widest mb-1">
              <ShieldCheck className="w-4 h-4" /> ACE Intelligent Underwriting Desk • Live Telemetry
            </div>
            <h1 className="text-3xl font-bold tracking-tight text-white">Autonomous Capital Engine (ACE)</h1>
          </div>
          <div className="flex items-center gap-3">
            <span className="px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/30 rounded-xl text-emerald-400 font-mono text-xs font-semibold">
              Status: ACTIVE (8,000+ Indexed)
            </span>
          </div>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Processed Leads</span>
              <Users className="w-5 h-5 text-cyan-400" />
            </div>
            <div className="text-3xl font-bold text-white font-mono">8,000</div>
            <div className="text-xs text-emerald-400 mt-1 font-mono">100% AAI Synchronized</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Matched Deals</span>
              <TrendingUp className="w-5 h-5 text-emerald-400" />
            </div>
            <div className="text-3xl font-bold text-white font-mono">{aceData.matchedDeals.toLocaleString()}</div>
            <div className="text-xs text-slate-400 mt-1 font-mono">Institutional Desks Linked</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">Capital Underwritten</span>
              <DollarSign className="w-5 h-5 text-amber-400" />
            </div>
            <div className="text-3xl font-bold text-white font-mono">
              ${(aceData.totalVolumeUnderwritten / 1000000).toFixed(2)}M
            </div>
            <div className="text-xs text-amber-400 mt-1 font-mono">Nov 2026 Cohort Volume</div>
          </div>

          <div className="bg-slate-900 border border-slate-800 p-5 rounded-2xl">
            <div className="flex items-center justify-between text-slate-400 mb-2">
              <span className="text-xs font-mono uppercase">IDE Engine Standard</span>
              <Database className="w-5 h-5 text-purple-400" />
            </div>
            <div className="text-lg font-bold text-white font-mono">S / G / P / E Tiers</div>
            <div className="text-xs text-purple-400 mt-1 font-mono">Month Letter 'N' Active</div>
          </div>
        </div>

        {/* Paginated Leads Table */}
        <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-white">Live Indexed Borrower Lead Portfolio</h3>
            <span className="text-xs font-mono text-slate-400">Showing page {currentPage} of {Math.ceil(aceData.leads.length / pageSize)}</span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-slate-800 text-xs font-mono text-slate-400 uppercase">
                  <th className="py-3 px-4">Account Assigned ID (AAI)</th>
                  <th className="py-3 px-4">Borrower Entity</th>
                  <th className="py-3 px-4">Credit Score</th>
                  <th className="py-3 px-4">Requested Amount</th>
                  <th className="py-3 px-4">Underwriting Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/60 text-sm font-mono">
                {paginatedLeads.map((lead) => (
                  <tr key={lead.id} className="hover:bg-slate-800/40 transition-colors">
                    <td className="py-3 px-4 text-cyan-400 font-bold">{lead.aai}</td>
                    <td className="py-3 px-4 text-white font-sans">{lead.company}</td>
                    <td className="py-3 px-4 text-slate-300">{lead.score}</td>
                    <td className="py-3 px-4 text-emerald-400">${lead.amount.toLocaleString()}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2.5 py-1 rounded-full text-xs font-semibold ${
                        lead.status === 'APPROVED_MATCHED' 
                          ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20' 
                          : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                      }`}>
                        {lead.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Reusable Pagination Component */}
          <Pagination
            currentPage={currentPage}
            totalPages={Math.ceil(aceData.leads.length / pageSize)}
            onPageChange={(page) => setCurrentPage(page)}
            totalRecords={aceData.leads.length}
            pageSize={pageSize}
          />
        </div>

      </div>
    </div>
  );
}
