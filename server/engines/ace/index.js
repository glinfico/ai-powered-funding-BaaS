/**
 * ACE — Automated Credit Engine
 *
 * Consumes IDE-enriched, AAI-stamped records and runs real underwriting:
 * the existing calculateMCAScore / calculateMCAOffer / detectStacking logic,
 * then lender buy-box matching.
 *
 * What changed from the previous src/lib/aceEngine.js:
 *   It looped 1..8000 and invented every input —
 *       const creditScore = Math.floor(Math.random() * ...)
 *       const requestedAmount = Math.floor(Math.random() * ...)
 *   so the dashboard reported 8,000 processed leads and a volume figure that
 *   corresponded to no actual lead. This version reads the IDE payload and
 *   will process exactly as many records as it is given.
 *
 * The hand-off is enforced, not assumed: a record without an AAI and
 * `enrichmentStatus === 'enriched'` is rejected rather than scored, so a data
 * failure can never surface as a credit decline.
 */

import { calculateMCAScore, calculateMCAOffer, detectStacking } from "../mcaScoring.js";
import { matchLendersBuyBox } from "../lenderBuyBoxMatching.js";
import { ENRICHMENT_STATUS } from "../ide/index.js";

export class HandoffError extends Error {
  constructor(message, record) {
    super(message);
    this.name = "HandoffError";
    this.aai = record?.aai ?? null;
    this.leadId = record?.id ?? null;
  }
}

/**
 * Guard the IDE -> ACE boundary.
 * @throws {HandoffError}
 */
export function assertReadyForAce(record) {
  if (!record) throw new HandoffError("No record supplied");
  if (record.enrichmentStatus !== ENRICHMENT_STATUS.ENRICHED) {
    throw new HandoffError(
      `Record is '${record.enrichmentStatus || "unstamped"}', not enriched — IDE must complete first`,
      record
    );
  }
  if (!record.aai) throw new HandoffError("Record has no AAI stamp", record);
  if (!record.idiqData) throw new HandoffError("Record has no IDIQ payload", record);
  if (!record.finGoalData) throw new HandoffError("Record has no FinGoal payload", record);
  return true;
}

/** Shape an enriched record into what matchLendersBuyBox expects. */
function toDeal(record) {
  const fg = record.finGoalData || {};
  const idiq = record.idiqData || {};
  return {
    amount: Number(record.loan_amount) || 0,
    monthlyRevenue: fg.avgMonthlyDeposits || 0,
    avgDailyBalance: fg.avgEndingBalance || 0,
    nsfCount: fg.nsfCount || 0,
    industry: idiq.industry || record.industry || "general",
    state: record.state || null,
    timeInBusinessMonths: idiq.businessAgeMonths || 0,
  };
}

/**
 * Underwrite one enriched record.
 * @param {object} record  IDE output
 * @param {Array}  lenders buy-box catalogue
 */
export function runACE(record, lenders = []) {
  assertReadyForAce(record);

  const scoring = calculateMCAScore(record.idiqData, record.finGoalData);
  const offer = calculateMCAOffer(record.finGoalData, scoring.tier);
  const stacking = detectStacking(record.finGoalData);

  const deal = toDeal(record);
  const matches = scoring.action === "decline" ? [] : matchLendersBuyBox(deal, lenders);

  return {
    aai: record.aai,
    leadId: record.id ?? null,
    company: record.company || record.business_name || null,
    score: scoring.score,
    tier: scoring.tier,
    action: scoring.action,
    label: scoring.label,
    breakdown: scoring.breakdown,
    isRestricted: scoring.isRestricted,
    offer,
    stacking,
    matchedLenders: matches,
    matchedCount: matches.length,
    requestedAmount: deal.amount,
    underwrittenAt: new Date().toISOString(),
  };
}

/**
 * Underwrite a batch. Records that fail the hand-off guard are reported,
 * not silently dropped and not counted as processed.
 */
export function runACEBatch(records = [], lenders = []) {
  const results = [];
  const rejected = [];
  const tierBreakdown = { A: 0, B: 0, C: 0, D: 0, F: 0 };
  let totalVolumeUnderwritten = 0;
  let matchedDeals = 0;

  for (const record of records) {
    try {
      const r = runACE(record, lenders);
      results.push(r);
      tierBreakdown[r.tier] = (tierBreakdown[r.tier] || 0) + 1;
      if (r.matchedCount > 0) {
        matchedDeals++;
        totalVolumeUnderwritten += r.requestedAmount || 0;
      }
    } catch (err) {
      rejected.push({
        leadId: record?.id ?? null,
        aai: record?.aai ?? null,
        reason: err.message,
      });
    }
  }

  return {
    results,
    rejected,
    counts: {
      // Every figure here is derived from records actually processed.
      submitted: records.length,
      underwritten: results.length,
      rejectedAtHandoff: rejected.length,
      matchedDeals,
    },
    tierBreakdown,
    totalVolumeUnderwritten,
    completedAt: new Date().toISOString(),
  };
}
