export const EXPORT_COLUMNS = [
  "Lead ID", "First Name", "Last Name", "Email", "Phone", "Company", "Job Title", "City", "Country", "Address", "DOB", "SSN (masked)", "IDIQ-ready (SSN+DOB)",
  "Lead Source", "Acquisition", "Origin System", "Vendor / Bank DB",
  "Loan Outcome", "Loan / Applied Amount ($)", "Application Date",
  "Pipeline Status", "Lead Score (0-100)", "Estimated Value ($)", "Batch",
  "IDIQ Identity", "IDIQ Identity Confidence", "IDIQ Ref",
  "Soft Pull Status", "Credit Score", "Credit Band",
  "Monitoring", "Monitoring Alerts",
  "FinGoal Banking", "Bank Accounts", "Monthly Income ($)", "Monthly Spend ($)", "Cashflow Score",
  "Final Score (0-100)", "Scored", "Routed to IDE", "IDE Ref",
  "Credit Consent", "Banking Consent", "Monitoring Consent", "Consent Basis", "Consent Evidence", "Consent Captured",
  "Created At",
] as const;

export function rowToExport(r: any): (string | number)[] {
  const l = r.leads, e = r.enrichments;
  return [
    l.id, l.firstName, l.lastName, l.email, l.phone, l.company, l.jobTitle, l.city, l.country,
    l.address || "", fmtDate(l.dob), l.ssn ? `***-**-${l.ssn.replace(/\D/g, "").slice(-4)}` : "", (l.ssn && l.dob && l.firstName && l.lastName) ? "YES" : "NO — missing " + [l.ssn ? null : "SSN", l.dob ? null : "DOB"].filter(Boolean).join("+"),
    l.source, l.acquisitionType, l.originSystem || "Bank DB — Loan Application", l.vendorName,
    l.loanOutcome || "Funded", l.loanAmount || 0, fmtDate(l.applicationDate),
    l.status, l.score, l.estimatedValue, l.batchLabel,
    e?.identityStatus || "—", e?.identityConfidence || "", e?.idiqRef || "",
    e?.softPullStatus || "—", e?.creditScore || "", e?.creditBand || "",
    e?.monitoringStatus || "—", e?.monitoringAlerts ?? "",
    e?.fingoalStatus || "—", e?.bankAccounts ?? "", e?.monthlyIncome ?? "", e?.monthlySpend ?? "", e?.cashflowScore ?? "",
    e?.finalScore ?? l.score, e?.scoredStatus || "—", e?.routedToIde || "—", e?.ideRef || "",
    r.creditConsent || "—", r.bankingConsent || "—", r.monitoringConsent || "—",
    r.consentBasis || "—", r.consentEvidence || "—", fmtDate(r.consentCaptured),
    fmtDate(l.createdAt),
  ];
}

function fmtDate(d: any) {
  if (!d) return "";
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? "" : dt.toISOString().slice(0, 10);
}

export function csvEscape(v: string | number): string {
  const s = String(v ?? "");
  // Guard against spreadsheet formula injection, but never mangle phone numbers (+1 …)
  const looksLikePhone = /^\+?[\d\s().-]+$/.test(s);
  const safe = !looksLikePhone && /^[=@]|^[+-](?![0-9])/.test(s) && typeof v === "string" ? `'${s}` : s;
  return /[",\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe;
}

export function toCsv(rows: (string | number)[][]): string {
  // BOM so Excel opens UTF-8 (accents in names/cities) correctly
  return "\uFEFF" + [EXPORT_COLUMNS.join(","), ...rows.map(r => r.map(csvEscape).join(","))].join("\r\n");
}

export function scopeLabel(scope: string, include?: string, outcome?: string) {
  const parts = ["Bank DB Leads", scope === "page" ? "Current Page" : scope === "filtered" ? "Filtered" : "All"];
  if (include === "ide") parts.push("IDE Payload");
  if (outcome && outcome !== "all") parts.push(outcome);
  return parts.join(" · ");
}
