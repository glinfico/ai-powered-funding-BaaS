import React, { useState } from "react";
import { DollarSign, ShieldCheck, Zap, Award, CheckCircle2, TrendingUp } from "lucide-react";

const fmt = v => new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: 0 }).format(Number(v) || 0);

export default function CommissionDashboard() {
  // 100% Commission for Broker deals brought in or assigned
  const [commissions] = useState([
    { id: "COMM-101", deal: "Apex Logistics Growth", broker: "Sarah Jenkins", amount: 18500, share: 18500, status: "Paid", date: "2026-10-15" },
    { id: "COMM-102", deal: "Pacific RE Bridge", broker: "Michael Chang", amount: 24000, share: 24000, status: "Pending Payout", date: "2026-10-18" },
    { id: "COMM-103", deal: "Metro Transit Fleet", broker: "David Ross", amount: 12000, share: 12000, status: "Paid", date: "2026-10-10" },
    { id: "COMM-104", deal: "Sunbelt Portfolio", broker: "Elena Rostova", amount: 62000, share: 62000, status: "Pending Payout", date: "2026-10-19" },
  ]);

  // 100% Platform Subscription Revenue (Starter $999, Growth $1,499, Pro $2,999, Enterprise $7,999)
  const [platformSubscriptions] = useState([
    { id: "SUB-501", broker: "Sarah Jenkins", plan: "Growth", amount: 1499, status: "Active", date: "2026-10-01" },
    { id: "SUB-502", broker: "Michael Chang", plan: "Pro", amount: 2999, status: "Active", date: "2026-10-05" },
    { id: "SUB-503", broker: "David Ross", plan: "Starter", amount: 999, status: "Active", date: "2026-10-10" },
    { id: "SUB-504", broker: "Elena Rostova", plan: "Enterprise", amount: 7999, status: "Active", date: "2026-10-12" },
  ]);

  const totalBrokerEarned = commissions.reduce((s, c) => s + c.share, 0);
  const totalBrokerPaid = commissions.filter(c => c.status === "Paid").reduce((s, c) => s + c.share, 0);
  const totalPlatformRevenue = platformSubscriptions.reduce((s, sub) => s + sub.amount, 0);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#090d16", color: "white", padding: "40px 20px" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        
        {/* Header */}
        <div style={{ marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "6px" }}>
              <span style={{ backgroundColor: "rgba(217, 119, 6, 0.15)", color: "#f59e0b", padding: "4px 12px", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>
                Commission & Revenue Engine
              </span>
            </div>
            <h1 style={{ fontSize: "30px", fontWeight: "900", margin: 0 }}>Broker Payouts & Platform Revenue</h1>
            <p style={{ color: "#94a3b8", fontSize: "14px", margin: "4px 0 0 0" }}>
              Brokers receive 100% commission on assigned/brought deals. Platform retains 100% of subscription fees.
            </p>
          </div>
          <a href="/portal" style={{ backgroundColor: "#1e293b", border: "1px solid #334155", color: "white", padding: "10px 18px", borderRadius: "10px", fontSize: "14px", fontWeight: "700", textDecoration: "none" }}>
            ← Back to Portal Hub
          </a>
        </div>

        {/* Metrics Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "40px" }}>
          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Total Broker Payouts (100% Split)</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#34d399" }}>{fmt(totalBrokerEarned)}</div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>Paid: {fmt(totalBrokerPaid)}</div>
          </div>

          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Platform Subscription Revenue (100%)</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "#f59e0b" }}>{fmt(totalPlatformRevenue)}</div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>From Starter, Growth, Pro & Enterprise tiers</div>
          </div>

          <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "16px", padding: "24px" }}>
            <div style={{ color: "#94a3b8", fontSize: "13px", fontWeight: "600", marginBottom: "8px" }}>Active Subscribed Brokers</div>
            <div style={{ fontSize: "32px", fontWeight: "900", color: "white" }}>{platformSubscriptions.length}</div>
            <div style={{ color: "#94a3b8", fontSize: "12px", marginTop: "6px" }}>Zero platform commission deduction on deals</div>
          </div>
        </div>

        {/* Broker Deals Commission Table (100% Payout) */}
        <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "20px", padding: "28px", marginBottom: "40px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <Award size={20} color="#34d399" /> Broker Deal Commissions (100% Payout Rate)
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>Deal Name</th>
                  <th style={{ padding: "12px" }}>Broker</th>
                  <th style={{ padding: "12px" }}>Deal Value / Fee</th>
                  <th style={{ padding: "12px" }}>Broker Commission (100%)</th>
                  <th style={{ padding: "12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {commissions.map((c, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "14px", fontWeight: "700", color: "#f59e0b" }}>{c.id}</td>
                    <td style={{ padding: "14px", fontWeight: "600" }}>{c.deal}</td>
                    <td style={{ padding: "14px", color: "#cbd5e1" }}>{c.broker}</td>
                    <td style={{ padding: "14px", color: "#94a3b8" }}>{fmt(c.amount)}</td>
                    <td style={{ padding: "14px", fontWeight: "800", color: "#34d399" }}>{fmt(c.share)}</td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ backgroundColor: c.status === "Paid" ? "rgba(52, 211, 153, 0.15)" : "rgba(245, 158, 11, 0.15)", color: c.status === "Paid" ? "#34d399" : "#f59e0b", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                        {c.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Platform Subscriptions Table (100% Platform Revenue) */}
        <div style={{ backgroundColor: "#1e293b", border: "1px solid #334155", borderRadius: "20px", padding: "28px" }}>
          <h2 style={{ fontSize: "20px", fontWeight: "800", margin: "0 0 16px 0", display: "flex", alignItems: "center", gap: "10px" }}>
            <Zap size={20} color="#f59e0b" /> Platform Subscription Revenue (100% Platform Fee)
          </h2>
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left", fontSize: "14px" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid #334155", color: "#94a3b8", fontSize: "12px", textTransform: "uppercase" }}>
                  <th style={{ padding: "12px" }}>ID</th>
                  <th style={{ padding: "12px" }}>Broker</th>
                  <th style={{ padding: "12px" }}>Plan Tier</th>
                  <th style={{ padding: "12px" }}>Platform Revenue (100%)</th>
                  <th style={{ padding: "12px" }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {platformSubscriptions.map((sub, i) => (
                  <tr key={i} style={{ borderBottom: "1px solid #334155" }}>
                    <td style={{ padding: "14px", fontWeight: "700", color: "#f59e0b" }}>{sub.id}</td>
                    <td style={{ padding: "14px", fontWeight: "600" }}>{sub.broker}</td>
                    <td style={{ padding: "14px", color: "#cbd5e1" }}>{sub.plan} Plan</td>
                    <td style={{ padding: "14px", fontWeight: "800", color: "#f59e0b" }}>{fmt(sub.amount)}/mo</td>
                    <td style={{ padding: "14px" }}>
                      <span style={{ backgroundColor: "rgba(52, 211, 153, 0.15)", color: "#34d399", padding: "4px 10px", borderRadius: "8px", fontSize: "12px", fontWeight: "700" }}>
                        {sub.status}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}
