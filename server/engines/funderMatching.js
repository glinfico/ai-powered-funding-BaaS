async function matchFunders(application, supabaseClient) {

  // Pull all active funders from DB
  const { data: funders } = await supabaseClient
    .from('funders')
    .select('*')
    .eq('active', true);

  const matches = [];

  for (const funder of funders) {

    // Hard filters — eliminate non-eligible
    if (application.amount < funder.min_deal_size) continue;
    if (application.amount > funder.max_deal_size) continue;
    if (!funder.accepted_tiers.includes(application.tier)) continue;
    if (application.creditScore < funder.min_credit_score) continue;

    // Soft scoring — rank eligible funders
    let fitScore = 0;

    // Deal size in sweet spot
    const sweetSpot = (funder.min_deal_size + funder.max_deal_size) / 2;
    const sizeProximity = 1 - Math.abs(application.amount - sweetSpot) / sweetSpot;
    fitScore += sizeProximity * 25;

    // Industry match
    if (funder.preferred_industries?.includes(application.industry)) fitScore += 20;
    else if (!funder.restricted_industries?.includes(application.industry)) fitScore += 10;

    // Tier alignment
    const tierScores = { A: 25, B: 20, C: 12, D: 5 };
    fitScore += tierScores[application.tier] || 0;

    // Speed score
    fitScore += Math.max(0, 20 - funder.avg_decision_hours);

    // Historical approval rate
    fitScore += (funder.approval_rate || 0.5) * 10;

    matches.push({
      funderId: funder.id,
      funderName: funder.name,
      fitScore: Math.round(fitScore),
      factorRate: funder.base_factor_rate,
      avgDecisionHours: funder.avg_decision_hours
    });
  }

  // Sort by fit score, return top 5
  return matches
    .sort((a, b) => b.fitScore - a.fitScore)
    .slice(0, 5);
}
