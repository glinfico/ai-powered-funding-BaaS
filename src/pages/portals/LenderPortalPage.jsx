import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";

export default function LenderPortalPage() {
  const navigate = useNavigate();
  const [deals] = useState([
    { id: "DL-4021", borrower: "TechFlow Logistics LLC", amount: "$350,000", product: "Merchant Cash Advance", riskScore: "A (94%)", status: "Ready for Term Sheet" },
    { id: "DL-4089", borrower: "Metro Retail Corp", amount: "$1,200,000", product: "Real Estate Investment", riskScore: "A- (88%)", status: "Under Review" }
  ]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "32px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", backgroundColor: "white", padding: "20px 24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div>
            <span style={{ backgroundColor: "rgba(16, 185, 129, 0.1)", color: "#047857", fontWeight: "700", fontSize: "11px", padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase" }}>Lender Portal</span>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "8px 0 0 0" }}>Institutional Lender Deal Queue</h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button onClick={() => navigate("/portal")} variant="outline" style={{ fontWeight: "600" }}>Portal Hub</Button>
            <Button onClick={() => navigate("/crm/lenders")} style={{ backgroundColor: "#10b981", color: "white", fontWeight: "700" }}>Lender Directory</Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Matched Deals Queue</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0" }}>8</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Total Deployed Capital</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#10b981", margin: "0" }}>$14,500,000</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Average Risk Score</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", margin: "0" }}>91% (Tier A)</h3></CardContent></Card>
        </div>

        <Card style={{ border: "1px solid #e2e8f0" }}>
          <CardHeader><CardTitle style={{ fontSize: "18px", fontWeight: "800" }}>Incoming Matched Deals & Risk Matrices</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {deals.map(d => (
                <div key={d.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
                  <div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{d.id}</span>
                      <span style={{ fontWeight: "600", color: "#334155" }}>{d.borrower}</span>
                      <Badge variant="outline" style={{ color: "#047857", borderColor: "#a7f3d0", backgroundColor: "#ecfdf5" }}>{d.product}</Badge>
                    </div>
                    <p style={{ color: "#64748b", fontSize: "13px", margin: "0" }}>Amount: <strong>{d.amount}</strong> • AI Risk Score: <strong>{d.riskScore}</strong></p>
                  </div>
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <span style={{ padding: "4px 12px", borderRadius: "20px", backgroundColor: "#eff6ff", color: "#2563eb", fontWeight: "700", fontSize: "12px" }}>{d.status}</span>
                    <Button size="sm" style={{ backgroundColor: "#10b981", color: "white", fontWeight: "700" }}>Issue Term Sheet</Button>
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
