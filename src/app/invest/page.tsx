"use client";

import { useState } from "react";
import { ShieldCheck, Loader2, CheckCircle2 } from "lucide-react";

const FOCUS = ["MCA", "REI", "CRE", "M&A", "Senior Debt", "Secondary market packages"];
const TYPES = ["Individual (HNW)", "Family office", "Fund / Asset manager", "Bank / Credit union", "Other"];

export default function InvestPage() {
  const [f, setF] = useState({ full_name: "", company: "", email: "", phone: "", investor_type: TYPES[0], min_ticket: "", max_ticket: "", states: "", website: "" });
  const [focus, setFocus] = useState<string[]>([]);
  const [accredited, setAccredited] = useState(false);
  const [consent, setConsent] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState("");
  const [done, setDone] = useState<string | null>(null);
  const input = "w-full rounded-xl border border-stone-300 bg-white px-3 py-2.5 text-sm outline-none focus:border-emerald-600";

  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr(""); setBusy(true);
    try {
      const r = await fetch("/api/intake/investor", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ ...f, focus, accredited, consent }) });
      const j = await r.json();
      if (r.ok && j.ok) setDone(j.reference || "registered"); else setErr(j.error || "Could not save your registration");
    } catch { setErr("Network error — please try again"); }
    finally { setBusy(false); }
  }

  return (
    <div className="min-h-screen bg-stone-950 text-white">
      <div className="max-w-2xl mx-auto px-6 py-12">
        <div className="flex items-center gap-3 mb-8">
          <div className="w-11 h-11 rounded-xl bg-amber-400 grid place-items-center font-black text-stone-950">G</div>
          <div><div className="font-black text-xl">GLINFICO Investor Network</div><div className="text-xs text-stone-400">Syndicated deals · Loan packages · Senior debt</div></div>
        </div>

        {done ? (
          <div className="bg-white text-stone-900 rounded-2xl p-8 text-center">
            <CheckCircle2 className="w-10 h-10 text-emerald-600 mx-auto" />
            <h1 className="text-xl font-black mt-3">You're registered</h1>
            {done !== "registered" && <p className="mt-2 text-sm">Your GLINFICO investor ID: <b className="font-mono">{done}</b></p>}
            <p className="mt-2 text-sm text-stone-600">Deals matching your focus and ticket size will be offered to you. You can unsubscribe at any time.</p>
          </div>
        ) : (
          <form onSubmit={submit} className="bg-white text-stone-900 rounded-2xl p-6 space-y-4">
            <h1 className="text-xl font-black">Join the investor network</h1>
            <p className="text-sm text-stone-600">Receive syndicated deal shares and secondary-market loan packages that match your criteria.</p>
            <div className="grid gap-3 sm:grid-cols-2">
              <input className={input} placeholder="Full name *" value={f.full_name} onChange={(e) => setF({ ...f, full_name: e.target.value })} required />
              <input className={input} placeholder="Company / fund" value={f.company} onChange={(e) => setF({ ...f, company: e.target.value })} />
              <input className={input} type="email" placeholder="Email *" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} required />
              <input className={input} placeholder="Phone" value={f.phone} onChange={(e) => setF({ ...f, phone: e.target.value })} />
              <select className={input} value={f.investor_type} onChange={(e) => setF({ ...f, investor_type: e.target.value })}>{TYPES.map((t) => <option key={t}>{t}</option>)}</select>
              <input className={input} placeholder="Preferred states (optional)" value={f.states} onChange={(e) => setF({ ...f, states: e.target.value })} />
              <input className={input} placeholder="Minimum ticket ($)" value={f.min_ticket} onChange={(e) => setF({ ...f, min_ticket: e.target.value })} />
              <input className={input} placeholder="Maximum ticket ($) *" value={f.max_ticket} onChange={(e) => setF({ ...f, max_ticket: e.target.value })} required />
            </div>
            <input className="hidden" tabIndex={-1} autoComplete="off" value={f.website} onChange={(e) => setF({ ...f, website: e.target.value })} aria-hidden="true" />
            <div>
              <div className="text-sm font-bold mb-2">Investment focus *</div>
              <div className="flex flex-wrap gap-2">
                {FOCUS.map((x) => (
                  <button type="button" key={x} onClick={() => setFocus(focus.includes(x) ? focus.filter((y) => y !== x) : [...focus, x])}
                    className={`rounded-full px-3 py-1.5 text-xs font-bold border ${focus.includes(x) ? "bg-emerald-700 text-white border-emerald-700" : "border-stone-300"}`}>{x}</button>
                ))}
              </div>
            </div>
            <label className="flex gap-2 text-sm"><input type="checkbox" className="mt-1" checked={accredited} onChange={(e) => setAccredited(e.target.checked)} />
              <span>I confirm I am an <b>accredited investor</b> (or represent an institutional investor) under applicable securities law.</span></label>
            <label className="flex gap-2 text-sm"><input type="checkbox" className="mt-1" checked={consent} onChange={(e) => setConsent(e.target.checked)} />
              <span>I agree to receive deal offers and communications from GLINFICO by email and phone. I can unsubscribe at any time.</span></label>
            {err && <div className="text-sm text-red-700 bg-red-50 rounded-lg px-3 py-2">{err}</div>}
            <button disabled={busy || !accredited || !consent} className="w-full inline-flex justify-center items-center gap-2 rounded-xl bg-stone-950 text-white font-black py-3 disabled:opacity-40">
              {busy && <Loader2 className="w-4 h-4 animate-spin" />} Register as an investor
            </button>
            <p className="flex items-center gap-1.5 text-[11px] text-stone-500"><ShieldCheck className="w-3.5 h-3.5" /> Your consent is recorded in an encrypted, tamper-evident record.</p>
          </form>
        )}
      </div>
    </div>
  );
}
