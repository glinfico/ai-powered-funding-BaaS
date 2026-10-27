import React, { useCallback, useEffect, useState } from "react";
import { Landmark, Search, Download, ArrowRight, Database, ChevronLeft, ChevronRight, AlertCircle, RefreshCw } from "lucide-react";
import { supabase } from "@/lib/supabase";

const PAGE_SIZE = 50;
const csvCell = (value) => '"' + String(value ?? '').replace(/"/g, '""') + '"';

export default function InvestorDirectory() {
  const [searchTerm, setSearchTerm] = useState("");
  const [investorType, setInvestorType] = useState("All");
  const [page, setPage] = useState(1);
  const [rows, setRows] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
      const token = sessionData?.session?.access_token;
      if (sessionError || !token) throw new Error("Your session has expired. Please sign in again.");
      const params = new URLSearchParams({ page: String(page), limit: String(PAGE_SIZE) });
      if (searchTerm.trim()) params.set("search", searchTerm.trim());
      if (investorType !== "All") params.set("type", investorType);
      const response = await fetch(`/api/investors?${params}`, { headers: { Authorization: `Bearer ${token}` } });
      const payload = await response.json();
      if (!response.ok) throw new Error(payload.error || "Could not load investors.");
      setRows(Array.isArray(payload.investors) ? payload.investors : []);
      setTotal(Number(payload.total) || 0);
    } catch (e) {
      setRows([]);
      setTotal(0);
      setError(e.message || "Could not load investors.");
    } finally {
      setLoading(false);
    }
  }, [page, searchTerm, investorType]);

  useEffect(() => { load(); }, [load]);

  const exportPage = () => {
    const columns = ["name", "investor_type", "check_size_min", "check_size_max", "asset_focus", "contact_name", "email", "phone", "status", "rating"];
    const csv = [columns.join(","), ...rows.map(row => columns.map(key => csvCell(row[key])).join(","))].join("\n");
    const url = URL.createObjectURL(new Blob([csv], { type: "text/csv;charset=utf-8;" }));
    const a = document.createElement("a"); a.href = url; a.download = `glinfico-investors-page-${page}.csv`; a.click(); URL.revokeObjectURL(url);
  };
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  return (
    <div className="p-8 max-w-7xl mx-auto">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8 gap-4">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Landmark className="w-8 h-8 text-amber-500" />Accredited Investor Database & LP Directory</h1><p className="text-sm text-slate-500 mt-1">Investor records loaded from the secured GLINFICO database.</p></div>
        <div className="flex items-center gap-3">
          <div className="bg-amber-500/10 border border-amber-500/30 text-amber-700 px-4 py-2 rounded-xl text-xs font-semibold flex items-center gap-2"><Database className="w-4 h-4" />{total.toLocaleString()} database records</div>
          <button onClick={exportPage} disabled={!rows.length} className="bg-slate-900 disabled:opacity-40 text-white px-4 py-2 rounded-xl text-xs font-bold flex items-center gap-2"><Download className="w-4 h-4" />Export current page</button>
        </div>
      </div>
      <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-200 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between">
        <div className="relative w-full md:w-96"><Search className="absolute left-3.5 top-3 w-4 h-4 text-slate-400" /><input value={searchTerm} onChange={e => { setSearchTerm(e.target.value); setPage(1); }} placeholder="Search name, focus, contact or email..." className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm" /></div>
        <select value={investorType} onChange={e => { setInvestorType(e.target.value); setPage(1); }} className="w-full md:w-auto px-3 py-2 border border-slate-200 rounded-xl text-sm bg-white"><option>All</option><option>Family Office</option><option>Institutional LP</option><option>Angel Syndicate</option><option>High Net Worth</option></select>
      </div>
      {error && <div role="alert" className="mb-5 p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4" />{error}<button onClick={load} className="ml-auto underline">Retry</button></div>}
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 overflow-hidden">
        <div className="overflow-x-auto"><table className="w-full text-left border-collapse"><thead><tr className="bg-slate-50 border-b text-xs font-bold text-slate-500 uppercase"><th className="py-4 px-6">Investor / Entity</th><th className="py-4 px-6">Category</th><th className="py-4 px-6">Target Check Size</th><th className="py-4 px-6">Asset Focus</th><th className="py-4 px-6">Primary Contact</th><th className="py-4 px-6">Status</th></tr></thead>
        <tbody className="divide-y divide-slate-100 text-sm">
          {loading && <tr><td colSpan="6" className="p-8 text-center text-slate-500"><RefreshCw className="inline w-4 h-4 animate-spin mr-2" />Loading database records…</td></tr>}
          {!loading && !error && rows.map((inv) => <tr key={inv.id} className="hover:bg-slate-50"><td className="py-4 px-6 font-semibold text-slate-900">{inv.name || inv.company_name || "Unnamed investor"}</td><td className="py-4 px-6">{inv.investor_type || "—"}</td><td className="py-4 px-6">{inv.check_size_min != null || inv.check_size_max != null ? `${inv.check_size_min ?? "—"} – ${inv.check_size_max ?? "—"}` : "—"}</td><td className="py-4 px-6">{inv.asset_focus || "—"}</td><td className="py-4 px-6"><div>{inv.contact_name || "—"}</div><div className="text-xs text-slate-400">{inv.email || ""}</div></td><td className="py-4 px-6">{inv.status || "Prospect"}</td></tr>)}
          {!loading && !error && rows.length === 0 && <tr><td colSpan="6" className="p-10 text-center text-slate-500">No investor records found. The table is ready for a verified data import; sample records are not shown as real investors.</td></tr>}
        </tbody></table></div>
        <div className="p-4 bg-slate-50 border-t text-xs text-slate-600 flex flex-col sm:flex-row gap-3 justify-between items-center"><span>Showing {total ? ((page - 1) * PAGE_SIZE + 1).toLocaleString() : 0}–{Math.min(page * PAGE_SIZE, total).toLocaleString()} of {total.toLocaleString()} records · Page {page} of {pages}</span><div className="flex gap-2"><button disabled={page <= 1 || loading} onClick={() => setPage(p => Math.max(1, p - 1))} className="px-3 py-2 bg-white border rounded-lg disabled:opacity-40 flex items-center gap-1"><ChevronLeft className="w-4 h-4" />Previous</button><button disabled={page >= pages || loading} onClick={() => setPage(p => Math.min(pages, p + 1))} className="px-3 py-2 bg-white border rounded-lg disabled:opacity-40 flex items-center gap-1">Next<ChevronRight className="w-4 h-4" /></button></div></div>
      </div>
    </div>
  );
}
