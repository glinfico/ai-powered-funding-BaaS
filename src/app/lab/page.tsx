"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import {
  Database, Zap, Play, Trash2, Search, ChevronLeft, ChevronRight, Gauge, Users, Layers,
  Timer, DollarSign, Target, CheckCircle2, Loader2, RefreshCw, Download, Activity,
  Flame, ListFilter, BarChart3, Terminal, Sparkles, ArrowRight, ShieldCheck, AlertTriangle,
  Sunrise, ClipboardCheck, MoonStar, Printer, CalendarClock, CircleAlert,
  Workflow, Fingerprint, CreditCard, BellRing, Landmark, Send, Server, AppWindow, KeyRound, BookOpenCheck,
  Plug, Upload, FileJson, FlaskConical, Link2, FolderSearch,
  ShoppingCart, Megaphone, MessageSquare, Ban, Handshake, FileSpreadsheet, FileDown, Landmark as LandmarkIcon
} from "lucide-react";

type Lead = {
  id: number; firstName: string; lastName: string; email: string; phone: string; company: string;
  jobTitle: string; source: string; status: string; score: number; estimatedValue: number;
  city: string; country: string; batchLabel: string; createdAt: string;
};
type Batch = { id: number; label: string; requested: number; inserted: number; durationMs: number; throughput: number; status: string; totalAfter: number; createdAt: string };
type Stats = {
  total: number; pipelineValue: number; avgScore: number; dbSize: string; target: number; remaining: number; percent: number;
  byStatus: { label: string; count: number }[]; bySource: { label: string; count: number }[];
  byBatch: { label: string; count: number }[]; batches: Batch[]; lastBatch: Batch | null;
  probes: { countMs: number; list25Ms: number; searchMs: number; searchedRows: number };
};
type Pipeline = {
  totalLeads: number; enriched: number; pending: number; verified: number; softDone: number;
  monitoring: number; banking: number; scored: number; routed: number; routedPending: number;
  avgCredit: number; avgIncome: number; avgFinalScore: number;
  config: { idiq: boolean; fingoal: boolean; ideWebhook: boolean; mode: string };
  sample: { lead: Lead; enrichment: any; ide: any }[];
  events: { id: number; type: string; provider: string; status: string; count: number; createdAt: string }[];
};
type Vault = {
  searchedThisSystem: { verdict: string; envFileKeysFound: string[]; lookFor: { idiqJson: string[]; fingoalApi: string[] } };
  idiq: { keySet: boolean; apiUrl: string; docs: string; imported: number; matched: number; unmatched: number; mode: string };
  fingoal: { keySet: boolean; apiUrl: string; docs: string; endpointOverride: string; mode: string; lastTest: any };
  ide: { webhookSet: boolean };
  comms?: { twilioSid: boolean; twilioPhone: boolean; twilioToken: boolean; sendgrid: boolean; consentSecret: boolean; mode: string; webhook: string };
  recent: { id: number; provider: string; kind: string; leadId: number | null; externalRef: string; email: string; status: string; parsed: any }[];
};
type Consent = {
  total_leads: number; purchased: number; prospected: number; records: number;
  credit_granted: number; banking_granted: number; monitoring_granted: number; revoked: number; pending: number;
  bothGranted: number; noConsent: number; blockedFromPipeline: number; principle: string; origin?: string;
  loanOutcomes?: { label: string; count: number; amount: number }[];
  sample: { id: number; first_name: string; last_name: string; email: string; acquisition_type: string; vendor_name: string; credit_status: string | null; banking_status: string | null; monitoring_status: string | null; evidence_ref: string | null; captured_at: string | null; scored_status: string | null }[];
};
type Report = {
  id: number; title: string; totalLeads: number; combinedMs: number; avgThroughput: number;
  pipelineValue: number; avgScore: number; dbSize: string; verdict: string; note: string; createdAt: string;
  steps: { label: string; inserted: number; durationMs: number; throughput: number; totalAfter: number; createdAt: string }[];
  probes: { countMs: number; list25Ms: number; searchMs: number };
  checklist: { label: string; ok: boolean; detail: string }[];
};

const STATUSES = ["New","Contacted","Qualified","Proposal","Negotiation","Won","Lost"];
const SOURCES = ["Website","LinkedIn","Referral","Webinar","Cold Outreach","Paid Ads","Trade Show","Partner"];

function statusColor(s: string) {
  if (s === "Won") return "bg-emerald-100 text-emerald-800 border-emerald-200";
  if (s === "Lost") return "bg-red-100 text-red-700 border-red-200";
  if (s === "Negotiation" || s === "Proposal") return "bg-amber-100 text-amber-800 border-amber-200";
  if (s === "Qualified") return "bg-teal-100 text-teal-800 border-teal-200";
  if (s === "Contacted") return "bg-sky-100 text-sky-800 border-sky-200";
  return "bg-stone-100 text-stone-700 border-stone-200";
}
function fmt(n: number) { return n.toLocaleString("en-US"); }
function money(n: number) { return n >= 1_000_000 ? `$${(n/1_000_000).toFixed(2)}M` : n >= 1000 ? `$${(n/1000).toFixed(1)}k` : `$${n}`; }

export default function Page() {
  const [stats, setStats] = useState<Stats | null>(null);
  const [leads, setLeads] = useState<Lead[]>([]);
  const [totalLeads, setTotalLeads] = useState(0);
  const [page, setPage] = useState(1);
  const [pageCount, setPageCount] = useState(1);
  const [pageSize, setPageSize] = useState(25);
  const [q, setQ] = useState("");
  const [statusF, setStatusF] = useState("");
  const [sourceF, setSourceF] = useState("");
  const [batchF, setBatchF] = useState("");
  const [sort, setSort] = useState("newest");
  const [listMs, setListMs] = useState<number | null>(null);

  const [running, setRunning] = useState<string | null>(null);
  const [runningDetail, setRunningDetail] = useState("");
  const [custom, setCustom] = useState("500");
  const [logs, setLogs] = useState<{ t: string; msg: string; kind: string }[]>([
    { t: new Date().toLocaleTimeString(), msg: "System ready. Plan: 100 warm-up → 7,900 bulk → 2,000 top-up = 10,000 leads.", kind: "info" },
  ]);
  const [confirmClear, setConfirmClear] = useState(false);
  const [report, setReport] = useState<Report | null>(null);
  const [savingReport, setSavingReport] = useState(false);
  const [pipeline, setPipeline] = useState<Pipeline | null>(null);
  const [pipelineRunning, setPipelineRunning] = useState<string | null>(null);
  const [showPayload, setShowPayload] = useState(false);
  const [vault, setVault] = useState<Vault | null>(null);
  const [idiqText, setIdiqText] = useState("");
  const [matchEmail, setMatchEmail] = useState("");
  const [vaultBusy, setVaultBusy] = useState<string | null>(null);
  const [vaultMsg, setVaultMsg] = useState("");
  const [fgEndpoint, setFgEndpoint] = useState("");
  const [fgTest, setFgTest] = useState<any>(null);
  const [consent, setConsent] = useState<Consent | null>(null);
  const [consentBusy, setConsentBusy] = useState<string | null>(null);
  const [exportOutcome, setExportOutcome] = useState("all");
  const [backfilling, setBackfilling] = useState(false);
  const [importBusy, setImportBusy] = useState(false);
  const [importResult, setImportResult] = useState<any>(null);
  const logRef = useRef<HTMLDivElement>(null);

  const addLog = useCallback((msg: string, kind = "info") => {
    setLogs(prev => [...prev.slice(-60), { t: new Date().toLocaleTimeString(), msg, kind }]);
  }, []);

  useEffect(() => { logRef.current?.scrollTo({ top: 99999 }); }, [logs]);

  const fetchStats = useCallback(async () => {
    const r = await fetch("/api/stats", { cache: "no-store" });
    if (r.ok) setStats(await r.json());
  }, []);

  const fetchReport = useCallback(async () => {
    try {
      const r = await fetch("/api/report", { cache: "no-store" });
      if (r.ok) { const j = await r.json(); setReport(j.report || null); }
    } catch {}
  }, []);

  const fetchPipeline = useCallback(async () => {
    try {
      const r = await fetch("/api/pipeline", { cache: "no-store" });
      if (r.ok) setPipeline(await r.json());
    } catch {}
  }, []);

  async function runPipeline(action: string, label: string) {
    setPipelineRunning(label);
    addLog(`⚙ Pipeline: ${label}…`, "start");
    try {
      const r = await fetch("/api/pipeline", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "pipeline failed");
      (j.log || []).forEach((m: string) => addLog(`✓ ${m}`, "ok"));
      setPipeline(j);
      await Promise.all([fetchStats(), fetchConsent()]);
    } catch (e: any) { addLog(`✕ Pipeline failed: ${e.message}`, "err"); }
    finally { setPipelineRunning(null); }
  }

  const fetchVault = useCallback(async () => {
    try {
      const r = await fetch("/api/integrations", { cache: "no-store" });
      if (r.ok) { const j = await r.json(); setVault(j); if (j.fingoal?.apiUrl) setFgEndpoint(j.fingoal.apiUrl); }
    } catch {}
  }, []);

  async function importIdiq() {
    setVaultBusy("import"); setVaultMsg("");
    try {
      const r = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "import_idiq", jsonText: idiqText, matchEmail }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Import failed");
      setVault(j);
      const msg = `Imported ${j.rawCount} IDIQ record(s): ${j.matched} matched to leads, ${j.unmatched} unmatched${j.duplicates ? `, ${j.duplicates} duplicate(s) skipped` : ""}${j.updatedExisting ? `. ${j.updatedExisting} already-scored lead(s) updated in place with your real values` : ""}. ${j.errors?.length ? j.errors.join(" ") : "Matched new leads will use these real values on the next pipeline run."}`;
      setVaultMsg(msg); addLog(`▣ IDIQ JSON: ${msg}`, j.matched ? "ok" : "info");
      fetchPipeline();
    } catch (e: any) { setVaultMsg(e.message); addLog(`✕ IDIQ import: ${e.message}`, "err"); }
    finally { setVaultBusy(null); }
  }

  async function testFingoal() {
    setVaultBusy("test"); setFgTest(null);
    try {
      const r = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "test_fingoal" }) });
      const j = await r.json(); setFgTest(j.test); if (j.idiq) setVault(j);
      addLog(`◎ FinGoal test: ${j.test?.note || ""}`, j.test?.reachable ? "ok" : "err");
    } catch (e: any) { setFgTest({ note: e.message }); }
    finally { setVaultBusy(null); }
  }

  async function saveFgEndpoint() {
    setVaultBusy("save");
    try {
      const r = await fetch("/api/integrations", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "save_fingoal_endpoint", endpoint: fgEndpoint }) });
      const j = await r.json(); if (!j.ok) throw new Error(j.error); setVault(j); addLog(`✓ FinGoal endpoint saved: ${fgEndpoint}`, "ok");
    } catch (e: any) { addLog(`✕ ${e.message}`, "err"); }
    finally { setVaultBusy(null); }
  }

  const fetchConsent = useCallback(async () => {
    try { const r = await fetch("/api/consent", { cache: "no-store" }); if (r.ok) setConsent(await r.json()); } catch {}
  }, []);

  async function consentAction(action: string, leadId?: number) {
    setConsentBusy(action + (leadId || ""));
    try {
      const r = await fetch("/api/consent", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, leadId }) });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "consent action failed");
      setConsent(j);
      if (action === "register_purchased") addLog(`✓ Purchased consent registered for ${fmt(j.registered)} leads (credit + banking + monitoring, evidence stored per lead)`, "ok");
      if (action === "create_prospect_demo") addLog(`⚠ Prospect demo #${j.demoLeadId} created with NO consent — it will be blocked by the pipeline gate. That's the point.`, "info");
      if (action === "revoke") addLog(`⛔ Consent revoked for lead #${leadId} — blocked from all future pulls/searches`, "err");
      if (action === "restore") addLog(`✓ Consent restored for lead #${leadId}`, "ok");
      fetchPipeline();
    } catch (e: any) { addLog(`✕ Consent: ${e.message}`, "err"); }
    finally { setConsentBusy(null); }
  }

  function exportUrl(format: "csv" | "xlsx", scope: "all" | "filtered" | "page", outcome = exportOutcome) {
    const p = new URLSearchParams({ format, scope, outcome, sort });
    if (scope !== "all") {
      if (q) p.set("q", q); if (statusF) p.set("status", statusF); if (sourceF) p.set("source", sourceF); if (batchF) p.set("batch", batchF);
    }
    if (scope === "page") { p.set("page", String(page)); p.set("pageSize", String(pageSize)); }
    return `/api/leads/export?${p}`;
  }

  async function backfillLoanHistory() {
    setBackfilling(true);
    try {
      const r = await fetch("/api/leads/loan-history", { method: "POST" });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error);
      addLog(`🏦 Bank loan history backfilled for ${fmt(j.updated)} leads — funded/declined outcomes now on every record & export.`, "ok");
      await Promise.all([fetchConsent(), fetchLeads()]);
    } catch (e: any) { addLog(`✕ Loan history: ${e.message}`, "err"); }
    finally { setBackfilling(false); }
  }

  async function saveReport(silent = false) {
    setSavingReport(true);
    try {
      const r = await fetch("/api/report", { method: "POST" });
      const j = await r.json();
      if (j.ok) { setReport(j.report); if (!silent) addLog("🌅 Morning briefing snapshot saved — it will be waiting at the top tomorrow.", "ok"); return j.report; }
    } catch {} finally { setSavingReport(false); }
  }

  function downloadBriefing() {
    if (!report) return;
    const lines = [
      report.title, `Prepared: ${new Date(report.createdAt).toLocaleString()}`, `Verdict: ${report.verdict}`,
      `Total leads: ${fmt(report.totalLeads)}`, `Combined insert time: ${fmt(report.combinedMs)}ms`,
      `Average throughput: ${fmt(report.avgThroughput)} leads/sec`, `Pipeline: ${money(report.pipelineValue)} · Avg score: ${report.avgScore}/100 · Table: ${report.dbSize}`,
      `Probes — count: ${report.probes.countMs}ms · list 25: ${report.probes.list25Ms}ms · search: ${report.probes.searchMs}ms`, "",
      "Steps:", ...report.steps.map(s => `- ${s.label}: +${fmt(s.inserted)} in ${fmt(s.durationMs)}ms (${fmt(s.throughput)}/sec) → ${fmt(s.totalAfter)}`),
      "", "Checklist:", ...report.checklist.map(c => `${c.ok ? "✓" : "✗"} ${c.label} (${c.detail})`), "", report.note,
    ].join("\n");
    const blob = new Blob([lines], { type: "text/plain" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = "morning-briefing-10k.txt"; a.click();
    addLog("⬇ Morning briefing downloaded (.txt)", "info");
  }

  const fetchLeads = useCallback(async () => {
    const params = new URLSearchParams({ page: String(page), pageSize: String(pageSize), sort });
    if (q) params.set("q", q);
    if (statusF) params.set("status", statusF);
    if (sourceF) params.set("source", sourceF);
    if (batchF) params.set("batch", batchF);
    const r = await fetch(`/api/leads?${params}`, { cache: "no-store" });
    if (r.ok) {
      const j = await r.json();
      setLeads(j.data); setTotalLeads(j.total); setPageCount(j.pageCount); setListMs(j.timings?.totalMs ?? null);
    }
  }, [page, pageSize, sort, q, statusF, sourceF, batchF]);

  useEffect(() => { fetchStats(); fetchReport(); fetchPipeline(); fetchVault(); fetchConsent(); }, [fetchStats, fetchReport, fetchPipeline, fetchVault, fetchConsent]);
  useEffect(() => {
    const t = setTimeout(fetchLeads, q ? 280 : 0);
    return () => clearTimeout(t);
  }, [fetchLeads, q]);

  async function generate(count: number, label: string) {
    setRunning(label);
    setRunningDetail(`Inserting ${fmt(count)} leads in 1,000-row chunks…`);
    addLog(`▶ Starting "${label}" — ${fmt(count)} leads`, "start");
    const t0 = Date.now();
    try {
      const r = await fetch("/api/leads/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ count, label }),
      });
      const j = await r.json();
      if (!j.ok) throw new Error(j.error || "Failed");
      const secs = ((Date.now() - t0) / 1000).toFixed(2);
      addLog(`✓ ${label}: +${fmt(j.inserted)} inserted in ${j.durationMs}ms (${fmt(j.throughput)}/sec) → total now ${fmt(j.totalAfter)}`, "ok");
      if (j.totalAfter >= 10000) addLog(`🎯 10,000 LEAD MARK HIT — total ${fmt(j.totalAfter)}. Check probes below: pagination, search & count should still be live.`, "ok");
      else addLog(`→ Progress: ${fmt(j.totalAfter)} / 10,000 (${Math.round(j.totalAfter/100)}% there, ${fmt(Math.max(0,10000-j.totalAfter))} to go)`, "info");
      setPage(1);
      await Promise.all([fetchStats(), fetchLeads()]);
      return j;
    } catch (e: any) {
      addLog(`✕ ${label} failed: ${e.message}`, "err");
    } finally {
      setRunning(null); setRunningDetail("");
    }
  }

  async function runFullSequence() {
    if (running) return;
    addLog("🚀 FULL SEQUENCE started: 100 → 7,900 → 2,000 = 10,000 in one system", "start");
    await generate(100, "Step 1 · Warm-up (100)");
    await generate(7900, "Step 2 · Bulk Load (7,900)");
    await generate(2000, "Step 3 · Top-up to 10K (2,000)");
    addLog("🏁 Full sequence complete. Now filter, search & paginate — notice only 25 rows render at a time, so UI stays fast.", "ok");
    await saveReport(true);
    addLog("🌅 Morning briefing auto-saved — safe to close this tab, it will be at the top when you return.", "ok");
  }

  async function clearAll() {
    if (!confirmClear) { setConfirmClear(true); setTimeout(()=>setConfirmClear(false), 3500); return; }
    setRunning("Clearing…");
    await fetch("/api/leads", { method: "DELETE" });
    addLog("🗑 All leads & batches cleared. Back to 0 / 10,000.", "err");
    setReport(null); setPipeline(null);
    setConfirmClear(false); setPage(1); setBatchF("");
    await Promise.all([fetchStats(), fetchLeads(), fetchPipeline(), fetchVault(), fetchConsent()]);
    setRunning(null);
  }

  async function changeStatus(id: number, status: string) {
    setLeads(prev => prev.map(l => l.id === id ? { ...l, status } : l));
    await fetch(`/api/leads/${id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) });
    fetchStats();
  }

  function exportCsv() {
    const header = "id,name,email,company,source,status,score,value,city,batch\n";
    const rows = leads.map(l => [l.id, `"${l.firstName} ${l.lastName}"`, l.email, `"${l.company}"`, l.source, l.status, l.score, l.estimatedValue, l.city, `"${l.batchLabel}"`].join(",")).join("\n");
    const blob = new Blob([header + rows], { type: "text/csv" });
    const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = `leads-page-${page}.csv`; a.click();
  }

  const total = stats?.total ?? 0;
  const percent = stats?.percent ?? 0;
  const probes = stats?.probes;
  const verdict = total === 0
    ? { label: "READY TO LOAD", color: "bg-stone-900 text-white", icon: Target, desc: "No leads yet. Run Step 1 (100) to warm up, then hit it with 7,900." }
    : total < 1000
    ? { label: "SNAPPY", color: "bg-emerald-600 text-white", icon: Zap, desc: "Tiny dataset. Every query is instant — this is the warm-up zone." }
    : total < 5000
    ? { label: "HEALTHY", color: "bg-emerald-600 text-white", icon: ShieldCheck, desc: "Thousands of rows, still instant thanks to indexes + server pagination." }
    : total < 10000
    ? { label: "UNDER LOAD — STABLE", color: "bg-amber-500 text-white", icon: Activity, desc: "Approaching 10K. Watch count / search probe times on the right — they should stay in single-digit ms." }
    : { label: "AT 10K+ SCALE", color: "bg-red-600 text-white", icon: Flame, desc: "10,000+ leads in one system. Table renders only one page at a time, so browsing, search & filters stay responsive." };

  const VerdictIcon = verdict.icon;
  const stepsDone = [total >= 100, total >= 8000, total >= 10000];

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900">
      {/* Header */}
      <header className="bg-stone-950 text-white">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 py-5 flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-xl bg-emerald-500 grid place-items-center shrink-0"><Database className="w-6 h-6 text-white" /></div>
            <div>
              <div className="font-black tracking-tight text-xl leading-none">LEADSCALE <span className="text-emerald-400">/ 10K LAB</span></div>
              <div className="text-xs text-stone-400 mt-1">Load-test your CRM: 100 → 7,900 → 10,000 leads, one system, live reaction</div>
            </div>
          </div>
          <div className="flex items-center gap-2 flex-wrap">
            <span className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold ${verdict.color}`}><VerdictIcon className="w-3.5 h-3.5" />{verdict.label}</span>
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white/10 border border-white/15"><Users className="w-3.5 h-3.5" />{fmt(total)} / 10,000 leads</span>
            <button onClick={() => { fetchStats(); fetchLeads(); addLog("↻ Performance probe re-run"); }} className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold bg-white text-stone-900 hover:bg-emerald-100"><RefreshCw className="w-3.5 h-3.5" />Re-probe</button>
            <a href="/crm" className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-black bg-emerald-500 text-white hover:bg-emerald-400"><Users className="w-3.5 h-3.5" />GLINFICO Control Center</a>
          </div>
        </div>
        {/* Progress to 10K */}
        <div className="mx-auto max-w-7xl px-4 sm:px-6 pb-5">
          <div className="flex justify-between text-[11px] font-semibold text-stone-400 mb-1.5">
            <span>0</span><span className={total>=100 ? "text-emerald-400" : ""}>100 warm-up</span><span className={total>=8000 ? "text-emerald-400" : ""}>8,000 after bulk</span><span className={total>=10000 ? "text-emerald-400" : ""}>10,000 🎯</span>
          </div>
          <div className="relative h-3.5 bg-white/10 rounded-full overflow-visible">
            <div className="h-full bg-emerald-500 rounded-full transition-all duration-700" style={{ width: `${Math.min(100, percent)}%` }} />
            <div className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-white/50" style={{ left: "1%" }} />
            <div className="absolute top-[-3px] bottom-[-3px] w-0.5 bg-white/50" style={{ left: "80%" }} />
          </div>
          <div className="mt-2 text-xs text-stone-300 flex flex-wrap gap-x-4 gap-y-1">
            <span><b className="text-white">{percent}%</b> to 10K</span>
            <span>{fmt(stats?.remaining ?? 10000)} remaining</span>
            <span>Table size: <b className="text-white">{stats?.dbSize ?? "—"}</b></span>
            <span>Pipeline: <b className="text-emerald-400">{money(stats?.pipelineValue ?? 0)}</b></span>
            {listMs !== null && <span>Last list query: <b className="text-white">{listMs}ms</b></span>}
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 sm:px-6 py-6 space-y-5">
        {/* Morning Briefing — left ready overnight */}
        {report && total >= 10000 ? (
          <section className="bg-emerald-800 text-white rounded-3xl p-5 sm:p-7 shadow-sm overflow-hidden">
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div className="flex gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-2xl bg-amber-400 grid place-items-center shrink-0"><Sunrise className="w-7 h-7 text-stone-950" /></div>
                <div>
                  <div className="text-[11px] font-black tracking-[0.14em] text-emerald-200 flex items-center gap-1.5"><MoonStar className="w-3.5 h-3.5" /> PREPARED OVERNIGHT · FOR YOUR MORNING CHECK</div>
                  <h2 className="font-black text-2xl sm:text-3xl tracking-tight mt-1">Good morning — your 10,000-lead result is ready. ☀️</h2>
                  <p className="text-emerald-100 text-sm mt-1.5 max-w-2xl leading-relaxed">
                    We ran <b className="text-white">100 → 7,900 → 2,000</b> for you last night and left everything loaded. Nothing to re-run, nothing lost — just open, breathe, and check. Prepared {new Date(report.createdAt).toLocaleString([], { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}.
                  </p>
                </div>
              </div>
              <span className="inline-flex items-center gap-1.5 bg-white text-emerald-900 text-xs font-black px-3 py-1.5 rounded-full shrink-0"><ClipboardCheck className="w-4 h-4" />{report.verdict}</span>
            </div>

            <div className="grid grid-cols-2 lg:grid-cols-4 gap-2.5 mt-5 text-center">
              {[
                { label: "LEADS WAITING FOR YOU", value: fmt(report.totalLeads), sub: "exactly as planned" },
                { label: "COMBINED INSERT TIME", value: `${fmt(report.combinedMs)}ms`, sub: `avg ${fmt(report.avgThroughput)}/sec` },
                { label: "STILL FAST AT 10K", value: `${report.probes.countMs}ms`, sub: `count · search ${report.probes.searchMs}ms · page ${report.probes.list25Ms}ms` },
                { label: "PIPELINE SITTING THERE", value: money(report.pipelineValue), sub: `avg score ${report.avgScore}/100 · ${report.dbSize}` },
              ].map(c => (
                <div key={c.label} className="bg-white/10 border border-white/15 rounded-2xl p-3.5">
                  <div className="text-[10px] font-black tracking-wider text-emerald-200">{c.label}</div>
                  <div className="font-black text-xl sm:text-2xl mt-1">{c.value}</div>
                  <div className="text-[11px] text-emerald-200 mt-0.5">{c.sub}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-1.5 mt-4">
              {report.steps.map((s, i) => (
                <span key={i} className="inline-flex items-center gap-1.5 bg-emerald-900/60 border border-emerald-600/50 text-xs font-bold rounded-full px-2.5 py-1.5">
                  <CheckCircle2 className="w-3.5 h-3.5 text-amber-400" />{s.label}: +{fmt(s.inserted)} in {fmt(s.durationMs)}ms → {fmt(s.totalAfter)}
                </span>
              ))}
            </div>

            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-1.5 mt-4">
              {report.checklist.map((c, i) => (
                <div key={i} className={`flex items-start gap-2 rounded-xl px-3 py-2 text-xs font-semibold ${c.ok ? "bg-white/10 text-white" : "bg-red-500/20 text-red-100"}`}>
                  {c.ok ? <CheckCircle2 className="w-4 h-4 text-amber-400 shrink-0 mt-0.5" /> : <CircleAlert className="w-4 h-4 shrink-0 mt-0.5" />}
                  <span>{c.label} <span className="opacity-70 font-normal">· {c.detail}</span></span>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-5">
              <a href="#leads-explorer" className="inline-flex items-center gap-1.5 bg-amber-400 text-stone-950 font-black text-sm px-4 py-2.5 rounded-full hover:bg-amber-300"><Search className="w-4 h-4" />Start my morning check — browse the 10K</a>
              <button onClick={downloadBriefing} className="inline-flex items-center gap-1.5 bg-white text-emerald-900 font-bold text-sm px-4 py-2.5 rounded-full hover:bg-emerald-50"><Download className="w-4 h-4" />Download briefing</button>
              <button onClick={() => window.print()} className="inline-flex items-center gap-1.5 border border-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-full hover:bg-white/10"><Printer className="w-4 h-4" />Print</button>
              <button onClick={() => { fetchStats(); saveReport(true); }} className="inline-flex items-center gap-1.5 border border-white/30 text-white font-bold text-sm px-4 py-2.5 rounded-full hover:bg-white/10"><RefreshCw className="w-4 h-4" />Re-probe now</button>
            </div>
            <p className="text-[11px] text-emerald-200 mt-3 flex items-center gap-1.5"><CalendarClock className="w-3.5 h-3.5 shrink-0" />{report.note}</p>
          </section>
        ) : report && total < 10000 ? (
          <section className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <CircleAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <p className="text-sm text-amber-900 flex-1 min-w-[220px]"><b>A saved briefing exists, but the data was cleared since.</b> It had {fmt(report.totalLeads)} leads ({report.verdict}). Re-run the Full Sequence below to recreate your 10K morning result.</p>
            <button onClick={runFullSequence} disabled={!!running} className="bg-amber-400 text-stone-950 font-black text-sm px-4 py-2 rounded-full disabled:opacity-50">Re-run 10K sequence</button>
          </section>
        ) : total >= 10000 ? (
          <section className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex flex-wrap items-center gap-3">
            <Sunrise className="w-5 h-5 text-emerald-700 shrink-0" />
            <p className="text-sm text-emerald-900 flex-1 min-w-[220px]"><b>You&apos;re at 10,000 — save this as your morning briefing</b> so the result, timings and checklist are pinned to the top when you return.</p>
            <button onClick={() => saveReport()} disabled={savingReport} className="bg-emerald-700 text-white font-black text-sm px-4 py-2 rounded-full disabled:opacity-50 inline-flex items-center gap-1.5">{savingReport ? <Loader2 className="w-4 h-4 animate-spin" /> : <ClipboardCheck className="w-4 h-4" />}Save morning briefing</button>
          </section>
        ) : (
          <section className="bg-stone-950 text-white rounded-2xl p-4 sm:p-5 flex flex-wrap items-center gap-3">
            <MoonStar className="w-6 h-6 text-amber-400 shrink-0" />
            <div className="flex-1 min-w-[240px]">
              <div className="font-extrabold">Heading out for the night? You&apos;re covered. 🌙</div>
              <p className="text-xs text-stone-300 mt-0.5 leading-relaxed">Hit <b className="text-white">Run Full Sequence</b> before you go — it loads all 10,000, auto-saves a Morning Briefing, and leaves the result pinned at the top for your first check tomorrow. We already prepared one run for you tonight, too.</p>
            </div>
            <button onClick={runFullSequence} disabled={!!running} className="bg-amber-400 text-stone-950 font-black text-sm px-4 py-2.5 rounded-full disabled:opacity-50 shrink-0">{running ? "Running…" : "Run 10K & save briefing"}</button>
          </section>
        )}

        {/* The plan math */}
        <div className="bg-white border border-stone-200 rounded-2xl p-4 sm:p-5 flex flex-col lg:flex-row lg:items-center gap-4">
          <div className="flex items-center gap-2 shrink-0"><Sparkles className="w-5 h-5 text-emerald-600" /><h1 className="font-extrabold text-lg sm:text-xl tracking-tight">Let&apos;s do 100, then the 7,900 — and watch 10,000 happen.</h1></div>
          <div className="flex items-center flex-wrap gap-2 text-sm font-bold lg:ml-auto">
            <span className={`px-3 py-1.5 rounded-full border ${stepsDone[0] ? "bg-emerald-600 text-white border-emerald-600" : "bg-stone-100 border-stone-200"}`}>{stepsDone[0] && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}100</span><ArrowRight className="w-4 h-4 text-stone-400" />
            <span className={`px-3 py-1.5 rounded-full border ${stepsDone[1] ? "bg-emerald-600 text-white border-emerald-600" : "bg-stone-100 border-stone-200"}`}>{stepsDone[1] && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}+ 7,900 = 8,000</span><ArrowRight className="w-4 h-4 text-stone-400" />
            <span className={`px-3 py-1.5 rounded-full border ${stepsDone[2] ? "bg-emerald-600 text-white border-emerald-600" : "bg-stone-100 border-stone-200"}`}>{stepsDone[2] && <CheckCircle2 className="w-3.5 h-3.5 inline mr-1" />}+ 2,000 top-up = 10,000</span>
          </div>
        </div>

        {/* ─── HOW TO RUN THIS ENGINE: IDE vs SEPARATE + IDIQ / FinGoal ─── */}
        <section id="engine-pipeline" className="bg-white border border-stone-200 rounded-3xl overflow-hidden scroll-mt-6">
          <div className="p-5 sm:p-7 border-b border-stone-100">
            <div className="flex flex-wrap items-start justify-between gap-3">
              <div>
                <div className="text-[11px] font-black tracking-[0.14em] text-emerald-700 flex items-center gap-1.5"><Workflow className="w-4 h-4" /> HOW DO I RUN THIS LEAD ENGINE?</div>
                <h2 className="font-black text-2xl sm:text-3xl tracking-tight mt-1">Keep it <span className="text-emerald-700">separate</span>. Route the results to IDE.</h2>
                <p className="text-sm text-stone-600 mt-2 max-w-3xl leading-relaxed">
                  Don&apos;t insert this engine inside IDE and don&apos;t paste it into a code editor to run by hand. It runs as its <b>own little service</b> (this app, on its own server).
                  IDE never talks to IDIQ or FinGoal and never re-scores — IDE simply <b>receives finished, scored leads</b>. That protects IDE from 10K-load spikes, keeps provider keys in one safe place, and lets you re-run the engine without touching IDE.
                </p>
              </div>
              <span className={`text-xs font-black px-3 py-1.5 rounded-full shrink-0 ${pipeline && pipeline.scored >= 10000 ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800 border border-amber-200"}`}>
                {pipeline && pipeline.scored > 0 ? `✓ ${fmt(pipeline.scored)} ALREADY SCORED` : "NOT ENRICHED YET"}
              </span>
            </div>

            {/* Architecture diagram */}
            <div className="flex flex-col md:flex-row items-stretch gap-2 mt-5 text-center">
              {[
                { icon: Users, title: "1 · LEADS IN", sub: "100 → 7,900 → 2,000\n10,000 generated here" },
                { icon: Fingerprint, title: "2 · IDIQ: ID'd", sub: "Identity verified\nIDIQ ref per lead" },
                { icon: CreditCard, title: "3 · IDIQ: SOFT PULL", sub: "Credit score + band\nNo hard inquiry, no damage" },
                { icon: BellRing, title: "4 · IDIQ: MONITORING", sub: "Enrolled for alerts\nOngoing, not one-off" },
                { icon: Landmark, title: "5 · FinGOAL: BANKING", sub: "Bank linked, income\n& cash-flow enriched" },
                { icon: Target, title: "6 · SCORED", sub: "Final score blends\nlead + credit + cash-flow" },
                { icon: Send, title: "7 · ROUTED TO IDE", sub: "lead.scored webhook /\nGET /api/ide/leads" },
              ].map((s, i, arr) => (
                <div key={s.title} className="flex md:flex-1 items-center gap-2">
                  <div className="flex-1 bg-stone-50 border border-stone-200 rounded-2xl p-3 min-w-[118px]">
                    <s.icon className="w-5 h-5 mx-auto text-emerald-700" />
                    <div className="font-black text-[11px] mt-1.5">{s.title}</div>
                    <div className="text-[11px] text-stone-500 whitespace-pre-line leading-snug mt-0.5">{s.sub}</div>
                  </div>
                  {i < arr.length - 1 && <ArrowRight className="w-4 h-4 text-stone-400 shrink-0 hidden md:block" />}
                </div>
              ))}
            </div>

            <div className="grid md:grid-cols-3 gap-3 mt-5 text-sm">
              <div className="border-2 border-emerald-600 bg-emerald-50 rounded-2xl p-4">
                <div className="font-black flex items-center gap-2"><Server className="w-4 h-4 text-emerald-700" /> ✓ DO — Separate engine (this)</div>
                <ul className="mt-2 space-y-1.5 text-stone-700 text-[13px] leading-relaxed list-disc pl-4">
                  <li>Runs 24/7 on its own: generates, enriches, scores</li>
                  <li>Only place IDIQ / FinGoal keys live (server-side env)</li>
                  <li>Scale it, restart it, fix it — IDE stays up</li>
                  <li>You press buttons here; no code/IDE needed day-to-day</li>
                </ul>
              </div>
              <div className="border border-stone-200 rounded-2xl p-4">
                <div className="font-black flex items-center gap-2"><AppWindow className="w-4 h-4 text-emerald-700" /> IDE — just consumes</div>
                <ul className="mt-2 space-y-1.5 text-stone-700 text-[13px] leading-relaxed list-disc pl-4">
                  <li>Pull: <code className="bg-stone-100 px-1 rounded font-bold">GET /api/ide/leads?minScore=70</code></li>
                  <li>Or push: engine sends <code className="bg-stone-100 px-1 rounded font-bold">lead.scored</code> webhook to IDE</li>
                  <li>Dedupes on <code className="bg-stone-100 px-1 rounded font-bold">lead-{"{id}"}-scored-v1</code> — safe to retry</li>
                  <li>Displays score, band, income — never re-runs pulls</li>
                </ul>
              </div>
              <div className="border border-red-200 bg-red-50 rounded-2xl p-4">
                <div className="font-black flex items-center gap-2 text-red-800"><CircleAlert className="w-4 h-4" /> ✕ DON'T — Embed in IDE</div>
                <ul className="mt-2 space-y-1.5 text-stone-700 text-[13px] leading-relaxed list-disc pl-4">
                  <li>10K bulk inserts would slow/freeze IDE for users</li>
                  <li>Provider keys would leak into IDE/browser code</li>
                  <li>Every IDE release risks breaking scoring</li>
                  <li>Re-pulling already-scored leads wastes cost + consent</li>
                </ul>
              </div>
            </div>
          </div>

          {/* Live pipeline status + run controls */}
          <div className="p-5 sm:p-7 bg-stone-50">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h3 className="font-extrabold flex items-center gap-2"><BookOpenCheck className="w-5 h-5 text-emerald-700" /> IDIQ → FinGoal → Scoring pipeline — live status</h3>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-white border border-stone-300 rounded-full px-3 py-1.5"><KeyRound className="w-3.5 h-3.5" />{pipeline?.config.mode || "…"}</span>
            </div>
            <p className="text-xs text-stone-600 mt-1.5 max-w-3xl leading-relaxed">
              <b>About “already Scored”:</b> you&apos;re exactly right — for these 10,000, steps 2–6 <b>have already happened</b>. The score on each lead is the <i>end</i> of that chain, not the start.
              So the buttons below will <b>skip already-scored leads</b> (no second soft pull, no duplicate cost). You only run this pipeline again for <i>new</i> leads that arrive after today.
              A soft pull also needs the consumer&apos;s consent / permissible purpose in production — the engine is where that consent is recorded, another reason to keep it out of IDE.
            </p>

            <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-2 mt-4 text-center">
              {[
                { label: "LEADS", value: pipeline?.totalLeads ?? total, icon: Users },
                { label: "ID'd · IDIQ", value: pipeline?.verified ?? 0, icon: Fingerprint },
                { label: "SOFT PULL DONE", value: pipeline?.softDone ?? 0, icon: CreditCard },
                { label: "MONITORING", value: pipeline?.monitoring ?? 0, icon: BellRing },
                { label: "BANKING · FinGoal", value: pipeline?.banking ?? 0, icon: Landmark },
                { label: "SCORED", value: pipeline?.scored ?? 0, icon: Target },
                { label: "ROUTED → IDE", value: pipeline?.routed ?? 0, icon: Send },
              ].map(c => (
                <div key={c.label} className="bg-white border border-stone-200 rounded-2xl p-3">
                  <c.icon className="w-4 h-4 mx-auto text-emerald-700" />
                  <div className="font-black text-lg mt-1">{fmt(c.value)}</div>
                  <div className="text-[10px] font-black tracking-wide text-stone-500">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button disabled={!!pipelineRunning || (pipeline?.pending ?? 0) === 0} onClick={() => runPipeline("enrich-and-route", "Enrich (IDIQ + FinGoal) → Score → Route to IDE")} className="inline-flex items-center gap-2 bg-emerald-700 text-white font-black text-sm px-5 py-3 rounded-full hover:bg-emerald-800 disabled:opacity-50">
                {pipelineRunning ? <Loader2 className="w-4 h-4 animate-spin" /> : <Workflow className="w-4 h-4" />}
                {pipelineRunning || ((pipeline?.pending ?? 0) === 0 && (pipeline?.scored ?? 0) > 0 ? "All leads already enriched + scored ✓" : `Run pipeline for ${fmt(pipeline?.pending ?? 0)} new leads`)}
              </button>
              <button disabled={!!pipelineRunning || (pipeline?.routedPending ?? 0) === 0} onClick={() => runPipeline("route", "Route scored results to IDE")} className="inline-flex items-center gap-2 bg-stone-950 text-white font-bold text-sm px-5 py-3 rounded-full disabled:opacity-50">
                <Send className="w-4 h-4" />Route {fmt(pipeline?.routedPending ?? 0)} scored → IDE
              </button>
              <button onClick={() => setShowPayload(v => !v)} className="inline-flex items-center gap-2 bg-white border border-stone-300 font-bold text-sm px-5 py-3 rounded-full">{"</>"} {showPayload ? "Hide" : "See"} what IDE receives</button>
              <a href="/api/ide/leads?minScore=80&limit=5" target="_blank" className="inline-flex items-center gap-2 bg-white border border-stone-300 font-bold text-sm px-5 py-3 rounded-full">Open IDE feed (top scores) ↗</a>
            </div>
            {pipeline && (
              <div className="flex flex-wrap gap-x-5 gap-y-1 mt-3 text-xs text-stone-600">
                <span>Provider keys: IDIQ <b className={pipeline.config.idiq ? "text-emerald-700" : "text-amber-700"}>{pipeline.config.idiq ? "configured ✓" : "not set — simulated"}</b></span>
                <span>FinGoal <b className={pipeline.config.fingoal ? "text-emerald-700" : "text-amber-700"}>{pipeline.config.fingoal ? "configured ✓" : "not set — simulated"}</b></span>
                <span>IDE webhook <b className={pipeline.config.ideWebhook ? "text-emerald-700" : "text-amber-700"}>{pipeline.config.ideWebhook ? "configured ✓" : "not set — simulated delivery"}</b></span>
                {pipeline.enriched > 0 && <span>Avg credit <b>{pipeline.avgCredit}</b> · Avg income <b>${fmt(pipeline.avgIncome)}/mo</b> · Avg final score <b>{pipeline.avgFinalScore}/100</b></span>}
              </div>
            )}

            {showPayload && pipeline?.sample?.[0] && (
              <pre className="mt-4 bg-stone-950 text-emerald-300 text-[11px] leading-relaxed rounded-2xl p-4 overflow-x-auto">{JSON.stringify(pipeline.sample[0].ide, null, 2)}</pre>
            )}

            {/* Top enriched sample */}
            {pipeline && pipeline.sample.length > 0 && (
              <div className="mt-5 bg-white border border-stone-200 rounded-2xl overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 font-extrabold text-sm">Top scored & routed — exactly as IDE sees them</div>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm min-w-[820px]">
                    <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-4 py-2.5">Lead</th><th className="px-3 py-2.5">IDIQ Identity</th><th className="px-3 py-2.5">Soft Pull</th><th className="px-3 py-2.5">Monitoring</th><th className="px-3 py-2.5">FinGoal Banking</th><th className="px-3 py-2.5">Final Score</th><th className="px-3 py-2.5">→ IDE</th></tr></thead>
                    <tbody>
                      {pipeline.sample.map(({ lead: l, enrichment: e }: any) => (
                        <tr key={l.id} className="border-b border-stone-50 hover:bg-stone-50">
                          <td className="px-4 py-2.5"><div className="font-bold leading-tight">{l.firstName} {l.lastName}</div><div className="text-xs text-stone-500">{l.company} · #{l.id}</div></td>
                          <td className="px-3 py-2.5 text-xs"><span className={`font-bold px-2 py-1 rounded-full border ${e.identityStatus === "Verified" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : "bg-amber-100 text-amber-800 border-amber-200"}`}>{e.identityStatus} {e.identityConfidence}%</span><div className="text-stone-400 mt-1">{e.idiqRef}</div></td>
                          <td className="px-3 py-2.5 text-xs"><b>{e.creditScore}</b> · {e.creditBand}<div className="text-stone-400">{e.softPullStatus} · soft only</div></td>
                          <td className="px-3 py-2.5 text-xs">{e.monitoringStatus}{e.monitoringAlerts ? <span className="text-amber-700 font-bold"> · {e.monitoringAlerts} alert(s)</span> : ""}</td>
                          <td className="px-3 py-2.5 text-xs">{e.fingoalStatus}<div className="text-stone-400">{e.bankAccounts} acct(s) · ${fmt(e.monthlyIncome)}/mo · cash-flow {e.cashflowScore}</div></td>
                          <td className="px-3 py-2.5"><span className="font-black text-emerald-700 text-base">{e.finalScore}</span><span className="text-stone-400 text-xs">/100</span></td>
                          <td className="px-3 py-2.5"><span className={`text-xs font-bold px-2 py-1 rounded-full ${e.routedToIde === "Routed" ? "bg-stone-950 text-white" : "bg-stone-100 text-stone-600"}`}>{e.routedToIde}</span></td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Event log */}
            {pipeline && pipeline.events.length > 0 && (
              <div className="mt-4 flex flex-wrap gap-1.5">
                {pipeline.events.slice(0, 8).map(ev => (
                  <span key={ev.id} className="text-[11px] font-semibold bg-white border border-stone-200 rounded-full px-2.5 py-1.5 text-stone-600">
                    <b className="text-stone-900">{ev.provider}</b> {ev.type} · {fmt(ev.count)} · {ev.status} · {new Date(ev.createdAt).toLocaleTimeString()}
                  </span>
                ))}
              </div>
            )}

            <div className="grid md:grid-cols-3 gap-3 mt-5 text-[13px] leading-relaxed">
              <div className="bg-white border border-stone-200 rounded-2xl p-4"><b>How you run it day-to-day</b><p className="text-stone-600 mt-1">Open this dashboard → generate new leads → press <b>Run pipeline</b>. That&apos;s it. In production the same button becomes a job that fires automatically when a new batch lands — still here, never in IDE.</p></div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4"><b>How IDE gets results</b><p className="text-stone-600 mt-1">Two safe options, pick one: IDE polls <code className="bg-stone-100 px-1 rounded font-bold">GET /api/ide/leads</code>, or the engine pushes a signed <code className="bg-stone-100 px-1 rounded font-bold">lead.scored</code> webhook. Either way IDE only stores the finished payload shown above.</p></div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4"><b>Going live with real providers</b><p className="text-stone-600 mt-1">Add <code className="bg-stone-100 px-1 rounded font-bold">IDIQ_API_KEY</code>, <code className="bg-stone-100 px-1 rounded font-bold">FINGOAL_API_KEY</code> and <code className="bg-stone-100 px-1 rounded font-bold">IDE_WEBHOOK_URL</code> as server-side secrets on <i>this engine only</i> and swap the simulated calls for the providers&apos; APIs — IDE code doesn&apos;t change at all.</p></div>
            </div>
          </div>
        </section>

        {/* ─── DOWNLOAD CENTER: CSV / EXCEL BANK LEADS ─── */}
        <section className="bg-emerald-800 text-white rounded-3xl p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-[0.14em] text-emerald-200 flex items-center gap-1.5"><FileSpreadsheet className="w-4 h-4" /> DOWNLOAD CENTER — YES, TAKE THE FILE</div>
              <h2 className="font-black text-2xl sm:text-3xl tracking-tight mt-1">Download your bank leads: CSV or Excel (.xlsx)</h2>
              <p className="text-sm text-emerald-100 mt-2 max-w-3xl leading-relaxed">
                These aren&apos;t cold prospects — they&apos;re <b className="text-white">bank DB leads</b>: each person consented inside a loan application, and most were already decided (<b className="text-white">funded or declined</b>) before you bought them.
                Exports are built <b className="text-white">server-side with lead + IDIQ + FinGoal + consent evidence + loan outcome in one row</b> — all 10,000 if you want, never just the 25 on screen.
              </p>
            </div>
            <button onClick={backfillLoanHistory} disabled={backfilling} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/20 text-white font-bold text-xs px-3 py-2 rounded-full disabled:opacity-50 shrink-0">
              {backfilling ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <LandmarkIcon className="w-3.5 h-3.5" />}Tag bank loan history
            </button>
          </div>

          {consent?.loanOutcomes && consent.loanOutcomes.length > 0 && (
            <div className="flex flex-wrap gap-1.5 mt-4">
              {consent.loanOutcomes.map(o => (
                <span key={o.label} className="inline-flex items-center gap-1.5 bg-white/10 border border-white/15 text-xs font-bold rounded-full px-3 py-1.5">
                  <LandmarkIcon className="w-3.5 h-3.5 text-amber-400" />{o.label}: {fmt(o.count)} · ${fmt(Number(o.amount))}
                </span>
              ))}
              <span className="inline-flex items-center gap-1.5 bg-amber-400 text-stone-950 text-xs font-black rounded-full px-3 py-1.5">Origin: Bank DB — Loan Application</span>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3 mt-5">
            <div className="bg-white text-stone-900 rounded-2xl p-4">
              <div className="font-black flex items-center gap-2"><FileDown className="w-5 h-5 text-emerald-700" /> All leads (full file)</div>
              <p className="text-xs text-stone-500 mt-1">Every bank lead with enrichment, consent evidence &amp; loan outcome. Best for archive, audit, or handing to IDE/CRM.</p>
              <div className="flex gap-2 mt-3">
                <a href={exportUrl("csv", "all")} className="flex-1 text-center bg-stone-950 text-white font-black text-sm px-4 py-2.5 rounded-full">⬇ CSV · {fmt(total)}</a>
                <a href={exportUrl("xlsx", "all")} className="flex-1 text-center bg-emerald-700 text-white font-black text-sm px-4 py-2.5 rounded-full">⬇ Excel · {fmt(total)}</a>
              </div>
            </div>
            <div className="bg-white text-stone-900 rounded-2xl p-4">
              <div className="font-black flex items-center gap-2"><ListFilter className="w-5 h-5 text-emerald-700" /> What I&apos;m looking at</div>
              <p className="text-xs text-stone-500 mt-1">Respects your current search, status, source &amp; batch filters in the Explorer below — <b>{fmt(totalLeads)} matching</b> right now.</p>
              <div className="flex gap-2 mt-3">
                <a href={exportUrl("csv", "filtered")} className="flex-1 text-center bg-stone-950 text-white font-black text-sm px-4 py-2.5 rounded-full">⬇ CSV filtered</a>
                <a href={exportUrl("xlsx", "filtered")} className="flex-1 text-center bg-emerald-700 text-white font-black text-sm px-4 py-2.5 rounded-full">⬇ Excel filtered</a>
              </div>
              <a href={exportUrl("csv", "page")} className="block text-center text-xs font-bold text-stone-500 underline mt-2">or just this page ({leads.length} rows)</a>
            </div>
            <div className="bg-white text-stone-900 rounded-2xl p-4">
              <div className="font-black flex items-center gap-2"><LandmarkIcon className="w-5 h-5 text-emerald-700" /> Split by loan outcome</div>
              <p className="text-xs text-stone-500 mt-1">Funded borrowers, declined applicants, or still in-system — bank leads behave differently, export them separately.</p>
              <select value={exportOutcome} onChange={e => setExportOutcome(e.target.value)} className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-semibold mt-3">
                <option value="all">All outcomes</option>
                <option value="Funded">Funded — obtained a loan</option>
                <option value="Declined">Declined — did not obtain</option>
                <option value="In System — No Decision Yet">In system — no decision yet</option>
              </select>
              <div className="flex gap-2 mt-2">
                <a href={exportUrl("csv", "all", exportOutcome)} className="flex-1 text-center bg-stone-950 text-white font-black text-sm px-4 py-2.5 rounded-full">⬇ CSV</a>
                <a href={exportUrl("xlsx", "all", exportOutcome)} className="flex-1 text-center bg-emerald-700 text-white font-black text-sm px-4 py-2.5 rounded-full">⬇ Excel</a>
              </div>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-5 gap-y-1.5 mt-4 text-xs text-emerald-200">
            <span>Excel = real .xlsx with <b className="text-white">Summary + Bank Leads sheets</b>, frozen header, filters &amp; styled columns</span>
            <span>45 columns: identity, contact, origin, loan, IDIQ, FinGoal, final score, IDE routing, consent evidence</span>
            <span>IDE feed too: <a className="underline font-bold text-white" href="/api/ide/leads?format=xlsx&minScore=80" target="_blank">scored ≥80 .xlsx ↗</a> · <a className="underline font-bold text-white" href="/api/ide/leads?format=csv&minScore=80" target="_blank">.csv ↗</a></span>
          </div>
          <p className="text-[11px] text-emerald-300/80 mt-3 flex gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0" /> This file contains personal + credit/banking-derived data from bank applications. Download it only on a secure machine, store it encrypted, share only with authorized parties, and honor consent revocations — the ledger below is your audit trail.</p>
        </section>

        {/* ─── CONSENT & ACQUISITION: PURCHASED vs PROSPECTED ─── */}
        <section className="bg-white border border-stone-200 rounded-3xl overflow-hidden">
          <div className="p-5 sm:p-7 border-b border-stone-100">
            <div className="text-[11px] font-black tracking-[0.14em] text-emerald-700 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4" /> CONSENT — PRECISELY, BECAUSE YOU BOUGHT (NOT PROSPECTED)</div>
            <h2 className="font-black text-2xl sm:text-3xl tracking-tight mt-1">My take: you&apos;re right. Stay purchased — it&apos;s what keeps this semi-autonomous.</h2>
            <p className="text-sm text-stone-600 mt-2 max-w-3xl leading-relaxed">
              Your leads arrive with consent <b>already captured by the seller and transferred with the lead</b>. So IDIQ soft pull + FinGoal banking search are <b>pre-authorized per lead</b> — the engine just has to <i>prove</i> it per record and refuse anyone without it.
              Prospecting flips you into the consent-<i>collector</i> role, and that&apos;s a different business. The system now treats them as two separate lanes that never mix:
            </p>

            <div className="grid md:grid-cols-2 gap-3 mt-5">
              <div className="border-2 border-emerald-600 bg-emerald-50 rounded-2xl p-4">
                <div className="font-black flex items-center gap-2"><ShoppingCart className="w-5 h-5 text-emerald-700" /> LANE A — PURCHASED BANK DB LEADS (you, now) ✓ KEEP</div>
                <ul className="mt-2 space-y-1.5 text-[13px] text-stone-700 leading-relaxed list-disc pl-4">
                  <li>Consented <b>in the bank loan application itself</b> → transfers with the lead from the bank&apos;s DB. Most were already decided: <b>funded or declined</b> before purchase</li>
                  <li>Per lead we store: scope (credit / banking / monitoring), evidence ref, capture date, text version, expiry, vendor</li>
                  <li>IDIQ + FinGoal may run <b>autonomously</b> — no outreach, no Twilio, no human in loop</li>
                  <li>Your diligence: vendor must warrant scope + named-purpose coverage, deliver revocation updates, and consent must actually be <i>transferable</i></li>
                </ul>
              </div>
              <div className="border border-stone-300 bg-stone-50 rounded-2xl p-4">
                <div className="font-black flex items-center gap-2"><Megaphone className="w-5 h-5 text-stone-600" /> LANE B — PROSPECTING (future, optional) — SEPARATE MODULE</div>
                <ul className="mt-2 space-y-1.5 text-[13px] text-stone-700 leading-relaxed list-disc pl-4">
                  <li><b>Twilio</b> comms: SMS/voice numbers, A2P 10DLC registration, templates, STOP/opt-out, quiet hours, DNC scrubbing, full message logs</li>
                  <li>You must <b>capture</b> outreach consent first, then separately credit/banking consent in that conversation — <i>before</i> any pull</li>
                  <li>Human/supervised follow-up by design → <b>partial autonomy is lost</b>, exactly as you said</li>
                  <li>Never let a prospected lead borrow a purchased lead&apos;s consent. Different basis, different flag, hard gate</li>
                </ul>
              </div>
            </div>

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 mt-4 text-xs leading-relaxed text-amber-900">
              <b>One precise nuance:</b> purchased consent can cover a banking <b>data search / vendor-supplied enrichment</b>. A consumer personally <b>linking their live bank</b> (logging in through an aggregator widget) is a separate consumer-permissioned act — a seller can&apos;t pre-consent that for them. If you ever use live linking, that one step puts the consumer back in the loop even in Lane A. Also: this is system design, not legal advice — have counsel confirm FCRA permissible purpose + consent transfer language in your vendor contracts.
            </div>

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-2 mt-5 text-center">
              {[
                { label: "PURCHASED LEADS", value: consent?.purchased ?? 0 },
                { label: "CREDIT CONSENT ✓", value: consent?.credit_granted ?? 0 },
                { label: "BANKING CONSENT ✓", value: consent?.banking_granted ?? 0 },
                { label: "BOTH (ELIGIBLE)", value: consent?.bothGranted ?? 0 },
                { label: "BLOCKED BY GATE", value: consent?.blockedFromPipeline ?? 0 },
                { label: "REVOKED", value: consent?.revoked ? Math.floor((consent.revoked) / 3) : 0 },
              ].map(c => (
                <div key={c.label} className="bg-stone-50 border border-stone-200 rounded-2xl p-3">
                  <div className="font-black text-xl">{fmt(c.value)}</div>
                  <div className="text-[10px] font-black tracking-wide text-stone-500 mt-0.5">{c.label}</div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-2 mt-4">
              <button disabled={!!consentBusy || (consent?.noConsent ?? 0) === 0} onClick={() => consentAction("register_purchased")} className="inline-flex items-center gap-2 bg-emerald-700 text-white font-black text-sm px-5 py-3 rounded-full disabled:opacity-50">
                {consentBusy === "register_purchased" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Handshake className="w-4 h-4" />}
                {(consent?.noConsent ?? 0) === 0 && (consent?.records ?? 0) > 0 ? "Purchased consent registered for all leads ✓" : `Register purchased consent (${fmt(consent?.noConsent ?? 0)} without)`}
              </button>
              <button disabled={!!consentBusy} onClick={() => consentAction("create_prospect_demo")} className="inline-flex items-center gap-2 bg-white border border-stone-300 font-bold text-sm px-5 py-3 rounded-full disabled:opacity-50"><Megaphone className="w-4 h-4" />Create 1 prospect demo (see it get blocked)</button>
              <span className="inline-flex items-center gap-1.5 text-xs font-bold bg-stone-100 border border-stone-200 rounded-full px-3 py-2"><MessageSquare className="w-4 h-4 text-stone-500" />Twilio: <b>not installed</b> — only needed if Lane B opens</span>
            </div>
            {consent && <p className="text-xs text-stone-500 mt-2.5 flex gap-1.5"><Ban className="w-4 h-4 shrink-0 text-red-500" />{consent.principle}</p>}
          </div>

          {consent && consent.sample.length > 0 && (
            <div className="overflow-x-auto">
              <table className="w-full text-sm min-w-[860px]">
                <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-5 py-3">Lead</th><th className="px-3 py-3">Acquisition</th><th className="px-3 py-3">Credit Pull</th><th className="px-3 py-3">Banking Search</th><th className="px-3 py-3">Monitoring</th><th className="px-3 py-3">Evidence / Captured</th><th className="px-3 py-3">Gate</th></tr></thead>
                <tbody>
                  {consent.sample.map(l => {
                    const eligible = l.credit_status === "Granted" && l.banking_status === "Granted";
                    const pill = (s: string | null) => s === "Granted" ? "bg-emerald-100 text-emerald-800 border-emerald-200" : s === "Revoked" ? "bg-red-100 text-red-700 border-red-200" : "bg-amber-100 text-amber-800 border-amber-200";
                    return (
                      <tr key={l.id} className="border-b border-stone-50 hover:bg-stone-50">
                        <td className="px-5 py-2.5"><div className="font-bold leading-tight">{l.first_name} {l.last_name}</div><div className="text-xs text-stone-500 truncate max-w-[200px]">{l.email}</div></td>
                        <td className="px-3 py-2.5 text-xs"><span className={`font-bold px-2 py-1 rounded-full border ${l.acquisition_type === "Purchased" ? "bg-emerald-50 text-emerald-800 border-emerald-200" : "bg-stone-100 text-stone-700 border-stone-300"}`}>{l.acquisition_type}</span><div className="text-stone-400 mt-1">{l.vendor_name}</div></td>
                        <td className="px-3 py-2.5"><span className={`text-xs font-bold px-2 py-1 rounded-full border ${pill(l.credit_status)}`}>{l.credit_status || "— none"}</span></td>
                        <td className="px-3 py-2.5"><span className={`text-xs font-bold px-2 py-1 rounded-full border ${pill(l.banking_status)}`}>{l.banking_status || "— none"}</span></td>
                        <td className="px-3 py-2.5"><span className={`text-xs font-bold px-2 py-1 rounded-full border ${pill(l.monitoring_status)}`}>{l.monitoring_status || "—"}</span></td>
                        <td className="px-3 py-2.5 text-xs text-stone-500"><div className="max-w-[210px] truncate font-semibold text-stone-700">{l.evidence_ref || "—"}</div>{l.captured_at ? new Date(l.captured_at).toLocaleDateString() : "not captured"}</td>
                        <td className="px-3 py-2.5">
                          {eligible
                            ? <span className="text-xs font-black text-emerald-700">✓ ELIGIBLE{l.scored_status === "Scored" ? " · SCORED" : ""}</span>
                            : <span className="text-xs font-black text-red-600">⛔ BLOCKED</span>}
                          {(l.credit_status || l.banking_status) && (
                            <button onClick={() => consentAction(l.credit_status === "Revoked" ? "restore" : "revoke", l.id)} className="block text-[11px] font-bold text-stone-500 underline mt-1">{l.credit_status === "Revoked" ? "restore" : "revoke"}</button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}

          <div className="grid md:grid-cols-3 gap-3 p-5 sm:p-7 pt-4 text-[13px] leading-relaxed bg-stone-50">
            <div className="bg-white border border-stone-200 rounded-2xl p-4"><b>If you add prospecting later, you must add:</b><p className="text-stone-600 mt-1">Twilio account + verified numbers, A2P 10DLC brand/campaign, consent-capture forms &amp; timestamps, STOP/HELP handling, quiet-hours + DNC checks, conversation logs, human review queue. Budget it as a <b>separate module</b> feeding the same gate — not a switch on Lane A.</p></div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4"><b>What protects autonomy in Lane A</b><p className="text-stone-600 mt-1">No outreach means no TCPA/Twilio surface at all. The engine&apos;s only jobs are verify evidence → pull/search → score → route. Revocation is the one inbound signal you must honor instantly (try revoke above, then re-run the pipeline).</p></div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4"><b>Vendor checklist per purchase</b><p className="text-stone-600 mt-1">Consent text version, capture timestamp/IP/source URL, scope naming credit + banking (+ your company or assignees), transfer/assignment clause, revocation feed, retention/expiry. If a vendor can&apos;t produce the evidence ref, the gate treats the lead as unconsented.</p></div>
          </div>
        </section>

        {/* ─── INTEGRATION VAULT: IDIQ JSON + FinGoal API ─── */}
        <section className="bg-stone-950 text-white rounded-3xl p-5 sm:p-7">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="text-[11px] font-black tracking-[0.14em] text-amber-400 flex items-center gap-1.5"><Plug className="w-4 h-4" /> INTEGRATION VAULT — THIS BLOCK, DONE</div>
              <h2 className="font-black text-2xl sm:text-3xl tracking-tight mt-1">IDIQ JSON + FinGoal API, plugged into the engine</h2>
              <p className="text-sm text-stone-300 mt-2 max-w-3xl leading-relaxed">
                I searched this whole system before building this: <b className="text-white">no IDIQ JSON file, no FinGoal key, no provider file on disk — the system environment here only has DATABASE_URL.</b> That&apos;s why they showed empty.
                So: if your IDIQ JSON / FinGoal API live somewhere else, this is the exact place they land. Drop them in and the pipeline above switches from simulated to your real values — no code, no IDE.
              </p>
            </div>
            <div className="flex flex-col gap-1.5 shrink-0">
              <span className={`text-xs font-black px-3 py-1.5 rounded-full text-center ${vault?.idiq.matched ? "bg-emerald-500 text-white" : "bg-white/10 border border-white/15"}`}>IDIQ: {vault?.idiq.mode || "…"}</span>
              <span className={`text-xs font-black px-3 py-1.5 rounded-full text-center ${vault?.fingoal.keySet ? "bg-emerald-500 text-white" : "bg-white/10 border border-white/15"}`}>FinGoal: {vault?.fingoal.mode || "…"}</span>
            </div>
          </div>

          <div className="grid lg:grid-cols-2 gap-4 mt-5">
            {/* IDIQ */}
            <div className="bg-white text-stone-900 rounded-2xl p-5">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black flex items-center gap-2"><FileJson className="w-5 h-5 text-emerald-700" /> IDIQ — your JSON goes here</h3>
                <a href={vault?.idiq.docs || "https://api.idandcredit.com"} target="_blank" className="text-xs font-bold text-emerald-700 shrink-0">Partner API ↗</a>
              </div>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">Checked against your screenshot: it accepts the real <b>IdentityIQ member-dashboard payload</b> — a <code className="bg-stone-100 px-1 rounded font-bold">JSON_CALLBACK( … )</code> JSONP from <code className="bg-stone-100 px-1 rounded font-bold">member.identityiq.com … dsply.aspx</code> with <code className="bg-stone-100 px-1 rounded font-bold">BundleComponents → BundleComponent[] (TUC/EQF/EXP)</code> and <code className="bg-stone-100 px-1 rounded font-bold">CreditScoreType (@riskScore, @scoreName, @populationRank)</code> + <code className="bg-stone-100 px-1 rounded font-bold">CreditScoreFactor[]</code>. The JSONP wrapper and the <code className="bg-stone-100 px-1 rounded font-bold">dollar-sign</code> value wrappers are unwrapped automatically. Also still accepts partner enrollment exports (array or <code className="bg-stone-100 px-1 rounded font-bold">members/data</code> wrapper).</p>
              <textarea value={idiqText} onChange={e => setIdiqText(e.target.value)} rows={8} spellCheck={false} placeholder={'Paste the IDIQ JSON / JSON_CALLBACK payload here…'} className="w-full mt-3 border border-stone-300 rounded-xl p-3 text-xs font-mono leading-relaxed outline-none focus:border-emerald-600" />
              <div className="flex flex-wrap items-center gap-2 mt-3">
                <label className="inline-flex items-center gap-1.5 bg-stone-100 border border-stone-300 font-bold text-sm px-4 py-2.5 rounded-full cursor-pointer hover:bg-stone-200"><Upload className="w-4 h-4" />Load file<input type="file" accept=".json,.txt,application/json,text/plain" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (f) { setIdiqText(await f.text()); addLog(`▣ Loaded ${f.name} — now press Import`, "info"); } }} /></label>
                <button onClick={async () => { const m = await import("@/lib/providers"); setIdiqText(m.SAMPLE_IDIQ_JSON); addLog("▣ Loaded the IdentityIQ sample (JSON_CALLBACK shape from your screenshot)", "info"); }} className="bg-white border border-stone-300 font-bold text-sm px-4 py-2.5 rounded-full">Load the IdentityIQ sample</button>
                <button disabled={vaultBusy === "import" || !idiqText.trim()} onClick={importIdiq} className="inline-flex items-center gap-1.5 bg-emerald-700 text-white font-black text-sm px-5 py-2.5 rounded-full disabled:opacity-50">{vaultBusy === "import" ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plug className="w-4 h-4" />}Import & match</button>
              </div>
              <div className="mt-3 bg-red-50 border border-red-300 rounded-xl p-3 text-xs leading-relaxed text-red-900">
                <b className="flex items-center gap-1"><Ban className="w-4 h-4" /> DO NOT use the "right-click → Inspect → Sources → cloud icon → copy the JSON" method for lead data.</b>
                <span className="block mt-1">Scraping a consumer's logged-in IdentityIQ session out of DevTools is <b>not a permissible, auditable pull</b>: it breaks IdentityIQ's terms, leaves no FCRA permissible-purpose record, and the "consent" is really the consumer's live session credentials. A purchased-consent transfer does not cover scraping sessions. The importer will still <i>parse</i> that JSON shape if you legitimately hold a single record (e.g. your own report, for testing the schema) — but the pipeline's production intake is the <b>IDIQ partner API</b> or the <b>consent evidence transferred with your bank-DB leads</b>, never a DevTools export of someone else's session.</span>
              </div>
              <div className="flex items-center gap-2 mt-2">
                <label className="text-xs font-bold text-stone-500 shrink-0">Match to lead email (raw report has none):</label>
                <input value={matchEmail} onChange={e => setMatchEmail(e.target.value)} placeholder="lead@example.com" className="flex-1 min-w-[180px] border border-stone-300 rounded-xl px-3 py-2 text-xs" />
              </div>
              {vaultMsg && <p className="text-xs font-semibold bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-xl px-3 py-2 mt-3 leading-relaxed">{vaultMsg}</p>}
              <div className="flex flex-wrap gap-4 mt-3 text-xs text-stone-600">
                <span>Imported: <b className="text-stone-900">{fmt(vault?.idiq.imported ?? 0)}</b></span>
                <span>Matched: <b className="text-emerald-700">{fmt(vault?.idiq.matched ?? 0)}</b></span>
                <span>Unmatched: <b className="text-amber-700">{fmt(vault?.idiq.unmatched ?? 0)}</b></span>
                <span>API key in system: <b>{vault?.idiq.keySet ? "yes ✓" : "no"}</b></span>
              </div>
              {vault && vault.recent.filter(r => r.provider === "IDIQ").length > 0 && (
                <div className="mt-3 space-y-1.5">
                  {vault.recent.filter(r => r.provider === "IDIQ").slice(0, 4).map(r => (
                    <div key={r.id} className="text-xs border border-stone-200 rounded-xl px-3 py-2 flex flex-wrap justify-between gap-2">
                      <span className="font-bold truncate">{r.email || r.externalRef} <span className="text-stone-400 font-normal">· {r.externalRef}</span></span>
                      <span className={r.status === "matched" ? "text-emerald-700 font-black" : "text-amber-700 font-black"}>{r.status}{r.parsed?.creditScore ? ` · ${r.parsed.creditScore} ${r.parsed.creditModel || "score"}` : ""}{r.parsed?.reportTypes?.length ? ` · ${r.parsed.reportTypes.join("/")}` : ""}{r.parsed?.factorCount ? ` · ${r.parsed.negativeFactors || 0}/${r.parsed.factorCount} neg factors` : ""}</span>
                    </div>
                  ))}
                </div>
              )}
              <div className="mt-4 bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs leading-relaxed text-stone-600">
                <b className="text-stone-900 flex items-center gap-1"><FolderSearch className="w-3.5 h-3.5" /> If yours is empty, look for:</b>
                <ul className="list-disc pl-4 mt-1 space-y-0.5">{(vault?.searchedThisSystem.lookFor.idiqJson || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
              </div>
            </div>

            {/* FinGoal */}
            <div className="bg-white text-stone-900 rounded-2xl p-5 flex flex-col">
              <div className="flex items-center justify-between gap-2">
                <h3 className="font-black flex items-center gap-2"><Landmark className="w-5 h-5 text-emerald-700" /> FinGoal — API already has a home</h3>
                <a href={vault?.fingoal.docs || "https://docs.fingoal.dev"} target="_blank" className="text-xs font-bold text-emerald-700 shrink-0">FinGoal docs ↗</a>
              </div>
              <p className="text-xs text-stone-600 mt-1.5 leading-relaxed">FinGoal&apos;s <b>Insights API</b> enriches banking transactions (clean merchant, category, income/cash-flow signals) — fed by the bank aggregator, authenticated with a <b>Bearer token server-side</b>. The engine is pre-wired for it: save the endpoint, test reachability, and add the token to the system environment — it never goes in the browser or IDE.</p>
              <label className="text-xs font-bold text-stone-500 mt-3">API BASE ENDPOINT</label>
              <div className="flex gap-2 mt-1">
                <input value={fgEndpoint} onChange={e => setFgEndpoint(e.target.value)} className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-mono" placeholder="https://findmoney.fingoal.com" />
                <button disabled={vaultBusy === "save"} onClick={saveFgEndpoint} className="px-4 py-2.5 rounded-xl bg-stone-950 text-white font-bold text-sm disabled:opacity-50 shrink-0">Save</button>
              </div>
              <div className="flex flex-wrap gap-2 mt-3">
                <button disabled={vaultBusy === "test"} onClick={testFingoal} className="inline-flex items-center gap-1.5 bg-emerald-700 text-white font-black text-sm px-5 py-2.5 rounded-full disabled:opacity-50">{vaultBusy === "test" ? <Loader2 className="w-4 h-4 animate-spin" /> : <FlaskConical className="w-4 h-4" />}Test FinGoal connection</button>
                <a href="/api/ide/leads?minScore=80&limit=3" target="_blank" className="inline-flex items-center gap-1.5 bg-white border border-stone-300 font-bold text-sm px-4 py-2.5 rounded-full"><Link2 className="w-4 h-4" />Preview enriched feed ↗</a>
              </div>
              {(fgTest || vault?.fingoal.lastTest) && (
                <p className={`text-xs font-semibold rounded-xl px-3 py-2 mt-3 leading-relaxed border ${fgTest?.reachable ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-amber-50 border-amber-200 text-amber-900"}`}>
                  {fgTest ? fgTest.note : (() => { try { return JSON.parse(vault!.fingoal.lastTest.payload).note; } catch { return "Last test recorded."; } })()}
                  {fgTest && <span className="block mt-1 font-normal">{fgTest.endpoint} · {fgTest.ms}ms · HTTP {fgTest.httpStatus || "—"} · key {fgTest.keySet ? "present" : "missing"}</span>}
                </p>
              )}
              <div className="mt-3 space-y-1.5 text-xs">
                {[["FINGOAL_API_KEY / Bearer token", vault?.fingoal.keySet], ["IDIQ_API_KEY", vault?.idiq.keySet], ["IDE_WEBHOOK_URL", vault?.ide.webhookSet], ["TWILIO_ACCOUNT_SID + AUTH_TOKEN", vault?.comms?.twilioSid && vault?.comms?.twilioToken], ["TWILIO_PHONE_NUMBER", vault?.comms?.twilioPhone], ["SENDGRID_API_KEY (email)", vault?.comms?.sendgrid], ["CONSENT_SIGNING_SECRET", vault?.comms?.consentSecret]].map(([label, ok]) => (
                  <div key={label as string} className="flex items-center justify-between border border-stone-200 rounded-xl px-3 py-2">
                    <span className="font-mono font-bold">{label}</span>
                    <span className={ok ? "text-emerald-700 font-black" : "text-amber-700 font-black"}>{ok ? "IN SYSTEM ✓" : "NOT IN SYSTEM"}</span>
                  </div>
                ))}
                <p className="text-stone-500 leading-relaxed pt-1">Keys live in the <b>system environment / sandbox secrets for this engine service only</b> (same place DATABASE_URL lives) — add them there, restart, and this card flips to LIVE. Nothing to change in IDE.</p>
                {vault?.comms && <p className="text-xs font-bold pt-1">SMS/email transport: <b>{vault.comms.mode}</b> · STOP webhook: <code className="bg-stone-100 px-1 rounded">{vault.comms.webhook}</code></p>}
              </div>
              <div className="mt-auto pt-4">
                <div className="bg-stone-50 border border-stone-200 rounded-xl p-3 text-xs leading-relaxed text-stone-600">
                  <b className="text-stone-900 flex items-center gap-1"><FolderSearch className="w-3.5 h-3.5" /> If yours is empty, look for:</b>
                  <ul className="list-disc pl-4 mt-1 space-y-0.5">{(vault?.searchedThisSystem.lookFor.fingoalApi || []).map((x, i) => <li key={i}>{x}</li>)}</ul>
                </div>
              </div>
            </div>
          </div>

          <p className="text-xs text-stone-400 mt-4 leading-relaxed flex gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0 text-emerald-400" /> Honest status rule in this engine: a provider only says LIVE when a real key is in the system or real JSON records are imported + matched. Everything else is labelled simulated — so what you see tomorrow is never dressed up.</p>
        </section>

        <div className="grid lg:grid-cols-3 gap-5 items-start">
          {/* LEFT: Controls + Reaction */}
          <div className="space-y-5">
            <section className="bg-white border border-stone-200 rounded-2xl p-5">
              <h2 className="font-extrabold flex items-center gap-2"><Play className="w-4 h-4 text-emerald-600" /> Load Plan</h2>
              <p className="text-xs text-stone-500 mt-1">Each run inserts in 1,000-row chunks &amp; measures real throughput.</p>

              <div className="space-y-2.5 mt-4">
                <button disabled={!!running} onClick={() => generate(100, "Step 1 · Warm-up (100)")} className="w-full flex items-center justify-between bg-stone-950 text-white rounded-xl px-4 py-3 font-bold text-sm hover:bg-stone-800 disabled:opacity-50">
                  <span className="flex items-center gap-2"><Zap className="w-4 h-4 text-emerald-400" />STEP 1 — Generate 100</span><span className="text-xs text-stone-400">warm-up</span>
                </button>
                <button disabled={!!running} onClick={() => generate(7900, "Step 2 · Bulk Load (7,900)")} className="w-full flex items-center justify-between bg-emerald-600 text-white rounded-xl px-4 py-3 font-bold text-sm hover:bg-emerald-700 disabled:opacity-50">
                  <span className="flex items-center gap-2"><Layers className="w-4 h-4" />STEP 2 — Generate 7,900</span><span className="text-xs text-emerald-100">the big one</span>
                </button>
                <button disabled={!!running} onClick={() => generate(2000, "Step 3 · Top-up to 10K (2,000)")} className="w-full flex items-center justify-between bg-white border-2 border-stone-900 rounded-xl px-4 py-3 font-bold text-sm hover:bg-stone-50 disabled:opacity-50">
                  <span className="flex items-center gap-2"><Target className="w-4 h-4" />STEP 3 — Top-up 2,000</span><span className="text-xs text-stone-500">→ 10,000</span>
                </button>
                <button disabled={!!running} onClick={runFullSequence} className="w-full flex items-center justify-center gap-2 bg-amber-400 text-stone-950 rounded-xl px-4 py-3.5 font-black text-sm hover:bg-amber-300 disabled:opacity-50">
                  {running ? <Loader2 className="w-4 h-4 animate-spin" /> : <Flame className="w-4 h-4" />}
                  {running ? running : "RUN FULL SEQUENCE — 10,000 AT ONCE"}
                </button>
                {running && <p className="text-xs text-stone-500 flex items-center gap-1.5"><Loader2 className="w-3.5 h-3.5 animate-spin" />{runningDetail || running}</p>}

                <div className="flex gap-2 pt-1">
                  <input value={custom} onChange={e => setCustom(e.target.value)} type="number" min={1} max={20000} className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-semibold" placeholder="Custom count" />
                  <button disabled={!!running} onClick={() => generate(Math.max(1, Math.min(20000, Number(custom) || 0)), `Custom (${fmt(Number(custom)||0)})`)} className="px-4 py-2.5 rounded-xl bg-stone-100 border border-stone-300 font-bold text-sm disabled:opacity-50">Generate</button>
                </div>
                <div className="pt-1 border-t border-stone-100">
                  <label className="block text-xs font-black text-stone-500 mb-1.5">UPLOAD LEADS CSV (with SSN + DOB columns so IDIQ accepts them)</label>
                  <div className="flex gap-2">
                    <label className="flex-1 inline-flex items-center justify-center gap-1.5 bg-stone-100 border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-bold cursor-pointer hover:bg-stone-200"><Upload className="w-4 h-4" />Choose .csv<input type="file" accept=".csv,text/csv" className="hidden" onChange={async e => { const f = e.target.files?.[0]; if (!f) return; setImportBusy(true); const fd = new FormData(); fd.append("file", f); const r = await fetch("/api/leads/import", { method: "POST", body: fd }); const j = await r.json(); setImportResult(j); setImportBusy(false); addLog(j.ok ? `⬆ CSV import: +${fmt(j.inserted)} leads (IDIQ-ready ${fmt(j.idiqReady)}, will-reject ${fmt(j.idiqWillReject)})` : `✕ CSV import: ${j.error}`, j.ok ? "ok" : "err"); if (j.ok) { setPage(1); await Promise.all([fetchStats(), fetchLeads(), fetchPipeline(), fetchConsent()]); } }} /></label>
                  </div>
                  {importBusy && <p className="text-xs text-stone-500 mt-1.5 flex items-center gap-1"><Loader2 className="w-3 h-3 animate-spin" />Importing…</p>}
                  {importResult && <p className={`text-xs mt-1.5 rounded-xl px-3 py-2 border leading-relaxed ${importResult.ok ? "bg-emerald-50 border-emerald-200 text-emerald-900" : "bg-red-50 border-red-200 text-red-800"}`}>{importResult.ok ? <>Imported <b>{fmt(importResult.inserted)}</b> leads ({fmt(importResult.skipped)} skipped, no email). <b>IDIQ-ready (SSN+DOB+name): {fmt(importResult.idiqReady)}</b> · will be rejected by IDIQ: <b>{fmt(importResult.idiqWillReject)}</b>{importResult.rejects?.length ? ` — e.g. ${importResult.rejects.slice(0,3).map((r: any) => `${r.email} missing ${r.missing.join("+")}`).join("; ")}` : ""}. Consent requests auto-sent.</> : importResult.error}</p>}
                </div>
                <button onClick={clearAll} className={`w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 font-bold text-sm border ${confirmClear ? "bg-red-600 text-white border-red-600" : "text-red-600 border-red-200 bg-red-50 hover:bg-red-100"}`}>
                  <Trash2 className="w-4 h-4" />{confirmClear ? "Tap again to confirm — wipe everything" : "Clear all leads"}
                </button>
              </div>
            </section>

            {/* System reaction */}
            <section className="bg-stone-950 text-white rounded-2xl p-5">
              <h2 className="font-extrabold flex items-center gap-2"><Gauge className="w-4 h-4 text-emerald-400" /> How the system is reacting</h2>
              <p className="text-sm text-stone-300 mt-2 leading-relaxed">{verdict.desc}</p>
              <div className="grid grid-cols-3 gap-2 mt-4 text-center">
                <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="text-[11px] text-stone-400 font-bold">COUNT QUERY</div><div className="font-black text-lg mt-0.5">{probes ? `${probes.countMs}ms` : "—"}</div><div className="text-[11px] text-stone-500">all {fmt(total)} rows</div></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="text-[11px] text-stone-400 font-bold">LIST 25</div><div className="font-black text-lg mt-0.5">{probes ? `${probes.list25Ms}ms` : "—"}</div><div className="text-[11px] text-stone-500">one page</div></div>
                <div className="bg-white/5 border border-white/10 rounded-xl p-3"><div className="text-[11px] text-stone-400 font-bold">SEARCH</div><div className="font-black text-lg mt-0.5">{probes ? `${probes.searchMs}ms` : "—"}</div><div className="text-[11px] text-stone-500">{probes ? `${probes.searchedRows} hits shown` : "ILIKE scan"}</div></div>
              </div>
              {stats?.lastBatch && (
                <div className="mt-3 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-3 text-xs leading-relaxed">
                  <b className="text-emerald-400">Last batch:</b> {stats.lastBatch.label} — {fmt(stats.lastBatch.inserted)} leads in {fmt(stats.lastBatch.durationMs)}ms at <b className="text-white">{fmt(stats.lastBatch.throughput)}/sec</b>
                </div>
              )}
              <div className="mt-3 flex gap-2 text-[11px] text-stone-400"><AlertTriangle className="w-4 h-4 shrink-0 text-amber-400" />Why it stays fast at 10K: server-side pagination (25/page), indexed status/source/batch columns, and chunked bulk inserts — never load 10,000 rows into the browser.</div>
            </section>

            {/* Log */}
            <section className="bg-[#111] border border-stone-800 rounded-2xl overflow-hidden">
              <div className="px-4 py-2.5 flex items-center gap-2 text-xs font-bold text-stone-300 border-b border-white/10"><Terminal className="w-4 h-4 text-emerald-400" /> LIVE RUN LOG</div>
              <div ref={logRef} className="h-44 overflow-y-auto p-3 space-y-1.5 font-mono text-[11px] leading-relaxed">
                {logs.map((l, i) => (
                  <div key={i} className={l.kind === "ok" ? "text-emerald-400" : l.kind === "err" ? "text-red-400" : l.kind === "start" ? "text-amber-300" : "text-stone-400"}>
                    <span className="text-stone-600">[{l.t}]</span> {l.msg}
                  </div>
                ))}
                {running && <div className="text-white flex items-center gap-1.5"><Loader2 className="w-3 h-3 animate-spin" />{running}…</div>}
              </div>
            </section>
          </div>

          {/* RIGHT: KPIs + batches + table */}
          <div className="lg:col-span-2 space-y-5">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {[
                { label: "Total Leads", value: fmt(total), sub: `${percent}% of 10K target`, icon: Users },
                { label: "Batches Run", value: fmt(stats?.batches.length ?? 0), sub: stats?.lastBatch ? `last: ${fmt(stats.lastBatch.inserted)} leads` : "no runs yet", icon: Layers },
                { label: "Pipeline Value", value: money(stats?.pipelineValue ?? 0), sub: `avg score ${stats?.avgScore ?? 0}/100`, icon: DollarSign },
                { label: "Last Throughput", value: stats?.lastBatch ? `${fmt(stats.lastBatch.throughput)}/s` : "—", sub: stats?.lastBatch ? `${fmt(stats.lastBatch.durationMs)}ms insert time` : "run a batch", icon: Timer },
              ].map(c => (
                <div key={c.label} className="bg-white border border-stone-200 rounded-2xl p-4">
                  <div className="flex items-center justify-between text-stone-500"><span className="text-[11px] font-bold uppercase tracking-wide">{c.label}</span><c.icon className="w-4 h-4" /></div>
                  <div className="font-black text-2xl mt-1.5 tracking-tight">{c.value}</div>
                  <div className="text-xs text-stone-500 mt-0.5">{c.sub}</div>
                </div>
              ))}
            </div>

            {/* Breakdowns */}
            <div className="grid md:grid-cols-2 gap-3">
              <div className="bg-white border border-stone-200 rounded-2xl p-4">
                <h3 className="font-bold text-sm flex items-center gap-2"><BarChart3 className="w-4 h-4 text-emerald-600" /> By Status</h3>
                <div className="mt-3 space-y-2">
                  {STATUSES.map(s => {
                    const c = stats?.byStatus.find(x => x.label === s)?.count ?? 0;
                    return (
                      <button key={s} onClick={() => { setStatusF(statusF === s ? "" : s); setPage(1); }} className="w-full flex items-center gap-2 text-xs group">
                        <span className="w-20 text-left font-semibold shrink-0 group-hover:text-emerald-700">{s}</span>
                        <span className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden"><span className="block h-full bg-emerald-500 rounded-full" style={{ width: `${total ? (c/total)*100 : 0}%` }} /></span>
                        <span className="w-12 text-right font-bold">{fmt(c)}</span>
                      </button>
                    );
                  })}
                  {total === 0 && <p className="text-xs text-stone-400">Generate leads to see the funnel fill up.</p>}
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4">
                <h3 className="font-bold text-sm flex items-center gap-2"><Activity className="w-4 h-4 text-emerald-600" /> Batch History {stats?.batches.length ? `(${stats.batches.length})` : ""}</h3>
                <div className="mt-3 space-y-2 max-h-56 overflow-y-auto pr-1">
                  {(stats?.batches ?? []).map(b => (
                    <button key={b.id} onClick={() => { setBatchF(batchF === b.label ? "" : b.label); setPage(1); }} className={`w-full text-left border rounded-xl p-2.5 text-xs hover:border-emerald-400 ${batchF === b.label ? "border-emerald-500 bg-emerald-50" : "border-stone-200"}`}>
                      <div className="flex justify-between gap-2"><b className="truncate">{b.label}</b><span className="font-black shrink-0">→ {fmt(b.totalAfter)}</span></div>
                      <div className="text-stone-500 mt-0.5">+{fmt(b.inserted)} in {fmt(b.durationMs)}ms · {fmt(b.throughput)}/sec · {new Date(b.createdAt).toLocaleTimeString()}</div>
                    </button>
                  ))}
                  {!stats?.batches.length && <p className="text-xs text-stone-400">No batches yet — Step 1 creates the first one. Click a batch later to filter the table to just those leads.</p>}
                </div>
              </div>
            </div>

            {/* Leads explorer */}
            <section id="leads-explorer" className="bg-white border border-stone-200 rounded-2xl overflow-hidden scroll-mt-6">
              <div className="p-4 border-b border-stone-100">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="font-extrabold flex items-center gap-2"><ListFilter className="w-4 h-4 text-emerald-600" /> Leads Explorer <span className="text-xs font-bold bg-stone-100 rounded-full px-2 py-0.5">{fmt(totalLeads)} matching</span></h2>
                  <span className="inline-flex gap-1.5">
                    <a href={exportUrl("csv", "page")} className="inline-flex items-center gap-1.5 text-xs font-bold border border-stone-300 rounded-full px-3 py-1.5 hover:bg-stone-50"><Download className="w-3.5 h-3.5" />Page CSV</a>
                    <a href={exportUrl("xlsx", "filtered")} className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-700 text-white rounded-full px-3 py-1.5 hover:bg-emerald-800"><FileSpreadsheet className="w-3.5 h-3.5" />Excel (filtered)</a>
                    <a href={exportUrl("csv", "filtered")} className="inline-flex items-center gap-1.5 text-xs font-bold bg-stone-950 text-white rounded-full px-3 py-1.5 hover:bg-stone-800"><FileDown className="w-3.5 h-3.5" />CSV (filtered)</a>
                  </span>
                </div>
                <div className="flex flex-wrap gap-2 mt-3">
                  <label className="flex items-center gap-2 flex-1 min-w-[200px] border border-stone-300 rounded-xl px-3 py-2">
                    <Search className="w-4 h-4 text-stone-400 shrink-0" />
                    <input value={q} onChange={e => { setQ(e.target.value); setPage(1); }} placeholder={`Search ${fmt(total)} leads by name, email, company…`} className="w-full outline-none text-sm bg-transparent" />
                  </label>
                  <select value={statusF} onChange={e => { setStatusF(e.target.value); setPage(1); }} className="border border-stone-300 rounded-xl px-2 py-2 text-sm font-semibold"><option value="">All statuses</option>{STATUSES.map(s => <option key={s}>{s}</option>)}</select>
                  <select value={sourceF} onChange={e => { setSourceF(e.target.value); setPage(1); }} className="border border-stone-300 rounded-xl px-2 py-2 text-sm font-semibold"><option value="">All sources</option>{SOURCES.map(s => <option key={s}>{s}</option>)}</select>
                  <select value={sort} onChange={e => setSort(e.target.value)} className="border border-stone-300 rounded-xl px-2 py-2 text-sm font-semibold"><option value="newest">Newest first</option><option value="oldest">Oldest first</option><option value="score">Highest score</option><option value="value">Highest value</option><option value="name">Name A–Z</option></select>
                  <select value={pageSize} onChange={e => { setPageSize(Number(e.target.value)); setPage(1); }} className="border border-stone-300 rounded-xl px-2 py-2 text-sm font-semibold"><option value={25}>25 / page</option><option value={50}>50 / page</option><option value={100}>100 / page</option></select>
                </div>
                {(statusF || sourceF || batchF || q) && (
                  <div className="flex flex-wrap gap-1.5 mt-2 text-xs">
                    <span className="text-stone-500 font-semibold py-1">Active:</span>
                    {[q && `“${q}”`, statusF, sourceF, batchF].filter(Boolean).map((f, i) => <span key={i} className="bg-emerald-100 text-emerald-800 font-bold rounded-full px-2 py-1">{f as string}</span>)}
                    <button onClick={() => { setQ(""); setStatusF(""); setSourceF(""); setBatchF(""); setPage(1); }} className="font-bold text-red-600 px-1 py-1">Clear all ×</button>
                  </div>
                )}
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm min-w-[760px]">
                  <thead><tr className="text-left text-[11px] uppercase tracking-wide text-stone-500 border-b border-stone-100">
                    <th className="px-4 py-3">Lead</th><th className="px-3 py-3">Company</th><th className="px-3 py-3">Source</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Value</th><th className="px-3 py-3">Batch</th>
                  </tr></thead>
                  <tbody>
                    {leads.map(l => (
                      <tr key={l.id} className="border-b border-stone-50 hover:bg-stone-50">
                        <td className="px-4 py-2.5"><div className="font-bold leading-tight">{l.firstName} {l.lastName}</div><div className="text-xs text-stone-500 truncate max-w-[210px]">{l.email}</div><div className="text-[11px] text-stone-400">{l.jobTitle} · {l.city}</div></td>
                        <td className="px-3 py-2.5 font-semibold">{l.company}</td>
                        <td className="px-3 py-2.5"><span className="text-xs font-bold bg-stone-100 rounded-full px-2 py-1 whitespace-nowrap">{l.source}</span></td>
                        <td className="px-3 py-2.5"><select value={l.status} onChange={e => changeStatus(l.id, e.target.value)} className={`text-xs font-bold border rounded-full px-2 py-1 cursor-pointer ${statusColor(l.status)}`}>{STATUSES.map(s => <option key={s}>{s}</option>)}</select></td>
                        <td className="px-3 py-2.5"><span className={`font-black ${l.score >= 70 ? "text-emerald-600" : l.score >= 40 ? "text-amber-600" : "text-red-500"}`}>{l.score}</span></td>
                        <td className="px-3 py-2.5 font-bold">{money(l.estimatedValue)}</td>
                        <td className="px-3 py-2.5"><span className="text-[11px] font-semibold text-stone-500 block max-w-[140px] truncate" title={l.batchLabel}>{l.batchLabel}</span><span className="text-[11px] text-stone-400">#{l.id}</span></td>
                      </tr>
                    ))}
                    {leads.length === 0 && (
                      <tr><td colSpan={7} className="px-4 py-14 text-center">
                        <Database className="w-8 h-8 text-stone-300 mx-auto" />
                        <div className="font-bold mt-2">{total === 0 ? "Zero leads. Zero drama — for now." : "No leads match those filters."}</div>
                        <p className="text-sm text-stone-500 mt-1">{total === 0 ? "Hit Step 1 (100), then Step 2 (7,900) on the left and watch this table fill up." : "Try clearing a filter or searching something else."}</p>
                      </td></tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="p-3.5 flex flex-wrap items-center justify-between gap-3 border-t border-stone-100 text-sm">
                <span className="text-stone-500 text-xs font-semibold">
                  {totalLeads === 0 ? "Showing 0" : `Showing ${fmt((page-1)*pageSize+1)}–${fmt(Math.min(page*pageSize, totalLeads))} of ${fmt(totalLeads)}`} · Page {page} of {fmt(pageCount)} {listMs !== null && `· fetched in ${listMs}ms`}
                </span>
                <div className="flex items-center gap-1.5">
                  <button disabled={page <= 1} onClick={() => setPage(p => p - 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-300 font-bold text-xs disabled:opacity-40"><ChevronLeft className="w-3.5 h-3.5" />Prev</button>
                  {Array.from({ length: Math.min(5, pageCount) }, (_, i) => {
                    const p = pageCount <= 5 ? i + 1 : Math.max(1, Math.min(pageCount - 4, page - 2)) + i;
                    return <button key={p} onClick={() => setPage(p)} className={`w-8 h-8 rounded-full text-xs font-black ${p === page ? "bg-stone-950 text-white" : "border border-stone-300"}`}>{p}</button>;
                  })}
                  <button disabled={page >= pageCount} onClick={() => setPage(p => p + 1)} className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-stone-300 font-bold text-xs disabled:opacity-40">Next<ChevronRight className="w-3.5 h-3.5" /></button>
                </div>
              </div>
            </section>

            <p className="text-xs text-stone-500 leading-relaxed px-1">
              <b className="text-stone-700">What to watch at 10,000:</b> jump to the last page, search a common name like “Smith”, filter by <i>Won</i>, click a batch in Batch History — if the probes above stay under ~50ms and pagination stays instant, the system is handling 10K exactly as it should. Status dropdowns in the table are live — change one and the funnel updates.
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}
