"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Loader2, LogOut, ScrollText } from "lucide-react";
import RulesStep from "./RulesStep";
import type { RoleRules } from "@/lib/ppgRules";

type View = {
  email: string;
  role: string;
  title: string;
  subtitle: string;
  cards: { label: string; value: number | string }[];
  columns: string[];
  rows: (string | number | { termSheetId: number } | { shareId: number } | { ddDealId: number })[][];
  empty: string;
};

export default function MyPortal() {
  const [me, setMe] = useState<View | null>(null);
  const [err, setErr] = useState("");
  const [rules, setRules] = useState<{ rules: RoleRules | null; accepted: boolean } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [notice, setNotice] = useState("");
  const [busy, setBusy] = useState<number | null>(null);
  const [dd, setDd] = useState<{ dealId: number; items: any[]; note: string } | null>(null);
  async function openDd(dealId: number) {
    const r = await fetch(`/api/ppg/dd?deal=${dealId}`, { cache: "no-store" });
    if (r.ok) setDd(await r.json()); else setNotice("Could not load the due-diligence checklist");
  }
  async function uploadDd(docId: number, file: File) {
    const fd = new FormData(); fd.append("doc", String(docId)); fd.append("file", file);
    setBusy(docId);
    try {
      const r = await fetch("/api/ppg/dd", { method: "POST", body: fd });
      const j = await r.json();
      setNotice(j.ok ? "Document received — thank you" : j.error || "Upload failed");
      if (dd) await openDd(dd.dealId);
    } finally { setBusy(null); }
  }
  async function respondShare(id: number, action: "commit" | "decline") {
    if (!window.confirm(`${action === "commit" ? "Commit to" : "Decline"} this syndicate share?`)) return;
    setBusy(id);
    try {
      const r = await fetch("/api/ppg/share", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action }) });
      const j = await r.json();
      setNotice(j.ok ? `Share #${id}: ${j.status}` : j.error || "Could not record your decision");
      const v = await fetch("/api/ppg"); if (v.ok) setMe(await v.json());
    } finally { setBusy(null); }
  }
  async function respond(id: number, action: "approve" | "decline" | "counter") {
    let note = "";
    if (action === "counter") { note = window.prompt("Describe your counter-offer (rate, advance, term, conditions):") || ""; if (!note.trim()) return; }
    if (action !== "counter" && !window.confirm(`${action === "approve" ? "Approve" : "Decline"} this term sheet?`)) return;
    setBusy(id);
    try {
      const r = await fetch("/api/ppg/termsheet", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ id, action, note }) });
      const j = await r.json();
      setNotice(j.ok ? `Term sheet #${id}: ${j.status}` : j.error || "Could not record your decision");
      const v = await fetch("/api/ppg"); if (v.ok) setMe(await v.json());
    } finally { setBusy(null); }
  }
  const router = useRouter();
  useEffect(() => {
    fetch("/api/ppg/rules").then(async (r) => { if (r.ok) setRules(await r.json()); }).catch(() => {});
  }, []);
  useEffect(() => {
    fetch("/api/ppg")
      .then(async (r) => {
        if (r.status === 401) { router.push("/gate?next=/ppg"); return; }
        const j = await r.json();
        if (!r.ok) { setErr(j.error || "load failed"); return; }
        setMe(j);
      })
      .catch(() => setErr("load failed"));
  }, [router]);

  if (err) return <div className="min-h-screen bg-stone-950 text-red-300 grid place-items-center text-sm">{err}</div>;
  if (!me || !rules) return <div className="min-h-screen bg-stone-950 text-white grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  const mustAccept = !!rules.rules && !rules.accepted;
  const rulesView = rules.rules && (mustAccept || showRules);

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900">
      <header className="bg-stone-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 grid place-items-center"><ShieldCheck className="w-5 h-5 text-stone-950" /></div>
            <div>
              <div className="font-black text-lg leading-none">{me.title} · Private Portal (PPG)</div>
              <div className="text-xs text-stone-400 mt-1">{me.email} · role: {me.role}</div>
            </div>
          </div>
          <div className="flex items-center gap-2">
          {(me.role === "investor" || me.role === "lender") && !mustAccept && (
            <a href="/ppg/market" className="inline-flex items-center gap-1.5 text-xs font-bold bg-emerald-500 text-stone-950 rounded-full px-3 py-1.5">Secondary Market</a>
          )}
          {rules.rules && !mustAccept && (
            <button onClick={() => setShowRules(!showRules)} className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/20">
              <ScrollText className="w-3.5 h-3.5" /> {showRules ? "Back to portal" : "Membership rules"}
            </button>
          )}
          <button
            onClick={async () => { await fetch("/api/gate", { method: "DELETE" }); location.href = "/gate"; }}
            className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 border border-white/20 rounded-full px-3 py-1.5 hover:bg-white/20"
          >
            <LogOut className="w-3.5 h-3.5" /> Sign out
          </button>
          </div>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        {notice && <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-sm font-bold">{notice}</div>}
        {rulesView ? (
          <RulesStep
            rules={rules.rules!}
            accepted={rules.accepted}
            onAccepted={(code) => {
              setRules({ ...rules, accepted: true });
              setShowRules(false);
              setNotice(code ? `Welcome — your application was sent to the IDE. Your GLINFICO ID: ${code}` : "Thank you — your acceptance is recorded.");
              fetch("/api/ppg").then(async (r) => { if (r.ok) setMe(await r.json()); });
            }}
          />
        ) : (<>
        {dd && (
          <div className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <div className="flex items-center justify-between">
              <div className="font-bold">Due diligence · deal #{dd.dealId}</div>
              <button onClick={() => setDd(null)} className="text-xs font-bold text-stone-500 underline">Close</button>
            </div>
            <p className="text-xs text-stone-500">{dd.note}</p>
            <div className="divide-y divide-stone-100">
              {dd.items.map((it: any) => (
                <div key={it.id} className="py-2 flex flex-wrap items-center justify-between gap-2 text-sm">
                  <div><b>{it.name}</b> <span className="text-[11px] text-stone-500">· {it.category}{it.provider ? ` · via ${it.provider}` : ""}</span></div>
                  <div className="flex items-center gap-2 text-xs">
                    <span className={`rounded-full px-2 py-0.5 font-bold ${it.status === "requested" ? "bg-amber-100 text-amber-900" : "bg-emerald-100 text-emerald-900"}`}>{it.status}</span>
                    {it.status !== "requested" && <a href={`/api/ppg/dd?doc=${it.id}`} className="underline font-bold">Download</a>}
                    {it.status === "requested" && it.method !== "generate" && me.role === "borrower" && (
                      <label className="cursor-pointer rounded-full bg-stone-950 text-white px-3 py-1 font-bold">
                        {busy === it.id ? "Uploading…" : "Upload"}
                        <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg,.csv,.xls,.xlsx,.doc,.docx"
                          onChange={(e) => { const f = e.target.files?.[0]; if (f) uploadDd(it.id, f); e.target.value = ""; }} />
                      </label>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
        <p className="text-sm text-stone-600">{me.subtitle}</p>
        {me.cards.length > 0 && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {me.cards.map((c) => (
              <div key={c.label} className="bg-white border border-stone-200 rounded-2xl p-4 text-center">
                <div className="font-black text-2xl">{c.value}</div>
                <div className="text-[10px] font-bold text-stone-500 mt-1 tracking-wide">{c.label}</div>
              </div>
            ))}
          </div>
        )}
        <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            {me.columns.length > 0 && (
              <thead>
                <tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100">
                  {me.columns.map((c) => <th key={c} className="px-4 py-3">{c}</th>)}
                </tr>
              </thead>
            )}
            <tbody>
              {me.rows.map((r, i) => (
                <tr key={i} className="border-b border-stone-50">
                  {r.map((v, j) => (
                    <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-bold" : "text-xs"} ${j === 1 ? "font-mono" : ""}`}>
                      {typeof v === "object" && v && "termSheetId" in v ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(["approve", "decline", "counter"] as const).map((a) => (
                            <button key={a} disabled={busy === v.termSheetId} onClick={() => respond(v.termSheetId, a)}
                              className={`rounded-full px-3 py-1 text-[11px] font-bold disabled:opacity-40 ${a === "approve" ? "bg-emerald-700 text-white" : a === "decline" ? "bg-stone-200 text-stone-800" : "border border-stone-300"}`}>
                              {a === "approve" ? "Approve" : a === "decline" ? "Decline" : "Counter"}
                            </button>
                          ))}
                        </div>
                      ) : typeof v === "object" && v && "shareId" in v ? (
                        <div className="flex flex-wrap gap-1.5">
                          {(["commit", "decline"] as const).map((a) => (
                            <button key={a} disabled={busy === v.shareId} onClick={() => respondShare(v.shareId, a)}
                              className={`rounded-full px-3 py-1 text-[11px] font-bold disabled:opacity-40 ${a === "commit" ? "bg-emerald-700 text-white" : "bg-stone-200 text-stone-800"}`}>
                              {a === "commit" ? "Commit" : "Decline"}
                            </button>
                          ))}
                        </div>
                      ) : typeof v === "object" && v && "ddDealId" in v ? (
                        <button onClick={() => openDd(v.ddDealId)} className="rounded-full border border-stone-300 px-3 py-1 text-[11px] font-bold">Due diligence</button>
                      ) : (v as string | number)}
                    </td>
                  ))}
                </tr>
              ))}
              {me.rows.length === 0 && (
                <tr><td colSpan={Math.max(1, me.columns.length)} className="p-8 text-center text-stone-400">{me.empty}</td></tr>
              )}
            </tbody>
          </table>
        </div>
        </>)}
        <p className="text-xs text-stone-500">You only see your own records. Signed in through the GLINFICO sign-in.</p>
      </main>
    </div>
  );
}
