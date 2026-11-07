// Deterministic simulated enrichment — in production these values come from
// live IDIQ (identity / soft pull / monitoring) and FinGoal (banking) API calls
// made server-side from the Lead Engine. Never call those providers from IDE.

function rand(seed: number) {
  const x = Math.sin(seed * 99991 + 54321) * 10000;
  return x - Math.floor(x);
}

export type EnrichmentRow = {
  leadId: number; identityStatus: string; identityConfidence: number; idiqRef: string;
  softPullStatus: string; creditScore: number; creditBand: string; monitoringStatus: string;
  monitoringAlerts: number; fingoalStatus: string; bankAccounts: number; monthlyIncome: number;
  monthlySpend: number; cashflowScore: number; finalScore: number; scoredStatus: string;
  routedToIde: string; ideRef: string;
};

export function bandFor(credit: number) {
  if (credit >= 750) return "Excellent 750+";
  if (credit >= 700) return "Good 700–749";
  if (credit >= 650) return "Fair 650–699";
  if (credit >= 600) return "Watch 600–649";
  return "High Risk <600";
}

export function enrichLead(lead: { id: number; score: number; estimatedValue: number }): EnrichmentRow {
  const s = lead.id * 17 + lead.score * 31;
  const r = (n: number) => rand(s + n);

  // IDIQ identity: ~94% verified, rest review/failed (realistic, still "processed")
  const idr = r(1);
  const identityStatus = idr < 0.94 ? "Verified" : idr < 0.985 ? "Review" : "Failed";
  const identityConfidence = identityStatus === "Verified" ? 82 + Math.floor(r(2) * 18) : identityStatus === "Review" ? 55 + Math.floor(r(2) * 25) : 20 + Math.floor(r(2) * 30);

  // IDIQ soft pull (does NOT affect credit score): mapped from existing lead score
  const creditScore = Math.max(480, Math.min(840, Math.round(505 + lead.score * 3.1 + (r(3) - 0.5) * 36)));
  const softPullStatus = identityStatus === "Failed" ? "Review" : r(4) < 0.97 ? "Completed" : "No Hit";

  // IDIQ monitoring
  const monitoringStatus = identityStatus === "Verified" ? "Enrolled" : "Not Enrolled";
  const monitoringAlerts = monitoringStatus === "Enrolled" ? (r(5) < 0.82 ? 0 : 1 + Math.floor(r(6) * 3)) : 0;

  // FinGoal banking (consumer-permissioned): most linked, some enriched-only
  const fr = r(7);
  const fingoalStatus = fr < 0.86 ? "Linked + Enriched" : fr < 0.95 ? "Enriched" : "Not Linked";
  const bankAccounts = fingoalStatus === "Not Linked" ? 0 : 1 + Math.floor(r(8) * 3);
  const monthlyIncome = fingoalStatus === "Not Linked" ? 0 : Math.round((2600 + r(9) * 9400 + lead.score * 22) / 10) * 10;
  const monthlySpend = monthlyIncome ? Math.round(monthlyIncome * (0.52 + r(10) * 0.36)) : 0;
  const cashflowScore = fingoalStatus === "Not Linked" ? 0 : Math.max(5, Math.min(99, Math.round(38 + lead.score * 0.45 + (r(11) - 0.5) * 18)));

  // Final scored value: the lead already carries a score; enrichment confirms/explains it.
  // Blend lead score + credit + cashflow so the number is auditable, not magic.
  const creditNorm = Math.round(((creditScore - 480) / 360) * 100); // 0–100
  const finalScore = Math.max(1, Math.min(100, Math.round(lead.score * 0.5 + creditNorm * 0.3 + (cashflowScore || creditNorm) * 0.2)));

  return {
    leadId: lead.id,
    identityStatus, identityConfidence,
    idiqRef: `IDIQ-${String(lead.id).padStart(6, "0")}`,
    softPullStatus, creditScore, creditBand: bandFor(creditScore),
    monitoringStatus, monitoringAlerts,
    fingoalStatus, bankAccounts, monthlyIncome, monthlySpend, cashflowScore,
    finalScore, scoredStatus: "Scored",
    routedToIde: "Pending", ideRef: "",
  };
}

export function idePayload(lead: any, e: EnrichmentRow | any) {
  // This exact shape is what IDE consumes — results routed OUT of the engine.
  return {
    event: "lead.scored",
    idempotencyKey: `lead-${lead.id}-scored-v1`,
    leadId: lead.id,
    name: `${lead.firstName} ${lead.lastName}`,
    email: lead.email,
    company: lead.company,
    source: lead.source,
    status: lead.status,
    score: e.finalScore,
    identity: { provider: "IDIQ", status: e.identityStatus, confidence: e.identityConfidence, ref: e.idiqRef },
    softPull: { provider: "IDIQ", status: e.softPullStatus, creditScore: e.creditScore, band: e.creditBand, hardInquiry: false },
    monitoring: { provider: "IDIQ", status: e.monitoringStatus, alerts: e.monitoringAlerts },
    banking: { provider: "FinGoal", status: e.fingoalStatus, accounts: e.bankAccounts, monthlyIncome: e.monthlyIncome, cashflowScore: e.cashflowScore },
  };
}
