"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { ShieldCheck, Loader2, LockKeyhole, ArrowUpRight } from "lucide-react";
import { PORTALS } from "@/lib/portals";

function GateInner() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const router = useRouter();
  const next = useSearchParams().get("next") || "/crm";

  async function signIn() {
    setBusy(true); setErr("");
    const r = await fetch("/api/gate", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email, password }) });
    const j = await r.json();
    if (j.ok) router.push(j.redirect || (next.startsWith("/") ? next : "/crm"));
    else { setErr(j.error || "Sign-in failed"); setBusy(false); }
  }

  return (
      <div className="w-full max-w-sm bg-white/5 border border-white/10 rounded-3xl p-8">
        <div className="w-12 h-12 rounded-2xl bg-emerald-500 grid place-items-center"><ShieldCheck className="w-7 h-7 text-stone-950" /></div>
        <h1 className="font-black text-2xl mt-4 tracking-tight">Private Portal Gate</h1>
        <p className="text-xs text-stone-400 mt-1">PPG · Staff &amp; Admin only. The Control Center, engine bench and all data APIs sit behind this gate. Public front-end is unaffected.</p>
        <input value={email} onChange={e => setEmail(e.target.value)} placeholder="staff email" autoComplete="username" className="w-full mt-5 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" />
        <input value={password} onChange={e => setPassword(e.target.value)} onKeyDown={e => e.key === "Enter" && signIn()} type="password" placeholder="password" autoComplete="current-password" className="w-full mt-3 bg-white/10 border border-white/15 rounded-xl px-4 py-3 text-sm outline-none focus:border-emerald-500" />
        {err && <p className="text-xs text-red-400 mt-2 font-bold">{err}</p>}
        <button onClick={signIn} disabled={busy || !email || !password} className="w-full mt-4 bg-emerald-500 text-stone-950 font-black py-3.5 rounded-2xl disabled:opacity-50 inline-flex items-center justify-center gap-2">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <LockKeyhole className="w-5 h-5" />}Sign in to PPG
        </button>
        <p className="text-[10px] text-stone-500 mt-4 text-center">Credentials: STAFF_EMAIL / STAFF_PASSWORD (system env). Session: 12h, httpOnly, HMAC-signed.</p>
      </div>
  );
}

export default function GatePage() {
  return (
    <div className="min-h-screen bg-stone-950 text-white grid place-items-center px-4 py-10">
      <Suspense><GateInner /></Suspense>
      <div className="w-full max-w-sm mt-4 border-t border-white/10 pt-4">
        <div className="text-[10px] font-black tracking-widest text-stone-500 mb-2">PORTALS — SIGN-IN LINKS</div>
        <div className="grid grid-cols-2 gap-1.5">
          {PORTALS.map(p => (
            <a key={p.id} href={p.internal ? p.url.replace("<token>", "") : p.url} target={p.internal ? undefined : "_blank"} rel="noreferrer" title={p.desc}
               className="flex items-center justify-between gap-1 text-[11px] font-bold text-stone-300 bg-white/5 hover:bg-white/10 border border-white/10 rounded-lg px-2.5 py-2 truncate">
              <span className="truncate">{p.name}</span>
              {!p.internal && <ArrowUpRight className="w-3 h-3 shrink-0 text-emerald-400" />}
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
