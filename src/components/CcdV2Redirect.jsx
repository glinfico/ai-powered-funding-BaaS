import { useEffect } from "react";

// Hands the Control Center over to the new WSD (CCD-V2).
// The PFE and its sign-in are untouched; only the old /crm pages point here.
export const CCD_V2_URL = (import.meta.env.VITE_CCD_V2_URL || "https://admin-glinfico.netlify.app").replace(/\/$/, "");

export default function CcdV2Redirect() {
  useEffect(() => {
    window.location.replace(`${CCD_V2_URL}/gate?next=/crm`);
  }, []);
  return (
    <div style={{ minHeight: "100vh", display: "grid", placeItems: "center", background: "#0a0a12", color: "#cbd5e1", fontFamily: "system-ui, sans-serif" }}>
      Opening the GLINFICO Control Center…
    </div>
  );
}
