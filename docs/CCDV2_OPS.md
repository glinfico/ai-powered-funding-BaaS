# CCD-V2 operations checklist (admin-glinfico.netlify.app)

Site: https://admin-glinfico.netlify.app (Netlify project 84334923-61ca-4c15-a069-b9ecbba721e0)
Code: branch `ccd-v2` in glinfico/ai-powered-funding-BaaS. DB: Supabase project kpoqglkyvfaztaemhtsa.

## Auth (/gate)
POST /api/gate {email,password} — staff table (STAFF_EMAIL/STAFF_PASSWORD) OR Supabase login
(verifySupabaseLogin). Cookie session 12h, roles admin/user. admin → /crm. All /api/* (except
/api/health) require it → 401 {"error":"Staff sign-in required (PPG)","gate":"/gate"}.

## Leads (~10k prospects) should populate
- Verify data: in Supabase project kpoqglkyvfaztaemhtsa → SQL Editor: SELECT count(*) FROM public.leads;
- Site env DATABASE_URL must be that project's direct conn: postgresql://postgres:<pw>@db.kpoqglkyvfaztaemhtsa.supabase.co:5432/postgres
- CCD-V2 reads via drizzle over DATABASE_URL (server-side, bypasses RLS) — no REST policy needed.
- After env change: netlify redeploy; check GET /api/health → {"ok":true}; sign in /gate → /crm/leads.

## The 4 engines (POST /api/engines {engine}, GET /api/engines status board)
- IDE  — Identification Engine: verifies identity, IDIQ readiness (SSN+DOB). run "verify"
- LAE  — Leads Assignment Engine: best-lender assignment. run "assign"
- ACE  — Automated Closing Engine: advances/funds deals (consent + IDIQ-ready + score). run "close"
- DPE  — Documents Processing Engine: docs vault + lender packet. run "docs"
Also: /api/pipeline (enrichment pipeline), /api/ide/leads (IDE export json/csv/xlsx).

## Reactivate IDIQ + FinGoal (+ DataLink / notifications)
Env-gated in src/lib/providers.ts — when keys are set, engines go from SIMULATED to live.
Set on the Netlify site (hidden input, --force, never print secrets):
  IDIQ_API_KEY, IDIQ_PARTNER_ID, IDIQ_API_URL (default https://api.idandcredit.com)
  FINGOAL_API_KEY (or FINGOAL_TOKEN), FINGOAL_API_URL (default https://findmoney.fingoal.com)
  DATA_LINK_API_KEY, IDE_WEBHOOK_URL, TWILIO_ACCOUNT_SID/TWILIO_AUTH_TOKEN/TWILIO_PHONE_NUMBER,
  SENDGRID_API_KEY/SENDGRID_FROM, CONSENT_SIGNING_SECRET
Then redeploy. Verify: GET /api/engines shows real stats; integration_events table logs provider calls.

## PFE connection (done)
PFE fod.glinfico.com: /crm/* → CcdV2Redirect → https://admin-glinfico.netlify.app/gate?next=/crm (PR #13, main).

## ID attribution (AAI / id_ledger) — status 2026-11-12
Ran POST /api/aai {action:"backfill"} per entity (gate session required):
- lenders: 1,944 codes (L-1026-O…), investors: 1,601 (I-1026-O…), leads: 10,000/10,000 (SL-1026-O100001…O110000)
- id_ledger has the batch entries. Re-running backfill is safe (only uncoded rows get codes).
- Big backfills hit Netlify function timeout (502/504) — just re-run until GET /api/aai counts stop increasing.
- Note: no `brokers` table in this branch's schema — aai covers lenders/investors/leads only.
- IDE engine (POST /api/engines {engine:"IDE"}) runs fine but verifies 0 until IDIQ SSN/DOB data exists (by design it flags, not verifies).

## Broker tiers = membership value by price (current pricing page)
Starter S-XXXXX $999/mo · Growth G-XXXXX $1,499/mo · Pro P-XXXXX $2,999/mo · Enterprise E-XXXXX $7,999/mo.
PayPal subscription provisions the broker code automatically (S/G/P/E-XXXXX).
Engine code format (live, Nov 2026): {S|G|P|E}-1126-N{seq}  (cohort 1126, month letter N, seq from 100001).
Old branch format was {P|G|L|I|SL|BL}-1026-O{seq} — codes issued under 1026/O are NOT valid under the 1126 engine.
Migration plan: re-code all entities to the 1126/N cohort, map broker tiers by plan price
(Senior VP -> P, Capital Advisor / Underwriting Specialist -> G, Enterprise accounts -> E, new brokers -> S),
log id_ledger action='migrate', re-seed simulated brokers, validate with engine parseCode/isValid.

## ID engine — VERIFIED LIVE 2026-11-12 (ccd-v2@1041fce deployed to admin-glinfico)
GET /api/aai counts: brokers 5, lenders 22,450, investors 3,000, leads 10,000 — all coded.
New standard: COHORT=currentCohort() (now 1126 → letter N); format {PREFIX}-1126-N{seq}, seq from 100001.
Issued codes NEVER change cohort — old …-1026-O… codes stay valid (prefixes still in TIERS).
Brokers auto-seeded from old CCD (ensureBrokers) and coded by plan price: Senior VP→Pro→P-1126-N100001/2,
others→Growth→G-1126-N100001..3. Enterprise plan → E-1126-N… (e.g. E-1126-N100005) when subscribed.
id_ledger logs every assign/migrate — engine validates rows via parseCode/isValid (prefix must be in TIERS).

## PayPal -> LAE broker provisioning
Webhook: POST /api/paypal/webhook on admin-glinfico (set in PayPal dashboard).
On BILLING.SUBSCRIPTION.ACTIVATED -> provisionBroker(): staff.portal='broker', brokers row,
AAI code by plan prefix (S/G/P/E, current cohort), id_ledger + integration_events LAE.broker_provisioned.
Env: PAYPAL_CLIENT_ID/SECRET/WEBHOOK_ID + 8 PAYPAL_PLAN_<STARTER|GOLD|PLATINUM|ENTERPRISE>_<MONTHLY|ANNUAL>.
Plan->prefix: STARTER->S(Silver,25), GOLD->G(Gold,100), PLATINUM->P(Platinum,500), ENTERPRISE->E(Emerald,1000).
