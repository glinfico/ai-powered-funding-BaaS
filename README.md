# GLINFICO Control Center (fod.glinfico.com)

One Next.js 16 app = the CCD (CRM: Dashboard, Deals, Leads, Lenders 22,450, Investors 3,000,
Term Sheets, Pipeline, Tasks, Commissions, Reports, AI Comms, Engines, Portals) + the engine bench (`/lab`)
+ 4 engines (IDE identification, LAE assignment, ACE closing, DPE docs) + consent e-form + ID/tier codes.

## Deploy (one push, everything together)
1. Push this repo to GitHub; connect the repo in **Netlify** (or Render via `render.yaml`).
2. Set env secrets in the hosting dashboard — see `.env.example`. `DATABASE_URL` points to **Supabase**
   (Settings → Database → Connection string, `postgres://postgres:<pw>@db.<ref>.supabase.co:5432/postgres`).
   Your Supabase login is already registered — just grab the connection string.
3. `NEXT_PUBLIC_APP_URL=https://fod.glinfico.com`; assign the custom domain `fod.glinfico.com` in Netlify
   (Domain settings → add custom domain). The old clanker is replaced by pointing this domain at the new site
   (or delete the old site after DNS cutover).
4. First boot, run once (with env set):
   - `npx drizzle-kit push` (creates tables in Supabase)
   - `POST /api/ccd/seed` (lender/investor book + deals from bank history)
   - `POST /api/aai {"action":"backfill"}` for lenders/investors/leads, then `{"action":"migrate_month_letter"}`
   - `POST /api/consent {"action":"register_purchased"}`
5. Webhooks: Twilio Messaging → `https://fod.glinfico.com/api/consent/webhook`; IDE pulls `/api/ide/leads`
   or receives `lead.scored` to `IDE_WEBHOOK_URL`.

## Connecting the existing PFE login page (no changes to the public FE)
On fod.glinfico.com's existing sign-in box, point the **PPG button** to:
`https://fod.glinfico.com/gate?next=/crm`
- Admin credentials → LAE grants admin access → routed to `/crm` (Control Center)
- User credentials → routed to `/ppg` (their own private portal, LAE-assigned leads)
- No subdomain; the PFE itself is not modified. Anon visitors hitting `/crm`, `/lab`, `/ppg` or admin APIs are redirected/401 to `/gate`.

## Routes
- `/` → redirects to `/crm` (the app) · `/lab` engine bench · `/consent/<token>` public e-sign form
- APIs: `/api/leads*` (list/export CSV+XLSX/import CSV/generate), `/api/pipeline`, `/api/consent/*`,
  `/api/integrations`, `/api/crm/*`, `/api/ccd/*`, `/api/engines`, `/api/aai`, `/api/ide/leads`, `/api/portals`

## Security notes
- All provider keys server-side only; browser never sees them (`/api/portals` shows presence, not values).
- Consent gate blocks pulls without granted credit+banking consent; STOP webhook revokes instantly.
- Exports mask SSN; ID docs are never auto-generated.
