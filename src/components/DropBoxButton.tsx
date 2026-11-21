"use client";
import { useState } from "react";
import { usePathname } from "next/navigation";

const ADMIN = [/^\/$/, /^\/crm/, /^\/ppg(?!\/market)/, /^\/lab/];

export default function DropBoxButton() {
  const path = usePathname() || "";
  const [open, setOpen] = useState(false);
  if (!ADMIN.some(r => r.test(path))) return null;
  return (
    <>
      <button onClick={() => setOpen(true)} title="Drop lenders, investors or leads"
        style={{ position: "fixed", right: 20, top: 72, zIndex: 9998, padding: "12px 18px", borderRadius: 999, background: "#0284c7", color: "#fff", border: "none", fontWeight: 600, fontSize: 14, boxShadow: "0 8px 24px rgba(0,0,0,.35)", cursor: "pointer" }}>
        📥 Drop Box
      </button>
      {open && (
        <div onClick={() => setOpen(false)} style={{ position: "fixed", inset: 0, zIndex: 9999, background: "rgba(2,6,23,.6)" }}>
          <div onClick={e => e.stopPropagation()} style={{ position: "absolute", top: 0, right: 0, height: "100%", width: "min(1000px, 100%)", background: "#020617", boxShadow: "-8px 0 32px rgba(0,0,0,.5)", display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 16px", borderBottom: "1px solid #1e293b", color: "#e2e8f0" }}>
              <b>CCD-V2 Drop Box</b>
              <span>
                <a href="/dropbox" target="_blank" style={{ color: "#38bdf8", fontSize: 13, marginRight: 16 }}>↗ full page</a>
                <button onClick={() => setOpen(false)} style={{ background: "none", border: "none", color: "#e2e8f0", fontSize: 20, cursor: "pointer" }}>✕</button>
              </span>
            </div>
            <iframe src="/dropbox" style={{ flex: 1, border: "none", width: "100%" }} title="Drop Box" />
          </div>
        </div>
      )}
    </>
  );
}
