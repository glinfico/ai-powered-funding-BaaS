// Membership rules shown as the first step of each Private Portal (PPG).
// Bump RULES_VERSION when the wording changes materially — members re-accept.
export const RULES_VERSION = "2026-11";

export const PFE_URL = "https://fod.glinfico.com";

export type RuleLink = { label: string; href?: string; note?: string };
export type RuleSection = { heading: string; points: string[] };
export type Package = { name: string; code: string; price: string; leads: string; benefits: string[] };
export type RoleRules = {
  title: string;
  intro: string;
  sections: RuleSection[];
  packages?: Package[];
  links?: RuleLink[];
  placeholders?: { heading: string; text: string }[];
  acceptLabel: string;
  collectsApplication?: boolean;
};

export const RULES: Record<"borrower" | "broker" | "lender" | "investor", RoleRules> = {
  borrower: {
    title: "Borrower Membership Rules",
    intro:
      "A Borrower is an individual or a group of individuals who bring their own deal, or a partner's deal, to get it done fast and fully automated.",
    sections: [
      {
        heading: "Membership",
        points: [
          "Borrower membership is free.",
          "Borrowers do not earn any commission.",
          "For every deal you run through the platform, the commission is paid to the platform.",
        ],
      },
      {
        heading: "What happens when you accept",
        points: [
          "Your application is sent to the IDE (Identification Engine).",
          "The IDE creates your personal GLINFICO ID.",
          "Your application then follows the automated path: scoring, lender matching and term sheet by the ACE.",
        ],
      },
    ],
    acceptLabel: "I agree — send my application to the IDE and create my ID",
    collectsApplication: true,
  },
  broker: {
    title: "Broker Master Portal — Rules of Being a Broker",
    intro: "Brokers are paying members. Your package sets how many leads the LAE (Leads Assignment Engine) assigns to you.",
    sections: [
      {
        heading: "Account set-up",
        points: [
          "Your PayPal subscription payment triggers the LAE to set up your Broker account.",
          "Your Broker ID carries your package tier: S (Silver), G (Gold), P (Platinum) or E (Emerald).",
        ],
      },
      {
        heading: "Commission",
        points: [
          "You earn 100% of the commission on every deal assigned to you by the LAE.",
          "You earn 100% of the commission on every deal you bring to the platform yourself.",
          "Any deal that existed before you signed up as a Broker remains 100% platform revenue.",
        ],
      },
    ],
    packages: [
      {
        name: "SILVER", code: "S-XXXXX", price: "$999/month", leads: "25 leads/month",
        benefits: ["Basic CRM access", "MCA deal submissions", "Standard lender matching", "Email support"],
      },
      {
        name: "GOLD", code: "G-XXXXX", price: "$1,499/month", leads: "100 leads/month",
        benefits: ["MCA + CRE/REI access", "Advanced CRM tools", "Priority lender routing", "AI scoring & matching", "Pipeline dashboard"],
      },
      {
        name: "PLATINUM", code: "P-XXXXX", price: "$2,999/month", leads: "500 leads/month",
        benefits: ["Full Multi-Vertical Access", "Advanced commission tracking", "Dedicated broker support", "Custom ad placements (5/mo)", "API & webhook access"],
      },
      {
        name: "EMEROD", code: "E-XXXXX", price: "$7,999/month", leads: "1,000 leads/month",
        benefits: ["White-label portal setup", "Custom domain & branding", "Dedicated account manager", "Unlimited ad placements", "Custom integrations & SLA", "Direct lender syndicate access"],
      },
    ],
    links: [{ label: "Choose a package & subscribe (PayPal)", href: `${PFE_URL}/fod/pricing` }],
    acceptLabel: "I agree to the Broker rules",
  },
  lender: {
    title: "Lender Rules",
    intro: "The rules are simple: the ACE (Automated Closing Engine) brings you underwritten, matched deals and expects a decision within 24 hours.",
    sections: [
      {
        heading: "How deals reach you",
        points: [
          "The ACE takes the scored leads from the IDE and underwrites them.",
          "The ACE matches each deal with Lenders according to their guidelines (your buy box).",
          "The ACE writes a term sheet, sends it to the matched Lender for approval, and sends it to the client.",
        ],
      },
      {
        heading: "24-hour rule",
        points: [
          "The whole cycle must be completed within 24 hours.",
          "If the Lender does not respond within 24 hours, the ACE assigns the deal to the next matched Lender.",
        ],
      },
    ],
    placeholders: [
      { heading: "Partners", text: "Partner listings will appear here." },
      { heading: "Sponsors", text: "Sponsor placements will appear here." },
    ],
    acceptLabel: "I agree to the Lender rules and the 24-hour response time",
  },
  investor: {
    title: "Investor Rules",
    intro: "Investors participate in syndicated deals and in the secondary market for buying and selling loan packages.",
    sections: [
      {
        heading: "Where you invest",
        points: [
          "Syndicated deals: commit to tranches of funded deals that match your ticket size.",
          "Secondary market: buy and sell loan packages with other members.",
        ],
      },
    ],
    links: [
      { label: "Syndicated Deals — Institutional Investor Syndicate Portal", href: `${PFE_URL}/portal/investor` },
      { label: "Secondary Market — buy & sell loan packages", note: "Coming soon" },
    ],
    acceptLabel: "I agree to the Investor rules",
  },
};

export function rulesFor(role: string): { key: keyof typeof RULES; rules: RoleRules } | null {
  const key = (role === "user" ? "broker" : role) as keyof typeof RULES;
  return RULES[key] ? { key, rules: RULES[key] } : null;
}
