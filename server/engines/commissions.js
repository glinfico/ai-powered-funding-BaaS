/**
 * GLINFICO Commission Engine
 * Calculates and records commissions for all product types
 * Rates: MCA 5% | CRE/REI 3% | M&A 5% | ALS 2%
 */

export const COMMISSION_RATES = {
  MCA:  0.05,
  CRE:  0.03,
  REI:  0.03,
  MA:   0.05,
  ALS:  0.02,
};

export const PRODUCT_LABELS = {
  MCA: 'Merchant Cash Advance',
  CRE: 'Commercial Real Estate',
  REI: 'Real Estate Investment',
  MA:  'Business Acquisition (M&A)',
  ALS: 'Automated Loan Services',
};

export function calculateCommission(deal) {
  const { productType, fundedAmount, brokerId, dealId, funderId } = deal;

  const rate = COMMISSION_RATES[productType];
  if (rate === undefined) {
    throw new Error(`Unknown product type: ${productType}`);
  }

  const grossCommission = fundedAmount * rate;
  const brokerShare     = Math.round(grossCommission * 0.70);
  const platformShare   = Math.round(grossCommission * 0.30);

  return {
    dealId,
    brokerId,
    funderId,
    productType,
    productLabel: PRODUCT_LABELS[productType],
    fundedAmount,
    commissionRate: rate,
    grossCommission: Math.round(grossCommission),
    brokerShare,
    platformShare,
    status: 'pending_payout',
    payoutMethod: 'paypal',
    createdAt: new Date().toISOString(),
    payoutScheduledAt: getPayoutDate(),
  };
}

export const SUBSCRIPTION_PLANS = {
  basic: {
    id: 'basic',
    name: 'Basic',
    price: 199,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_BASIC || 'price_basic',
    features: [
      'Up to 10 deal submissions/month',
      'MCA deal access',
      'Basic reporting dashboard',
      'Email support',
    ],
    dealLimit: 10,
    productAccess: ['MCA'],
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 499,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
    features: [
      'Unlimited deal submissions',
      'MCA + CRE/REI access',
      'Advanced analytics',
      'Priority support',
      'Commission tracking',
    ],
    dealLimit: null,
    productAccess: ['MCA', 'CRE', 'REI'],
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 999,
    interval: 'month',
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    features: [
      'Everything in Pro',
      'M&A deal access',
      'ALS access',
      'White-label options',
      'Dedicated account manager',
      'API access',
    ],
    dealLimit: null,
    productAccess: ['MCA', 'CRE', 'REI', 'MA', 'ALS'],
  },
};

export function buildCommissionSummary(commissions) {
  const summary = {
    totalEarned: 0,
    totalPending: 0,
    totalPaid: 0,
    byProduct: {},
    recentPayouts: []
  };

  for (const c of commissions) {
    summary.totalEarned += c.brokerShare;
    if (c.status === 'pending_payout') summary.totalPending += c.brokerShare;
    if (c.status === 'paid') summary.totalPaid += c.brokerShare;

    if (!summary.byProduct[c.productType]) {
      summary.byProduct[c.productType] = { count: 0, total: 0 };
    }
    summary.byProduct[c.productType].count++;
    summary.byProduct[c.productType].total += c.brokerShare;
  }

  return summary;
}

function getPayoutDate() {
  const d = new Date();
  d.setDate(d.getDate() + 1);
  if (d.getDay() === 6) d.setDate(d.getDate() + 2);
  if (d.getDay() === 0) d.setDate(d.getDate() + 1);
  return d.toISOString();
}
