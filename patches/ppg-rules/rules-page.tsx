// src/app/ppg/rules/page.tsx  (NEW) — the PPG rules step. /ppg redirects here until accepted.
"use client";
import { Suspense, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { PORTAL_RULES, PORTAL_NAMES } from "@/lib/portal-rules";

function RulesInner() {
  const sp = useSearchParams();
  const portal = ["borrower","broker","lender","investor"].includes(sp.get("portal")||"") ? sp.get("portal")! : "borrower";
  const rules = PORTAL_RULES[portal];
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState<string | null>(null);
  const router = useRouter();
  async function accept() {
    if (!agree || busy) return;
    setBusy(true);
    const r = await fetch("/api/ppg/accept", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ portal }) });
    const j = await r.json();
    setBusy(false);
    if (j.ok) { setDone(j.issuedId ? `Accepted — your ID: ${j.issuedId}` : "Accepted"); setTimeout(() => router.push(`/ppg?portal=${portal}`), 900); }
  }
  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900 grid place-items-center px-4 py-10">
      <div className="w-full max-w-lg bg-white border border-stone-200 rounded-3xl p-8 shadow-sm">
        <div className="text-[10px] font-black tracking-widest text-stone-400">PPG · {PORTAL_NAMES[portal].toUpperCase()} PORTAL · STEP 1 OF 2</div>
        <h1 className="font-black text-2xl mt-2">{rules.title}</h1>
        <p className="text-sm text-stone-500 mt-1">{rules.blurb}</p>
        <ul className="mt-4 space-y-2.5">{rules.points.map((p, i) => <li key={i} className="flex gap-2.5 text-sm leading-relaxed"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-emerald-600 shrink-0" />{p}</li>)}</ul>
        <label className="mt-6 flex items-start gap-2.5 text-sm font-semibold cursor-pointer">
          <input type="checkbox" checked={agree} onChange={e => setAgree(e.target.checked)} className="mt-0.5 w-4 h-4 accent-emerald-600" />
          {rules.cta}
        </label>
        <button onClick={accept} disabled={!agree || busy} className="w-full mt-4 bg-stone-950 text-white font-black py-3.5 rounded-2xl disabled:opacity-50">
          {busy ? "Saving…" : done ? done : "Agree & continue →"}
        </button>
      </div>
    </div>
  );
}
export default function RulesPage() { return <Suspense><RulesInner /></Suspense>; }
