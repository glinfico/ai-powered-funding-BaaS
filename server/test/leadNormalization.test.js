import test from 'node:test';
import assert from 'node:assert/strict';
import {
  normalizeLoanType,
  getFundingCategory
} from '../leadNormalization.js';

test('normalizes loan types consistently', () => {
  assert.equal(normalizeLoanType('Commercial Real Estate'), 'commercial_real_estate');
  assert.equal(normalizeLoanType('Merchant Cash Advance'), 'merchant_cash_advance');
  assert.equal(normalizeLoanType('Line of Credit'), 'line_of_credit');
  assert.equal(normalizeLoanType('M&A Deal'), 'm_a_deal');
  assert.equal(normalizeLoanType('  SBA Loan!  '), 'sba_loan');
});

test('defaults missing loan type to other', () => {
  assert.equal(normalizeLoanType(undefined), 'other');
  assert.equal(normalizeLoanType(''), 'other');
});

test('maps real estate products to REAL_ESTATE', () => {
  assert.equal(getFundingCategory('commercial_real_estate'), 'REAL_ESTATE');
  assert.equal(getFundingCategory('bridge_loan'), 'REAL_ESTATE');
});

test('maps business funding products to BUSINESS_LOANS', () => {
  for (const type of [
    'business_loan',
    'merchant_cash_advance',
    'equipment_financing',
    'sba_loan',
    'line_of_credit',
    'invoice_factoring',
    'other'
  ]) {
    assert.equal(getFundingCategory(type), 'BUSINESS_LOANS', type);
  }
});

test('maps M&A deals to M_AND_A', () => {
  const normalized = normalizeLoanType('M&A Deal');
  assert.equal(getFundingCategory(normalized), 'M_AND_A');
});

test('unknown loan types default to BUSINESS_LOANS', () => {
  assert.equal(getFundingCategory('unknown_product'), 'BUSINESS_LOANS');
});
