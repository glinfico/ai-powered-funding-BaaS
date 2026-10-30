import React from "react";
import { useQuery } from "@tanstack/react-query";
import { DollarSign, ShieldCheck, Lock, CheckCircle2, Building2, UserCheck, ArrowUpRight, Zap, Building } from "lucide-react";

const fmt = v => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v) || 0);

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
    const val = parseFloat((lead.requested_amount || "$0").replace(/[^0-9.]/g, "")) || 0;
    return sum + val;
  }, 0);

  const grossCommission = totalFundedVolume * 0.05; // 5% Standard Gross Fee
  
  // Dual Model Calculation:
  // - If Subscribed Broker: 100% commission payout to broker
  // - If Unsubscribed / Institutional Direct Sender: 100% commission retained by Platform (0% broker payout)
  const brokerPayout = isSubscribed ? grossCommission : 0;
  const platformDealRevenue = isSubscribed ? 0 : grossCommission;

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "white", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ backgroundColor: "rgba(217, 119, 6, 0.15)", color: "#f59e0b", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>
                Commission & Institutional Revenue Command
              </span>
            </div>
            <h1 style={{ fontSize: "30px", fontWeight: "900", margin: 0 }}>Deal Execution & Revenue Split</h1>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: "4px 0 0 0" }}>
              Subscribed Brokers: 100% Commission Payout. Institutional & Unsubscribed Direct Senders: 100% Platform Retention.
            </p>
          </div>
          <a href="/portal" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white", padding: "10px 18px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", textDecoration: "none" }}>
            ← Back to Portal Hub
          </a>
        </div>

        {/* Status Banner */}
        <div style={{ backgroundColor: isSubscribed ? "rgba(52, 211, 153, 0.1)" : "rgba(217, 119, 6, 0.1)", border: isSubscribed ? "1px solid rgba(52, 211, 153, 0.3)" : "1px solid rgba(217, 119, 6, 0.3)", borderRadius: "16px", padding: "20px 24px", marginBottom: "32px", display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "14px" }}>
            {isSubscribed ? <UserCheck size={28} color="#34d399" /> : <Building size={28} color="#f59e0b" />}
            <div>
              <div style={{ fontSize: "16px", fontWeight: "800", color: isSubscribed ? "#34d399" : "#f59e0b" }}>
                {isSubscribed ? "Active Broker Subscription (100% Commission Mode)" : "Institutional / Unsubscribed Direct Mode (100% Platform Retention)"}
              </div>
              <div style={{ fontSize: "13px", color: "#94a3b8", marginTop: "2px" }}>
                {isSubscribed 
                  ? "You are subscribed. You receive 100% of deal commissions for deals you bring in or get assigned."
                  : "Fast & clean institutional execution enabled. 100% of deal commission is retained by the platform."}
              </div>
            </div>
          </div>
          {!isSubscribed && (
            <a href="/pricing" style={{ backgroundColor: "#d97706", color: "white", padding: "10px 20px", borderRadius: "10px", fontSize: "13px", fontWeight: "700", textDecoration: "none" }}>
              Upgrade to Broker Plan (100% Payouts) →
            </a>
          )}
        </div>

        {/* Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Total Closed Deal Volume</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "white" }}>{fmt(totalFundedVolume)}</div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>{closedDeals.length} qualified institutional/broker deals</div>
          </div>

          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Broker Commission Payout (100%)</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#34d399" }}>{fmt(brokerPayout)}</div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>{isSubscribed ? "Active subscription payout share" : "Requires active broker subscription"}</div>
          </div>

          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Platform Retained Deal Revenue (100%)</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#f59e0b" }}>{fmt(platformDealRevenue)}</div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>{isSubscribed ? "Platform subscription model active" : "Institutional fast-track execution fee"}</div>
          </div>
        </div>

        {/* Closed Deals & Execution Breakdown */}
        <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "20px", padding: "28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <Building2 size={20} color="#f59e0b" /> Institutional & Broker Deal Pipeline
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px" }}>Company / Deal</th>
                  <th style={{ padding: "12px" }}>Requested Amount</th>
                  <th style={{ padding: "12px" }}>AI Score</th>
                  <th style={{ padding: "12px" }}>5% Gross Fee</th>
                  <th style={{ padding: "12px" }}>Commission Routing</th>
                  <th style={{ padding: "12px" }}>Execution Status</th>
                </tr>
              </thead>
              <tbody>
                {closedDeals.length === 0 ? (
                  <tr>
                    <td colSpan="6" style={{ padding: "24px", textAlign: "center", color: "#94a3b8" }}>
                      No closed deals found in active cache. Submit a deal to test execution.
                    </td>
                  </tr>
                ) : (
                  closedDeals.map((deal, i) => {
                    const amt = parseFloat((deal.requested_amount || "$0").replace(/[^0-9.]/g, "")) || 0;
                    const fee = amt * 0.05;
                    return (
                      <tr key={i} style={{ borderBottom: "1px solid #334155" }}>
                        <td style={{ padding: "14px", fontWeight: "700" }}>{deal.business_name || deal.name || "Institutional Deal #" + (i+1)}</td>
                        <td style={{ padding: "14px", color: "#cbd5e1" }}>{deal.requested_amount || fmt(amt)}</td>
                        <td style={{ padding: "14px", color: "#34d399", fontWeight: "700" }}>{deal.score || 85}/100</td>
                        <td style={{ padding: "14px", fontWeight: "700", color: "white" }}>{fmt(fee)}</td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ backgroundColor: isSubscribed ? "rgba(52, 211, 153, 0.15)" : "rgba(245, 158, 11, 0.15)", color: isSubscribed ? "#34d399" : "#f59e0b", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                            {isSubscribed ? "100% to Broker" : "100% to Platform"}
                          </span>
                        </td>
                        <td style={{ padding: "14px" }}>
                          <span style={{ backgroundColor: "rgba(52, 211, 153, 0.15)", color: "#34d399", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                            Fast & Clean Execution
                          </span>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
