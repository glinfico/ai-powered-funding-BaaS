import crypto from "crypto";

export const FORM_VERSION = "glf-consent-v1";
const SECRET = process.env.CONSENT_SIGNING_SECRET || "dev-only-change-me";

export function makeToken(leadId: number): string {
  return crypto.createHmac("sha256", SECRET).update(`${leadId}:${FORM_VERSION}`).digest("hex");
}
export function hashToken(token: string): string {
  return crypto.createHash("sha256").update(token).digest("hex");
}
export function verifyToken(leadId: number, token: string): boolean {
  const a = makeToken(leadId);
  const b = String(token || "");
  return a.length === b.length && crypto.timingSafeEqual(Buffer.from(a), Buffer.from(b));
}

// The consent formulation. Every scope is explicit and separately accepted.
export const CONSENT_TEXT = {
  title: "GLINFICO — Consent & Authorization Form",
  version: FORM_VERSION,
  sections: [
    {
      id: "credit_pull",
      label: "Credit report access (soft pull)",
      text: "I authorize GLINFICO and its partner IdentityIQ (IDIQ) to obtain my consumer credit report and credit score (e.g. VantageScore/FICO) as a SOFT inquiry only. A soft pull does not affect my credit score and is not visible to other lenders.",
    },
    {
      id: "banking_search",
      label: "Banking & transaction data access",
      text: "I authorize GLINFICO and its partner FinGoal to access my bank account and transaction data (read-only) through my bank's secure connection to verify income, cash flow and affordability for financing. I may revoke this access at any time.",
    },
    {
      id: "monitoring",
      label: "Credit monitoring & rebuild — $9.95/month",
      text: "For a small fee of $9.95 per month, GLINFICO will monitor my credit 24/7 so that my credit is not abused by third parties (fraud alerts, new inquiries, dark-web exposure) and will provide guidance to rebuild and improve my credit so I can qualify for more loans in the future. I can cancel anytime; cancellation stops future monitoring.",
    },
    {
      id: "card_offer",
      label: "No-fee Corporate / Business spending card offer",
      text: "As part of this program I am offered a Corporate/Business spending card with NO annual fee, subject to approval. This offer is optional and does not affect my other consents.",
    },
    {
      id: "communications",
      label: "Automated communications (SMS & email)",
      text: "I consent to receive automated text messages and emails from GLINFICO at the phone number and email provided, including this consent request, status updates and offers. Message & data rates may apply. I can opt out at any time by replying STOP to any text or clicking unsubscribe in any email.",
    },
  ],
  legal: "By submitting this form electronically I agree this is my electronic signature (E-SIGN Act), I am 18+ and the person named above, and I have read each authorization. GLINFICO keeps a timestamped, IP-logged record of this consent. Questions: compliance@glinfico.example.",
  optOut: "Reply STOP to any text or unsubscribe from any email at any time to revoke communications consent.",
};

export function consentLinkUrl(leadId: number, base: string): string {
  return `${base}/consent/${makeToken(leadId)}?lid=${leadId}`;
}

export function consentSmsBody(lead: { firstName: string }, url: string): string {
  return `Hi ${lead.firstName}, GLINFICO here: to proceed with your financing we need your consent for a soft credit check, read-only bank data access, optional $9.95/mo credit monitoring, and a no-fee business card offer. Review & sign: ${url} — reply STOP to opt out.`;
}
export function consentEmailBody(lead: { firstName: string; lastName: string }, url: string): string {
  return `Subject: Your GLINFICO consent form is ready, ${lead.firstName}

Hi ${lead.firstName} ${lead.lastName},

To move your financing forward, please review and electronically sign your consent form. It covers, separately:
1) a SOFT credit pull via IDIQ (no impact on your score),
2) read-only access to your bank data via FinGoal to verify income/cash flow,
3) optional 24/7 credit monitoring + rebuild guidance for $9.95/month (guards against third-party abuse of your credit; cancel anytime),
4) an optional no-fee Corporate/Business spending card offer.

Sign here: ${url}

You can opt out of texts anytime with STOP. — GLINFICO Control Center`;
}

// Enqueue a consent request (link + SMS + email) for a lead. Used both by the
// /api/consent/send route and automatically when new leads are generated.
export async function enqueueConsentRequest(l: { id: number; firstName: string; email: string; phone: string }) {
  const { db } = await import("@/db");
  const { consentLinks, messages } = await import("@/db/schema");
  const { eq } = await import("drizzle-orm");
  const token = makeToken(l.id);
  const url = consentLinkUrl(l.id, process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000");
  const expires = new Date(Date.now() + 7 * 86400000);
  await db.insert(consentLinks).values({ leadId: l.id, tokenHash: hashToken(token), formVersion: FORM_VERSION, expiresAt: expires });

  const smsBody = consentSmsBody({ firstName: l.firstName }, url);
  const emailBody = consentEmailBody({ firstName: l.firstName, lastName: "" }, url);

  let smsStatus = "simulated", emailStatus = "simulated", smsRef = "", emailRef = "", err = "";
  try {
    const sid = process.env.TWILIO_ACCOUNT_SID, tk = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_PHONE_NUMBER;
    if (sid && tk && from) {
      const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
        method: "POST", headers: { Authorization: "Basic " + Buffer.from(`${sid}:${tk}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({ From: from, To: l.phone, Body: smsBody }),
      });
      const j: any = await r.json().catch(() => ({}));
      if (r.ok) { smsStatus = "sent"; smsRef = j.sid || ""; } else { smsStatus = "failed"; err = j.message || `HTTP ${r.status}`; }
    }
    const sg = process.env.SENDGRID_API_KEY;
    if (sg) {
      const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
        method: "POST", headers: { Authorization: `Bearer ${sg}`, "Content-Type": "application/json" },
        body: JSON.stringify({ personalizations: [{ to: [{ email: l.email }] }], from: { email: process.env.SENDGRID_FROM || "noreply@glinfico.example" }, subject: `Your GLINFICO consent form, ${l.firstName}`, content: [{ type: "text/plain", value: emailBody }] }),
      });
      if (r.ok) { emailStatus = "sent"; emailRef = r.headers.get("x-message-id") || "sendgrid"; } else { emailStatus = "failed"; err += ` email HTTP ${r.status}`; }
    }
  } catch (e: any) { err = e?.message || "send error"; }

  await db.insert(messages).values([
    { leadId: l.id, channel: "sms", template: "consent_request", body: smsBody, status: smsStatus, providerRef: smsRef, error: err, sentAt: smsStatus === "sent" ? new Date() : null },
    { leadId: l.id, channel: "email", template: "consent_request", body: emailBody, status: emailStatus, providerRef: emailRef, error: err, sentAt: emailStatus === "sent" ? new Date() : null },
  ]);
  return { leadId: l.id, link: `/consent/${token}?lid=${l.id}`, sms: smsStatus, email: emailStatus };
}

// Lender doc packet — everything EXCEPT ID documents, which stay with the
// human/IDV step by design.
export function renderLenderDocs(lead: any, e: any, deal: any) {
  const name = `${lead.firstName} ${lead.lastName}`;
  return [
    { doc: "01 Loan Application Summary", content: `LOAN APPLICATION SUMMARY (auto-generated)\nBorrower: ${name}\nBusiness: ${lead.company}\nEmail: ${lead.email} | Phone: ${lead.phone}\nLocation: ${lead.city}, ${lead.country}\nRequested product: ${deal?.product || "Term Loan"}\nRequested amount: $${Number(deal?.amount || lead.loanAmount || 0).toLocaleString()}\nPrior bank DB outcome: ${lead.loanOutcome} (${lead.loanAmount ? "$" + Number(lead.loanAmount).toLocaleString() : "n/a"})\nGenerated: ${new Date().toISOString()}` },
    { doc: "02 Consent & Authorization Evidence", content: `CONSENT EVIDENCE (auto-generated summary)\nLead #${lead.id} · form version ${FORM_VERSION}\nScopes and statuses are stored per lead in the consent ledger (evidence refs CONSENT-…).\nCredit pull: see ledger · Banking search: see ledger · Monitoring ($9.95/mo): see ledger · Card offer: see ledger · Communications: see ledger\nThis summary must be attached to the lender packet.` },
    { doc: "03 Credit & Banking Snapshot", content: `CREDIT & BANKING SNAPSHOT\nCredit score: ${e?.creditScore || "—"} (${e?.creditBand || "—"}, soft pull, model ${e?.creditModel || "—"})\nIdentity: ${e?.identityStatus || "—"} (${e?.identityConfidence || 0}%) · IDIQ ref ${e?.idiqRef || "—"}\nBanking: ${e?.fingoalStatus || "—"} · accounts ${e?.bankAccounts ?? "—"} · income ${e?.monthlyIncome ? "$" + Number(e.monthlyIncome).toLocaleString() + "/mo" : "—"} · cash-flow score ${e?.cashflowScore || "—"}\nFinal engine score: ${e?.finalScore ?? lead.score}/100` },
    { doc: "04 Term Sheet Draft (lender-facing)", content: `TERM SHEET DRAFT for ${deal?.title || "deal"} — ${deal?.product || "Term Loan"} $${Number(deal?.amount || 0).toLocaleString()}\nRate: ${deal?.ratePct ? (deal.ratePct / 100).toFixed(2) + "%/mo" : "TBD"} · Commission: ${deal?.commissionPct ? (deal.commissionPct / 100).toFixed(2) + "%" : "TBD"}\nConditions: personal guarantee, UCC-1, monthly reporting. Final terms set by lender underwriting.` },
    { doc: "05 ID DOCUMENTS — NOT AUTO-GENERATED", content: "By design, ID documents are NEVER produced by the system. Identity verification runs through IDIQ IDV or a human review step. This placeholder is included so lenders know the packet is incomplete until IDV/human step completes." },
  ];
}
