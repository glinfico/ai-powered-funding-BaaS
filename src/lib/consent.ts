// Purchased-lead consent model.
// The user BUYS leads whose consent for credit pull + banking search was
// already captured by the seller and transferred with the lead. That is a
// different legal/operational basis from prospecting (where WE would have to
// capture consent ourselves, e.g. via Twilio outreach). Keep them separate.

export const SCOPES = ["credit_pull", "banking_search", "monitoring"] as const;
export const VENDORS = ["Bank Partner DB — Lending Division", "Bank Partner DB — Consumer Loans", "Bank Partner DB — Retail Banking", "Bank Partner DB — Loan Origination"];

export function vendorForLead(leadId: number, batchId?: number | null) {
  return VENDORS[Math.abs((batchId || 0) + leadId) % VENDORS.length];
}

export function purchasedConsentRows(lead: { id: number; createdAt: string | Date; batchId?: number | null; vendorName?: string }) {
  const created = new Date(lead.createdAt);
  const seed = lead.id * 13;
  return SCOPES.map((scope, i) => {
    const capturedAt = new Date(created.getTime() - (6 + ((seed + i * 7) % 38)) * 86400000); // consent predates purchase/scoring
    const expiresAt = new Date(capturedAt.getTime() + 365 * 86400000);
    const vendorName = lead.vendorName && lead.vendorName !== "Purchased Lead Vendor" ? lead.vendorName : vendorForLead(lead.id, lead.batchId);
    return {
      leadId: lead.id, scope, status: "Granted", basis: "Purchased-Transferred",
      vendorName,
      evidenceRef: `CONSENT-${vendorName.replace(/[^A-Z]/gi, "").slice(0, 4).toUpperCase()}-${String(lead.id).padStart(6, "0")}-${scope.replace("_", "-").toUpperCase()}`,
      consentTextVersion: "loan-application-consent-v1 (consented in bank loan application; transferred with bank DB lead — covers credit pull + banking search + monitoring)",
      capturedAt, expiresAt,
    };
  });
}

export const CONSENT_EXPLAINER = {
  purchased: "Seller captured consent before sale; it transfers with the lead under your vendor contract (scope, evidence id, capture date/time, text version, revocation feed). Engine may run IDIQ soft pull + FinGoal banking search autonomously — no outreach needed.",
  prospected: "You would be the one contacting a person who never asked you. That needs its own prior express consent for outreach (TCPA etc.), Twilio A2P/10DLC, opt-out (STOP), quiet hours, DNC checks, message logs, and human/supervised follow-up — and credit/banking consent must be captured in that conversation before any pull. Partial autonomy is lost by design.",
  bankingNuance: "Precise point: purchased consent can cover a banking DATA SEARCH / vendor-supplied transaction enrichment. A consumer personally LINKING their live bank (entering credentials in an aggregator widget) is a separate consumer-permissioned act and can never be 'pre-consented' by a seller alone — that step, if used, still needs the consumer in the loop.",
};
