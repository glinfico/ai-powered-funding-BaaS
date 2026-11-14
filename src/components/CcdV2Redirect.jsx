import { useEffect } from "react";

// Hands the Control Center over to the new WSD (CCD-V2).
// The PFE and its sign-in are untouched; only the old /crm pages point here.
export const CCD_V2_URL = (import.meta.env.VITE_CCD_V2_URL || "https://admin-glinfico.netlify.app").replace(/\/$/, "");

// next="/crm" (staff Control Center, default) or next="/ppg" (member private portals).
export default function CcdV2Redirect({ next = "/crm" }) {
  useEffect(() => {
    window.location.replace(`${CCD_V2_URL}/gate?next=${next === "/ppg" ? "/ppg" : "/crm"}`);
  }, [next]);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a12", color: "#cbd5e1", fontFamily: "system-ui, sans-serif" }}>
      Opening the GLINFICO Control Center…
    </div>
  );
}
