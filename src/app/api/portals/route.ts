import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

// Portal registry with login links + which credentials are present in the
// system env. NEVER returns secret values — only presence flags.
const PORTALS = [
  { id: "cc", name: "GLINFICO Control Center (this app)", url: "/crm", internal: true, desc: "Main app: leads, deals, pipeline, engines, commissions", keys: [] },
  { id: "lab", name: "Load Lab / Engine bench", url: "/lab", internal: true, desc: "10K load tests, integration vault, exports, morning briefing", keys: [] },
  { id: "consent", name: "Consent e-form (public)", url: "/consent/<token>", internal: true, desc: "One-time HMAC links sent by SMS/email", keys: ["CONSENT_SIGNING_SECRET"] },
  { id: "idiq", name: "IDIQ partner portal (IdentityIQ / IDCS)", url: "https://api.idandcredit.com", keys: ["IDIQ_API_KEY", "IDIQ_PARTNER_ID"], desc: "Identity verification + soft pulls + monitoring" },
  { id: "fingoal", name: "FinGoal developer dashboard", url: "https://docs.fingoal.dev", keys: ["FINGOAL_API_KEY"], desc: "Banking / transaction enrichment (Insights API)" },
  { id: "datalink", name: "Data Link portal", url: "https://datalink.example", keys: ["DATA_LINK_API_KEY"], desc: "Bank-DB data feed (SSN/DOB source)" },
  { id: "twilio", name: "Twilio console", url: "https://console.twilio.com", keys: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"], desc: "SMS transport + A2P 10DLC; webhook → /api/consent/webhook" },
  { id: "sendgrid", name: "SendGrid (email)", url: "https://app.sendgrid.com", keys: ["SENDGRID_API_KEY", "SENDGRID_FROM"], desc: "Email delivery for consent requests" },
  { id: "ide", name: "IDE — Identification Engine feed", url: "/api/ide/leads", internal: true, keys: ["IDE_WEBHOOK_URL"], desc: "Scored leads consumed here (pull or webhook)" },
  { id: "db", name: "PostgreSQL (bank DB replica)", url: "—", keys: ["DATABASE_URL"], desc: "App database; bank DB connection separate" },
];

export async function GET() {
  const rows = PORTALS.map(p => ({
    ...p,
    keyStatus: p.keys.map(k => ({ key: k, present: !!process.env[k] })),
    ready: p.keys.length === 0 ? true : p.keys.every(k => !!process.env[k]),
  }));
  return NextResponse.json({
    portals: rows,
    target: "fod.glinfico.com via Netlify (GitHub commit) or Render; Postgres on Supabase; old clanker replaced by pointing the domain at the new site",
    deployChecklist: [
      "Push this GitHub repo → Netlify (netlify.toml included) or Render (render.yaml). One deploy = whole CCD + 4 engines + /lab",
      "Assign custom domain fod.glinfico.com in Netlify → this replaces the old clanker (delete old site after cutover)",
      "Supabase: DATABASE_URL = postgres://postgres:<pw>@db.<ref>.supabase.co:5432/postgres (login already registered); then `npx drizzle-kit push` once",
      "Env secrets in hosting dashboard (see .env.example): IDIQ_API_KEY, IDIQ_PARTNER_ID, FINGOAL_API_KEY, DATA_LINK_API_KEY, TWILIO_*, SENDGRID_*, IDE_WEBHOOK_URL, CONSENT_SIGNING_SECRET, NEXT_PUBLIC_APP_URL=https://fod.glinfico.com",
      "Twilio Messaging webhook → https://fod.glinfico.com/api/consent/webhook ; IDE pulls /api/ide/leads or gets lead.scored webhooks",
      "First boot one-time jobs: POST /api/ccd/seed · POST /api/aai backfill + migrate_month_letter · POST /api/consent register_purchased",
      "Verify: /api/health ok · /crm loads · exports download · consent link round-trips · /api/portals all READY",
      "Deploy this Next.js app to the platform (one deploy: /crm app + /lab engine + all /api routes)",
      "Set env secrets on the platform: DATABASE_URL, IDIQ_API_KEY, IDIQ_PARTNER_ID, FINGOAL_API_KEY, DATA_LINK_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SENDGRID_API_KEY, SENDGRID_FROM, IDE_WEBHOOK_URL, CONSENT_SIGNING_SECRET, NEXT_PUBLIC_APP_URL=<public domain>",
      "Point Twilio Messaging webhook → https://<domain>/api/consent/webhook (STOP handling)",
      "Point IDIQ/FinGoal webhooks (if any) at this app; IDE pulls /api/ide/leads or receives lead.scored webhooks",
      "Run one-time jobs on first boot: POST /api/ccd/seed (book + deals), POST /api/aai {action:'backfill'}, POST /api/aai {action:'migrate_month_letter'}, POST /api/consent (register_purchased)",
      "Verify: /api/health ok · /crm loads · exports download · consent link round-trips",
    ],
  });
}
