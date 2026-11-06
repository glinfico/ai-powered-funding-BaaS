/**
 * IDE — Identity & Data Engine
 *
 * Responsibility boundary (deliberate, see ARCHITECTURE notes below):
 *   IDE  owns external data acquisition — IDIQ, FinGoal — plus their
 *        timeouts, retries and partial-payload handling. It stamps the AAI
 *        reference ONLY once every required payload has returned.
 *   ACE  receives a clean, enriched, stamped profile. It never sees a raw
 *        vendor response and never has to distinguish a data failure from an
 *        underwriting decline.
 *
 * The practical consequence: a lead that fails enrichment never reaches ACE.
 * It lands in `enrichment_failed` with the vendor and reason recorded, so a
 * retry is a data operation, not a re-underwrite.
 */

import { fetchIdiqProfile, EnrichmentError } from "./idiqAdapter.js";
import { fetchFinGoalCashflow } from "./finGoalAdapter.js";
import { nextAaiSequence } from "./aaiSequence.js";

const MONTH_LETTERS = {
  1: "J", 2: "F", 3: "M", 4: "A", 5: "W", 6: "U",
  7: "L", 8: "G", 9: "S", 10: "O", 11: "N", 12: "D",
};

/** Mirrors src/lib/aaiEngine.js so server and client produce identical codes. */
export function formatAAI(prefixCode, sequenceIndex, date = new Date()) {
  const monthNum = date.getMonth() + 1;
  const cohort = `${String(monthNum).padStart(2, "0")}${String(date.getFullYear()).slice(-2)}`;
  const letter = MONTH_LETTERS[monthNum] || "X";
  return `${String(prefixCode).toUpperCase()}-${cohort}-${letter}${100000 + sequenceIndex}`;
}

export const ENRICHMENT_STATUS = {
  PENDING: "pending",
  ENRICHED: "enriched",
  FAILED: "enrichment_failed",
};

/**
 * Run IDE for a single lead.
 *
 * Both vendor calls run in parallel — they are independent, and serialising
 * them would double the worst-case latency for no benefit.
 *
 * @param {object} lead
 * @param {object} [opts]
 * @param {string} [opts.prefixCode='SL']  AAI tier prefix
 * @param {boolean} [opts.requireFinGoal=true] treat a missing bank link as fatal
 * @returns {Promise<object>} enriched + stamped record, or a failure record
 */
export async function runIDE(lead, opts = {}) {
  const { prefixCode = "SL", requireFinGoal = true } = opts;
  if (!lead || !(lead.id || lead.email)) {
    throw new Error("runIDE requires a lead with an id or email");
  }

  const startedAt = new Date().toISOString();

  const [idiqResult, finGoalResult] = await Promise.allSettled([
    fetchIdiqProfile(lead),
    fetchFinGoalCashflow(lead),
  ]);

  const failures = [];
  if (idiqResult.status === "rejected") {
    failures.push({
      source: "idiq",
      message: idiqResult.reason?.message || String(idiqResult.reason),
      retryable: idiqResult.reason?.retryable ?? true,
    });
  }
  if (finGoalResult.status === "rejected" && requireFinGoal) {
    failures.push({
      source: "fingoal",
      message: finGoalResult.reason?.message || String(finGoalResult.reason),
      retryable: finGoalResult.reason?.retryable ?? true,
    });
  }

  // Fail closed. No AAI is issued, so nothing downstream can mistake this
  // for a scoreable record.
  if (failures.length > 0) {
    return {
      ...lead,
      aai: null,
      enrichmentStatus: ENRICHMENT_STATUS.FAILED,
      enrichmentFailures: failures,
      enrichmentStartedAt: startedAt,
      enrichmentCompletedAt: new Date().toISOString(),
      ideVerified: false,
    };
  }

  const idiqData = idiqResult.value;
  const finGoalData =
    finGoalResult.status === "fulfilled" ? finGoalResult.value : null;

  // Both payloads are in — now, and only now, stamp the AAI.
  const sequence = await nextAaiSequence(prefixCode);
  const aai = formatAAI(prefixCode, sequence);

  return {
    ...lead,
    aai,
    idiqData,
    finGoalData,
    enrichmentStatus: ENRICHMENT_STATUS.ENRICHED,
    enrichmentFailures: [],
    enrichmentStartedAt: startedAt,
    enrichmentCompletedAt: new Date().toISOString(),
    ideVerified: true,
    dataSources: {
      idiq: idiqData?._mock ? "mock" : "live",
      fingoal: finGoalData?._mock ? "mock" : finGoalData ? "live" : "skipped",
    },
  };
}

/**
 * Run IDE across a batch with bounded concurrency.
 * Vendor APIs rate-limit; firing 8,000 requests at once guarantees 429s.
 */
export async function runIDEBatch(leads = [], opts = {}) {
  const { concurrency = 8, onProgress, ...ideOpts } = opts;
  const out = [];
  let index = 0;

  async function worker() {
    while (index < leads.length) {
      const i = index++;
      try {
        out[i] = await runIDE(leads[i], ideOpts);
      } catch (err) {
        out[i] = {
          ...leads[i],
          aai: null,
          enrichmentStatus: ENRICHMENT_STATUS.FAILED,
          enrichmentFailures: [{ source: "ide", message: err.message, retryable: false }],
          ideVerified: false,
        };
      }
      if (onProgress) onProgress(out.filter(Boolean).length, leads.length);
    }
  }

  await Promise.all(
    Array.from({ length: Math.min(concurrency, leads.length || 1) }, worker)
  );

  const enriched = out.filter((r) => r.enrichmentStatus === ENRICHMENT_STATUS.ENRICHED);
  const failed = out.filter((r) => r.enrichmentStatus === ENRICHMENT_STATUS.FAILED);

  return {
    records: out,
    enriched,
    failed,
    // Honest counts. Previously the orchestrator reported batchSize on error,
    // which made failed runs look successful on the dashboard.
    counts: {
      attempted: leads.length,
      enriched: enriched.length,
      failed: failed.length,
    },
    completedAt: new Date().toISOString(),
  };
}

export { EnrichmentError };
