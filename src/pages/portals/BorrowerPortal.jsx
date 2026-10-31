import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { UploadCloud } from "lucide-react";

export default function BorrowerPortal() {
  const navigate = useNavigate();
  const [loans] = useState([
    { id: "LN-8842", type: "Merchant Cash Advance (MCA)", amount: "$150,000", status: "Underwriting Review", progress: 65, date: "2026-10-24" },
    { id: "LN-9102", type: "Real Estate Investment (REI)", amount: "$850,000", status: "Term Sheet Issued", progress: 90, date: "2026-10-18" }
  ]);

  return (
    <div style={{ minHeight: "100vh", backgroundColor: "#f8fafc", padding: "32px 20px", fontFamily: "system-ui, -apple-system, sans-serif" }}>
      <div style={{ maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", backgroundColor: "white", padding: "20px 24px", borderRadius: "16px", border: "1px solid #e2e8f0" }}>
          <div>
            <span style={{ backgroundColor: "rgba(59, 130, 246, 0.1)", color: "#2563eb", fontWeight: "700", fontSize: "11px", padding: "4px 12px", borderRadius: "20px", textTransform: "uppercase" }}>Borrower Portal</span>
            <h1 style={{ fontSize: "24px", fontWeight: "800", color: "#0f172a", margin: "8px 0 0 0" }}>My Funding Dashboard</h1>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <Button onClick={() => navigate("/portal")} variant="outline" style={{ fontWeight: "600" }}>Portal Hub</Button>
            <Button onClick={() => navigate("/")} variant="destructive" style={{ backgroundColor: "#ef4444", color: "white" }}>Sign Out</Button>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "20px", marginBottom: "32px" }}>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Active Applications</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#0f172a", margin: "0" }}>2</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Total Capital Requested</p><h3 style={{ fontSize: "28px", fontWeight: "800", color: "#2563eb", margin: "0" }}>$1,000,000</h3></CardContent></Card>
          <Card style={{ border: "1px solid #e2e8f0" }}><CardContent style={{ padding: "24px" }}><p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 8px 0" }}>Underwriting Status</p><h3 style={{ fontSize: "20px", fontWeight: "800", color: "#10b981", margin: "0" }}>Active Matching</h3></CardContent></Card>
        </div>

        <Card style={{ border: "1px solid #e2e8f0", marginBottom: "32px" }}>
          <CardHeader><CardTitle style={{ fontSize: "18px", fontWeight: "800" }}>Active Financing Applications & Term Sheets</CardTitle></CardHeader>
          <CardContent>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {loans.map(loan => (
                <div key={loan.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px", borderRadius: "12px", border: "1px solid #e2e8f0", backgroundColor: "#fff" }}>
                  <div>
                    <div style={{ display: "flex", gap: "12px", alignItems: "center", marginBottom: "6px" }}>
                      <span style={{ fontWeight: "700", color: "#0f172a" }}>{loan.id}</span>
                      <Badge variant="outline" style={{ color: "#2563eb", borderColor: "#bfdbfe", backgroundColor: "#eff6ff" }}>{loan.type}</Badge>
                    </div>
                    <p style={{ color: "#64748b", fontSize: "13px", margin: "0" }}>Requested: <strong>{loan.amount}</strong> • Submitted: {loan.date}</p>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ display: "inline-block", padding: "4px 12px", borderRadius: "20px", backgroundColor: "#fef3c7", color: "#d97706", fontWeight: "700", fontSize: "12px", marginBottom: "6px" }}>{loan.status}</span>
                    <p style={{ color: "#64748b", fontSize: "12px", margin: "0" }}>Progress: {loan.progress}%</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card style={{ border: "1px solid #e2e8f0" }}>
          <CardHeader><CardTitle style={{ fontSize: "18px", fontWeight: "800" }}>Secure Document Center (Bank Statements & Tax Returns)</CardTitle></CardHeader>
          <CardContent style={{ textAlign: "center", padding: "40px", border: "2px dashed #cbd5e1", borderRadius: "12px", backgroundColor: "#fafaf9" }}>
            <UploadCloud size={48} style={{ color: "#64748b", marginBottom: "16px" }} />
            <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#0f172a", margin: "0 0 8px 0" }}>Drag & Drop business bank statements or tax documents</h3>
            <p style={{ color: "#64748b", fontSize: "14px", margin: "0 0 20px 0" }}>Supported formats: PDF, XLSX, CSV (Encrypted 256-bit)</p>
            <Button style={{ backgroundColor: "#2563eb", color: "white", fontWeight: "700" }}>Browse Files</Button>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
