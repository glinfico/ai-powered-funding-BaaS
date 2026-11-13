"use client";

import { use, useEffect, useState } from "react";
import { ShieldCheck, CheckCircle2, Loader2, Landmark, CreditCard, BellRing, Ban, Bot } from "lucide-react";

export default function ConsentPage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = use(params);
  const [state, setState] = useState<any>(null);
  const [error, setError] = useState("");
  const [scopes, setScopes] = useState<Record<string, boolean>>({});
  const [signature, setSignature] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [done, setDone] = useState<any>(null);

  const lid = typeof window !== "undefined" ? Number(new URLSearchParams(window.location.search).get("lid") || 0) : 0;

  useEffect(() => {
    fetch(`/api/consent/form?token=${token}&lid=${lid}`, { cache: "no-store" })
      .then(r => r.json())
      .then(j => { if (!j.valid) setError(j.error || "Invalid link"); else { setState(j); const s: Record<string, boolean> = {}; j.form.sections.forEach((x: any) => s[x.id] = true); setScopes(s); } })
      .catch(() => setError("Could not load the form."));
  }, [token, lid]);

  async function submit() {
    setSubmitting(true);
    const r = await fetch("/api/consent/form", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, lid, scopes, signature }) });
    const j = await r.json();
    if (j.ok) setDone(j); else setError(j.error || "Submission failed");
    setSubmitting(false);
  }

  const ICONS: Record<string, any> = { credit_pull: CreditCard, banking_search: Landmark, monitoring: BellRing, card_offer: CreditCard, communications: Bot };

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900 grid place-items-center px-4 py-10">
      <div className="w-full max-w-2xl bg-white border border-stone-200 rounded-3xl shadow-sm overflow-hidden">
        <div className="bg-stone-950 text-white p-6">
          <div className="flex items-center gap-3">
            <div className="w-11 h-11 rounded-2xl bg-emerald-500 grid place-items-center"><ShieldCheck className="w-6 h-6 text-white" /></div>
            <div>
              <div className="font-black text-xl">GLINFICO</div>
              <div className="text-xs text-emerald-400 font-bold tracking-wide">CONSENT & AUTHORIZATION · v{FORM_VERSION_SAFE()}</div>
            </div>
          </div>
        </div>

        {error && !done && (
          <div className="p-8 text-center">
            <Ban className="w-10 h-10 mx-auto text-red-400" />
            <div className="font-bold text-red-700 mt-3">{error}</div>
            <p className="text-sm text-stone-500 mt-1">Ask GLINFICO to send you a fresh consent link.</p>
          </div>
        )}

        {!state && !error && <div className="p-10 text-center text-stone-400"><Loader2 className="w-6 h-6 animate-spin mx-auto" /> Loading your form…</div>}

        {state && !done && (
          <div className="p-6 space-y-4">
            <p className="text-sm text-stone-600">Hi <b>{state.lead.firstName} {state.lead.lastName}</b> ({state.lead.company}) — please review each authorization and sign. Link expires {new Date(state.expiresAt).toLocaleString()} and can be used once.</p>
            {state.form.sections.map((s: any) => {
              const Icon = ICONS[s.id] || ShieldCheck;
              return (
                <label key={s.id} className={`flex gap-3 border-2 rounded-2xl p-4 cursor-pointer ${scopes[s.id] ? "border-emerald-600 bg-emerald-50" : "border-stone-200"}`}>
                  <input type="checkbox" checked={!!scopes[s.id]} onChange={e => setScopes({ ...scopes, [s.id]: e.target.checked })} className="w-5 h-5 mt-0.5 accent-emerald-700" />
                  <div>
                    <div className="font-black text-sm flex items-center gap-1.5"><Icon className="w-4 h-4 text-emerald-700" />{s.label}</div>
                    <p className="text-[13px] text-stone-600 mt-1 leading-relaxed">{s.text}</p>
                  </div>
                </label>
              );
            })}
            <div className="text-[11px] text-stone-500 leading-relaxed border border-stone-200 rounded-xl p-3 bg-stone-50">{state.form.legal}<br /><b>{state.form.optOut}</b></div>
            <div>
              <label className="text-xs font-black text-stone-500">ELECTRONIC SIGNATURE — type your full name</label>
              <input value={signature} onChange={e => setSignature(e.target.value)} placeholder="Full legal name" className="w-full mt-1.5 border border-stone-300 rounded-xl px-3 py-3 text-sm" />
            </div>
            <button onClick={submit} disabled={submitting || !signature.trim()} className="w-full bg-emerald-700 text-white font-black py-3.5 rounded-2xl disabled:opacity-50 inline-flex items-center justify-center gap-2">
              {submitting ? <Loader2 className="w-5 h-5 animate-spin" /> : <CheckCircle2 className="w-5 h-5" />}I consent — submit & sign
            </button>
          </div>
        )}

        {done && (
          <div className="p-8 text-center">
            <CheckCircle2 className="w-12 h-12 mx-auto text-emerald-600" />
            <div className="font-black text-xl mt-3">Consent recorded ✓</div>
            <p className="text-sm text-stone-600 mt-2">{done.message}</p>
            <p className="text-xs text-stone-400 mt-2">Evidence ref: <b>{done.evidence}</b> · sealed in an encrypted, tamper-evident record (AES-256).</p>
            {done.fingoalConnectUrl && (
              <a href={done.fingoalConnectUrl} rel="noopener noreferrer" className="mt-4 inline-flex w-full justify-center bg-emerald-700 text-white font-black py-3.5 rounded-2xl">
                Connect your bank securely (FinGoal) →
              </a>
            )}
            <div className="flex flex-wrap justify-center gap-1.5 mt-4">
              {done.consents.map((c: any) => <span key={c.scope} className={`text-xs font-bold px-2.5 py-1 rounded-full ${c.status === "Granted" ? "bg-emerald-100 text-emerald-800" : "bg-stone-100 text-stone-500"}`}>{c.scope.replace(/_/g, " ")}: {c.status}</span>)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
function FORM_VERSION_SAFE() { return "1.0"; }
