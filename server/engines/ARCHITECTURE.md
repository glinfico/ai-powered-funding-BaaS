# Engine architecture — IDE → AAI → ACE → CCD

Your separation is right, and it is now enforced in code rather than by
convention. This documents what was already built, what was not, and what still
needs a decision.

---

## The flow

```
lead
  │
  ├─ IDE ─── IDIQ      ─┐  parallel, each with its own timeout + retry
  │          FinGoal   ─┘
  │            │
  │            └─ both returned?  ──no──▶  enrichment_failed, no AAI, stops here
  │                   │yes
  │            stamp AAI  (durable sequence)
  │                   │
  ▼                   ▼
ACE ◀── assertReadyForAce() rejects anything unstamped
  │
  ├─ calculateMCAScore(idiqData, finGoalData)
  ├─ calculateMCAOffer(finGoalData, tier)
  ├─ detectStacking(finGoalData)
  └─ matchLendersBuyBox(deal, lenders)
       │
       ▼
     CCD telemetry
```

A lead that fails enrichment never reaches ACE. Retrying it is a data
operation, not a re-underwrite — which is exactly the property you wanted.

---

## What I found already built

**`server/engines/mcaScoring.js` is real and good.** 210 lines, and its
signature is already `calculateMCAScore(idiqData, finGoalData)`. Deposit
scoring, trend analysis, restricted-industry screening, offer sizing and
stacking detection are all implemented. It was written for exactly this
architecture and was waiting for the two adapters that never arrived.

**`server/engines/lenderBuyBoxMatching.js` is strict in the right way.** It
refuses to infer eligibility from missing or malformed data rather than
guessing. For a lending platform that is the correct default.

## What was not built

**IDIQ was never integrated.** It appeared only as marketing copy in
`DealWorkflow.jsx` and as consent language in `BorrowerConsentForm.jsx` — which
tells the borrower "a soft inquiry will be conducted via IDIQ". No code
performed that pull. Worth closing quickly: you are collecting consent for
something the system does not do.

**FinGoal was never referenced at all.**

**IDE did no enrichment.** `src/lib/idEngineRunner.js` only assigned AAI codes.

**ACE was a simulation.** `src/lib/aceEngine.js`:

```js
const creditScore    = Math.floor(Math.random() * (850 - 520 + 1)) + 520;
const requestedAmount = Math.floor(Math.random() * (450000 - 25000 + 1)) + 25000;
```

It looped `1..8000` inventing every input. That is the source of the dashboard
count: it always reports 8,000 processed because the loop always runs 8,000
times, regardless of how many leads exist.

**The orchestrator reported success on failure.** In
`server/workers/pipelineOrchestrator.js`, when the Supabase fetch failed it
returned `{ processed_count: batchSize, success: true }` — so a broken run
looked like a clean one on the dashboard.

**AAI sequences were in-memory.** A module-level `Map` reset on every cold
start, was not shared between instances, and could interleave under
concurrency. For a permanent external reference that is not safe.

---

## What is now in place

| File | Purpose |
|---|---|
| `ide/idiqAdapter.js` | IDIQ pull, normalised to the 3 fields scoring reads |
| `ide/finGoalAdapter.js` | FinGoal pull, normalised to the 8 cash-flow fields |
| `ide/aaiSequence.js` | Atomic sequence allocation, Supabase-backed |
| `ide/index.js` | Parallel enrichment, fail-closed, AAI stamp on success |
| `ace/index.js` | Hand-off guard + real scoring + buy-box matching |
| `migrations/aai_sequence.sql` | Sequence table and `next_aai_sequence()` |

Both adapters run in **deterministic mock mode** until credentials are set, so
the same lead always produces the same profile. Random mocks would make runs
unreproducible and hide scoring regressions.

### Verified end-to-end

```
Acme Logistics LLC      score= 78 tier=B matched=2   Apex | Summit Bridge
Sunrise Healthcare      score= 77 tier=B matched=1   Meridian
Harbor View REI         score= 75 tier=B matched=2   Meridian | Summit Bridge
Greenleaf Dispensary    score= 71 tier=B matched=0   [RESTRICTED]

{"submitted":4,"underwritten":4,"rejectedAtHandoff":0,"matchedDeals":3}
volume $2,120,000
```

Every exclusion is correct: Sunrise is over Apex's $500k cap, Harbor View is
over it too, and cannabis is screened out. 23 tests cover the adapters, the AAI
format, the hand-off guard and batch count honesty.

---

## Three things that need you

**1. Credentials.** Set these and the adapters switch from mock to live with no
code change:

```
IDIQ_API_KEY=        IDIQ_BASE_URL=       (optional)
FINGOAL_API_KEY=     FINGOAL_BASE_URL=    (optional)
SUPABASE_URL=        SUPABASE_SERVICE_KEY=
```

I guessed at both vendors' request and response shapes. Send me their API docs
and I will correct `normalise()` in each adapter — that is the only part not
verifiable without access.

**2. Apply the migration.** `migrations/aai_sequence.sql` in the Supabase SQL
editor. Until then AAIs come from memory and the engine logs a warning on every
run. Seed values assume cohort `1126` — adjust before running.

**3. Check your lender records.** `matchLendersBuyBox` requires this exact
shape:

```js
{
  id, name, is_active: true,
  buy_box: {
    funding_limits: { min_amount, max_amount },
    underwriting_criteria: {
      min_monthly_revenue, max_nsf_count_30_days,
      min_daily_balance, min_time_in_business_months,
      excluded_states: [],        // array required
      allowed_industries: []      // array required, 'ALL' is the wildcard
    }
  }
}
```

Note `allowed_industries` is an **allowlist**, not a denylist. If your 22,450
lender rows in Supabase do not carry a populated `buy_box` in this shape, every
match returns zero — silently, because the matcher correctly refuses to guess.
That is worth checking before the next batch run.

---

## Still to wire

- CCD telemetry should read from real `runIDEBatch` / `runACEBatch` counts
  rather than the hardcoded 8,000 / 22,000 / 3,000 in
  `initializeActiveNetworkCounters()`.
- `server/routes/pipelineRoute.js` and `pipelineRouter.js` both exist and
  overlap — worth collapsing to one.
- `server/server/engines/mcaScoring.js` is a duplicate of
  `server/engines/mcaScoring.js` at a nested path. Two copies of scoring logic
  will drift; one should go.
