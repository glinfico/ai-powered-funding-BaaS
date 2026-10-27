import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShieldCheck, Lock, CheckCircle2, Building2, UserCheck, ArrowUpRight } from "lucide-react";

export default function CommissionDashboard() {
  const isSubscribed = localStorage.getItem("glinfico_broker_subscribed") === "true";

  const { data: leads = [] } = useQuery({
    queryKey: ["leads"],
    queryFn: () => {
      try {
        const cached = localStorage.getItem("glinfico_leads_master");
        if (cached) return JSON.parse(cached);
      } catch (e) {}
      return [];
    }
  });

  const closedDeals = leads.filter(l => l.status === "Auto-Closed & Unlocked" || l.score >= 50);

  const totalFundedVolume = closedDeals.reduce((sum, lead) => {
    const val = parseFloat((lead.requested_amount || "$0").replace(/[^0-9.]/g, '')) || 0;
    return sum + val;
  }, 0);

  const grossCommission = totalFundedVolume * 0.05; // 5% Gross Fee
  const brokerPayout = isSubscribed ? grossCommission : 0; // 100% Broker Payout if Subscribed
  const houseRetention = isSubscribed ? 0 : grossCommission; // 100% House Retention if Non-Subscribed

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight flex items-center gap-2.5">
            <DollarSign className="w-7 h-7 text-emerald-600" />
            Broker Commission & Retention Ledger
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Enforcing strict 100% Broker Payout (Subscribed) vs. 100% House Retention (Non-Subscribed) — Zero Split Model.
          </p>
        </div>

        <div className={`px-4 py-2 rounded-xl text-xs font-bold border flex items-center gap-2 ${
          isSubscribed ? "bg-emerald-50 text-emerald-800 border-emerald-300" : "bg-amber-50 text-amber-900 border-amber-300"
        }`}>
          {isSubscribed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Lock className="w-4 h-4 text-amber-600" />}
          Subscription Status: <strong>{isSubscribed ? "ACTIVE (100% Broker Commission Locked)" : "NON-SUBSCRIBER (100% House Retention)"}</strong>
        </div>
      </div>

      {/* Commission Breakdown Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Total Closed Funded Volume</div>
          <div className="text-3xl font-black text-slate-900">${totalFundedVolume.toLocaleString()}</div>
          <div className="text-[11px] text-slate-500">Across {closedDeals.length.toLocaleString()} qualified pipeline deals</div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">Broker Earnings (100% Payout)</div>
          <div className="text-3xl font-black text-emerald-600">${brokerPayout.toLocaleString()}</div>
          <div className="text-[11px] text-emerald-700 font-semibold">
            {isSubscribed ? "100% Payout Allocated to Broker" : "$0 (Requires Active Subscription)"}
          </div>
        </div>

        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm space-y-2">
          <div className="text-xs font-bold text-slate-400 uppercase tracking-wider">House Account Retention</div>
          <div className="text-3xl font-black text-amber-600">${houseRetention.toLocaleString()}</div>
          <div className="text-[11px] text-amber-700 font-semibold">
            {isSubscribed ? "$0 Retained by House" : "100% Retained by House Account"}
          </div>
        </div>
      </div>

      {/* Individual Deal Commission Ledger Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-5 bg-slate-50 border-b border-slate-200 font-bold text-slate-900 text-sm">
          Deal-by-Deal Commission Allocation Ledger
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-100/70 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase">
                <th className="py-3.5 px-5">Deal Name / ID</th>
                <th className="py-3.5 px-5">Funding Volume</th>
                <th className="py-3.5 px-5">Gross Fee (5%)</th>
                <th className="py-3.5 px-5">Broker Payout (100%)</th>
                <th className="py-3.5 px-5 text-right">House Retention</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs font-medium">
              {closedDeals.slice(0, 15).map((deal, idx) => {
                const vol = parseFloat((deal.requested_amount || "$0").replace(/[^0-9.]/g, '')) || 0;
                const fee = vol * 0.05;
                const bPayout = isSubscribed ? fee : 0;
                const hRet = isSubscribed ? 0 : fee;

                return (
                  <tr key={idx} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-4 px-5 font-bold text-slate-900">
                      <div>{deal.company_name}</div>
                      <div className="text-[10px] text-slate-400 font-mono">{deal.id}</div>
                    </td>
                    <td className="py-4 px-5 font-bold text-slate-900">${vol.toLocaleString()}</td>
                    <td className="py-4 px-5 font-bold text-slate-700">${fee.toLocaleString()}</td>
                    <td className="py-4 px-5 font-bold text-emerald-600">${bPayout.toLocaleString()}</td>
                    <td className="py-4 px-5 text-right font-bold text-amber-600">${hRet.toLocaleString()}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
