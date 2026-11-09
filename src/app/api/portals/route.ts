import { NextResponse } from "next/server";
import { PORTALS } from "@/lib/portals";

export const dynamic = "force-dynamic";

// Key requirements per portal (presence is checked server-side; values never leave the server).
const KEYS: Record<string, string[]> = {
  consent: ["CONSENT_SIGNING_SECRET"],
  idiq: ["IDIQ_API_KEY", "IDIQ_PARTNER_ID"],
  fingoal: ["FINGOAL_API_KEY"],
  datalink: ["DATA_LINK_API_KEY"],
  twilio: ["TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN", "TWILIO_PHONE_NUMBER"],
  sendgrid: ["SENDGRID_API_KEY", "SENDGRID_FROM"],
  ide: ["IDE_WEBHOOK_URL"],
  db: ["DATABASE_URL"],
};

export async function GET() {
  const rows = PORTALS.map(p => {
    const keys = KEYS[p.id] || [];
    return {
      ...p,
      keyStatus: keys.map(k => ({ key: k, present: !!process.env[k] })),
      ready: keys.length === 0 ? true : keys.every(k => !!process.env[k]),
    };
  });
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
      "PFE hookup (public FE untouched): its sign-in box PPG button → https://fod.glinfico.com/gate?next=/crm — admins land in /crm via LAE grant, users in their own /ppg",
      "Deploy this Next.js app to the platform (one deploy: /crm app + /lab engine + all /api routes)",
      "Set env secrets on the platform: DATABASE_URL, IDIQ_API_KEY, IDIQ_PARTNER_ID, FINGOAL_API_KEY, DATA_LINK_API_KEY, TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER, SENDGRID_API_KEY, SENDGRID_FROM, IDE_WEBHOOK_URL, CONSENT_SIGNING_SECRET, NEXT_PUBLIC_APP_URL=<public domain>",
      "Point Twilio Messaging webhook → https://<domain>/api/consent/webhook (STOP handling)",
      "Point IDIQ/FinGoal webhooks (if any) at this app; IDE pulls /api/ide/leads or receives lead.scored webhooks",
      "Run one-time jobs on first boot: POST /api/ccd/seed (book + deals), POST /api/aai {action:'backfill'}, POST /api/aai {action:'migrate_month_letter'}, POST /api/consent (register_purchased)",
      "Verify: /api/health ok · /crm loads · exports download · consent link round-trips",
    ],
  });
}
