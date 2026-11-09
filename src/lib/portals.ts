// Shared portal registry — public-safe (names + URLs only, never secrets).
export const PORTALS: { id: string; name: string; url: string; desc: string; internal?: boolean }[] = [
  { id: "cc", name: "GLINFICO Control Center (this app)", url: "/crm", internal: true, desc: "CCD — admin, after PPG sign-in" },
  { id: "lab", name: "Load Lab / Engine bench", url: "/lab", internal: true, desc: "10K load tests, vault, exports" },
  { id: "consent", name: "Consent e-form (public)", url: "/consent/<token>", internal: true, desc: "One-time HMAC links via SMS/email" },
  { id: "netlify", name: "Netlify (fod.glinfico.com)", url: "https://app.netlify.com", desc: "Hosting / deploys / domain" },
  { id: "supabase", name: "Supabase (Postgres)", url: "https://supabase.com/dashboard", desc: "Database — login already registered" },
  { id: "github", name: "GitHub (repo → Netlify)", url: "https://github.com", desc: "Source; push commit to deploy" },
  { id: "idiq", name: "IDIQ partner portal", url: "https://api.idandcredit.com", desc: "Identity + soft pulls + monitoring" },
  { id: "fingoal", name: "FinGoal developer dashboard", url: "https://docs.fingoal.dev", desc: "Banking / transaction enrichment" },
  { id: "datalink", name: "Data Link portal", url: "https://datalink.example", desc: "Bank-DB data feed (SSN/DOB)" },
  { id: "twilio", name: "Twilio console", url: "https://console.twilio.com", desc: "SMS + A2P 10DLC; webhook → /api/consent/webhook" },
  { id: "sendgrid", name: "SendGrid", url: "https://app.sendgrid.com", desc: "Email delivery" },
  { id: "ide", name: "IDE feed (scored leads)", url: "/api/ide/leads", internal: true, desc: "What IDE consumes" },
];
