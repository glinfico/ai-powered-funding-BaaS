const CATEGORY_MAP = {
  commercial_real_estate: 'REAL_ESTATE',
  bridge_loan: 'REAL_ESTATE',
  business_loan: 'BUSINESS_LOANS',
  merchant_cash_advance: 'BUSINESS_LOANS',
  equipment_financing: 'BUSINESS_LOANS',
  sba_loan: 'BUSINESS_LOANS',
  line_of_credit: 'BUSINESS_LOANS',
  invoice_factoring: 'BUSINESS_LOANS',
  m_a_deal: 'M_AND_A',
  other: 'BUSINESS_LOANS'
};

export function normalizeLoanType(loanType) {
  return (loanType || 'other')
    .toLowerCase()
    .replace(/&/g, '_')
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '');
}

export function getFundingCategory(normalizedType) {
  return CATEGORY_MAP[normalizedType] || 'BUSINESS_LOANS';
}
