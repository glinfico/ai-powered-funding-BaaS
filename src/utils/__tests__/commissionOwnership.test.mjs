/**
 * Commission ownership rules.
 * Run: node --test src/utils/__tests__/
 */

import { test, describe } from 'node:test';
import assert from 'node:assert/strict';
import {
  resolveCommissionOwner,
  buildCommissionRecord,
  OWNER,
  REASON,
} from '../commissionOwnership.js';

const active = (over = {}) => ({
  status: 'active',
  started_at: '2026-01-01T00:00:00Z',
  current_period_end: '2027-01-01T00:00:00Z',
  ...over,
});

const deal = (over = {}) => ({
  id: 'd1',
  broker_id: 'b1',
  submitted_at: '2026-06-01T00:00:00Z',
  lead_source: 'lae_assigned',
  ...over,
});

describe('paying broker keeps 100%', () => {
  test('LAE-assigned lead', () => {
    const r = resolveCommissionOwner(deal(), active());
    assert.equal(r.owner, OWNER.BROKER);
    assert.equal(r.brokerShare, 1);
    assert.equal(r.platformShare, 0);
  });

  test('broker-sourced lead — source does not change ownership', () => {
    const r = resolveCommissionOwner(deal({ lead_source: 'broker_sourced' }), active());
    assert.equal(r.owner, OWNER.BROKER);
    assert.equal(r.brokerShare, 1);
  });
});

describe('platform keeps 100%', () => {
  test('no broker attached — public submission', () => {
    const r = resolveCommissionOwner(deal({ broker_id: null }), null);
    assert.equal(r.owner, OWNER.PLATFORM);
    assert.equal(r.reason, REASON.NO_BROKER);
  });

  test('bank or institution submitting directly', () => {
    const r = resolveCommissionOwner(
      { broker_id: null, submitted_at: '2026-06-01T00:00:00Z', lead_source: 'institutional' },
      null
    );
    assert.equal(r.platformShare, 1);
  });

  test('broker exists but never subscribed', () => {
    const r = resolveCommissionOwner(deal(), null);
    assert.equal(r.owner, OWNER.PLATFORM);
    assert.equal(r.reason, REASON.NOT_SUBSCRIBED);
  });

  test('subscription cancelled before submission', () => {
    const r = resolveCommissionOwner(
      deal({ submitted_at: '2026-06-01T00:00:00Z' }),
      active({ cancelled_at: '2026-03-01T00:00:00Z' })
    );
    assert.equal(r.owner, OWNER.PLATFORM);
    assert.equal(r.reason, REASON.LAPSED);
  });

  test('billing period ended before submission', () => {
    const r = resolveCommissionOwner(
      deal({ submitted_at: '2026-06-01T00:00:00Z' }),
      active({ current_period_end: '2026-05-01T00:00:00Z' })
    );
    assert.equal(r.reason, REASON.LAPSED);
  });

  test('status past_due is not active', () => {
    const r = resolveCommissionOwner(deal(), active({ status: 'past_due' }));
    assert.equal(r.owner, OWNER.PLATFORM);
  });
});

describe('forward-looking rule', () => {
  test('subscribing later does not claim an earlier deal', () => {
    const r = resolveCommissionOwner(
      deal({ submitted_at: '2026-02-01T00:00:00Z' }),
      active({ started_at: '2026-05-01T00:00:00Z' })
    );
    assert.equal(r.owner, OWNER.PLATFORM);
    assert.equal(r.reason, REASON.SUBSCRIBED_AFTER);
  });

  test('deals after the start date do earn', () => {
    const r = resolveCommissionOwner(
      deal({ submitted_at: '2026-06-01T00:00:00Z' }),
      active({ started_at: '2026-05-01T00:00:00Z' })
    );
    assert.equal(r.owner, OWNER.BROKER);
  });

  test('submitted the same instant the subscription starts — earns', () => {
    const t = '2026-05-01T00:00:00Z';
    const r = resolveCommissionOwner(deal({ submitted_at: t }), active({ started_at: t }));
    assert.equal(r.owner, OWNER.BROKER);
  });
});

describe('ledger record', () => {
  const fee = { rate: 0.05, amount: 25000, label: 'MCA 5%' };

  test('paying broker takes the whole fee', () => {
    const rec = buildCommissionRecord(deal({ aai: 'SL-1126-N100001' }), fee, active());
    assert.equal(rec.broker_amount, 25000);
    assert.equal(rec.platform_amount, 0);
    assert.equal(rec.aai, 'SL-1126-N100001');
  });

  test('non-subscriber fee goes to the house in full', () => {
    const rec = buildCommissionRecord(deal(), fee, null);
    assert.equal(rec.broker_amount, 0);
    assert.equal(rec.platform_amount, 25000);
  });

  test('shares always reconcile to the gross', () => {
    for (const sub of [active(), null, active({ status: 'cancelled' })]) {
      const rec = buildCommissionRecord(deal(), fee, sub);
      assert.equal(
        Math.round((rec.broker_amount + rec.platform_amount) * 100) / 100,
        fee.amount,
        'broker + platform must equal gross'
      );
    }
  });

  test('every outcome carries a human-readable reason', () => {
    for (const sub of [active(), null, active({ status: 'past_due' })]) {
      const rec = buildCommissionRecord(deal(), fee, sub);
      assert.ok(rec.reason && rec.explanation.length > 20);
    }
  });
});
