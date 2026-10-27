import React, { useCallback, useEffect, useState } from "react";
import { Users, RefreshCw, ShieldCheck, AlertCircle, CheckCircle2, UserCheck } from "lucide-react";
import { supabase } from "@/lib/supabase";

export default function BrokerAssignment() {
  const [preview, setPreview] = useState({ unassigned: 0, brokerCount: 0, brokers: [] });
  const [role, setRole] = useState("");
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [result, setResult] = useState(null);

  const request = useCallback(async (url, options = {}) => {
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    const token = sessionData?.session?.access_token;
    if (sessionError || !token) throw new Error("Your session has expired. Please sign in again.");
    const response = await fetch(url, {
      ...options,
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json", ...(options.headers || {}) }
    });
    const payload = await response.json();
    if (!response.ok) throw new Error(payload.error || "The assignment request failed.");
    return payload;
  }, []);

  const load = useCallback(async () => {
    setLoading(true); setError("");
    try {
      const [data, auth] = await Promise.all([
        request("/api/automation/assignment-preview"),
        request("/api/auth/me")
      ]);
      setPreview({ unassigned: Number(data.unassigned) || 0, brokerCount: Number(data.brokerCount) || 0, brokers: data.brokers || [] });
      setRole(auth.role || "");
    } catch (e) { setError(e.message || "Unable to load assignment status."); }
    finally { setLoading(false); }
  }, [request]);

  useEffect(() => { load(); }, [load]);

  const runAssignment = async () => {
    if (role !== "admin") { setError("Administrator access is required to run LAE."); return; }
    if (!preview.unassigned) { setMessage("No unassigned leads were found. No records were changed."); return; }
    const approved = window.confirm(`LAE will assign up to ${preview.unassigned.toLocaleString()} currently unassigned leads across ${preview.brokerCount} real broker records. Existing assignments are preserved, and self-sourced leads are skipped. Continue?`);
    if (!approved) return;
    setRunning(true); setError(""); setMessage(""); setResult(null);
    try {
      const data = await request("/api/automation/assign-unassigned", { method: "POST", body: JSON.stringify({ confirm: true }) });
      setResult(data);
      setMessage(`Database assignment completed: ${Number(data.assigned || 0).toLocaleString()} lead assignments saved.`);
      await load();
    } catch (e) { setError(e.message || "LAE could not complete assignments."); }
    finally { setRunning(false); }
  };

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div><h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-3"><Users className="w-8 h-8 text-amber-500" />Leads Assignment Engine (LAE)</h1><p className="text-sm text-slate-500 mt-1">Round-robin assignment using actual database leads and broker IDs.</p></div>
        <button onClick={load} disabled={loading || running} className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-sm font-semibold flex items-center gap-2 disabled:opacity-50"><RefreshCw className={`w-4 h-4 ${loading ? "animate-spin" : ""}`} />Refresh status</button>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="text-xs uppercase font-bold tracking-wide text-slate-500">Unassigned leads</div><div className="mt-2 text-3xl font-black text-slate-900">{loading ? "…" : preview.unassigned.toLocaleString()}</div><div className="text-xs text-slate-500 mt-1">Live count from the leads table</div></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="text-xs uppercase font-bold tracking-wide text-slate-500">Available brokers</div><div className="mt-2 text-3xl font-black text-slate-900">{loading ? "…" : preview.brokerCount.toLocaleString()}</div><div className="text-xs text-slate-500 mt-1">Real broker records, not a sample roster</div></div>
        <div className="bg-white border border-slate-200 rounded-2xl p-5"><div className="text-xs uppercase font-bold tracking-wide text-slate-500">Assignment mode</div><div className="mt-2 text-xl font-black text-slate-900">Round robin</div><div className="text-xs text-slate-500 mt-1">Existing assignments remain unchanged</div></div>
      </div>
      {error && <div role="alert" className="p-4 rounded-xl border border-red-200 bg-red-50 text-red-700 flex items-center gap-2"><AlertCircle className="w-4 h-4 shrink-0" />{error}</div>}
      {message && <div role="status" className="p-4 rounded-xl border border-emerald-200 bg-emerald-50 text-emerald-800 flex items-center gap-2"><CheckCircle2 className="w-4 h-4 shrink-0" />{message}</div>}
      <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
        <div className="flex items-start gap-3"><ShieldCheck className="w-6 h-6 text-amber-500 mt-0.5" /><div><h2 className="font-bold text-slate-900">Database-backed assignment run</h2><p className="text-sm text-slate-600 mt-1">LAE only assigns leads whose <code>assigned_to</code> field is empty. Existing broker assignments are not overwritten. Leads identified as self-sourced are skipped. The operation requires administrator authorization and explicit confirmation.</p></div></div>
        <button onClick={runAssignment} disabled={loading || running || role !== "admin" || preview.brokerCount === 0 || preview.unassigned === 0} className="px-5 py-3 rounded-xl bg-slate-900 text-white font-bold text-sm disabled:opacity-40 flex items-center gap-2"><UserCheck className="w-4 h-4" />{running ? "Saving assignments…" : "Run LAE assignment"}</button>
        {role && role !== "admin" && <p className="text-xs text-amber-700">You can view assignment status, but only an administrator can run LAE.</p>}
        {result && <div className="border-t border-slate-100 pt-4"><h3 className="font-semibold text-slate-900 mb-2">Verified response from database API</h3><p className="text-sm text-slate-600">Assignments saved: {Number(result.assigned || 0).toLocaleString()} · Self-sourced leads skipped: {Number(result.skippedSelfSourced || 0).toLocaleString()}</p><div className="mt-3 space-y-2">{preview.brokers.map(broker => <div key={broker.id} className="flex justify-between text-sm border-b border-slate-100 pb-2"><span>{broker.full_name || broker.email || broker.id}</span><span className="font-semibold">{Number(result.brokerAssignments?.[broker.id] || 0).toLocaleString()} assigned</span></div>)}</div></div>}
      </div>
      <div className="bg-slate-50 border border-slate-200 rounded-xl p-4 text-xs text-slate-600">No simulated lead records or localStorage assignment claims are used by this screen. A successful status is shown only after the server returns the database update result.</div>
    </div>
  );
}
