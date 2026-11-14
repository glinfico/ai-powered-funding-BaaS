"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { Loader2, Layers, PlusCircle, ArrowLeft } from "lucide-react";

type Pkg = { id: number; ref: string; asset_class: string; title: string; principal: string; asking_price: string; yield_pct: string; term_months: number; risk_grade: string; description: string; status: string; own: boolean };
type Offer = { id: number; price: string; fee: string; status: string; due_at: string };
type Board = { me: { type: string; name: string; code: string } | null; feeRate: number; assetClasses: string[]; grades: string[]; packages: Pkg[]; myListings: (Pkg & { offers: Offer[] })[]; myOffers: (Offer & { ref: string; title: string; asking_price: string })[] };

const usd = (v: unknown) => { const n = Number(v) || 0; return n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : `$${n.toLocaleString()}`; };
const left = (d: string) => { const ms = new Date(d).getTime() - Date.now(); return ms <= 0 ? "expired" : `${Math.floor(ms / 3600000)}h left`; };

export default function MarketPage() {
  const [b, setB] = useState<Board | null>(null);
  const [err, setErr] = useState("");
  const [msg, setMsg] = useState("");
  const [busy, setBusy] = useState(false);
  const [form, setForm] = useState({ asset_class: "MCA", title: "", principal: "", asking_price: "", yield_pct: "", term_months: "12", risk_grade: "B", description: "" });

  const load = useCallback(async () => {
    const r = await fetch("/api/ppg/market", { cache: "no-store" });
    const j = await r.json();
    if (!r.ok) setErr(j.error || "Could not load the market"); else setB(j);
  }, []);
  useEffect(() => { load(); }, [load]);

  async function act(body: Record<string, unknown>, confirmText?: string) {
    if (confirmText && !window.confirm(confirmText)) return;
    setBusy(true); setMsg("");
    try {
      const r = await fetch("/api/ppg/market", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json();
      setMsg(j.ok ? (j.ref ? `Listed as ${j.ref}` : j.fee ? `Offer sent: ${usd(j.price)} (fee ${usd(j.fee)})` : `Done: ${j.status || "saved"}`) : j.error || "Something went wrong");
      await load();
    } finally { setBusy(false); }
  }

  if (err) return <div className="min-h-screen grid place-items-center bg-stone-950 text-red-300 text-sm">{err}</div>;
  if (!b) return <div className="min-h-screen grid place-items-center bg-stone-950"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  const input = "w-full rounded-lg border border-stone-300 bg-white px-3 py-2 text-sm";
  const fee = Math.round((Number(form.asking_price.replace(/[^0-9.]/g, "")) || 0) * b.feeRate);

  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900">
      <header className="bg-stone-950 text-white">
        <div className="max-w-6xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 grid place-items-center"><Layers className="w-5 h-5 text-stone-950" /></div>
            <div>
              <div className="font-black text-lg leading-none">Secondary Market · Loan Packages</div>
              <div className="text-xs text-stone-400 mt-1">{b.me ? `${b.me.name} · ${b.me.code || "ID pending"}` : "Profile not linked"} · {(b.feeRate * 100).toFixed(1)}% settlement fee</div>
            </div>
          </div>
          <Link href="/ppg" className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 border border-white/20 rounded-full px-3 py-1.5"><ArrowLeft className="w-3.5 h-3.5" /> Back to portal</Link>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-6 space-y-6">
        {msg && <div className="bg-emerald-50 border border-emerald-200 text-emerald-900 rounded-2xl p-3 text-sm font-bold">{msg}</div>}

        <section className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
          <div className="px-5 pt-4 font-bold">Available packages</div>
          <table className="w-full text-sm min-w-[860px]">
            <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100">
              {["Package", "Class", "Principal", "Asking", "Yield", "Term", "Grade", "Status", ""].map((h) => <th key={h} className="px-4 py-3">{h}</th>)}
            </tr></thead>
            <tbody>
              {b.packages.map((p) => (
                <tr key={p.id} className="border-b border-stone-50">
                  <td className="px-4 py-2.5"><div className="font-bold">{p.title}</div><div className="font-mono text-[11px] text-stone-500">{p.ref}</div></td>
                  <td className="px-4 py-2.5 text-xs">{p.asset_class}</td>
                  <td className="px-4 py-2.5 text-xs">{usd(p.principal)}</td>
                  <td className="px-4 py-2.5 text-xs font-bold">{usd(p.asking_price)}</td>
                  <td className="px-4 py-2.5 text-xs">{Number(p.yield_pct).toFixed(2)}%</td>
                  <td className="px-4 py-2.5 text-xs">{p.term_months} mo</td>
                  <td className="px-4 py-2.5 text-xs">{p.risk_grade}</td>
                  <td className="px-4 py-2.5 text-xs">{p.own ? "Your listing" : p.status}</td>
                  <td className="px-4 py-2.5">
                    {!p.own && b.me && (
                      <div className="flex gap-1.5">
                        <button disabled={busy} onClick={() => act({ action: "offer", package_id: p.id }, `Buy ${p.ref} at ${usd(p.asking_price)}? Fee ${usd(Math.round(Number(p.asking_price) * b.feeRate))} at settlement.`)}
                          className="rounded-full bg-emerald-700 text-white px-3 py-1 text-[11px] font-bold disabled:opacity-40">Buy at ask</button>
                        <button disabled={busy} onClick={() => { const v = window.prompt("Your offer price (USD):"); if (v) act({ action: "offer", package_id: p.id, price: v }); }}
                          className="rounded-full border border-stone-300 px-3 py-1 text-[11px] font-bold disabled:opacity-40">Make offer</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
              {b.packages.length === 0 && <tr><td colSpan={9} className="p-8 text-center text-stone-400">No packages listed yet.</td></tr>}
            </tbody>
          </table>
        </section>

        {b.me && (
          <section className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="font-bold flex items-center gap-2"><PlusCircle className="w-4 h-4" /> List a loan package</div>
            <div className="grid gap-3 md:grid-cols-4 mt-4">
              <select className={input} value={form.asset_class} onChange={(e) => setForm({ ...form, asset_class: e.target.value })}>{b.assetClasses.map((c) => <option key={c}>{c}</option>)}</select>
              <input className={`${input} md:col-span-3`} placeholder="Title (e.g. MCA portfolio — 14 merchants)" value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} />
              <input className={input} placeholder="Principal balance ($)" value={form.principal} onChange={(e) => setForm({ ...form, principal: e.target.value })} />
              <input className={input} placeholder="Asking price ($)" value={form.asking_price} onChange={(e) => setForm({ ...form, asking_price: e.target.value })} />
              <input className={input} placeholder="Yield (% APR)" value={form.yield_pct} onChange={(e) => setForm({ ...form, yield_pct: e.target.value })} />
              <input className={input} placeholder="Remaining term (months)" value={form.term_months} onChange={(e) => setForm({ ...form, term_months: e.target.value })} />
              <select className={input} value={form.risk_grade} onChange={(e) => setForm({ ...form, risk_grade: e.target.value })}>{b.grades.map((g) => <option key={g}>{g}</option>)}</select>
              <input className={`${input} md:col-span-3`} placeholder="Description (optional)" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} />
            </div>
            <div className="mt-3 flex items-center gap-3">
              <button disabled={busy} onClick={() => act({ action: "list", ...form })} className="rounded-full bg-stone-950 text-white px-5 py-2 text-sm font-bold disabled:opacity-40">List package</button>
              <span className="text-xs text-stone-500">Settlement fee at {(b.feeRate * 100).toFixed(1)}%: {usd(fee)}</span>
            </div>
          </section>
        )}

        {b.myListings.length > 0 && (
          <section className="bg-white border border-stone-200 rounded-2xl p-5 space-y-3">
            <div className="font-bold">My listings</div>
            {b.myListings.map((p) => (
              <div key={p.id} className="border border-stone-100 rounded-xl p-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm"><b>{p.title}</b> <span className="font-mono text-[11px] text-stone-500">{p.ref}</span> · ask {usd(p.asking_price)} · <b>{p.status}</b></div>
                  {["Active", "Under Offer"].includes(p.status) && <button disabled={busy} onClick={() => act({ action: "withdraw", package_id: p.id }, "Withdraw this package?")} className="text-xs font-bold text-stone-500 underline">Withdraw</button>}
                </div>
                {p.offers.map((o) => (
                  <div key={o.id} className="mt-2 flex flex-wrap items-center gap-2 text-xs">
                    Offer {usd(o.price)} (fee {usd(o.fee)}) · {o.status === "Pending" ? left(o.due_at) : o.status}
                    {o.status === "Pending" && (<>
                      <button disabled={busy} onClick={() => act({ action: "respond", offer_id: o.id, decision: "accept" }, `Accept ${usd(o.price)}?`)} className="rounded-full bg-emerald-700 text-white px-3 py-0.5 font-bold">Accept</button>
                      <button disabled={busy} onClick={() => act({ action: "respond", offer_id: o.id, decision: "decline" })} className="rounded-full bg-stone-200 px-3 py-0.5 font-bold">Decline</button>
                    </>)}
                  </div>
                ))}
              </div>
            ))}
          </section>
        )}

        {b.myOffers.length > 0 && (
          <section className="bg-white border border-stone-200 rounded-2xl p-5">
            <div className="font-bold mb-2">My offers</div>
            {b.myOffers.map((o) => (
              <div key={o.id} className="text-xs py-1">{o.title} <span className="font-mono text-stone-500">{o.ref}</span> · offered {usd(o.price)} (ask {usd(o.asking_price)}) · {o.status === "Pending" ? left(o.due_at) : o.status}</div>
            ))}
          </section>
        )}
        <p className="text-xs text-stone-500">Trades are between verified platform members. Loan sales to investors may be regulated; consult counsel before trading.</p>
      </main>
    </div>
  );
}
