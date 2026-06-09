/**
 * GLINFICO Commission Calculator
 * Rates:
 *   MCA (merchant_cash_advance / mca)  → 5%
 *   CRE (commercial_real_estate)       → 3%
 *   M&A (bridge_loan / other M&A)      → 5%
 *   All others                          → 2% default
 *
 * Fee is due at closing — sent to GLINFICO PayPal account.
 */

export const COMMISSION_RATES = {
  merchant_cash_advance: 0.05,
  mca: 0.05,
  commercial_real_estate: 0.03,
  bridge_loan: 0.05, // M&A / bridge
  other: 0.05,       // treat "other" as M&A
  // defaults for all remaining types
  business_loan: 0.02,
  equipment_financing: 0.02,
  sba_loan: 0.02,
  line_of_credit: 0.02,
  invoice_factoring: 0.02,
};

export const PAYPAL_CLOSING_EMAIL = 'closing@glinfico.com'; // PayPal account for commission

/**
 * Calculate commission for a deal.
 * Uses approved_amount if available, otherwise loan_amount.
 * Returns { rate, amount, paypal_email, label }
 */
export function calcCommission(deal) {
  const rate = COMMISSION_RATES[deal.loan_type] ?? 0.02;
  const base = deal.approved_amount || deal.loan_amount || 0;
  const amount = Math.round(base * rate * 100) / 100;

  const rateLabels = {
    merchant_cash_advance: 'MCA 5%', mca: 'MCA 5%',
    commercial_real_estate: 'CRE 3%',
    bridge_loan: 'M&A 5%', other: 'M&A 5%',
  };
  const label = rateLabels[deal.loan_type] || `${(rate * 100).toFixed(0)}%`;

  return { rate, amount, paypal_email: PAYPAL_CLOSING_EMAIL, label };
}

/**
 * Suggest approved loan amount based on verified annual revenue.
 * Standard underwriting ratios:
 *   MCA / Line of Credit  → 10–15% of annual revenue (use 12%)
 *   Business Loan / SBA   → 20–25% of annual revenue (use 20%)
 *   CRE                   → determined by LTV, fall back to 40% revenue
 *   Equipment             → up to 100% of equipment value → use 15% revenue
 *   Invoice Factoring     → 80% of A/R → approximated as 8% revenue
 */
export function suggestApprovedAmount(deal) {
  const revenue = deal.annual_revenue || 0;
  if (!revenue) return null;

  const ratios = {
    merchant_cash_advance: 0.12, mca: 0.12,
    line_of_credit: 0.12,
    business_loan: 0.20,
    sba_loan: 0.20,
    commercial_real_estate: 0.40,
    equipment_financing: 0.15,
    invoice_factoring: 0.08,
    bridge_loan: 0.25,
    other: 0.15,
  };

  const ratio = ratios[deal.loan_type] ?? 0.15;
  return Math.round(revenue * ratio);
}