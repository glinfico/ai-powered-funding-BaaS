// MCA Score Calculator — runs server-side in Node.js
function calculateMCAScore(idiqData, finGoalData) {

  let score = 0;

  // 1. Average Monthly Deposits (25 pts)
  const avgDeposits = finGoalData.avgMonthlyDeposits;
  if (avgDeposits >= 50000) score += 25;
  else if (avgDeposits >= 25000) score += 18;
  else if (avgDeposits >= 10000) score += 10;
  else score += 3;

  // 2. Deposit Trend (10 pts)
  const trend = finGoalData.depositTrend; // 'growing','stable','declining'
  if (trend === 'growing') score += 10;
  else if (trend === 'stable') score += 6;
  else score += 1;

  // 3. NSF / Negative Days (15 pts)
  const nsfCount = finGoalData.nsfCount;
  if (nsfCount === 0) score += 15;
  else if (nsfCount <= 2) score += 10;
  else if (nsfCount <= 5) score += 5;
  else score += 0;

  // 4. Existing MCA Load (20 pts)
  const dailyObligations = finGoalData.detectedDailyACH;
  const dailyDeposits = avgDeposits / 21;
  const loadRatio = dailyObligations / dailyDeposits;
  if (loadRatio < 0.15) score += 20;
  else if (loadRatio < 0.25) score += 12;
  else if (loadRatio < 0.35) score += 5;
  else score += 0;

  // 5. Ending Balance Health (10 pts)
  const balanceRatio = finGoalData.avgEndingBalance / avgDeposits;
  if (balanceRatio >= 0.25) score += 10;
  else if (balanceRatio >= 0.10) score += 6;
  else score += 2;

  // 6. Time in Business (10 pts)
  const months = idiqData.businessAgeMonths;
  if (months >= 24) score += 10;
  else if (months >= 12) score += 6;
  else if (months >= 6) score += 2;
  else score += 0;

  // 7. Owner Credit Score (5 pts)
  const creditScore = idiqData.ownerCreditScore;
  if (creditScore >= 680) score += 5;
  else if (creditScore >= 600) score += 3;
  else if (creditScore >= 500) score += 1;
  else score += 0;

  // 8. Industry Risk (5 pts)
  const restrictedIndustries = ['cannabis','adult','gambling','crypto'];
  const industry = idiqData.industry?.toLowerCase();
  if (!restrictedIndustries.some(r => industry?.includes(r))) score += 5;

  // Determine tier
  let tier, action;
  if (score >= 80) { tier = 'A'; action = 'auto_route'; }
  else if (score >= 65) { tier = 'B'; action = 'route_with_review'; }
  else if (score >= 50) { tier = 'C'; action = 'limited_funders'; }
  else if (score >= 35) { tier = 'D'; action = 'high_risk_only'; }
  else { tier = 'F'; action = 'decline'; }

  return { score, tier, action };
}
