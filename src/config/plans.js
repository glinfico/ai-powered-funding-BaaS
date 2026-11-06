/**
 * Broker subscription catalogue — single source of truth.
 *
 * Before this file the catalogue was hardcoded in three places:
 *   src/pages/fod/Pricing.jsx              (public pricing)
 *   src/pages/BrokerSubscription.jsx       (/broker/subscribe)
 *   src/pages/crm/BrokerSubscriptionCheckout.jsx  (/checkout)
 *
 * They drifted: the first two said Growth/Pro, the third said Gold/Platinum
 * for the same prices. Commit bfbb2b3 flagged this and warned against
 * silently mapping plan IDs. Importing from here makes drift impossible.
 *
 * Prices confirmed 6 Nov 2026:
 *   $999 / $1,499 / $2,999 / $7,999 per month.
 *
 * NAMING — flip this one constant to switch the whole app.
 *   'classic' -> Starter / Growth / Pro / Enterprise
 *   'metals'  -> Silver  / Gold   / Platinum / Emerald
 * Broker codes stay S / G / P / E either way, so existing codes and any
 * PayPal plan IDs keyed on the prefix remain valid under both schemes.
 */

export const NAMING = "classic"; // 'classic' | 'metals'

/**
 * BILLING SAFETY
 *
 * `paypalKey` is the suffix used to look up the PayPal plan:
 *   VITE_PAYPAL_PLAN_<paypalKey>_<MONTHLY|ANNUAL>
 *
 * It is deliberately separate from `id` and from the display name, because
 * the live checkout already resolves env vars keyed on STARTER / GOLD /
 * PLATINUM / ENTERPRISE. Renaming a tier must never change which PayPal
 * plan a broker is charged against. Change `paypalKey` only when the
 * corresponding PayPal plan and Netlify env var have both been created.
 */
export const PLANS = [
  {
    id: "starter",
    prefix: "S",
    paypalKey: "STARTER",
    classicName: "Starter",
    metalName: "Silver",
    monthly: 999,
    annual: 9990,
    tagline: "Perfect for independent brokers",
    blurb: "Perfect for new brokers and small operators entering the funding space.",
    features: [
      "25 leads/month",
      "Basic CRM access",
      "MCA deal submissions",
      "Standard lender matching",
      "Email support",
      "1 ad placement / month",
    ],
    adPosition: "Sidebar Banner",
    highlight: false,
  },
  {
    id: "growth",
    prefix: "G",
    paypalKey: "GOLD", // live PayPal plan is keyed GOLD - do not rename without creating a new plan
    classicName: "Growth",
    metalName: "Gold",
    monthly: 1499,
    annual: 14990,
    tagline: "For scaling broker operations",
    blurb: "Built for active brokers looking to scale deal flow and lender access.",
    features: [
      "100 leads/month",
      "MCA + CRE/REI access",
      "Advanced CRM tools",
      "Priority lender routing",
      "AI scoring & matching",
      "Commission tracking",
      "2 ad placements / month",
    ],
    adPosition: "Sidebar + In-Feed Banner",
    highlight: false,
  },
  {
    id: "professional",
    prefix: "P",
    paypalKey: "PLATINUM", // live PayPal plan is keyed PLATINUM
    classicName: "Pro",
    metalName: "Platinum",
    monthly: 2999,
    annual: 29990,
    tagline: "For growing broker teams",
    blurb: "The complete funding operating system for serious dealmakers.",
    features: [
      "Unlimited deals",
      "Advanced AI matching",
      "Full commission tracking",
      "Advanced analytics",
      "Bulk lead upload",
      "Priority support",
      "5 ad placements / month",
    ],
    adPosition: "Premium Placement",
    highlight: true,
  },
  {
    id: "enterprise",
    prefix: "E",
    paypalKey: "ENTERPRISE",
    classicName: "Enterprise",
    metalName: "Emerald",
    monthly: 7999,
    annual: 79990,
    tagline: "Full-service brokerage infrastructure",
    blurb: "For teams, institutions, and strategic funding operations.",
    features: [
      "Everything in Pro",
      "White-label portal",
      "Dedicated account manager",
      "API access",
      "Custom integrations",
      "SLA guarantee",
      "Unlimited ad placements",
    ],
    adPosition: "Unlimited",
    highlight: false,
  },
];

/** Display name under the active naming scheme. */
export function planName(plan) {
  return NAMING === "metals" ? plan.metalName : plan.classicName;
}

/** "$1,499" */
export function priceLabel(plan, cycle = "monthly") {
  const amount = cycle === "annual" ? plan.annual : plan.monthly;
  return `$${amount.toLocaleString("en-US")}`;
}

/** "S-XXXX" placeholder shown before a broker code is issued. */
export function codePlaceholder(plan) {
  return `${plan.prefix}-XXXX`;
}

export function getPlan(id) {
  return PLANS.find((p) => p.id === id) || PLANS[0];
}

/** Annual saving expressed in months, e.g. 2 on a 10-for-12 deal. */
export function monthsSaved(plan) {
  return Math.round((plan.monthly * 12 - plan.annual) / plan.monthly);
}

/**
 * Resolve the PayPal plan id for a tier + cycle.
 * Returns null when unconfigured so the caller can disable checkout rather
 * than silently falling back to a mock plan and taking a real payment
 * against the wrong product.
 */
export function paypalPlanId(plan, cycle = "monthly") {
  const key = `VITE_PAYPAL_PLAN_${plan.paypalKey}_${cycle.toUpperCase()}`;
  const value = import.meta.env?.[key];
  if (!value) {
    console.error(
      `[billing] Missing ${key}. Checkout disabled for ${planName(plan)} (${cycle}).`
    );
    return null;
  }
  return value;
}
