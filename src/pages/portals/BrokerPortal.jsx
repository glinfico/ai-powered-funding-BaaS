import React from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { ShieldCheck } from "lucide-react";

export default function BrokerPortal() {
  const navigate = useNavigate();
  const isSubscribed = localStorage.getItem("glinfico_broker_subscribed") === "true";

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "32px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", backgroundColor: "white", padding: "20px 24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div>
            <span style={{ backgroundColor: "rgba(245, 158, 11, 0.1)", color: "#b45309", fontWeight: "700", fontSize: "11px", padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase" }}>Broker Portal</span>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "8px 0 0 0" }}>Brokerage & Deal Submission Hub</h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button onClick={() => navigate("/portal")} variant="outline" style={{ fontWeight: "600" }}>Portal Hub</Button>
            {!isSubscribed && (
              <Button onClick={() => navigate("/pricing")} style={{ backgroundColor: "#f59e0b", color: "white", fontWeight: "700" }}>Upgrade to 100% Commission ($99/mo)</Button>
            )}
          </div>
        </div>

        {isSubscribed ? (
          <div style={{ backgroundColor: "#ecfdf5", border: "1px solid #a7f3d0", padding: "16px 24px", borderRadius: "12px", marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <ShieldCheck size={24} style={{ color: "#059669" }} />
            <div>
              <h4 style={{ margin: "0", color: "#065f46", fontWeight: "700" }}>Active Broker Subscription: 100% Commission Tier Unlocked</h4>
              <p style={{ margin: "4px 0 0 0", color: "#047857", fontSize: "13px" }}>All submitted deals retain 100% of broker commissions with zero platform splits.</p>
            </div>
          </div>
        ) : (
          <div style={{ backgroundColor: "#fffbeb", border: "1px solid #fde68a", padding: "16px 24px", borderRadius: "12px", marginBottom: "32px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <h4 style={{ margin: "0", color: "#b45309", fontWeight: "700" }}>Standard Commission Tier (50% Split)</h4>
              <p style={{ margin: "4px 0 0 0", color: "#92400e", fontSize: "13px" }}>Upgrade your subscription to unlock 100% commission retention on direct deal submissions.</p>
            </div>
            <Button onClick={() => navigate("/pricing")} style={{ backgroundColor: "#f59e0b", color: "white", fontWeight: "700" }}>Upgrade Now</Button>
          </div>
        )}

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Submitted Deals</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0" }}>14</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Pending Commission Payouts</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#f59e0b", margin: "0" }}>$24,850</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Lender Network Reach</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#10b981", margin: "0" }}>22,400+ Lenders</h3></CardContent></Card>
        </div>

        <Card style={{ border: "1px solid #e2e8f0" }}>
          <CardHeader><CardTitle style={{ fontSize: "18px", fontWeight: "800" }}>Quick Broker Actions</CardTitle></CardHeader>
          <CardContent style={{ display: "flex", gap: "16px", flexWrap: "wrap" }}>
            <Button onClick={() => navigate("/crm/leads")} style={{ backgroundColor: "#0f172a", color: "white", fontWeight: "700" }}>Manage Client Leads</Button>
            <Button onClick={() => navigate("/crm/deals")} variant="outline" style={{ fontWeight: "700" }}>Submit New Deal to 22K+ Lenders</Button>
            <Button onClick={() => navigate("/crm/commissions")} variant="outline" style={{ fontWeight: "700" }}>View Commission Dashboard</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
