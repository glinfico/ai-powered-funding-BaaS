/**
 * Lead Scoring Engine — GLINFICO CRM
 * Scores a lead 0–100 based on financial signals, completeness, and pipeline signals.
 * Returns { score, grade, breakdown, color, bg }
 */

export function scoreLeadQuality(lead) {
  let score = 0;
  const breakdown = [];

  // ── 1. Loan Amount (max 25 pts) ───────────────────────────────────────────
  const amount = lead.loan_amount || 0;
  let amountPts = 0;
  if (amount >= 1_000_000) amountPts = 25;
  else if (amount >= 500_000) amountPts = 20;
  else if (amount >= 250_000) amountPts = 15;
  else if (amount >= 100_000) amountPts = 10;
  else if (amount >= 25_000) amountPts = 5;
  score += amountPts;
  breakdown.push({ label: "Loan Amount", pts: amountPts, max: 25 });

  // ── 2. Credit Score Range (max 20 pts) ───────────────────────────────────
  const creditPts = {
    "excellent_750+": 20,
    "good_700-749": 15,
    "fair_650-699": 8,
    "poor_below_650": 2,
    "unknown": 0,
  }[lead.credit_score_range] ?? 0;
  score += creditPts;
  breakdown.push({ label: "Credit Score", pts: creditPts, max: 20 });

  // ── 3. Annual Revenue (max 15 pts) ───────────────────────────────────────
  const revenue = lead.annual_revenue || 0;
  let revPts = 0;
  if (revenue >= 5_000_000) revPts = 15;
  else if (revenue >= 1_000_000) revPts = 12;
  else if (revenue >= 500_000) revPts = 8;
  else if (revenue >= 100_000) revPts = 4;
  score += revPts;
  breakdown.push({ label: "Annual Revenue", pts: revPts, max: 15 });

  // ── 4. Years in Business (max 10 pts) ────────────────────────────────────
  const years = lead.years_in_business || 0;
  let yearPts = 0;
  if (years >= 5) yearPts = 10;
  else if (years >= 3) yearPts = 7;
  else if (years >= 1) yearPts = 4;
  else if (years > 0) yearPts = 1;
  score += yearPts;
  breakdown.push({ label: "Time in Business", pts: yearPts, max: 10 });

  // ── 5. Priority (max 10 pts) ─────────────────────────────────────────────
  const priorityPts = { urgent: 10, high: 8, medium: 4, low: 1 }[lead.priority] ?? 0;
  score += priorityPts;
  breakdown.push({ label: "Priority", pts: priorityPts, max: 10 });

  // ── 6. Profile completeness (max 10 pts) ─────────────────────────────────
  const fields = [lead.email, lead.phone, lead.company, lead.source, lead.assigned_to,
                  lead.loan_type, lead.credit_score_range, lead.annual_revenue,
                  lead.years_in_business, lead.next_follow_up];
  const filledCount = fields.filter(Boolean).length;
  const completePts = Math.round((filledCount / fields.length) * 10);
  score += completePts;
  breakdown.push({ label: "Profile Completeness", pts: completePts, max: 10 });

  // ── 7. Enrichment & Due Diligence (max 10 pts) ───────────────────────────
  let enrichPts = 0;
  if (lead.enrichment_status === "completed") enrichPts += 2;
  if (lead.business_owner_found) enrichPts += 1;
  // AI due diligence score contributes up to 5 pts
  if (lead.due_diligence_score != null) {
    enrichPts += Math.round((lead.due_diligence_score / 100) * 5);
  }
  // Credit soft-pull score contributes up to 2 pts
  if (lead.credit_idq_score != null) {
    if (lead.credit_idq_score >= 80) enrichPts += 2;
    else if (lead.credit_idq_score >= 60) enrichPts += 1;
  }
  enrichPts = Math.min(enrichPts, 10);
  score += enrichPts;
  breakdown.push({ label: "AI Due Diligence", pts: enrichPts, max: 10 });

  // ── 8. Property (CRE) LTV bonus (max 5 pts) ──────────────────────────────
  let propertyPts = 0;
  if (lead.loan_type === "commercial_real_estate" && lead.property_ltv != null) {
    if (lead.property_ltv <= 60) propertyPts = 5;
    else if (lead.property_ltv <= 70) propertyPts = 4;
    else if (lead.property_ltv <= 75) propertyPts = 3;
    else if (lead.property_ltv <= 80) propertyPts = 2;
    else propertyPts = 0; // High LTV = risk penalty
  }
  score += propertyPts;
  if (lead.loan_type === "commercial_real_estate") {
    breakdown.push({ label: "Property LTV", pts: propertyPts, max: 5 });
  }

  // ── 9. Pipeline stage bonus (max 5 pts) ──────────────────────────────────
  const stagePts = {
    new: 0, contacted: 1, qualified: 2, proposal_sent: 3, negotiation: 4, approved: 5, funded: 5, lost: 0,
  }[lead.status] ?? 0;
  score += stagePts;
  breakdown.push({ label: "Pipeline Stage", pts: stagePts, max: 5 });

  // Clamp
  score = Math.min(100, Math.max(0, score));

  // Grade
  let grade, color, bg, ring;
  if (score >= 80) { grade = "A"; color = "text-emerald-700"; bg = "bg-emerald-50"; ring = "ring-emerald-400"; }
  else if (score >= 65) { grade = "B"; color = "text-blue-700"; bg = "bg-blue-50"; ring = "ring-blue-400"; }
  else if (score >= 45) { grade = "C"; color = "text-amber-700"; bg = "bg-amber-50"; ring = "ring-amber-400"; }
  else if (score >= 25) { grade = "D"; color = "text-orange-700"; bg = "bg-orange-50"; ring = "ring-orange-400"; }
  else { grade = "F"; color = "text-red-700"; bg = "bg-red-50"; ring = "ring-red-400"; }

  return { score, grade, breakdown, color, bg, ring };
}