/**
 * Commission ownership — who keeps the fee.
 *
 * The rule, as specified:
 *
 *   • A deal submitted by a broker with an ACTIVE subscription earns that
 *     broker 100% of the commission. This covers both leads the LAE assigned
 *     to them and leads they sourced themselves — the source does not matter,
 *     only that a paying broker owns the deal.
 *
 *   • Everything else — anonymous submissions, banks, institutions, lapsed
 *     brokers — is free to submit and the platform keeps 100%.
 *
 *   • Forward-looking: subscribing earns commission on deals submitted from
 *     that point on. It does not retroactively claim deals submitted while
 *     the broker was unpaid.
 *
 * Why this file exists: `commissionCalc.js` computes the fee amount but has
 * no concept of who owns it. The rule lived only in UI copy
 * ("House Account Retention") and in simulator log strings; commit 5a24265,
 * named "enforce forward-looking subscription policy", changed a modal and
 * nothing else. Nothing in the system actually decided ownership.
 */

export const OWNER = {
  BROKER: 'broker',
  PLATFORM: 'platform',
};

export const REASON = {
  ACTIVE_SUBSCRIBER: 'active_subscriber',
  NO_BROKER: 'no_broker_attached',
  NOT_SUBSCRIBED: 'broker_never_subscribed',
  LAPSED: 'subscription_lapsed_at_submission',
  SUBSCRIBED_AFTER: 'subscribed_after_submission',
};

const toTime = (v) => {
  if (!v) return null;
  const t = new Date(v).getTime();
  return Number.isFinite(t) ? t : null;
};

/**
 * Decide who owns the commission on a deal.
 *
 * @param {object} deal
 *   @param {string} [deal.broker_id]
 *   @param {string} deal.submitted_at           ISO timestamp
 *   @param {string} [deal.lead_source]          'lae_assigned' | 'broker_sourced' | 'public' …
 * @param {object|null} subscription             the broker's subscription, if any
 *   @param {string}  subscription.status        'active' | 'cancelled' | 'past_due' …
 *   @param {string}  subscription.started_at    ISO
 *   @param {string}  [subscription.current_period_end] ISO
 *   @param {string}  [subscription.cancelled_at]       ISO
 *
 * @returns {{owner:string, brokerShare:number, platformShare:number,
 *            reason:string, explanation:string}}
 */
export function resolveCommissionOwner(deal, subscription) {
  const submittedAt = toTime(deal?.submitted_at) ?? Date.now();

  // No broker on the deal — a public, bank or institutional submission.
  if (!deal?.broker_id) {
    return {
      owner: OWNER.PLATFORM,
      brokerShare: 0,
      platformShare: 1,
      reason: REASON.NO_BROKER,
      explanation:
        'No broker attached. Free submission; platform retains the full fee.',
    };
  }

  if (!subscription) {
    return {
      owner: OWNER.PLATFORM,
      brokerShare: 0,
      platformShare: 1,
      reason: REASON.NOT_SUBSCRIBED,
      explanation:
        'Broker has no subscription on record. Platform retains the full fee.',
    };
  }

  const startedAt = toTime(subscription.started_at);
  const cancelledAt = toTime(subscription.cancelled_at);
  const periodEnd = toTime(subscription.current_period_end);

  // Forward-looking: a subscription started after the deal was submitted does
  // not reach back and claim it.
  if (startedAt && submittedAt < startedAt) {
    return {
      owner: OWNER.PLATFORM,
      brokerShare: 0,
      platformShare: 1,
      reason: REASON.SUBSCRIBED_AFTER,
      explanation:
        'Deal was submitted before the subscription began. Commission eligibility is forward-looking.',
    };
  }

  // Was the subscription actually in force on the submission date?
  const coverageEnded = cancelledAt ?? periodEnd ?? null;
  const lapsedAtSubmission = coverageEnded !== null && submittedAt > coverageEnded;
  const statusOk = String(subscription.status || '').toLowerCase() === 'active';

  if (lapsedAtSubmission || !statusOk) {
    return {
      owner: OWNER.PLATFORM,
      brokerShare: 0,
      platformShare: 1,
      reason: REASON.LAPSED,
      explanation: lapsedAtSubmission
        ? 'Subscription had lapsed when this deal was submitted. Platform retains the full fee.'
        : `Subscription status is "${subscription.status}", not active. Platform retains the full fee.`,
    };
  }

  return {
    owner: OWNER.BROKER,
    brokerShare: 1,
    platformShare: 0,
    reason: REASON.ACTIVE_SUBSCRIBER,
    explanation:
      'Broker held an active subscription at submission. Broker earns the full commission.',
  };
}

/**
 * Combine the fee amount with ownership into a ledger-ready record.
 * @param {object} deal
 * @param {{rate:number, amount:number, label:string}} fee  from calcCommission()
 * @param {object|null} subscription
 */
export function buildCommissionRecord(deal, fee, subscription) {
  const ownership = resolveCommissionOwner(deal, subscription);
  const gross = fee?.amount ?? 0;

  return {
    deal_id: deal?.id ?? null,
    aai: deal?.aai ?? null,
    broker_id: deal?.broker_id ?? null,
    lead_source: deal?.lead_source ?? null,
    gross_commission: gross,
    broker_amount: Math.round(gross * ownership.brokerShare * 100) / 100,
    platform_amount: Math.round(gross * ownership.platformShare * 100) / 100,
    rate: fee?.rate ?? null,
    rate_label: fee?.label ?? null,
    owner: ownership.owner,
    reason: ownership.reason,
    explanation: ownership.explanation,
    submitted_at: deal?.submitted_at ?? null,
    calculated_at: new Date().toISOString(),
  };
}
