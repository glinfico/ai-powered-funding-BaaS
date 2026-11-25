# GLINFICO — How the System Works (Owner's Rules)

> **Every agent / developer must read this file before changing anything.**
> Do not assume. If something is not described here, ASK the owner first.
> Never write code on top of existing logic before reading it and confirming how it works.

## 1. Where leads come from
- **Bank leads** — batches of leads we buy (first source).
- **FEI (FrontEnd Intake)** — anyone can bring and register leads through the front end.

## 2. The flow, step by step

### IDE — Identification Delivery Engine
- Automatically picks up every entity registered in the system (leads, brokers, lenders, investors).
- Gives it its ID: the **AAI (Assigned Account ID)**.
- **Triggers the consent** to be sent out — an **encrypted click consent** (email + text, via AI Comms).
- IDE does **not** score.

### ACE — Automated Closing Engine
1. Receives the lead once it has its AAI.
2. Takes it to **IDIQ** for the credit rating and to **FinGoal** for banking data.
3. Gathers all that data and **scores** the lead.
4. **Underwrites** the lead.
5. **Matches** it with a Lender.
6. The Lender has **24 hours to accept or decline**.
7. When accepted, the Lender writes a **term sheet** and **draws documents**, and sends a copy to the **client**, to **ACE** and to **DPE**.
8. ACE proceeds to **closing** with the Lender, collects all the **commissions** and **deposits them to the PayPal account**.

### DPE — Document Processing Engine
- Automatically gathers, using AI, **all the documents requested — except the ID and Authentication** (those are done at closing).
- Handles due diligence and documentation for **MCA, REI, M&A and ALS** (Automated Loan Service).
- Sends one set to the Lender and one set to ACE for closing.

### LAE — Leads Assignment Engine
- Runs **in parallel**: just after leads get their AAI, LAE takes **some of them at random** and assigns them to **Brokers** according to their **quota (shown in their tier)**.
- Runs the **reports** on each Broker.
- **Pays the Brokers' commissions** (ACE hands the Broker's share to LAE).

## 3. AAI format (never change, never invent another ID system)
`PREFIX-MMYY-<month letter><count>` — e.g. `BL-1126-N100123`
- **Prefixes:** BL = Bulk Lead · SL = Single Lead · S = Starter Broker / Silver · G = Growth / Gold · P = Pro / Platinum · E = Enterprise / Emerald · L = Lender · I = Investor
- **MMYY** = month of entry (1126 = November 2026).
- **Month letter + count**: the count restarts every month (N = November, D = December…). **100000 = zero**, so the real volume is hidden.
- AAIs are **never reused or renumbered**. Real records are **updated in place**, not deleted and re-inserted.
- **Brokers keep their ID history**: when they change tier the previous ID stays in their history, and if they return to a tier they get that ID back.
- **Returning customers** should get their **old AAI and history back** (for loyalty perks).

## 4. Sites
- **fod.glinfico.com** — the whole app, but mostly the **FE (front end)**: the **public side** everyone can access (includes the FEI — FrontEnd Intake).
- **admin-glinfico.netlify.app** — the **BE (back end)**: **private** to the Admin and staff. Also called the **CCC (Control Center Command)** or **CCD (Command Center Dashboard)**.

### How the FE reaches the CCD (verified Nov 24)
- FE (`main` branch → fod.glinfico.com) uses `VITE_CCD_V2_URL`, default **https://admin-glinfico.netlify.app** (`src/components/CcdV2Redirect.jsx`).
- `src/pages/fod/Submit.jsx` POSTs deals to **admin-glinfico `/api/intake/deal`**; Portal/Control Center buttons go to admin-glinfico `/gate`.
- admin-glinfico accepts FE submissions via **`INTAKE_ALLOWED_ORIGINS = https://fod.glinfico.com`** (verified with a CORS check).
- Old Node server `server/index.js` line 83 still redirects to `glinfico-admin.netlify.app` (does not exist) — only matters if that server is still running (owner to confirm).
- admin-glinfico is deployed manually from the `ccd-v2` branch (Netlify CLI); fod builds automatically from `main`. Same GitHub repo, different branches.

## 4b. Core architecture — two Supabase Edge Functions
1. **The Orchestrator** — stacks **every system intake** (the reason for the IDing) and articulates them for the good functioning of the app. It holds all the **Leads, Brokers, Lenders, Investors, Reports, Vendors, Partners, Sponsors…**
2. **The Hyper-Processor** — where **all the Engines and processes lodge**; the **base of all automation**. It stacks the engines **IDE, ACE, LAE, DPE**, the **AIs** (Claude, Gemini, ChatGPT…) and the **tools** (IDIQ, FinGoal, Doppler, Twilio…).

### Edge Functions v1 — LIVE (Nov 24) in CCD Supabase project `kpoqglkyvfaztaemhtsa` (display name "glinfico-admin")
- Code in repo: `supabase/functions/orchestrator`, `supabase/functions/hyper-processor`, tables `supabase/sql/edge_tables.sql` (`intake_register`, `hp_jobs`, RLS on).
- **Orchestrator** `POST /functions/v1/orchestrator` (header `x-orchestrator-key` = `ORCHESTRATOR_KEY`): saves lead/lender/investor, registers intake, hands to Hyper-Processor. Other entity types registered as "queued".
- **Hyper-Processor**: (1) IDE first — triggers admin-glinfico `/api/engines/cycle` (x-cron-secret) and verifies the AAI; nothing continues without it. (2) Gemini fills EMPTY lead profile fields (city, country, address) only if confidence ≥ 0.7; suggestions kept in `intake_register.ai_profile`. (3) Engine cycle again (ACE → LAE → DPE). Every step logged in `hp_jobs`.
- Secrets (Supabase): CCD_BASE_URL, CRON_SECRET, GEMINI_API_KEY, ORCHESTRATOR_KEY (also in Doppler admin-glinfico/prd).
- Deploy: `npx supabase functions deploy orchestrator --no-verify-jwt` and `npx supabase functions deploy hyper-processor` (folder linked to kpoqglkyvfaztaemhtsa).
- Verified Nov 24 with one test lead (since removed): AAI issued first → Gemini (low confidence, nothing filled) → engines OK.

## 5. Target speed
- **MCA:** 48 hours · **REI:** 5 days · **M&A:** 2 weeks — frictionless.

## 6. Open questions (to be answered by the owner — do not guess)
1. ~~Sites~~ — answered (see section 4).
2. **Databases:** what lives in the **main Supabase** vs the **CCD Supabase** (`kpoqglkyvfaztaemhtsa`), and what should sync between them?
3. **Scores storage:** the code expects an `enrichments` table (final score, scored status) that does not exist in the CCD database. How should tables be created in this project?
4. **IDIQ:** credentials pending — FinGoal is used for both credit and banking until then (owner decision).
5. **Webhooks:** where should the IDE webhook and the Twilio consent-reply webhook point?
6. **Engines location:** the Orchestrator and Hyper-Processor (Supabase Edge Functions) were last changed ~2 months ago, their code is **not** in the GitHub repo, and they are probably not connected to admin-glinfico. admin-glinfico **also** runs its own engine cycle every 15 min (Netlify `engine-cycle` → `/api/engines/cycle`: sync → IDE → LAE → ACE → DPE). Which one is the source of truth, and how should they connect?
7. **Old Node server** (`server/index.js`, possibly on Render): still in use?

## 7. Never do
- Never invent or change the AAI system; AAIs come **only** from the IDE.
- Never assume how an engine works — read the code or ask the owner.
- Never overwrite existing logic without reading it first and getting approval.
- Never click "Seed lender book + deals from bank history" (it creates test data).
- Never touch the `id_ledger` table.
- Never print or share secrets; keys live in Doppler → Netlify.
