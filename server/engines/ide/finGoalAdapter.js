/**
 * FinGoal adapter — open-banking cash-flow telemetry.
 *
 * Contract: returns exactly the fields server/engines/mcaScoring.js reads
 * from `finGoalData`:
 *     avgMonthlyDeposits, avgEndingBalance, depositTrend, detectedDailyACH,
 *     negativeDays, nsfCount, roundNumberDepositCount, suddenDepositSpikes
 *
 * Those last three feed stacking detection, so they must be present even when
 * zero — omitting them silently weakens fraud screening.
 */

import { EnrichmentError } from "./idiqAdapter.js";
import { getCredential } from "../../routes/adminCredentials.js";
import { createFinGoalTokenProvider } from "./finGoalAuth.js";

const FG_BASE = process.env.FINGOAL_BASE_URL || "https://findmoney-dev.fingoal.com";
const TIMEOUT_MS = Number(process.env.FINGOAL_TIMEOUT_MS || 25000);
const MAX_RETRIES = Number(process.env.FINGOAL_MAX_RETRIES || 2);
const getFinGoalBearerToken = createFinGoalTokenProvider({
  getCredential,
  baseUrl: FG_BASE,
  tenantId: process.env.FINGOAL_TENANT_ID || "",
  timeoutMs: TIMEOUT_MS,
  legacyBearerToken: process.env.FINGOAL_API_KEY || "",
});
// Settings-screen credentials are resolved from the server vault at request time.
export let FINGOAL_LIVE = Boolean(process.env.FINGOAL_API_KEY || process.env.FINGOAL_CLIENT_ID);

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

function mockFinGoal(lead) {
  const seedSource = String(lead.ein || lead.email || lead.id || "seed");
  let h = 0;
  for (let i = 0; i < seedSource.length; i++) h = (h * 37 + seedSource.charCodeAt(i)) >>> 0;

  const monthly = Number(lead.monthly_revenue) || 8000 + (h % 120000);
  const trends = ["growing", "stable", "declining"];
  // Unsigned shifts throughout. A signed >> on a hash above 2^31 yields a
  // negative, and matchLendersBuyBox correctly rejects a negative NSF count
  // as invalid underwriting data - which silently zeroed every match.
  return {
    avgMonthlyDeposits: monthly,
    avgEndingBalance: Math.round(monthly * (0.08 + ((h >>> 3) % 25) / 100)),
    depositTrend: trends[h % 3],
    detectedDailyACH: (h >>> 5) % 4,
    negativeDays: (h >>> 7) % 9,
    nsfCount: (h >>> 9) % 5,
    roundNumberDepositCount: (h >>> 11) % 6,
    suddenDepositSpikes: (h >>> 13) % 3,
    _mock: true,
  };
}

/** Derive the scoring fields from a FinGoal transaction/insight payload. */
function normalise(raw) {
  const t = raw?.cashflow || raw?.insights || raw || {};
  const num = (v, d = 0) => (Number.isFinite(Number(v)) ? Number(v) : d);
  // Counts must be non-negative integers or downstream matching rejects
  // the whole deal as invalid.
  const count = (v, d = 0) => Math.max(0, Math.round(num(v, d)));

  const avgMonthlyDeposits = num(
    t.averageMonthlyDeposits ?? t.avgMonthlyDeposits ?? t.monthlyRevenue
  );

  if (!avgMonthlyDeposits) {
    throw new EnrichmentError("FinGoal returned no deposit data", {
      source: "fingoal",
      retryable: false,
    });
  }

  return {
    avgMonthlyDeposits,
    avgEndingBalance: num(t.averageEndingBalance ?? t.avgEndingBalance),
    depositTrend: t.depositTrend || t.trend || "stable",
    detectedDailyACH: count(t.dailyAchCount ?? t.detectedDailyACH),
    negativeDays: count(t.negativeBalanceDays ?? t.negativeDays),
    nsfCount: count(t.nsfCount ?? t.insufficientFundsCount),
    roundNumberDepositCount: count(t.roundNumberDepositCount),
    suddenDepositSpikes: count(t.suddenDepositSpikes ?? t.depositAnomalies),
    _raw: raw,
  };
}

/**
 * Pull cash-flow telemetry for a lead.
 * Requires a linked bank account; `lead.fingoalUserId` or `lead.bankLinkId`
 * identifies it.
 * @throws {EnrichmentError}
 */
export async function fetchFinGoalCashflow(lead) {
  if (!lead) throw new EnrichmentError("lead is required", { source: "fingoal" });
  let bearerToken;
  try { bearerToken = await getFinGoalBearerToken(); }
  catch (cause) { throw new EnrichmentError("FinGoal authentication failed", { source: "fingoal", retryable: false, cause }); }
  if (bearerToken) FINGOAL_LIVE = true;
  if (!bearerToken) {
    if (process.env.NODE_ENV === "production") throw new EnrichmentError("FinGoal client credentials are not configured in Admin Settings.", { source: "fingoal", retryable: false });
    return mockFinGoal(lead);
  }

  const userId = lead.fingoalUserId || lead.bankLinkId;
  if (!userId) {
    throw new EnrichmentError("No linked bank account for this lead", {
      source: "fingoal",
      retryable: false,
    });
  }

  let lastErr;
  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    const ac = new AbortController();
    const timer = setTimeout(() => ac.abort(), TIMEOUT_MS);
    try {
      const res = await fetch(`${FG_BASE}/v2/insights/${encodeURIComponent(userId)}`, {
        signal: ac.signal,
        headers: {
          Authorization: `Bearer ${bearerToken}`,
          Accept: "application/json",
        },
      });
      clearTimeout(timer);

      if (res.status === 429 || res.status >= 500) {
        lastErr = new EnrichmentError(`FinGoal ${res.status}`, {
          source: "fingoal",
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
        throw new EnrichmentError(
          `FinGoal ${res.status}: ${(await res.text()).slice(0, 180)}`,
          { source: "fingoal", retryable: false, status: res.status }
        );
      }

      return normalise(await res.json());
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
  throw new EnrichmentError(`FinGoal unreachable: ${lastErr?.message || "unknown"}`, {
    source: "fingoal",
    retryable: true,
    cause: lastErr,
  });
}
