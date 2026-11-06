/**
 * IDIQ adapter — credit bureau / identity pull.
 *
 * Contract: returns exactly the fields server/engines/mcaScoring.js reads
 * from `idiqData`:
 *     businessAgeMonths, industry, ownerCreditScore
 *
 * IDE owns this call. ACE must never see a raw IDIQ response, a timeout or a
 * partial payload — that is the whole point of the separation.
 *
 * Runs in mock mode until IDIQ_API_KEY is set, so the pipeline is testable
 * end-to-end before credentials land.
 */

const IDIQ_BASE = process.env.IDIQ_BASE_URL || "https://api.idiq.com";
const IDIQ_KEY = process.env.IDIQ_API_KEY || "";
const TIMEOUT_MS = Number(process.env.IDIQ_TIMEOUT_MS || 20000);
const MAX_RETRIES = Number(process.env.IDIQ_MAX_RETRIES || 2);

export const IDIQ_LIVE = Boolean(IDIQ_KEY);

export class EnrichmentError extends Error {
  constructor(message, { source, retryable = false, status, cause } = {}) {
    super(message);
    this.name = "EnrichmentError";
    this.source = source;
    this.retryable = retryable;
    this.status = status;
    this.cause = cause;
  }
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Deterministic mock so the same lead always yields the same profile.
 * Random values would make pipeline runs unreproducible and would hide
 * regressions in scoring.
 */
function mockIdiq(lead) {
  const seedSource = String(lead.ein || lead.email || lead.id || "seed");
  let h = 0;
  for (let i = 0; i < seedSource.length; i++) h = (h * 31 + seedSource.charCodeAt(i)) >>> 0;

  const score = 540 + (h % 310); // 540-849
  const ageMonths = 6 + (h % 180); // 6 months - 15 years
  return {
    ownerCreditScore: score,
    businessAgeMonths: ageMonths,
    industry: lead.industry || lead.loan_type || "general",
    _mock: true,
  };
}

/** Normalise a live IDIQ response onto the scoring contract. */
function normalise(raw, lead) {
  const score =
    raw?.creditProfile?.score ??
    raw?.score ??
    raw?.fico ??
    null;

  const ageMonths =
    raw?.business?.ageMonths ??
    (raw?.business?.establishedDate
      ? Math.max(
          0,
          Math.round(
            (Date.now() - new Date(raw.business.establishedDate).getTime()) /
              (1000 * 60 * 60 * 24 * 30.44)
          )
        )
      : null);

  if (score == null) {
    throw new EnrichmentError("IDIQ response contained no credit score", {
      source: "idiq",
      retryable: false,
    });
  }

  return {
    ownerCreditScore: Number(score),
    businessAgeMonths: ageMonths ?? 0,
    industry: raw?.business?.industry || lead.industry || lead.loan_type || "general",
    _raw: raw,
  };
}

/**
 * Pull the IDIQ profile for a lead.
 * @returns {Promise<{ownerCreditScore:number, businessAgeMonths:number, industry:string}>}
 * @throws  {EnrichmentError}
 */
export async function fetchIdiqProfile(lead) {
  if (!lead) throw new EnrichmentError("lead is required", { source: "idiq" });
  if (!IDIQ_LIVE) return mockIdiq(lead);

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${IDIQ_BASE}/v1/business-credit`, {
        method: "POST",
        signal: ac.signal,
        headers: {
          Authorization: `Bearer ${IDIQ_KEY}`,
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          ein: lead.ein || null,
          business_name: lead.company || lead.business_name,
          owner_first_name: lead.first_name,
          owner_last_name: lead.last_name,
          email: lead.email,
          phone: lead.phone,
        }),
      });
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        lastErr = new EnrichmentError(`IDIQ ${res.status}`, {
          source: "idiq",
          retryable: true,
          status: res.status,
        });
        if (attempt < MAX_RETRIES) {
          await sleep(Math.random() * Math.min(1000 * 2 ** attempt, 8000));
          continue;
        }
        throw lastErr;
      }

      if (!res.ok) {
        throw new EnrichmentError(`IDIQ ${res.status}: ${(await res.text()).slice(0, 180)}`, {
          source: "idiq",
          retryable: false,
          status: res.status,
        });
      }

      return normalise(await res.json(), lead);
    } catch (err) {
      clearTimeout(timer);
      if (err instanceof EnrichmentError && !err.retryable) throw err;
      lastErr = err;
      if (attempt < MAX_RETRIES) {
        await sleep(Math.random() * Math.min(1000 * 2 ** attempt, 8000));
        continue;
      }
    }
  }
  throw new EnrichmentError(`IDIQ unreachable: ${lastErr?.message || "unknown"}`, {
    source: "idiq",
    retryable: true,
    cause: lastErr,
  });
}
