// src/lib/portal-rules.ts — PPG rules text per entity type (public-safe).
export const PORTAL_RULES: Record<string, { title: string; blurb: string; points: string[]; cta: string }> = {
  borrower: {
    title: "Borrower PPG — Rules",
    blurb: "Membership is free. You bring your own (or your partners') deal to get it done fast and automated.",
    points: [
      "You are an individual or a group of individuals bringing your own or your partners' deal in to get it done fast and automated.",
      "Membership is free — you do not pay to be here.",
      "You do not make any commission on your deal.",
      "For any deal you run through the platform, the commission is paid to the platform.",
      "If you agree with these rules, click Agree — your application goes to the IDE (Identification Engine) and creates your ID.",
    ],
    cta: "I agree — send my application to IDE and create my ID",
  },
  broker: {
    title: "Broker PPG — Master Rules",
    blurb: "The master Portal lays down the rules of being a Broker on the platform. Assigned leads scale with your package value.",
    points: [
      "Lead assignment is correlated to the value of your package: SILVER-25 / GOLD-100 / PLATINUM-500 / EMEROD-1000 (benefits per the Pricing page; codes S/G/P/E).",
      "Payment at PayPal triggers the LAE (Leads Assignment Engine) to set you up with an account and your broker code.",
      "You make 100% commission on any deal assigned to you or that you bring in.",
      "Any deal that existed before you signed in as a Broker is 100% platform revenue.",
    ],
    cta: "I agree to the Broker rules",
  },
  lender: {
    title: "Lender PPG — Rules",
    blurb: "ACE runs the flow end-to-end inside a 24h SLA.",
    points: [
      "ACE (Automated Closing Engine) takes the scored leads from the IDE, underwrites them, and matches them with Lenders according to your guidelines.",
      "ACE writes the term sheet, sends it to the matched Lender for approval, and sends it to the client — all within 24 hours.",
      "If the Lender does not respond within 24 hours, ACE assigns the deal to the next Lender.",
      "Partners & Sponsors: [placeholder — list partners and sponsors here]",
    ],
    cta: "I agree to the Lender rules",
  },
  investor: {
    title: "Investor PPG — Rules",
    blurb: "Syndicated deals and the secondary market for loan packages.",
    points: [
      "Syndicated deals page: [existing page — link here].",
      "Secondary market: buy and sell loan packages with other investors.",
    ],
    cta: "I agree to the Investor rules",
  },
};
export const PORTAL_NAMES: Record<string, string> = {
  borrower: "Borrower", broker: "Broker", lender: "Lender", investor: "Investor",
};
