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
  rows: (string | number)[][];
  empty: string;
};

export default function MyPortal() {
  const [me, setMe] = useState<View | null>(null);
  const [err, setErr] = useState("");
  const [rules, setRules] = useState<{ rules: RoleRules | null; accepted: boolean } | null>(null);
  const [showRules, setShowRules] = useState(false);
  const [notice, setNotice] = useState("");
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
                  {r.map((v, j) => <td key={j} className={`px-4 py-2.5 ${j === 0 ? "font-bold" : "text-xs"} ${j === 1 ? "font-mono" : ""}`}>{v}</td>)}
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
