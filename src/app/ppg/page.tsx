"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { ShieldCheck, Users, Handshake, FolderOpen, CheckSquare, Loader2, LogOut } from "lucide-react";

function money(n: number) { return n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n}`; }

export default function MyPortal() {
  const [me, setMe] = useState<any>(null);
  const [err, setErr] = useState("");
  const router = useRouter();
  useEffect(() => {
    fetch("/api/ppg").then(async r => { if (r.status === 401) { router.push("/gate?next=/ppg"); return; } setMe(await r.json()); }).catch(() => setErr("load failed"));
  }, []);
  if (!me) return <div className="min-h-screen bg-stone-950 text-white grid place-items-center"><Loader2 className="w-8 h-8 animate-spin text-emerald-400" /></div>;
  return (
    <div className="min-h-screen bg-[#F6F4EF] text-stone-900">
      <header className="bg-stone-950 text-white">
        <div className="max-w-5xl mx-auto px-6 py-5 flex flex-wrap items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-emerald-500 grid place-items-center"><ShieldCheck className="w-5 h-5 text-stone-950" /></div>
            <div>
              <div className="font-black text-lg leading-none">My Private Portal (PPG)</div>
              <div className="text-xs text-stone-400 mt-1">{me.email} · role: {me.role} · routed here by the sign-in, no subdomain</div>
            </div>
          </div>
          <button onClick={async () => { await fetch("/api/gate", { method: "DELETE" }); location.href = "/gate"; }} className="inline-flex items-center gap-1.5 text-xs font-bold bg-white/10 border border-white/15 rounded-full px-3 py-2"><LogOut className="w-4 h-4" />Sign out</button>
        </div>
      </header>
      <main className="max-w-5xl mx-auto px-6 py-6 space-y-4">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[["MY LEADS (LAE-assigned)", me.counts.leads, Users], ["MY DEALS", me.counts.deals, Handshake], ["MY DOCS", me.counts.docs, FolderOpen], ["OPEN TASKS", me.counts.openTasks, CheckSquare]].map(([l, v, I]: any) => (
            <div key={l} className="bg-white border border-stone-200 rounded-2xl p-4 text-center"><I className="w-4 h-4 mx-auto text-emerald-700" /><div className="font-black text-2xl mt-1">{v}</div><div className="text-[10px] font-black text-stone-500">{l}</div></div>
          ))}
        </div>
        <div className="bg-white border border-stone-200 rounded-2xl overflow-x-auto">
          <table className="w-full text-sm min-w-[700px]">
            <thead><tr className="text-left text-[11px] uppercase text-stone-500 border-b border-stone-100"><th className="px-4 py-3">Lead</th><th className="px-3 py-3">Code</th><th className="px-3 py-3">Loan history</th><th className="px-3 py-3">Deal</th><th className="px-3 py-3">Docs</th></tr></thead>
            <tbody>
              {me.leads.map((l: any) => {
                const d = me.deals.find((x: any) => x.leadId === l.id);
                const dc = me.docs.filter((x: any) => x.leadId === l.id);
                return (
                  <tr key={l.id} className="border-b border-stone-50">
                    <td className="px-4 py-2.5 font-bold">{l.firstName} {l.lastName}<div className="text-xs text-stone-500 font-normal">{l.email}</div></td>
                    <td className="px-3 py-2.5 font-mono text-xs">{l.code}</td>
                    <td className="px-3 py-2.5 text-xs">{l.loanOutcome} {l.loanAmount ? `· ${money(l.loanAmount)}` : ""}</td>
                    <td className="px-3 py-2.5 text-xs">{d ? `${d.stage} · ${money(d.amount)}` : "—"}</td>
                    <td className="px-3 py-2.5 text-xs">{dc.length ? `${dc.filter((x: any) => x.status !== "missing").length}/${dc.length} ready` : "—"}</td>
                  </tr>);
              })}
              {me.leads.length === 0 && <tr><td colSpan={5} className="p-8 text-center text-stone-400">No leads assigned to you yet — run the LAE in the Control Center (admin) to assign leads to users.</td></tr>}
            </tbody>
          </table>
        </div>
        <p className="text-xs text-stone-500">Admins reach the full Control Center only after the LAE grants admin access at sign-in (logged as LAE.admin_access_granted).</p>
      </main>
    </div>
  );
}
