"use client";

import { useState } from "react";
import { CheckCircle2, ExternalLink, Loader2 } from "lucide-react";
import type { RoleRules } from "@/lib/ppgRules";

export default function RulesStep({ rules, accepted, onAccepted }: { rules: RoleRules; accepted: boolean; onAccepted: (code: string | null) => void }) {
  const [agree, setAgree] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [form, setForm] = useState({ fullName: "", company: "", phone: "", amount: "" });
  const input = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm outline-none focus:border-emerald-600";

  async function accept() {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/ppg/rules", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ accept: true, ...form }) });
      const j = await r.json();
      if (!r.ok || !j.ok) { setErr(j.error || "Could not record your acceptance"); return; }
      onAccepted(j.code || null);
    } catch { setErr("Network error — please try again"); }
    finally { setBusy(false); }
  }

  const canSubmit = agree && (!rules.collectsApplication || (form.fullName.trim() && form.company.trim()));

  return (
    <div className="space-y-4">
      <div className="bg-white border border-stone-200 rounded-2xl p-6">
        <h1 className="text-xl font-black">{rules.title}</h1>
        <p className="text-sm text-stone-600 mt-2">{rules.intro}</p>
      </div>

      {rules.sections.map((s) => (
        <div key={s.heading} className="bg-white border border-stone-200 rounded-2xl p-6">
          <h2 className="font-bold">{s.heading}</h2>
          <ul className="mt-3 space-y-2">
            {s.points.map((p) => (
              <li key={p} className="flex gap-2 text-sm text-stone-700"><CheckCircle2 className="w-4 h-4 mt-0.5 shrink-0 text-emerald-600" />{p}</li>
            ))}
          </ul>
        </div>
      ))}

      {rules.packages && (
        <div className="grid gap-3 md:grid-cols-2 lg:grid-cols-4">
          {rules.packages.map((p) => (
            <div key={p.name} className="bg-white border border-stone-200 rounded-2xl p-5">
              <div className="text-xs font-black tracking-wider text-emerald-700">{p.name}</div>
              <div className="font-mono text-xs text-stone-500 mt-1">Code: {p.code}</div>
              <div className="text-xl font-black mt-2">{p.price}</div>
              <div className="text-sm font-bold mt-1">{p.leads}</div>
              <ul className="mt-3 space-y-1">{p.benefits.map((b) => <li key={b} className="text-xs text-stone-600">• {b}</li>)}</ul>
            </div>
          ))}
        </div>
      )}

      {rules.links && (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-2">
          {rules.links.map((l) =>
            l.href ? (
              <a key={l.label} href={l.href} target="_blank" rel="noreferrer" className="flex items-center gap-2 text-sm font-bold text-emerald-800 hover:underline">
                <ExternalLink className="w-4 h-4" />{l.label}
              </a>
            ) : (
              <div key={l.label} className="flex items-center gap-2 text-sm font-bold text-stone-500">
                <ExternalLink className="w-4 h-4" />{l.label}{l.note && <span className="text-[10px] uppercase bg-stone-100 rounded-full px-2 py-0.5">{l.note}</span>}
              </div>
            ),
          )}
        </div>
      )}

      {rules.placeholders && (
        <div className="grid gap-3 md:grid-cols-2">
          {rules.placeholders.map((p) => (
            <div key={p.heading} className="rounded-2xl border-2 border-dashed border-stone-300 p-6 text-center">
              <div className="font-bold text-stone-700">{p.heading}</div>
              <div className="text-xs text-stone-500 mt-1">{p.text}</div>
            </div>
          ))}
        </div>
      )}

      {accepted ? (
        <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-4 text-sm font-bold">You have accepted these rules.</div>
      ) : (
        <div className="bg-white border border-stone-200 rounded-2xl p-6 space-y-4">
          {rules.collectsApplication && (
            <div className="grid gap-3 md:grid-cols-2">
              <input className={input} placeholder="Full name *" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} />
              <input className={input} placeholder="Company / deal name *" value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
              <input className={input} placeholder="Phone" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} />
              <input className={input} placeholder="Requested amount (USD)" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} />
            </div>
          )}
          <label className="flex items-start gap-2 text-sm">
            <input type="checkbox" className="mt-1" checked={agree} onChange={(e) => setAgree(e.target.checked)} />
            <span>I have read and agree to the rules above.</span>
          </label>
          {err && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{err}</div>}
          <button disabled={!canSubmit || busy} onClick={accept} className="inline-flex items-center gap-2 rounded-full bg-stone-950 text-white font-bold text-sm px-5 py-2.5 disabled:opacity-40">
            {busy && <Loader2 className="w-4 h-4 animate-spin" />}{rules.acceptLabel}
          </button>
        </div>
      )}
    </div>
  );
}
