import test from 'node:test';
import assert from 'node:assert/strict';
import { matchLendersBuyBox } from '../engines/lenderBuyBoxMatching.js';

const makeLender = (overrides = {}) => ({
  id: 'lender-1',
  name: 'Test Capital',
  is_active: true,
  buy_box: {
    funding_limits: {
      min_amount: 25000,
      max_amount: 500000
    },
    underwriting_criteria: {
      excluded_states: ['CA', 'NV'],
      min_monthly_revenue: 15000,
      max_nsf_count_30_days: 2,
      allowed_industries: ['Construction', 'Logistics'],
      min_daily_balance: 1500,
      min_time_in_business_months: 12
    }
  },
  ...overrides
});

const makeDeal = (overrides = {}) => ({
  amount: 100000,
  monthlyRevenue: 25000,
  nsfCount: 1,
  state: 'TX',
  industry: 'Construction',
  avgDailyBalance: 2000,
  timeInBusinessMonths: 24,
  ...overrides
});

const matchIds = (deal, lenders) =>
  matchLendersBuyBox(deal, lenders).map((lender) => lender.id);

test('matches a deal that satisfies every buy-box criterion', () => {
  assert.deepEqual(
    matchIds(makeDeal(), [makeLender()]),
    ['lender-1']
  );
});

test('accepts exact funding amount boundaries and underwriting minimums', () => {
  const lender = makeLender();
  const criteria = lender.buy_box.underwriting_criteria;

  assert.deepEqual(
    matchIds(makeDeal({
      amount: 25000,
      monthlyRevenue: criteria.min_monthly_revenue,
      nsfCount: criteria.max_nsf_count_30_days,
      avgDailyBalance: criteria.min_daily_balance,
      timeInBusinessMonths: criteria.min_time_in_business_months
    }), [lender]),
    ['lender-1']
  );

  assert.deepEqual(
    matchIds(makeDeal({ amount: 500000 }), [lender]),
    ['lender-1']
  );
});

test('rejects amounts below the minimum or above the maximum', () => {
  assert.deepEqual(
    matchIds(makeDeal({ amount: 24999 }), [makeLender()]),
    []
  );
  assert.deepEqual(
    matchIds(makeDeal({ amount: 500001 }), [makeLender()]),
    []
  );
});

test('rejects excluded states case-insensitively', () => {
  assert.deepEqual(
    matchIds(makeDeal({ state: 'ca' }), [makeLender()]),
    []
  );
});

test('rejects monthly revenue below the minimum', () => {
  assert.deepEqual(
    matchIds(makeDeal({ monthlyRevenue: 14999 }), [makeLender()]),
    []
  );
});

test('rejects NSF count above the maximum', () => {
  assert.deepEqual(
    matchIds(makeDeal({ nsfCount: 3 }), [makeLender()]),
    []
  );
});

test('rejects industries outside the allowed list', () => {
  assert.deepEqual(
    matchIds(makeDeal({ industry: 'Healthcare' }), [makeLender()]),
    []
  );
});

test('matches allowed industries without case sensitivity', () => {
  assert.deepEqual(
    matchIds(makeDeal({ industry: 'construction' }), [makeLender()]),
    ['lender-1']
  );
});

test('treats All as an industry wildcard', () => {
  const lender = makeLender({
    id: 'all-industries',
    buy_box: {
      ...makeLender().buy_box,
      underwriting_criteria: {
        ...makeLender().buy_box.underwriting_criteria,
        allowed_industries: ['All']
      }
    }
  });

  assert.deepEqual(
    matchIds(makeDeal({ industry: 'Healthcare' }), [lender]),
    ['all-industries']
  );
});

test('rejects average daily balance below the minimum', () => {
  assert.deepEqual(
    matchIds(makeDeal({ avgDailyBalance: 1499 }), [makeLender()]),
    []
  );
});

test('rejects time in business below the minimum', () => {
  assert.deepEqual(
    matchIds(makeDeal({ timeInBusinessMonths: 11 }), [makeLender()]),
    []
  );
});

test('never matches when required deal information is missing', () => {
  const lender = makeLender();

  for (const field of [
    'amount',
    'monthlyRevenue',
    'nsfCount',
    'state',
    'industry',
    'avgDailyBalance',
    'timeInBusinessMonths'
  ]) {
    const deal = makeDeal();
    delete deal[field];

    assert.deepEqual(
      matchIds(deal, [lender]),
      [],
      `Missing ${field} must not match`
    );
  }
});

test('rejects null, invalid, and negative underwriting inputs', () => {
  for (const overrides of [
    { amount: null },
    { monthlyRevenue: 'unknown' },
    { nsfCount: -1 },
    { nsfCount: 1.5 },
    { avgDailyBalance: null },
    { timeInBusinessMonths: -1 },
    { state: '' },
    { industry: '' }
  ]) {
    assert.deepEqual(
      matchIds(makeDeal(overrides), [makeLender()]),
      [],
      `Invalid input: ${JSON.stringify(overrides)}`
    );
  }
});

test('does not match inactive lenders', () => {
  assert.deepEqual(
    matchIds(makeDeal(), [makeLender({ is_active: false })]),
    []
  );
});

test('can match multiple eligible lenders without returning ineligible ones', () => {
  const eligible = makeLender({ id: 'eligible' });
  const ineligible = makeLender({
    id: 'ineligible',
    buy_box: {
      ...makeLender().buy_box,
      underwriting_criteria: {
        ...makeLender().buy_box.underwriting_criteria,
        min_daily_balance: 5000
      }
    }
  });

  assert.deepEqual(
    matchIds(makeDeal(), [eligible, ineligible]),
    ['eligible']
  );
});
