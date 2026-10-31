import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { RefreshCw } from "lucide-react";

export default function InvestorPortal() {
  const navigate = useNavigate();
  const [opportunities] = useState([
    { id: "OPP-901", title: "Q4 Tech Growth Fund Tranche", target: "$2,500,000", raised: "$1,850,000", apr: "14.5%", term: "12 Months", risk: "Low (A)" },
    { id: "OPP-902", title: "Commercial Real Estate Pool A", target: "$5,000,000", raised: "$3,200,000", apr: "11.2%", term: "24 Months", risk: "Secure (AA)" },
    { id: "OPP-903", title: "Merchant Cash Advance Yield Tranche", target: "$1,000,000", raised: "$920,000", apr: "18.0%", term: "6 Months", risk: "Moderate (BBB)" }
  ]);
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 600);
  };

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "32px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", backgroundColor: "white", padding: "20px 24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div>
            <span style={{ backgroundColor: "rgba(139, 92, 246, 0.1)", color: "#7c3aed", fontWeight: "700", fontSize: "11px", padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase" }}>Investor Portal</span>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "8px 0 0 0" }}>Institutional Investor Syndicate Portal</h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button onClick={handleRefresh} variant="outline" style={{ display: "flex", alignItems: "center", gap: "6px", fontWeight: "600" }}>
              <RefreshCw size={14} className={refreshing ? "animate-spin" : ""} /> Sync Live Data
            </Button>
            <Button onClick={() => navigate("/portal")} variant="outline" style={{ fontWeight: "600" }}>Portal Hub</Button>
            <Button onClick={() => navigate("/crm/investors")} style={{ backgroundColor: "#8b5cf6", color: "white", fontWeight: "700" }}>Investor Directory</Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Active Portfolio Valuation</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0" }}>$5,970,000</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Blended Annual Yield (APR)</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#10b981", margin: "0" }}>14.2%</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Monthly ROI Distribution</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#7c3aed", margin: "0" }}>$70,650</h3></CardContent></Card>
        </div>

        <Card style={{ border: "1px solid #e2e8f0", marginBottom: "32px" }}>
          <CardHeader><CardTitle style={{ fontSize: "18px", fontWeight: "800" }}>Live Syndicated Investment Opportunities</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {opportunities.map(opp => (
                <div key={opp.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
                  <div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{opp.id}</span>
                      <span style={{ fontWeight: "700", color: "#1e293b" }}>{opp.title}</span>
                      <Badge variant="outline" style={{ color: "#7c3aed", borderColor: "#ddd6fe", backgroundColor: "#f5f3ff" }}>{opp.risk}</Badge>
                    </div>
                    <p style={{ color: "#64748b", fontSize: "13px", margin: "0" }}>Target: <strong>{opp.target}</strong> • Raised: <strong style={{ color: "#10b981" }}>{opp.raised}</strong> • APR: <strong style={{ color: "#2563eb" }}>{opp.apr}</strong> • Term: {opp.term}</p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <Button size="sm" style={{ backgroundColor: "#8b5cf6", color: "white", fontWeight: "700" }}>Participate in Tranche</Button>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
