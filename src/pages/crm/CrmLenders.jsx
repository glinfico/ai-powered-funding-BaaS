import React, { useCallback, useEffect, useState } from "react";
import { Building2, Search, ArrowRight, Database, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 50;
const value = (...items) => items.find(item => item !== undefined && item !== null && item !== "") ?? "—";

export default function CrmLenders() {
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [lenders, setLenders] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (sessionError || !token) throw new Error("Your session has expired. Please sign in again.");
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      const response = await fetch(`/api/lenders?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load lenders.");
      setLenders(Array.isArray(payload.lenders) ? payload.lenders : []);
      setTotal(Number(payload.total) || 0);
    } catch (e) { setLenders([]); setTotal(0); setError(e.message || "Could not load lenders."); }
    finally { setLoading(false); }
  }, [page, searchTerm]);

  useEffect(() => { load(); }, [load]);
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Building2 className="w-8 h-8 text-amber-500" />Lender Matching Engine & Network Directory</h1><p className="text-sm text-slate-500 mt-1">Lender records from the existing Lenders table. Funding Institutions remains a separate Smart Router source.</p></div>
        <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"><Database className="w-4 h-4" />{total.toLocaleString()} database records</div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6"><div className="relative w-full md:w-[32rem]"><Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" /><input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Search lenders by name…" className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div></div>
      {error && <div role="alert" className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}<button onClick={load} className="ml-auto underline">Retry</button></div>}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden"><div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-500 uppercase tracking-wider"><th className="py-4 px-6">Capital Partner</th><th className="py-4 px-6">Type</th><th className="py-4 px-6">Min / Max Deal</th><th className="py-4 px-6">Target Rate</th><th className="py-4 px-6">Focus Area</th><th className="py-4 px-6">Status</th></tr></thead>
      <tbody className="divide-y divide-slate-100 text-sm">
        {loading && <tr><td colSpan="6" className="p-8 text-center text-slate-500"><RefreshCw className="inline w-4 h-4 animate-spin mr-2" />Loading database records…</td></tr>}
        {!loading && !error && lenders.map((lender, index) => {
          const name = value(lender.name, lender.lender_name, lender.institution_name, lender.company_name);
          const type = value(lender.type, lender.lender_type, lender.institution_type, lender.category);
          const min = value(lender.min_deal, lender.minimum_deal, lender.min_amount, lender.min_loan_amount);
          const max = value(lender.max_deal, lender.maximum_deal, lender.max_amount, lender.max_loan_amount);
          const rate = value(lender.target_rate, lender.rate, lender.rate_range, lender.apr_range);
          const focus = value(lender.focus, lender.focus_area, lender.strategy, lender.product_types);
          const status = value(lender.status, lender.subscription_status, lender.active === true ? "Active" : null);
          return <tr key={lender.id || lender.uuid || `${page}-${index}`} className="hover:bg-slate-50"><td className="py-4 px-6 font-semibold text-slate-900">{name}<div className="text-xs text-slate-400">{value(lender.email, lender.website) === "—" ? "" : value(lender.email, lender.website)}</div></td><td className="py-4 px-6">{type}</td><td className="py-4 px-6">{min} / {max}</td><td className="py-4 px-6">{rate}</td><td className="py-4 px-6">{focus}</td><td className="py-4 px-6">{status}</td></tr>;
        })}
        {!loading && !error && lenders.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-slate-500">No lender records found for this search.</td></tr>}
      </tbody></table></div>
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-600 flex flex-col sm:flex-row gap-3 justify-between items-center"><span>Showing {total ? ((page - 1) * PAGE_SIZE + 1).toLocaleString() : 0}–{Math.min(page * PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()} records · Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 bg-white border rounded-lg disabled:opacity-40 flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Previous</button><button disabled={page >= pages || loading} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-2 bg-white border rounded-lg disabled:opacity-40 flex items-center gap-1">Next<ChevronRight className="w-4 h-4" /></button></div></div></div>
    </div>
  );
}
