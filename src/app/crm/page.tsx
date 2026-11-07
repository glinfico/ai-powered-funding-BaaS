"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  LayoutDashboard, Handshake, Users, Landmark, Briefcase, FileText, GitBranch, CheckSquare,
  DollarSign, BarChart3, Bot, Search, Home, X, Plus, Loader2, Trash2, Check, StickyNote,
  Phone, Mail, Activity as ActivityIcon, ShieldCheck, Fingerprint, CreditCard, Target, Send, Sparkles, Ban, Cog, FolderOpen, KeyRound
} from "lucide-react";

type Lead = { id: number; firstName: string; lastName: string; email: string; phone: string; company: string; jobTitle: string; source: string; status: string; score: number; estimatedValue: number; city: string; country: string; address?: string; ssn?: string | null; dob?: string | null; batchLabel: string; acquisitionType: string; vendorName: string; originSystem: string; loanOutcome: string; loanAmount: number; applicationDate: string | null; createdAt: string };
type Enrichment = { identityStatus: string; identityConfidence: number; idiqRef: string; softPullStatus: string; creditScore: number; creditBand: string; monitoringStatus: string; monitoringAlerts: number; fingoalStatus: string; bankAccounts: number; monthlyIncome: number; monthlySpend: number; cashflowScore: number; finalScore: number; scoredStatus: string; routedToIde: string; ideRef: string };
type Consent = { scope: string; status: string; basis: string; vendorName: string; evidenceRef: string; capturedAt: string; expiresAt: string | null };
type Act = { id: number; leadId: number; type: string; body: string; dueAt: string | null; done: number; createdAt: string };
type Lender = { id: number; name: string; kind: string; products: string; minFico: number; maxAmount: number; advanceRatePct: number; ratePct: number; contactEmail: string; phone: string; active: number; notes: string };
type Investor = { id: number; name: string; focus: string; minTicket: number; maxTicket: number; contactEmail: string; active: number; notes: string };
type Deal = { id: number; leadId: number; lenderId: number | null; title: string; product: string; amount: number; stage: string; ratePct: number; commissionPct: number; fundedAt: string | null; notes: string; createdAt: string; updatedAt: string; lead?: Lead; lender?: Lender };
type Term = { id: number; dealId: number; lenderId: number | null; ratePct: number; advancePct: number; termMonths: number; feesPct: number; conditions: string; status: string; createdAt: string };

const NAV = [
  ["dashboard", "Dashboard", LayoutDashboard], ["deals", "Deals", Handshake], ["leads", "Leads", Users],
  ["lenders", "Lenders", Landmark], ["investors", "Investors", Briefcase], ["terms", "Term Sheets", FileText],
  ["pipeline", "Pipeline", GitBranch], ["tasks", "Tasks", CheckSquare], ["commissions", "Commissions", DollarSign],
  ["reports", "Reports", BarChart3], ["ai", "AI Comms", Bot], ["engines", "Engines", Cog], ["portals", "Portals & Logins", KeyRound],
] as const;
type View = (typeof NAV)[number][0];

const DEAL_STAGES = ["Lead", "Application", "Term Sheet", "Underwriting", "Funded", "Declined", "Dead"];
const LEAD_STATUSES = ["New", "Contacted", "Qualified", "Proposal", "Negotiation", "Won", "Lost"];
const STAGE_STYLE: Record<string, string> = { Lead: "bg-stone-100 border-stone-300", Application: "bg-sky-50 border-sky-300", "Term Sheet": "bg-amber-50 border-amber-300", Underwriting: "bg-orange-50 border-orange-300", Funded: "bg-emerald-50 border-emerald-400", Declined: "bg-red-50 border-red-300", Dead: "bg-stone-200 border-stone-400" };
const STATUS_STYLE: Record<string, string> = { New: "bg-stone-100 text-stone-800", Contacted: "bg-sky-100 text-sky-800", Qualified: "bg-teal-100 text-teal-800", Proposal: "bg-amber-100 text-amber-800", Negotiation: "bg-orange-100 text-orange-800", Won: "bg-emerald-100 text-emerald-800", Lost: "bg-red-100 text-red-700" };
function fmt(n: number) { return n.toLocaleString("en-US"); }
function money(n: number) { return n >= 1_000_000 ? `$${(n / 1_000_000).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }
function pct(x: number) { return `${(x / 100).toFixed(2)}%`; }
const ACT_ICON: Record<string, any> = { note: StickyNote, task: CheckSquare, call: Phone, email: Mail, status: ActivityIcon, system: ActivityIcon, ai_draft: Bot };

export default function ControlCenter() {
  const [view, setView] = useState<View>("dashboard");
  const [reports, setReports] = useState<any>(null);
  const [deals, setDeals] = useState<{ rows: any[]; total: number; stageCounts: any[] } | null>(null);
  const [lenders, setLenders] = useState<Lender[]>([]);
  const [investors, setInvestors] = useState<Investor[]>([]);
  const [terms, setTerms] = useState<any[]>([]);
  const [leadsList, setLeadsList] = useState<{ data: Lead[]; total: number } | null>(null);
  const [tasks, setTasks] = useState<Act[]>([]);
  const [q, setQ] = useState("");
  const [selected, setSelected] = useState<number | null>(null);
  const [caseData, setCaseData] = useState<{ lead: Lead; enrichment: Enrichment | null; consents: Consent[]; timeline: Act[] } | null>(null);
  const [loadingCase, setLoadingCase] = useState(false);
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState(""); const [task, setTask] = useState(""); const [taskDue, setTaskDue] = useState("");
  const [dealQ, setDealQ] = useState("");
  const [newDeal, setNewDeal] = useState<any>(null);
  const [newLender, setNewLender] = useState(false);
  const [aiLead, setAiLead] = useState(""); const [aiTemplate, setAiTemplate] = useState("follow_up"); const [aiResult, setAiResult] = useState<any>(null); const [aiBusy, setAiBusy] = useState(false);
  const [msgLog, setMsgLog] = useState<any[]>([]);
  const [engines, setEngines] = useState<any>(null);
  const [engBusy, setEngBusy] = useState<string | false>(false);
  const [engResult, setEngResult] = useState<any>(null);
  const [docsList, setDocsList] = useState<any[]>([]);
  const [aai, setAai] = useState<any>(null);
  const [portals, setPortals] = useState<any>(null);
  useEffect(() => { if (view === "portals") fetch("/api/portals").then(r => r.json()).then(setPortals).catch(() => {}); }, [view]);
  const loadEngines = useCallback(async () => { const r = await fetch("/api/engines", { cache: "no-store" }); if (r.ok) setEngines(await r.json()); }, []);
  const loadDocs = useCallback(async () => { if (!selected) { setDocsList([]); return; } const r = await fetch(`/api/engines?docs=1&leadId=${selected}`, { cache: "no-store" }); if (r.ok) setDocsList((await r.json()).docs); }, [selected]);
  async function runEngine(run: string) {
    setEngBusy(run); setEngResult(null);
    const map: any = { verify: "IDE", assign: "LAE", close: "ACE", docs: "DPE" };
    const r = await fetch("/api/engines", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ engine: map[run] }) });
    const j = await r.json(); setEngResult(j); setEngBusy("");
    loadEngines(); loadReports(); loadDeals(dealQ); loadDocs();
  }
  useEffect(() => { loadEngines(); }, [loadEngines]);
  useEffect(() => { if (view === "engines") fetch("/api/aai").then(r => r.json()).then(setAai).catch(() => {}); }, [view]);
  useEffect(() => { if (view === "engines") loadDocs(); }, [view, selected, loadDocs]);
  const [seeded, setSeeded] = useState<any>(null);

  const loadReports = useCallback(async () => { const r = await fetch("/api/ccd/reports", { cache: "no-store" }); if (r.ok) setReports(await r.json()); }, []);
  const loadDeals = useCallback(async (qq = "") => { const r = await fetch(`/api/ccd/deals?pageSize=100${qq ? `&q=${encodeURIComponent(qq)}` : ""}`, { cache: "no-store" }); if (r.ok) setDeals(await r.json()); }, []);
  const [lenderQ, setLenderQ] = useState(""); const [lenderPage, setLenderPage] = useState(1); const [lenderTotal, setLenderTotal] = useState(0); const [lenderPages, setLenderPages] = useState(1);
  const [investorQ, setInvestorQ] = useState(""); const [investorPage, setInvestorPage] = useState(1); const [investorTotal, setInvestorTotal] = useState(0); const [investorPages, setInvestorPages] = useState(1);
  const loadLenders = useCallback(async (page = 1, qq = "") => { const r = await fetch(`/api/ccd/lenders?page=${page}&pageSize=24${qq ? `&q=${encodeURIComponent(qq)}` : ""}`, { cache: "no-store" }); if (r.ok) { const j = await r.json(); setLenders(j.rows); setLenderTotal(j.total); setLenderPages(Math.max(1, Math.ceil(j.total / j.pageSize))); } }, []);
  const loadInvestors = useCallback(async (page = 1, qq = "") => { const r = await fetch(`/api/ccd/investors?page=${page}&pageSize=24${qq ? `&q=${encodeURIComponent(qq)}` : ""}`, { cache: "no-store" }); if (r.ok) { const j = await r.json(); setInvestors(j.rows); setInvestorTotal(j.total); setInvestorPages(Math.max(1, Math.ceil(j.total / j.pageSize))); } }, []);
  const loadTerms = useCallback(async () => { const r = await fetch("/api/ccd/terms", { cache: "no-store" }); if (r.ok) setTerms((await r.json()).rows); }, []);
  const loadLeads = useCallback(async (qq = "") => { const r = await fetch(`/api/leads?pageSize=50&sort=score${qq ? `&q=${encodeURIComponent(qq)}` : ""}`, { cache: "no-store" }); if (r.ok) setLeadsList(await r.json()); }, []);
  const loadTasks = useCallback(async () => { const r = await fetch("/api/crm/activities?limit=100", { cache: "no-store" }); if (r.ok) setTasks((await r.json()).rows.filter((a: Act) => a.type === "task")); }, []);
  const checkSeed = useCallback(async () => { const r = await fetch("/api/ccd/seed", { cache: "no-store" }); if (r.ok) setSeeded(await r.json()); }, []);

  useEffect(() => { checkSeed(); loadReports(); loadDeals(); loadLenders(); loadInvestors(); loadTerms(); loadLeads(); loadTasks(); }, []);
  useEffect(() => { if (selected) { setLoadingCase(true); fetch(`/api/crm/case?leadId=${selected}`, { cache: "no-store" }).then(r => r.json()).then(j => { setCaseData(j); setLoadingCase(false); }); } else setCaseData(null); }, [selected]);
  useEffect(() => { const t = setTimeout(() => { if (view === "leads") loadLeads(q); if (view === "deals") loadDeals(dealQ); }, 300); return () => clearTimeout(t); }, [q, dealQ, view]);

  async function ensureSeed() { setBusy(true); const r = await fetch("/api/ccd/seed", { method: "POST" }); if (r.ok) { setSeeded(await r.json()); await Promise.all([loadReports(), loadDeals(), loadLenders(), loadInvestors(), loadTerms()]); } setBusy(false); }
  async function moveDeal(id: number, stage: string) { setBusy(true); await fetch("/api/ccd/deals", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, stage }) }); setBusy(false); loadDeals(dealQ); loadReports(); }
  async function createDeal() { if (!newDeal?.leadId) return; setBusy(true); await fetch("/api/ccd/deals", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(newDeal) }); setNewDeal(null); setBusy(false); loadDeals(dealQ); loadReports(); }
  async function addLender(f: any) { setBusy(true); await fetch("/api/ccd/lenders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); setNewLender(false); setBusy(false); loadLenders(); }
  async function addActivity(type: string) { if (!selected || (!note.trim() && !task.trim())) return; setBusy(true); await fetch("/api/crm/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: selected, type, body: type === "task" ? task : note, dueAt: type === "task" && taskDue ? new Date(taskDue).toISOString() : null }) }); setNote(""); setTask(""); setTaskDue(""); setBusy(false); if (selected) { const r = await fetch(`/api/crm/case?leadId=${selected}`, { cache: "no-store" }); if (r.ok) setCaseData(await r.json()); } loadTasks(); }
  async function toggleAct(a: Act) { await fetch("/api/crm/activities", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: a.id, done: a.done ? 0 : 1 }) }); loadTasks(); if (selected) { const r = await fetch(`/api/crm/case?leadId=${selected}`, { cache: "no-store" }); if (r.ok) setCaseData(await r.json()); } }
  async function moveLead(status: string) { if (!selected) return; setBusy(true); await fetch(`/api/leads/${selected}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) }); await fetch("/api/crm/activities", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: selected, type: "status", body: `Status → ${status}` }) }); const r = await fetch(`/api/crm/case?leadId=${selected}`, { cache: "no-store" }); if (r.ok) setCaseData(await r.json()); setBusy(false); loadLeads(q); loadReports(); }
  async function genAi() { setAiBusy(true); const r = await fetch("/api/ccd/ai-comms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: Number(aiLead), template: aiTemplate, save: true }) }); if (r.ok) setAiResult(await r.json()); setAiBusy(false); }
  async function createTerm(d: Deal) { setBusy(true); await fetch("/api/ccd/deals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "term_create", dealId: d.id, lenderId: d.lenderId, ratePct: d.ratePct || 1200, advancePct: 85, termMonths: 12, feesPct: 300, conditions: "Standard: personal guarantee, UCC-1 filing, monthly reporting.", status: "Draft" }) }); setBusy(false); loadTerms(); }

  const fundedDeals = useMemo(() => (deals?.rows || []).filter(r => r.deal.stage === "Funded"), [deals]);
  const commOwed = useMemo(() => fundedDeals.reduce((a, r) => a + (r.deal.amount * r.deal.commissionPct / 10000), 0), [fundedDeals]);

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900 flex">
      {/* Sidebar — GLINFICO Control Center nav */}
      <aside className="w-[210px] shrink-0 bg-stone-950 text-white min-h-screen sticky top-0 flex flex-col">
        <div className="p-4 border-b border-white/10">
          <div className="font-black text-lg tracking-tight">GLINFICO</div>
          <div className="text-[11px] text-emerald-400 font-bold tracking-wide">CONTROL CENTER</div>
        </div>
        <nav className="flex-1 p-2 space-y-0.5">
          {NAV.map(([key, label, Icon]) => (
            <button key={key} onClick={() => setView(key)} className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-sm font-bold ${view === key ? "bg-emerald-600 text-white" : "text-stone-300 hover:bg-white/10"}`}>
              <Icon className="w-4 h-4" />{label}
              {key === "tasks" && reports && <span className="ml-auto text-[10px] bg-amber-400 text-stone-950 rounded-full px-1.5 py-0.5 font-black">{reports.openTasks}</span>}
            </button>
          ))}
        </nav>
        <div className="p-3 border-t border-white/10 space-y-1">
          <a href="/lab" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-stone-300 hover:bg-white/10"><Home className="w-4 h-4" />Load Lab / Engine</a>
          <button onClick={async () => { await fetch("/api/gate", { method: "DELETE" }); location.href = "/gate"; }} className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-stone-300 hover:bg-red-500/20 hover:text-red-300 w-full text-left"><KeyRound className="w-4 h-4" />Sign out (PPG)</button>
          <a href="/api/leads/export?format=xlsx&scope=all" className="flex items-center gap-2 px-3 py-2 rounded-xl text-xs font-bold text-stone-300 hover:bg-white/10"><FileText className="w-4 h-4" />Export all (.xlsx)</a>
        </div>
      </aside>

      <main className="flex-1 min-w-0 p-4 sm:p-6">
        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div>
            <h1 className="font-black text-2xl tracking-tight capitalize">{NAV.find(n => n[0] === view)?.[1]}</h1>
            <p className="text-xs text-stone-500 mt-0.5">{fmt(reports?.totalDeals ?? 0)} deals · {fmt(leadsList?.total ?? 10000)} bank leads · {fmt(reports?.funded?.count ?? 0)} funded · {money(reports?.funded?.volume ?? 0)} volume</p>
          </div>
          {(!seeded?.deals || seeded.deals === 0) && (
            <button onClick={ensureSeed} disabled={busy} className="inline-flex items-center gap-1.5 bg-emerald-700 text-white font-black text-sm px-4 py-2.5 rounded-full disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Seed lender book + deals from bank history</button>
          )}
        </div>

        {/* DASHBOARD */}
        {view === "dashboard" && reports && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
              {[
                { l: "TOTAL DEALS", v: fmt(reports.totalDeals), s: "across all stages", i: Handshake },
                { l: "FUNDED VOLUME", v: money(reports.funded.volume), s: `${reports.funded.count} deals funded`, i: DollarSign },
                { l: "COMMISSION EARNED", v: money(reports.funded.commission), s: "on funded deals", i: DollarSign },
                { l: "OPEN TASKS", v: fmt(reports.openTasks), s: "need attention", i: CheckSquare },
              ].map(c => (
                <div key={c.l} className="bg-white border border-stone-200 rounded-2xl p-4">
                  <div className="flex justify-between text-stone-500"><span className="text-[11px] font-black tracking-wide">{c.l}</span><c.i className="w-4 h-4" /></div>
                  <div className="font-black text-2xl mt-1">{c.v}</div><div className="text-xs text-stone-500 mt-0.5">{c.s}</div>
                </div>
              ))}
            </div>
            <div className="grid lg:grid-cols-3 gap-3">
              <div className="bg-white border border-stone-200 rounded-2xl p-4">
                <b className="text-sm">Deal stages</b>
                <div className="mt-3 space-y-2">{reports.stageRows.map((r: any) => (
                  <button key={r.stage} onClick={() => setView("pipeline")} className="w-full flex items-center gap-2 text-xs group">
                    <span className="w-24 text-left font-bold shrink-0">{r.stage}</span>
                    <span className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden"><span className={`block h-full rounded-full ${STAGE_STYLE[r.stage] ? "bg-emerald-500" : "bg-stone-400"}`} style={{ width: `${Math.min(100, (r.v / Math.max(1, reports.totalDeals)) * 100)}%` }} /></span>
                    <span className="w-14 text-right font-bold">{fmt(r.v)} · {money(Number(r.amt))}</span>
                  </button>))}
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4">
                <b className="text-sm">By product</b>
                <div className="mt-3 space-y-2">{reports.productRows.map((r: any) => (
                  <div key={r.product} className="flex justify-between text-xs"><span className="font-bold">{r.product}</span><span className="text-stone-500">{fmt(r.v)} deals · {money(Number(r.amt))}</span></div>))}
                </div>
              </div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4">
                <b className="text-sm">By lender</b>
                <div className="mt-3 space-y-2">{reports.lenderRows.slice(0, 8).map((r: any) => (
                  <div key={r.name} className="flex justify-between text-xs"><span className="font-bold truncate">{r.name}</span><span className="text-stone-500">{fmt(r.v)} · {money(Number(r.amt))} · comm {money(Number(r.comm))}</span></div>))}
                </div>
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <b className="text-sm">Recent activity</b>
              <div className="mt-2 space-y-1.5">{reports.recentActs.map((a: any) => { const Icon = ACT_ICON[a.type] || StickyNote; return (
                <div key={a.id} className="flex gap-2 text-xs border border-stone-100 rounded-lg px-3 py-2">
                  <Icon className="w-3.5 h-3.5 mt-0.5 text-emerald-700 shrink-0" />
                  <button onClick={() => { setView("leads"); setSelected(a.leadId); }} className="font-bold shrink-0">#{a.leadId}</button>
                  <span className="text-stone-600 truncate flex-1">{a.body}</span>
                  <span className="text-stone-400 shrink-0">{new Date(a.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</span>
                </div>); })}
              </div>
            </div>
          </div>
        )}

        {/* DEALS */}
        {view === "deals" && (
          <div className="space-y-3">
            <div className="flex flex-wrap gap-2 items-center">
              <label className="flex items-center gap-2 bg-white border border-stone-300 rounded-full px-3 py-2"><Search className="w-4 h-4 text-stone-400" /><input value={dealQ} onChange={e => setDealQ(e.target.value)} placeholder="Search deals…" className="outline-none text-sm w-52" /></label>
              <button onClick={() => setNewDeal({ leadId: "", title: "New deal", product: "Term Loan", amount: 25000, stage: "Lead", lenderId: lenders[0]?.id, commissionPct: 500 })} className="inline-flex items-center gap-1.5 bg-stone-950 text-white font-bold text-sm px-4 py-2 rounded-full"><Plus className="w-4 h-4" />New deal</button>
            </div>
            {newDeal && (
              <div className="bg-white border-2 border-emerald-600 rounded-2xl p-4 grid sm:grid-cols-6 gap-2 items-end">
                <input placeholder="Lead ID" value={newDeal.leadId} onChange={e => setNewDeal({ ...newDeal, leadId: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
                <input placeholder="Title" value={newDeal.title} onChange={e => setNewDeal({ ...newDeal, title: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
                <select value={newDeal.product} onChange={e => setNewDeal({ ...newDeal, product: e.target.value })} className="border border-stone-300 rounded-xl px-2 py-2 text-sm">{["Term Loan", "Line of Credit", "Invoice Financing", "Bridge"].map(p => <option key={p}>{p}</option>)}</select>
                <input type="number" placeholder="Amount" value={newDeal.amount} onChange={e => setNewDeal({ ...newDeal, amount: Number(e.target.value) })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
                <select value={newDeal.lenderId} onChange={e => setNewDeal({ ...newDeal, lenderId: Number(e.target.value) })} className="border border-stone-300 rounded-xl px-2 py-2 text-sm">{lenders.map(l => <option key={l.id} value={l.id}>{l.name}</option>)}</select>
                <button onClick={createDeal} disabled={busy} className="bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-50">Create</button>
              </div>
            )}
            <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[900px]">
                <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-4 py-3">Deal</th><th className="px-3 py-3">Lead</th><th className="px-3 py-3">Lender</th><th className="px-3 py-3">Product</th><th className="px-3 py-3">Amount</th><th className="px-3 py-3">Stage</th><th className="px-3 py-3">Comm.</th><th className="px-3 py-3">Move</th></tr></thead>
                <tbody>
                  {(deals?.rows || []).map((r: any) => { const d = r.deal; return (
                    <tr key={d.id} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="px-4 py-2.5 font-bold">{d.title}<div className="text-[11px] text-stone-400 font-normal">#{d.id}</div></td>
                      <td className="px-3 py-2.5"><button onClick={() => { setView("leads"); setSelected(d.leadId); }} className="font-semibold text-emerald-700 hover:underline">{r.lead ? `${r.lead.firstName} ${r.lead.lastName}` : `#${d.leadId}`}</button></td>
                      <td className="px-3 py-2.5 text-xs">{r.lender?.name || "—"}</td>
                      <td className="px-3 py-2.5">{d.product}</td>
                      <td className="px-3 py-2.5 font-bold">{money(d.amount)}</td>
                      <td className="px-3 py-2.5"><span className={`text-xs font-bold px-2 py-1 rounded-full border ${STAGE_STYLE[d.stage]}`}>{d.stage}</span></td>
                      <td className="px-3 py-2.5">{d.stage === "Funded" ? <b className="text-emerald-700">{money(d.amount * d.commissionPct / 10000)}</b> : <span className="text-stone-400">{pct(d.commissionPct)}</span>}</td>
                      <td className="px-3 py-2.5"><select value={d.stage} onChange={e => moveDeal(d.id, e.target.value)} className="text-xs border border-stone-300 rounded-lg px-1.5 py-1">{DEAL_STAGES.map(s => <option key={s}>{s}</option>)}</select></td>
                    </tr>); })}
                  {(!deals || deals.rows.length === 0) && <tr><td colSpan={8} className="p-8 text-center text-stone-400">No deals yet — press “Seed lender book + deals from bank history” above.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* LEADS + CCD */}
        {view === "leads" && (
          <div className="grid lg:grid-cols-[1fr_400px] gap-5 items-start">
            <div className="space-y-3">
              <label className="flex items-center gap-2 bg-white border border-stone-300 rounded-full px-3 py-2 w-fit"><Search className="w-4 h-4 text-stone-400" /><input value={q} onChange={e => setQ(e.target.value)} placeholder="Search leads…" className="outline-none text-sm w-64" /></label>
              <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
                <table className="w-full text-sm min-w-[860px]">
                  <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-4 py-3">Lead</th><th className="px-3 py-3">Loan history</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Score</th><th className="px-3 py-3">Value</th></tr></thead>
                  <tbody>
                    {(leadsList?.data || []).map(l => (
                      <tr key={l.id} onClick={() => setSelected(l.id)} className={`border-b border-stone-50 hover:bg-emerald-50 cursor-pointer ${selected === l.id ? "bg-emerald-50" : ""}`}>
                        <td className="px-4 py-2.5"><div className="font-bold">{l.firstName} {l.lastName} <span className="text-stone-400 font-semibold text-xs">#{l.id}</span></div><div className="text-xs text-stone-500 truncate max-w-[220px]">{l.email}</div></td>
                        <td className="px-3 py-2.5 text-xs"><span className={`font-bold ${l.loanOutcome === "Funded" ? "text-emerald-700" : l.loanOutcome === "Declined" ? "text-red-600" : "text-amber-700"}`}>{l.loanOutcome === "In System — No Decision Yet" ? "In system" : l.loanOutcome}</span> {l.loanAmount ? `· ${money(l.loanAmount)}` : ""}</td>
                        <td className="px-3 py-2.5"><span className={`text-xs font-bold px-2 py-1 rounded-full ${STATUS_STYLE[l.status]}`}>{l.status}</span></td>
                        <td className="px-3 py-2.5 font-black text-emerald-700">{l.score}</td>
                        <td className="px-3 py-2.5 font-bold">{money(l.estimatedValue)}</td>
                      </tr>))}
                  </tbody>
                </table>
              </div>
            </div>
            {/* CCD panel */}
            <aside className="bg-white border border-stone-200 rounded-3xl overflow-hidden sticky top-5 max-h-[calc(100vh-40px)] flex flex-col">
              {!caseData && !loadingCase && <div className="p-8 text-center text-stone-400"><Users className="w-10 h-10 mx-auto text-stone-300" /><div className="font-bold text-stone-600 mt-3">Select a lead to open its CCD</div><p className="text-xs mt-1">Contact · bank loan history · IDIQ/FinGoal · consent evidence · timeline.</p></div>}
              {loadingCase && <div className="p-8 text-center"><Loader2 className="w-6 h-6 animate-spin mx-auto text-stone-400" /></div>}
              {caseData && (
                <>
                  <div className="p-5 border-b border-stone-100">
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-black text-xl leading-tight">{caseData.lead.firstName} {caseData.lead.lastName} <span className="text-stone-400 text-sm">#{caseData.lead.id}</span></div>
                        <div className="text-sm text-stone-500">{caseData.lead.jobTitle} · {caseData.lead.company}</div>
                        <div className="text-xs text-stone-500 mt-0.5">{caseData.lead.email} · {caseData.lead.phone}</div>
                      <div className="flex flex-wrap items-center gap-1.5 mt-1.5 text-[11px]">
                        <span className="bg-stone-100 rounded-full px-2 py-1 font-bold">DOB {caseData.lead.dob ? new Date(caseData.lead.dob).toLocaleDateString() : "—"}</span>
                        <span className="bg-stone-100 rounded-full px-2 py-1 font-bold">SSN {caseData.lead.ssn ? `***-**-${String(caseData.lead.ssn).replace(/\D/g, "").slice(-4)}` : "—"}</span>
                        {caseData.lead.ssn && caseData.lead.dob ? <span className="bg-emerald-100 text-emerald-800 rounded-full px-2 py-1 font-black">IDIQ-ready ✓</span> : <span className="bg-red-100 text-red-700 rounded-full px-2 py-1 font-black">IDIQ will REJECT — missing {!["ssn", "dob"].filter(k => !(caseData.lead as any)[k]).map(k => k.toUpperCase()).join(" + ")}</span>}
                      </div>
                      </div>
                      <button onClick={() => setSelected(null)} className="text-stone-400 hover:text-stone-700"><X className="w-5 h-5" /></button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 mt-3">{LEAD_STATUSES.map(s => <button key={s} onClick={() => moveLead(s)} disabled={busy} className={`text-[11px] font-bold px-2.5 py-1.5 rounded-full border ${caseData.lead.status === s ? "bg-stone-950 text-white border-stone-950" : "bg-white border-stone-200 text-stone-500"}`}>{s}</button>)}</div>
                  </div>
                  <div className="overflow-y-auto flex-1 p-5 space-y-4">
                    <section className="border border-stone-200 rounded-2xl p-3.5">
                      <div className="text-[11px] font-black text-stone-500 flex items-center gap-1.5"><Landmark className="w-4 h-4 text-emerald-700" /> BANK DB — LOAN HISTORY</div>
                      <div className="grid grid-cols-2 gap-2 mt-2.5 text-sm">
                        <div><span className="text-xs text-stone-400 block">Outcome</span><b className={caseData.lead.loanOutcome === "Funded" ? "text-emerald-700" : caseData.lead.loanOutcome === "Declined" ? "text-red-600" : "text-amber-700"}>{caseData.lead.loanOutcome}</b></div>
                        <div><span className="text-xs text-stone-400 block">Amount</span><b>{money(caseData.lead.loanAmount)}</b></div>
                        <div><span className="text-xs text-stone-400 block">Applied</span><b>{caseData.lead.applicationDate ? new Date(caseData.lead.applicationDate).toLocaleDateString() : "—"}</b></div>
                        <div><span className="text-xs text-stone-400 block">Origin</span><b className="text-[11px]">{caseData.lead.originSystem}</b></div>
                      </div>
                    </section>
                    <section className="border border-stone-200 rounded-2xl p-3.5">
                      <div className="text-[11px] font-black text-stone-500 flex items-center gap-1.5"><Target className="w-4 h-4 text-emerald-700" /> SCORE & ENRICHMENT</div>
                      {caseData.enrichment ? <div className="grid grid-cols-2 gap-2 mt-2.5 text-sm">
                        <div><span className="text-xs text-stone-400 block">Final score</span><b className="text-emerald-700 text-lg">{caseData.enrichment.finalScore}<span className="text-xs text-stone-400">/100</span></b></div>
                        <div><span className="text-xs text-stone-400 block"><Fingerprint className="w-3 h-3 inline" /> IDIQ</span><b className="text-xs">{caseData.enrichment.identityStatus} · {caseData.enrichment.creditScore} {caseData.enrichment.creditBand}</b></div>
                        <div><span className="text-xs text-stone-400 block"><CreditCard className="w-3 h-3 inline" /> FinGoal</span><b className="text-xs">{caseData.enrichment.fingoalStatus} · {caseData.enrichment.monthlyIncome ? money(caseData.enrichment.monthlyIncome) + "/mo" : "—"}</b></div>
                        <div><span className="text-xs text-stone-400 block">IDE</span><b className="text-xs">{caseData.enrichment.routedToIde} {caseData.enrichment.ideRef}</b></div>
                      </div> : <div className="text-xs text-stone-400 mt-2">Not enriched.</div>}
                    </section>
                    <section className="border border-stone-200 rounded-2xl p-3.5">
                      <div className="text-[11px] font-black text-stone-500 flex items-center gap-1.5"><ShieldCheck className="w-4 h-4 text-emerald-700" /> CONSENT</div>
                      <div className="space-y-1 mt-2">{caseData.consents.map((c, i) => <div key={i} className="flex justify-between text-xs border border-stone-100 rounded-lg px-2.5 py-1.5"><span className="font-bold">{c.scope.replace(/_/g, " ")}</span><span className={c.status === "Granted" ? "text-emerald-700 font-black" : "text-amber-700 font-black"}>{c.status}</span></div>)}</div>
                    </section>
                    <section className="border border-stone-200 rounded-2xl p-3.5">
                      <div className="text-[11px] font-black text-stone-500 flex items-center gap-1.5"><ActivityIcon className="w-4 h-4 text-emerald-700" /> TIMELINE</div>
                      <div className="flex gap-1.5 mt-2.5"><input value={note} onChange={e => setNote(e.target.value)} placeholder="Note…" className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2 text-sm" /><button disabled={busy || !note.trim()} onClick={() => addActivity("note")} className="bg-stone-950 text-white rounded-xl px-3.5 text-sm font-bold disabled:opacity-40"><Plus className="w-4 h-4 inline" /> Note</button></div>
                      <div className="flex gap-1.5 mt-2"><input value={task} onChange={e => setTask(e.target.value)} placeholder="Task…" className="flex-1 min-w-0 border border-stone-300 rounded-xl px-3 py-2 text-sm" /><input type="date" value={taskDue} onChange={e => setTaskDue(e.target.value)} className="border border-stone-300 rounded-xl px-2 py-2 text-sm" /><button disabled={busy || !task.trim()} onClick={() => addActivity("task")} className="bg-emerald-700 text-white rounded-xl px-3.5 text-sm font-bold disabled:opacity-40">Task</button></div>
                      <div className="space-y-1.5 mt-3 max-h-64 overflow-y-auto pr-1">
                        {caseData.timeline.map(a => { const Icon = ACT_ICON[a.type] || StickyNote; return (
                          <div key={a.id} className="flex gap-2 text-sm border border-stone-200 rounded-xl px-3 py-2 bg-white">
                            <Icon className="w-4 h-4 mt-0.5 shrink-0 text-emerald-700" />
                            <div className="flex-1 min-w-0"><div className={`text-[13px] ${a.done ? "line-through text-stone-400" : ""}`}>{a.body}</div><div className="text-[11px] text-stone-400 mt-0.5">{a.type}{a.dueAt ? ` · due ${new Date(a.dueAt).toLocaleDateString()}` : ""} · {new Date(a.createdAt).toLocaleString([], { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</div></div>
                            {a.type === "task" && <button onClick={() => toggleAct(a)} className={`shrink-0 w-6 h-6 rounded-full border grid place-items-center ${a.done ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-300"}`}><Check className="w-3.5 h-3.5" /></button>}
                          </div>); })}
                        {caseData.timeline.length === 0 && <div className="text-xs text-stone-400">No activity yet.</div>}
                      </div>
                    </section>
                  </div>
                </>
              )}
            </aside>
          </div>
        )}

        {/* LENDERS */}
        {view === "lenders" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <button onClick={() => setNewLender(true)} className="inline-flex items-center gap-1.5 bg-stone-950 text-white font-bold text-sm px-4 py-2 rounded-full"><Plus className="w-4 h-4" />Add lender</button>
              <button onClick={async () => { setBusy(true); const r = await fetch("/api/ccd/seed", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "fill_directories" }) }); const j = await r.json(); setBusy(false); loadLenders(1, lenderQ); loadInvestors(1, investorQ); if (j.ok) setAiResult({ draft: { subject: "Directories filled", body: `Lenders: ${j.lenders.toLocaleString()} (added ${j.addedLenders.toLocaleString()})\nInvestors: ${j.investors.toLocaleString()} (added ${j.addedInvestors.toLocaleString()})` }, complianceNote: "Idempotent — safe to press again; only fills up to 22,450 lenders / 3,000 investors." }); }} disabled={busy} className="inline-flex items-center gap-1.5 bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-full disabled:opacity-50">{busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Fill to 22,450 lenders / 3,000 investors</button>
              <label className="flex items-center gap-2 bg-white border border-stone-300 rounded-full px-3 py-2"><Search className="w-4 h-4 text-stone-400" /><input value={lenderQ} onChange={e => { setLenderQ(e.target.value); setLenderPage(1); loadLenders(1, e.target.value); }} placeholder="Search lenders…" className="outline-none text-sm w-52" /></label>
              <span className="text-xs font-bold text-stone-500">{fmt(lenderTotal)} lenders · page {lenderPage}/{lenderPages}</span>
              <div className="flex gap-1.5">
                <button disabled={lenderPage <= 1} onClick={() => { setLenderPage(p => p - 1); loadLenders(lenderPage - 1, lenderQ); }} className="px-3 py-2 rounded-full border border-stone-300 text-xs font-bold disabled:opacity-40">‹ Prev</button>
                <button disabled={lenderPage >= lenderPages} onClick={() => { setLenderPage(p => p + 1); loadLenders(lenderPage + 1, lenderQ); }} className="px-3 py-2 rounded-full border border-stone-300 text-xs font-bold disabled:opacity-40">Next ›</button>
              </div>
            </div>
            {newLender && <LenderForm busy={busy} onSave={addLender} onCancel={() => setNewLender(false)} />}
            <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
              {lenders.map(l => (
                <div key={l.id} className="bg-white border border-stone-200 rounded-2xl p-4">
                  <div className="flex justify-between items-start"><b>{l.name}</b><span className="text-[10px] font-black bg-stone-100 rounded-full px-2 py-0.5">{l.kind}</span></div>
                  <div className="text-xs text-stone-500 mt-1">{l.products}</div>
                  <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                    <div><span className="text-stone-400 block">Min FICO</span><b>{l.minFico}</b></div>
                    <div><span className="text-stone-400 block">Max amount</span><b>{money(l.maxAmount)}</b></div>
                    <div><span className="text-stone-400 block">Advance rate</span><b>{l.advanceRatePct}%</b></div>
                    <div><span className="text-stone-400 block">Rate</span><b>{pct(l.ratePct)}/mo</b></div>
                  </div>
                  <div className="text-[11px] text-stone-500 mt-2">{l.contactEmail} · {l.phone}</div>
                  {l.notes && <div className="text-[11px] text-stone-400 mt-1">{l.notes}</div>}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* INVESTORS */}
        {view === "investors" && (
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <label className="flex items-center gap-2 bg-white border border-stone-300 rounded-full px-3 py-2"><Search className="w-4 h-4 text-stone-400" /><input value={investorQ} onChange={e => { setInvestorQ(e.target.value); setInvestorPage(1); loadInvestors(1, e.target.value); }} placeholder="Search investors…" className="outline-none text-sm w-52" /></label>
              <span className="text-xs font-bold text-stone-500">{fmt(investorTotal)} investors · page {investorPage}/{investorPages}</span>
              <div className="flex gap-1.5">
                <button disabled={investorPage <= 1} onClick={() => { setInvestorPage(p => p - 1); loadInvestors(investorPage - 1, investorQ); }} className="px-3 py-2 rounded-full border border-stone-300 text-xs font-bold disabled:opacity-40">‹ Prev</button>
                <button disabled={investorPage >= investorPages} onClick={() => { setInvestorPage(p => p + 1); loadInvestors(investorPage + 1, investorQ); }} className="px-3 py-2 rounded-full border border-stone-300 text-xs font-bold disabled:opacity-40">Next ›</button>
              </div>
            </div>
          <div className="grid md:grid-cols-2 xl:grid-cols-3 gap-3">
            {investors.map(v => (
              <div key={v.id} className="bg-white border border-stone-200 rounded-2xl p-4">
                <b>{v.name}</b>
                <div className="text-xs text-stone-500 mt-1">{v.focus}</div>
                <div className="grid grid-cols-2 gap-2 mt-2.5 text-xs">
                  <div><span className="text-stone-400 block">Min ticket</span><b>{money(v.minTicket)}</b></div>
                  <div><span className="text-stone-400 block">Max ticket</span><b>{money(v.maxTicket)}</b></div>
                </div>
                <div className="text-[11px] text-stone-500 mt-2">{v.contactEmail}</div>
                {v.notes && <div className="text-[11px] text-stone-400 mt-1">{v.notes}</div>}
              </div>
            ))}
            {investors.length === 0 && <div className="text-stone-400 text-sm">No investors yet — seed them from the Dashboard button.</div>}
          </div>
          </div>
        )}

        {/* TERM SHEETS */}
        {view === "terms" && (
          <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
            <table className="w-full text-sm min-w-[860px]">
              <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-4 py-3">Deal</th><th className="px-3 py-3">Lender</th><th className="px-3 py-3">Rate</th><th className="px-3 py-3">Advance</th><th className="px-3 py-3">Term</th><th className="px-3 py-3">Fees</th><th className="px-3 py-3">Status</th><th className="px-3 py-3"></th></tr></thead>
              <tbody>
                {terms.map((r: any) => { const t = r.t; return (
                  <tr key={t.id} className="border-b border-stone-50">
                    <td className="px-4 py-2.5 font-bold">{r.d?.title || `Deal #${t.dealId}`}</td>
                    <td className="px-3 py-2.5 text-xs">{r.l?.name || "—"}</td>
                    <td className="px-3 py-2.5">{pct(t.ratePct)}/mo</td>
                    <td className="px-3 py-2.5">{t.advancePct}%</td>
                    <td className="px-3 py-2.5">{t.termMonths} mo</td>
                    <td className="px-3 py-2.5">{pct(t.feesPct)}</td>
                    <td className="px-3 py-2.5"><span className={`text-xs font-bold px-2 py-1 rounded-full ${t.status === "Accepted" ? "bg-emerald-100 text-emerald-800" : t.status === "Rejected" ? "bg-red-100 text-red-700" : t.status === "Sent" ? "bg-sky-100 text-sky-800" : "bg-stone-100 text-stone-600"}`}>{t.status}</span></td>
                    <td className="px-3 py-2.5"><select value={t.status} onChange={async e => { await fetch("/api/ccd/deals", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "term_update", id: t.id, status: e.target.value }) }); loadTerms(); }} className="text-xs border border-stone-300 rounded-lg px-1.5 py-1">{["Draft", "Sent", "Accepted", "Rejected"].map(s => <option key={s}>{s}</option>)}</select></td>
                  </tr>); })}
                {terms.length === 0 && <tr><td colSpan={8} className="p-8 text-center text-stone-400">No term sheets — open a deal in Deals and create one.</td></tr>}
              </tbody>
            </table>
          </div>
        )}

        {/* PIPELINE */}
        {view === "pipeline" && (
          <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2.5">
            {DEAL_STAGES.map(s => {
              const stageDeals = (deals?.rows || []).filter(r => r.deal.stage === s);
              return (
                <div key={s} className={`border-2 rounded-2xl p-2.5 min-h-[280px] ${STAGE_STYLE[s]}`}>
                  <div className="flex items-center justify-between px-1 pb-2"><b className="text-xs font-black">{s.toUpperCase()}</b><span className="text-xs font-black bg-white/70 rounded-full px-2 py-0.5">{stageDeals.length}</span></div>
                  <div className="space-y-2">
                    {stageDeals.map((r: any) => (
                      <div key={r.deal.id} className="bg-white border border-stone-200 rounded-xl p-2.5 shadow-sm">
                        <div className="font-bold text-[13px] leading-tight">{r.deal.title}</div>
                        <div className="text-[11px] text-stone-500">{r.lead ? `${r.lead.firstName} ${r.lead.lastName}` : `#${r.deal.leadId}`} · {r.lender?.name || ""}</div>
                        <div className="flex items-center justify-between mt-1.5 text-[11px]"><b>{money(r.deal.amount)}</b>{r.deal.stage === "Funded" && <span className="text-emerald-700 font-black">+ {money(r.deal.amount * r.deal.commissionPct / 10000)}</span>}</div>
                        <select value={r.deal.stage} onChange={e => moveDeal(r.deal.id, e.target.value)} className="mt-1.5 w-full text-[11px] border border-stone-300 rounded-lg px-1 py-1">{DEAL_STAGES.map(x => <option key={x}>{x}</option>)}</select>
                      </div>
                    ))}
                    {stageDeals.length === 0 && <div className="text-[11px] text-stone-400 px-1 py-4 text-center">empty</div>}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* TASKS */}
        {view === "tasks" && (
          <div className="bg-white border border-stone-200 rounded-2xl p-4 space-y-1.5">
            {tasks.map(a => (
              <div key={a.id} className="flex gap-3 items-center border border-stone-100 rounded-xl px-3 py-2.5">
                <button onClick={() => toggleAct(a)} className={`w-6 h-6 rounded-full border grid place-items-center shrink-0 ${a.done ? "bg-emerald-600 border-emerald-600 text-white" : "border-stone-300"}`}><Check className="w-3.5 h-3.5" /></button>
                <div className={`flex-1 text-sm ${a.done ? "line-through text-stone-400" : ""}`}>{a.body}</div>
                <button onClick={() => { setView("leads"); setSelected(a.leadId); }} className="text-xs font-bold text-emerald-700 shrink-0">#{a.leadId}</button>
                {a.dueAt && <span className={`text-xs shrink-0 font-bold ${new Date(a.dueAt) < new Date() && !a.done ? "text-red-600" : "text-stone-400"}`}>due {new Date(a.dueAt).toLocaleDateString()}</span>}
              </div>
            ))}
            {tasks.length === 0 && <div className="text-sm text-stone-400 p-4">No tasks — add some from a lead's CCD timeline.</div>}
          </div>
        )}

        {/* COMMISSIONS */}
        {view === "commissions" && (
          <div className="space-y-3">
            <div className="grid grid-cols-3 gap-3">
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-center"><div className="text-[11px] font-black text-stone-500">FUNDED DEALS</div><div className="font-black text-2xl">{fundedDeals.length}</div></div>
              <div className="bg-white border border-stone-200 rounded-2xl p-4 text-center"><div className="text-[11px] font-black text-stone-500">VOLUME</div><div className="font-black text-2xl">{money(fundedDeals.reduce((a, r) => a + r.deal.amount, 0))}</div></div>
              <div className="bg-emerald-700 text-white rounded-2xl p-4 text-center"><div className="text-[11px] font-black text-emerald-200">COMMISSION EARNED</div><div className="font-black text-2xl">{money(commOwed)}</div></div>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[700px]">
                <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-4 py-3">Deal</th><th className="px-3 py-3">Lead</th><th className="px-3 py-3">Lender</th><th className="px-3 py-3">Funded amount</th><th className="px-3 py-3">Rate</th><th className="px-3 py-3">Commission</th><th className="px-3 py-3">Funded</th></tr></thead>
                <tbody>
                  {fundedDeals.map((r: any) => (
                    <tr key={r.deal.id} className="border-b border-stone-50">
                      <td className="px-4 py-2.5 font-bold">{r.deal.title}</td>
                      <td className="px-3 py-2.5">{r.lead ? `${r.lead.firstName} ${r.lead.lastName}` : `#${r.deal.leadId}`}</td>
                      <td className="px-3 py-2.5 text-xs">{r.lender?.name || "—"}</td>
                      <td className="px-3 py-2.5 font-bold">{money(r.deal.amount)}</td>
                      <td className="px-3 py-2.5">{pct(r.deal.commissionPct)}</td>
                      <td className="px-3 py-2.5 font-black text-emerald-700">{money(r.deal.amount * r.deal.commissionPct / 10000)}</td>
                      <td className="px-3 py-2.5 text-xs text-stone-500">{r.deal.fundedAt ? new Date(r.deal.fundedAt).toLocaleDateString() : "—"}</td>
                    </tr>))}
                  {fundedDeals.length === 0 && <tr><td colSpan={7} className="p-8 text-center text-stone-400">No funded deals yet.</td></tr>}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* REPORTS */}
        {view === "reports" && reports && (
          <div className="grid lg:grid-cols-2 gap-3">
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <b className="text-sm">Lead funnel (pipeline status)</b>
              <div className="mt-3 space-y-2">{reports.leadStatus.map((r: any) => (
                <div key={r.label} className="flex items-center gap-2 text-xs"><span className="w-24 font-bold">{r.label}</span><span className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden"><span className="block h-full bg-emerald-500 rounded-full" style={{ width: `${(r.v / Math.max(1, leadsList?.total || 10000)) * 100}%` }} /></span><span className="w-12 text-right font-bold">{fmt(r.v)}</span></div>))}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <b className="text-sm">Bank loan outcomes (origin DB)</b>
              <div className="mt-3 space-y-2">{reports.loanOutcome.map((r: any) => (
                <div key={r.label} className="flex items-center gap-2 text-xs"><span className="w-40 font-bold truncate">{r.label}</span><span className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden"><span className="block h-full bg-amber-500 rounded-full" style={{ width: `${(r.v / Math.max(1, leadsList?.total || 10000)) * 100}%` }} /></span><span className="w-12 text-right font-bold">{fmt(r.v)}</span></div>))}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4">
              <b className="text-sm">Deal volume by stage</b>
              <div className="mt-3 space-y-2">{reports.stageRows.map((r: any) => (
                <div key={r.stage} className="flex items-center gap-2 text-xs"><span className="w-24 font-bold">{r.stage}</span><span className="flex-1 h-2.5 bg-stone-100 rounded-full overflow-hidden"><span className="block h-full bg-sky-500 rounded-full" style={{ width: `${Math.min(100, (Number(r.amt) / Math.max(1, ...reports.stageRows.map((x: any) => Number(x.amt)))) * 100)}%` }} /></span><span className="w-20 text-right font-bold">{money(Number(r.amt))}</span></div>))}
              </div>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl p-4 flex flex-col gap-2">
              <b className="text-sm">Exports</b>
              <a href="/api/leads/export?format=xlsx&scope=all" className="text-sm font-bold text-emerald-700 underline">All bank leads (.xlsx, 45 cols incl. consent + loan outcome)</a>
              <a href="/api/leads/export?format=csv&scope=all&outcome=Funded" className="text-sm font-bold text-emerald-700 underline">Funded-only (.csv)</a>
              <a href="/api/ide/leads?format=xlsx&minScore=80" className="text-sm font-bold text-emerald-700 underline">IDE scored ≥80 (.xlsx)</a>
            </div>
          </div>
        )}

        {/* ENGINES — IDE / LAE / ACE / DPE */}
        {view === "engines" && (
          <div className="space-y-4">
            <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex flex-wrap items-center gap-3 text-sm">
              <CheckSquare className="w-5 h-5 text-amber-600 shrink-0" />
              <b>Monday target: clean the REI.</b>
              <span className="text-stone-600">Queued as a task. Meanwhile, grab the live APIs — <b>IDIQ</b>, <b>FinGoal</b>, <b>Data Link</b>, <b>Twilio</b> — and drop the keys in the engine env (Integration Vault in /lab lists every name). Engines flip from SIMULATED to LIVE automatically.</span>
            </div>
            <div className="grid md:grid-cols-2 gap-3">
              {(engines?.engines || []).map((e: any) => (
                <div key={e.id} className="bg-white border border-stone-200 rounded-2xl p-5">
                  <div className="flex items-center justify-between">
                    <b className="text-lg">{e.id} — {e.name}</b>
                    <span className="text-[10px] font-black bg-emerald-100 text-emerald-800 rounded-full px-2 py-1">OPERATIONAL</span>
                  </div>
                  <p className="text-xs text-stone-500 mt-1 leading-relaxed">{e.desc}</p>
                  <p className="text-xs font-bold text-stone-700 mt-2">{e.stat}</p>
                  <div className="flex flex-wrap gap-2 mt-3">
                    <button onClick={() => runEngine(e.run)} disabled={!!engBusy} className="inline-flex items-center gap-1.5 bg-stone-950 text-white font-bold text-sm px-4 py-2 rounded-full disabled:opacity-50">{engBusy === e.run ? <Loader2 className="w-4 h-4 animate-spin" /> : <Cog className="w-4 h-4" />}Run {e.id}</button>
                    {e.run === "docs" && <label className="inline-flex items-center gap-1.5 border border-stone-300 font-bold text-sm px-4 py-2 rounded-full cursor-pointer">Upload client doc<input type="file" className="hidden" onChange={async ev => { const f = ev.target.files?.[0]; if (!f || !selected) return; const fd = new FormData(); fd.append("file", f); fd.append("leadId", String(selected)); const r = await fetch("/api/engines", { method: "PUT", body: fd }); const j = await r.json(); setEngResult({ engine: "DPE upload", ...j }); loadDocs(); }} /></label>}
                  </div>
                  {engResult?.engine === e.run && <pre className="mt-3 text-[11px] bg-stone-50 border border-stone-200 rounded-xl p-3 overflow-x-auto">{JSON.stringify(engResult, null, 1).slice(0, 900)}</pre>}
                </div>
              ))}
            </div>
            {selected && docsList.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <b className="text-sm flex items-center gap-2"><FolderOpen className="w-4 h-4 text-emerald-700" />DPE vault — docs for lead #{selected}</b>
                <div className="space-y-1.5 mt-3">
                  {docsList.map((d: any) => <div key={d.id} className="flex justify-between text-xs border border-stone-100 rounded-lg px-3 py-2"><span className="font-bold">{d.name}</span><span className={d.status === "missing" ? "text-red-600 font-black" : "text-emerald-700 font-black"}>{d.status}{d.size ? ` · ${(d.size / 1024).toFixed(1)}KB` : ""}</span></div>)}
                </div>
              </div>
            )}
            {/* AAI — ID & Tier standard */}
            <div className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <b className="text-sm flex items-center gap-2"><Cog className="w-4 h-4 text-emerald-700" />AAI — ID &amp; Tier standard (P/G/L/I/SL/BL - 1026 - 100001+)</b>
                <div className="flex gap-2">
                  <button onClick={async () => { setEngBusy("aai"); await fetch("/api/aai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backfill", entity: "lenders" }) }); await fetch("/api/aai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backfill", entity: "investors" }) }); await fetch("/api/aai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "backfill", entity: "leads" }) }); const r = await fetch("/api/aai"); setAai(await r.json()); setEngBusy(""); }} disabled={!!engBusy} className="bg-stone-950 text-white text-xs font-bold px-3.5 py-2 rounded-full disabled:opacity-50">Backfill all codes</button>
                  <button onClick={async () => { const r = await fetch("/api/aai"); setAai(await r.json()); }} className="border border-stone-300 text-xs font-bold px-3.5 py-2 rounded-full">Refresh</button>
                </div>
              </div>
              <p className="text-[11px] text-stone-500 mt-1">Upgrade/downgrade (e.g. G-1026-100042 → P-1026-100042) changes <b>only the prefix</b> — cohort (1026) and sequence (100042) are immutable. Revert restores the original ID from the ledger instantly.</p>
              {aai && (
                <div className="grid md:grid-cols-3 gap-3 mt-3">
                  {Object.entries(aai.samples || {}).map(([k, rows]: any) => (
                    <div key={k} className="border border-stone-100 rounded-xl p-3">
                      <div className="text-[10px] font-black text-stone-400 uppercase">{k} ({aai.counts[k[0]] ?? ""})</div>
                      <div className="space-y-1 mt-2">{rows.slice(0, 5).map((r: any) => (
                        <div key={r.id} className="flex items-center justify-between gap-1 text-[11px]">
                          <span className="font-mono font-bold">{r.code}</span>
                          <span className="text-stone-400 truncate flex-1">{r.label}</span>
                          <span className="flex gap-1 shrink-0">
                            {k === "lenders" || k === "investors" ? (
                              <>
                                <button title="Upgrade" onClick={async () => { await fetch("/api/aai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "upgrade", entity: k, id: r.id, prefix: k === "lenders" ? "L" : "I" }) }); const j = await fetch("/api/aai"); setAai(await j.json()); }} className="text-[10px] font-black text-emerald-700">▲</button>
                                <button title="Revert" onClick={async () => { await fetch("/api/aai", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "revert", entity: k, id: r.id }) }); const j = await fetch("/api/aai"); setAai(await j.json()); }} className="text-[10px] font-black text-stone-500">↺</button>
                              </>
                            ) : <span className="text-stone-400">{r.tier}</span>}
                          </span>
                        </div>))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
              {aai?.ledger?.length > 0 && <div className="mt-3 text-[11px] text-stone-500 space-y-0.5 max-h-32 overflow-y-auto">{aai.ledger.slice(0, 10).map((l: any) => <div key={l.id}><b>{l.action}</b> · {l.entityType} #{l.entityId} · {l.fromCode || "—"} → <span className="font-mono font-bold">{l.toCode}</span> · {new Date(l.createdAt).toLocaleTimeString()}</div>)}</div>}
            </div>

            {engines?.recent?.length > 0 && (
              <div className="bg-white border border-stone-200 rounded-2xl p-4">
                <b className="text-sm">Engine event log</b>
                <div className="mt-2 space-y-1">{engines.recent.map((ev: any) => <div key={ev.id} className="text-[11px] text-stone-500 border-b border-stone-50 pb-1">{ev.type} · {ev.count} · {new Date(ev.createdAt).toLocaleTimeString()}</div>)}</div>
              </div>
            )}
          </div>
        )}

        {/* PORTALS & LOGINS REVIEW */}
        {view === "portals" && (
          <div className="space-y-4">
            <div className="bg-stone-950 text-white rounded-2xl p-5">
              <b className="text-sm">Deployment checklist — push the CCD to the platform ONCE, all engines together</b>
              <ol className="mt-2 space-y-1 text-xs text-stone-300 list-decimal pl-4">
                {(portals?.deployChecklist || []).map((c: string, i: number) => <li key={i}>{c}</li>)}
              </ol>
            </div>
            <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
              <table className="w-full text-sm min-w-[760px]">
                <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-4 py-3">Portal</th><th className="px-3 py-3">Login / URL</th><th className="px-3 py-3">Credentials in system</th><th className="px-3 py-3">Status</th><th className="px-3 py-3">Notes</th></tr></thead>
                <tbody>
                  {(portals?.portals || []).map((p: any) => (
                    <tr key={p.id} className="border-b border-stone-50 hover:bg-stone-50">
                      <td className="px-4 py-2.5 font-bold">{p.name}</td>
                      <td className="px-3 py-2.5 text-xs">{p.internal ? <a href={p.url.replace("<token>", "")} className="text-emerald-700 font-bold underline">{p.url}</a> : <a href={p.url} target="_blank" className="text-emerald-700 font-bold underline">{p.url} ↗</a>}</td>
                      <td className="px-3 py-2.5">{p.keyStatus.length === 0 ? <span className="text-stone-400 text-xs">—</span> : <div className="flex flex-wrap gap-1">{p.keyStatus.map((k: any) => <span key={k.key} className={`text-[10px] font-black rounded-full px-2 py-0.5 ${k.present ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>{k.key} {k.present ? "✓" : "✗"}</span>)}</div>}</td>
                      <td className="px-3 py-2.5"><span className={`text-xs font-black px-2.5 py-1 rounded-full ${p.ready ? "bg-emerald-600 text-white" : "bg-amber-100 text-amber-800"}`}>{p.ready ? "READY" : "KEYS MISSING"}</span></td>
                      <td className="px-3 py-2.5 text-xs text-stone-500">{p.desc || ""}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <p className="text-xs text-stone-500 flex gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0 text-emerald-600" />This page shows only whether each key is <b>present</b> — secret values are never read into the browser. Review logins out-of-band (password manager / SSO); this registry is the map, not the vault.</p>
            <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded-xl px-3 py-2 mt-2 font-bold">STAFF / ADMIN ONLY — the entire Control Center (including this Portals &amp; Logins page) sits behind the Private Portal Gate (/gate). The public front-end is separate and untouched; on its sign-in box, the PPG button leads here.</p>
          </div>
        )}

        {/* AI COMMS + CONSENT OUTREACH */}
        {view === "ai" && (
          <div className="grid lg:grid-cols-2 gap-4 items-start">
            <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
              <div className="font-black flex items-center gap-2"><Bot className="w-5 h-5 text-emerald-700" /> Draft a message (never auto-sends)</div>
              <input value={aiLead} onChange={e => setAiLead(e.target.value)} placeholder="Lead ID (open a lead's CCD to get it)" className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm" />
              <select value={aiTemplate} onChange={e => setAiTemplate(e.target.value)} className="w-full border border-stone-300 rounded-xl px-3 py-2.5 text-sm font-semibold">
                <option value="follow_up">Follow-up</option><option value="funded_congrats">Funded — confirmation</option><option value="term_sheet_intro">Term sheet ready</option><option value="declined_reengage">Declined — re-engagement</option>
              </select>
              <button onClick={genAi} disabled={aiBusy || !aiLead} className="inline-flex items-center gap-1.5 bg-emerald-700 text-white font-black text-sm px-5 py-2.5 rounded-full disabled:opacity-50">{aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}Generate draft & save to timeline</button>
              <p className="text-[11px] text-stone-500 leading-relaxed flex gap-1.5"><ShieldCheck className="w-4 h-4 shrink-0 text-amber-500" />Drafts only. Sending requires communications consent for that lead (purchased bank leads carry credit/banking consent — verify comms consent before sending; Twilio sending belongs to the prospecting lane).</p>
            </div>
            <div className="space-y-4">
              <div className="bg-white border border-stone-200 rounded-2xl p-5">
                <div className="font-black flex items-center gap-2"><ShieldCheck className="w-5 h-5 text-emerald-700" /> Consent formulation — automated SMS + email</div>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">Sends a one-time e-sign link covering: soft credit pull (IDIQ) · read-only bank data (FinGoal) · $9.95/mo monitoring + credit rebuild · no-fee corporate card offer · comms consent with STOP. Transport: <b>Twilio for SMS, SendGrid for email</b> (server-side keys only; simulated when unset). The engine never sends SMS itself.</p>
                <div className="flex flex-wrap gap-2 mt-3 items-center">
                  <button onClick={async () => { setAiBusy(true); const r = await fetch("/api/consent/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ leadId: Number(aiLead) }) }); const j = await r.json(); setAiResult({ draft: { subject: "Consent request sent", body: JSON.stringify(j.results || j) }, complianceNote: j.mode }); setAiBusy(false); if (aiLead) { const m = await fetch(`/api/consent/send?leadId=${aiLead}`); if (m.ok) setMsgLog((await m.json()).rows); } }} disabled={aiBusy || !aiLead} className="inline-flex items-center gap-1.5 bg-stone-950 text-white font-black text-sm px-4 py-2.5 rounded-full disabled:opacity-50">{aiBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}Send consent request to lead #{aiLead || "…"}</button>
                  <button onClick={async () => { setAiBusy(true); const r = await fetch("/api/consent/send", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ all: true }) }); const j = await r.json(); setAiResult({ draft: { subject: `Bulk consent requests: ${j.count} leads`, body: `Mode: ${j.mode}\nFirst links:\n` + (j.results || []).map((x: any) => `lead ${x.leadId} — sms:${x.sms} email:${x.email} — ${x.link}`).join("\n") }, complianceNote: "Each link is one-time, expires in 7 days, and is HMAC-signed." }); setAiBusy(false); }} disabled={aiBusy} className="inline-flex items-center gap-1.5 bg-emerald-700 text-white font-black text-sm px-4 py-2.5 rounded-full disabled:opacity-50">Send to all pending (up to 2,000)</button>
                  <a href={aiLead ? `/api/consent/docs?leadId=${aiLead}` : "/api/consent/docs?leadId=1"} target="_blank" className="inline-flex items-center gap-1.5 border border-stone-300 font-bold text-sm px-4 py-2.5 rounded-full">Lender doc packet (IDs excluded) ↗</a>
                  <a href={aiLead ? `/api/consent/docs?leadId=${aiLead}&format=txt` : "/api/consent/docs?leadId=1&format=txt"} className="inline-flex items-center gap-1.5 border border-stone-300 font-bold text-sm px-4 py-2.5 rounded-full">Download packet .txt</a>
                </div>
                {msgLog.length > 0 && (
                  <div className="mt-3 space-y-1">
                    {msgLog.map(m => (
                      <div key={m.id} className="flex gap-2 text-[11px] border border-stone-100 rounded-lg px-2.5 py-1.5">
                        <span className={`font-black shrink-0 ${m.status === "sent" ? "text-emerald-700" : m.status === "failed" ? "text-red-600" : "text-amber-700"}`}>{m.channel} · {m.status}</span>
                        <span className="text-stone-500 truncate flex-1">{m.body.slice(0, 90)}…</span>
                        <span className="text-stone-400 shrink-0">{new Date(m.createdAt).toLocaleTimeString([], { hour: "numeric", minute: "2-digit" })}</span>
                      </div>
                    ))}
                  </div>
                )}
                <p className="text-[11px] text-stone-500 mt-2 flex gap-1.5"><Ban className="w-4 h-4 shrink-0 text-red-500" />Inbound <b>STOP</b> webhook: <code className="bg-stone-100 px-1 rounded">POST /api/consent/webhook</code> — point Twilio's Messaging webhook there; it revokes communications consent instantly.</p>
              </div>
            <div className="bg-stone-950 text-white rounded-2xl p-5">
              <div className="text-[11px] font-black text-emerald-400">PREVIEW</div>
              {aiResult ? (
                <div className="mt-3">
                  <div className="text-xs text-stone-400">To: {aiResult.context.lead.name} {aiResult.context.lead.company ? `· ${aiResult.context.lead.company}` : ""}</div>
                  <div className="font-bold mt-1">{aiResult.draft.subject}</div>
                  <pre className="mt-2 text-[13px] leading-relaxed whitespace-pre-wrap font-sans text-stone-200">{aiResult.draft.body}</pre>
                  <div className="mt-3 text-[11px] text-amber-300/90 border border-amber-500/30 bg-amber-500/10 rounded-xl px-3 py-2">{aiResult.complianceNote}</div>
                </div>
              ) : <div className="mt-3 text-sm text-stone-500">Pick a lead ID and template, generate a draft.</div>}
            </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

function LenderForm({ busy, onSave, onCancel }: { busy: boolean; onSave: (f: any) => void; onCancel: () => void }) {
  const [f, setF] = useState<any>({ name: "", kind: "Bank", products: "Term loans", minFico: 640, maxAmount: 250000, advanceRatePct: 85, ratePct: 1200, contactEmail: "", phone: "", notes: "" });
  return (
    <div className="bg-white border-2 border-emerald-600 rounded-2xl p-4 grid sm:grid-cols-4 gap-2 items-end">
      <input placeholder="Name" value={f.name} onChange={e => setF({ ...f, name: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
      <select value={f.kind} onChange={e => setF({ ...f, kind: e.target.value })} className="border border-stone-300 rounded-xl px-2 py-2 text-sm">{["Bank", "Credit Union", "Private Fund", "Broker", "Marketplace"].map(k => <option key={k}>{k}</option>)}</select>
      <input placeholder="Products" value={f.products} onChange={e => setF({ ...f, products: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
      <input type="number" placeholder="Min FICO" value={f.minFico} onChange={e => setF({ ...f, minFico: Number(e.target.value) })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
      <input type="number" placeholder="Max amount" value={f.maxAmount} onChange={e => setF({ ...f, maxAmount: Number(e.target.value) })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
      <input type="number" placeholder="Advance %" value={f.advanceRatePct} onChange={e => setF({ ...f, advanceRatePct: Number(e.target.value) })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
      <input type="number" placeholder="Rate (x100 per mo)" value={f.ratePct} onChange={e => setF({ ...f, ratePct: Number(e.target.value) })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
      <input placeholder="Contact email" value={f.contactEmail} onChange={e => setF({ ...f, contactEmail: e.target.value })} className="border border-stone-300 rounded-xl px-3 py-2 text-sm" />
      <div className="flex gap-2 sm:col-span-4">
        <button onClick={() => onSave(f)} disabled={busy || !f.name} className="bg-emerald-700 text-white font-bold text-sm px-4 py-2 rounded-xl disabled:opacity-50">Save lender</button>
        <button onClick={onCancel} className="border border-stone-300 font-bold text-sm px-4 py-2 rounded-xl">Cancel</button>
      </div>
    </div>
  );
}
