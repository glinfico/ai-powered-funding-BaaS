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
