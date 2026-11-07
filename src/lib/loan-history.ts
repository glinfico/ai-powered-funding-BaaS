// Bank-DB loan-application history.
// These are not cold prospects: each person applied for a loan inside a bank's
// system and consented in that application. Most were already decided
// (funded or not). Derived deterministically from the lead so backfill is
// idempotent and always consistent with score/status.

function rand(seed: number) {
  const x = Math.sin(seed * 424243 + 777) * 10000;
  return x - Math.floor(x);
}

export function loanHistoryFor(lead: { id: number; score: number; status: string; createdAt: string | Date }) {
  const s = lead.id * 19 + lead.score * 7;
  const r = (n: number) => rand(s + n);

  let loanOutcome: string;
  if (lead.status === "Won") loanOutcome = "Funded";
  else if (lead.status === "Lost") loanOutcome = "Declined";
  else {
    const x = r(1);
    // Weighted so "most have already been through the system" — only ~12% undecided
    if (x < 0.58) loanOutcome = "Funded";
    else if (x < 0.88) loanOutcome = "Declined";
    else loanOutcome = "In System — No Decision Yet";
  }

  const created = new Date(lead.createdAt);
  const applicationDate = new Date(created.getTime() - (20 + Math.floor(r(2) * 160)) * 86400000);
  const loanAmount = loanOutcome === "Funded"
    ? Math.round((3500 + r(3) * 46500) / 100) * 100
    : loanOutcome === "Declined"
      ? Math.round((3000 + r(3) * 32000) / 100) * 100 // amount they applied for
      : Math.round((3000 + r(3) * 28000) / 100) * 100;

  return { originSystem: "Bank DB — Loan Application", loanOutcome, loanAmount, applicationDate };
}
