const isPresent = (value) =>
  value !== undefined && value !== null && value !== '';

const toFiniteNumber = (value) => {
  if (!isPresent(value) || typeof value === 'boolean') return null;
  if (typeof value === 'string' && value.trim() === '') return null;

  const number = Number(value);
  return Number.isFinite(number) ? number : null;
};

const normalizeText = (value) =>
  typeof value === 'string' ? value.trim().toUpperCase() : '';

const getCriteria = (lender) => {
  const buyBox = lender?.buy_box;
  return {
    limits: buyBox?.funding_limits,
    criteria: buyBox?.underwriting_criteria
  };
};

/**
 * Returns lenders whose stored buy boxes satisfy every required input.
 * This is preliminary eligibility only, not an underwriting approval.
 *
 * Deal fields:
 * amount, monthlyRevenue, nsfCount, state, industry,
 * avgDailyBalance, timeInBusinessMonths
 *
 * Lender fields:
 * id, name, is_active, buy_box
 */
export function matchLendersBuyBox(deal, lenders = []) {
  if (!deal || !Array.isArray(lenders)) return [];

  const amount = toFiniteNumber(deal.amount);
  const monthlyRevenue = toFiniteNumber(deal.monthlyRevenue);
  const nsfCount = toFiniteNumber(deal.nsfCount);
  const avgDailyBalance = toFiniteNumber(deal.avgDailyBalance);
  const timeInBusinessMonths = toFiniteNumber(deal.timeInBusinessMonths);
  const state = normalizeText(deal.state);
  const industry = normalizeText(deal.industry);

  // Never infer eligibility when required underwriting information is absent
  // or invalid. NSF and time-in-business must be whole-number counts.
  if (
    amount === null || amount < 0 ||
    monthlyRevenue === null || monthlyRevenue < 0 ||
    nsfCount === null || !Number.isInteger(nsfCount) || nsfCount < 0 ||
    avgDailyBalance === null || avgDailyBalance < 0 ||
    timeInBusinessMonths === null ||
      !Number.isInteger(timeInBusinessMonths) ||
      timeInBusinessMonths < 0 ||
    !state || !industry
  ) {
    return [];
  }

  return lenders.filter((lender) => {
    if (lender?.is_active !== true) return false;

    const { limits, criteria } = getCriteria(lender);
    if (!limits || !criteria) return false;

    const minAmount = toFiniteNumber(limits.min_amount);
    const maxAmount = toFiniteNumber(limits.max_amount);
    const minRevenue = toFiniteNumber(criteria.min_monthly_revenue);
    const maxNsf = toFiniteNumber(criteria.max_nsf_count_30_days);
    const minDailyBalance = toFiniteNumber(criteria.min_daily_balance);
    const minTimeInBusiness = toFiniteNumber(
      criteria.min_time_in_business_months
    );

    // Missing or invalid lender criteria must not silently become a pass.
    if (
      minAmount === null || maxAmount === null ||
      minRevenue === null || maxNsf === null ||
      minDailyBalance === null || minTimeInBusiness === null ||
      !Array.isArray(criteria.excluded_states) ||
      !Array.isArray(criteria.allowed_industries) ||
      minAmount < 0 || maxAmount < minAmount ||
      minRevenue < 0 || maxNsf < 0 ||
      !Number.isInteger(maxNsf) ||
      minDailyBalance < 0 || minTimeInBusiness < 0 ||
      !Number.isInteger(minTimeInBusiness)
    ) {
      return false;
    }

    const excludedStates = criteria.excluded_states.map(normalizeText);
    const allowedIndustries = criteria.allowed_industries.map(normalizeText);

    if (amount < minAmount || amount > maxAmount) return false;
    if (monthlyRevenue < minRevenue) return false;
    if (nsfCount > maxNsf) return false;
    if (excludedStates.includes(state)) return false;
    if (avgDailyBalance < minDailyBalance) return false;
    if (timeInBusinessMonths < minTimeInBusiness) return false;

    const industryAllowed =
      allowedIndustries.includes('ALL') ||
      allowedIndustries.includes(industry);

    if (!industryAllowed) return false;

    return true;
  });
}
