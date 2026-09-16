/**
 * GLINFICO MCA Scoring Engine
 * Calculates MCA Score (0-100), tier, offer size, and factor rate
 * Inputs: idiqData (from IDIQ credit pull), finGoalData (from FinGoal revenue API)
 */

const RESTRICTED_INDUSTRIES = [
  'cannabis', 'marijuana', 'adult', 'gambling', 'crypto',
  'cryptocurrency', 'firearms', 'ammunition', 'tobacco'
];

// ─── MAIN SCORING FUNCTION ───────────────────────────────────────────────────

export function calculateMCAScore(idiqData, finGoalData) {
  const breakdown = {};
  let totalScore = 0;

  // 1. Average Monthly Deposits (25 pts)
  const avgDeposits = finGoalData.avgMonthlyDeposits || 0;
  let depositScore = 0;
  if (avgDeposits >= 100000) depositScore = 25;
  else if (avgDeposits >= 50000) depositScore = 20;
  else if (avgDeposits >= 25000) depositScore = 14;
  else if (avgDeposits >= 10000) depositScore = 8;
  else if (avgDeposits >= 5000)  depositScore = 3;
  breakdown.avgDeposits = { score: depositScore, max: 25, value: avgDeposits };
  totalScore += depositScore;

  // 2. Deposit Trend 3-6 months (10 pts)
  const trend = finGoalData.depositTrend || 'stable';
  const trendScore = trend === 'growing' ? 10 : trend === 'stable' ? 6 : 1;
  breakdown.depositTrend = { score: trendScore, max: 10, value: trend };
  totalScore += trendScore;

  // 3. Ending Balance Health (10 pts)
  const avgEndingBalance = finGoalData.avgEndingBalance || 0;
  const balanceRatio = avgDeposits > 0 ? avgEndingBalance / avgDeposits : 0;
  let balanceScore = 0;
  if (balanceRatio >= 0.30) balanceScore = 10;
  else if (balanceRatio >= 0.20) balanceScore = 8;
  else if (balanceRatio >= 0.10) balanceScore = 5;
  else if (balanceRatio >= 0.05) balanceScore = 2;
  breakdown.balanceHealth = { score: balanceScore, max: 10, value: balanceRatio };
  totalScore += balanceScore;

  // 4. NSF / Negative Days (15 pts)
  const nsfCount = finGoalData.nsfCount || 0;
  const negativeDays = finGoalData.negativeDays || 0;
  const nsfRisk = nsfCount + negativeDays;
  let nsfScore = 0;
  if (nsfRisk === 0) nsfScore = 15;
  else if (nsfRisk <= 2) nsfScore = 11;
  else if (nsfRisk <= 5) nsfScore = 7;
  else if (nsfRisk <= 10) nsfScore = 3;
  breakdown.nsfRisk = { score: nsfScore, max: 15, value: nsfRisk };
  totalScore += nsfScore;

  // 5. Existing MCA Load (20 pts)
  const detectedDailyACH = finGoalData.detectedDailyACH || 0;
  const dailyDepositAvg = avgDeposits / 21; // ~21 business days
  const loadRatio = dailyDepositAvg > 0 ? detectedDailyACH / dailyDepositAvg : 1;
  let loadScore = 0;
  if (loadRatio === 0) loadScore = 20;
  else if (loadRatio < 0.10) loadScore = 17;
  else if (loadRatio < 0.20) loadScore = 12;
  else if (loadRatio < 0.30) loadScore = 6;
  else if (loadRatio < 0.40) loadScore = 2;
  breakdown.existingLoad = { score: loadScore, max: 20, value: loadRatio };
  totalScore += loadScore;

  // 6. Time in Business (10 pts)
  const monthsInBusiness = idiqData.businessAgeMonths || 0;
  let timeScore = 0;
  if (monthsInBusiness >= 36) timeScore = 10;
  else if (monthsInBusiness >= 24) timeScore = 8;
  else if (monthsInBusiness >= 12) timeScore = 5;
  else if (monthsInBusiness >= 6)  timeScore = 2;
  breakdown.timeInBusiness = { score: timeScore, max: 10, value: monthsInBusiness };
  totalScore += timeScore;

  // 7. Owner Credit Score (5 pts)
  const creditScore = idiqData.ownerCreditScore || 0;
  let creditPts = 0;
  if (creditScore >= 700) creditPts = 5;
  else if (creditScore >= 650) creditPts = 4;
  else if (creditScore >= 600) creditPts = 3;
  else if (creditScore >= 550) creditPts = 2;
  else if (creditScore >= 500) creditPts = 1;
  breakdown.ownerCredit = { score: creditPts, max: 5, value: creditScore };
  totalScore += creditPts;

  // 8. Industry Risk (5 pts)
  const industry = (idiqData.industry || '').toLowerCase();
  const isRestricted = RESTRICTED_INDUSTRIES.some(r => industry.includes(r));
  const industryScore = isRestricted ? 0 : 5;
  breakdown.industryRisk = { score: industryScore, max: 5, value: industry, restricted: isRestricted };
  totalScore += industryScore;

  // ── Determine Tier & Action ──
  const { tier, action, label } = getTier(totalScore);

  return {
    score: Math.min(100, Math.round(totalScore)),
    tier,
    action,
    label,
    breakdown,
    isRestricted,
    timestamp: new Date().toISOString()
  };
}

function getTier(score) {
  if (score >= 80) return { tier: 'A', action: 'auto_route',        label: 'A-Paper — Lender Ready' };
  if (score >= 65) return { tier: 'B', action: 'route_with_review', label: 'B-Paper — Near Ready' };
  if (score >= 50) return { tier: 'C', action: 'limited_funders',   label: 'C-Paper — Limited Options' };
  if (score >= 35) return { tier: 'D', action: 'high_risk_only',    label: 'High Risk — Restricted' };
  return              { tier: 'F', action: 'decline',             label: 'Decline' };
}

// ─── OFFER SIZING ─────────────────────────────────────────────────────────────

export function calculateMCAOffer(finGoalData, tier) {
  const avgDeposits = finGoalData.avgMonthlyDeposits || 0;
  const detectedDailyACH = finGoalData.detectedDailyACH || 0;

  if (tier === 'F') {
    return { eligible: false, reason: 'Application does not meet minimum criteria.' };
  }

  // Advance multiples by tier
  const multiples = { A: 1.75, B: 1.50, C: 1.25, D: 1.00 };
  const haircuts  = { A: 1.00, B: 0.85, C: 0.75, D: 0.65 };

  const grossEligible = avgDeposits * (multiples[tier] || 1);
  const existingLoad  = detectedDailyACH * 20; // ~20 biz days/month
  const netEligible   = Math.max(0, grossEligible - existingLoad);
  const rawAdvance    = netEligible * (haircuts[tier] || 0.65);

  // Round to nearest $1,000, enforce min $5K / max $500K
  const recommendedAdvance = Math.min(500000, Math.max(5000, Math.round(rawAdvance / 1000) * 1000));

  // Factor rates by tier
  const factorRates = {
    A: { min: 1.18, max: 1.28 },
    B: { min: 1.29, max: 1.38 },
    C: { min: 1.39, max: 1.49 },
    D: { min: 1.50, max: 1.55 }
  };
  const rates = factorRates[tier] || factorRates.D;
  const assignedRate   = parseFloat(((rates.min + rates.max) / 2).toFixed(2));
  const paybackAmount  = Math.round(recommendedAdvance * assignedRate);
  const dailyPayment   = Math.round(paybackAmount / 60); // ~60 business day term
  const estimatedTerm  = Math.round(paybackAmount / dailyPayment);

  return {
    eligible: true,
    recommendedAdvance,
    assignedRate,
    paybackAmount,
    dailyPayment,
    estimatedTermDays: estimatedTerm,
    rateRange: rates,
    commissionAmount: Math.round(recommendedAdvance * 0.05), // 5% GLINFICO commission
    commissionRate: 0.05
  };
}

// ─── STACKING DETECTION ───────────────────────────────────────────────────────

export function detectStacking(finGoalData) {
  const detectedDailyACH = finGoalData.detectedDailyACH || 0;
  const avgDailyDeposit  = (finGoalData.avgMonthlyDeposits || 0) / 21;
  const loadRatio        = avgDailyDeposit > 0 ? detectedDailyACH / avgDailyDeposit : 0;

  const roundNumberDeposits = finGoalData.roundNumberDepositCount || 0;
  const suddenDepositSpikes = finGoalData.suddenDepositSpikes || 0;

  let stackingRisk = 'LOW';
  let recommendation = 'Proceed normally.';
  const flags = [];

  if (detectedDailyACH > 0) {
    flags.push(`Detected existing daily ACH: $${detectedDailyACH.toLocaleString()}/day`);
  }
  if (loadRatio > 0.35) {
    flags.push('Existing obligation load exceeds 35% of daily deposits');
    stackingRisk = 'HIGH';
    recommendation = 'Require payoff of existing positions OR reduce advance significantly.';
  } else if (loadRatio > 0.20) {
    stackingRisk = 'MODERATE';
    recommendation = 'Approve with payoff condition or reduce advance to maintain safe load ratio.';
  }
  if (roundNumberDeposits >= 3) {
    flags.push(`${roundNumberDeposits} round-number deposits detected — possible cash injection`);
  }
  if (suddenDepositSpikes >= 2) {
    flags.push(`${suddenDepositSpikes} sudden deposit spikes — may indicate new MCA funding`);
  }

  return {
    stackingRisk,
    recommendation,
    flags,
    detectedPositions: detectedDailyACH > 0 ? 1 : 0,
    estimatedRemainingBalance: detectedDailyACH > 0
      ? Math.round(detectedDailyACH * 30)
      : 0
  };
}
