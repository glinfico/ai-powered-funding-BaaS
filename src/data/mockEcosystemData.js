const STATES = ["NY", "CA", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI", "NJ", "VA", "WA", "MA", "AZ"];
const ASSET_TYPES = ["MCA / Working Capital", "Commercial Real Estate (CRE)", "Equipment Financing", "M&A Debt", "Invoice Factoring"];
const LENDER_PREFIXES = ["Apex", "Titan", "Capital Direct", "Vanguard", "Horizon", "BlueRidge", "Sterling", "Summit", "Beacon", "Pinnacle", "Trident", "Omega"];
const LENDER_SUFFIXES = ["Funding Group", "Capital Partners", "Commercial Credit", "Financial Services", "Syndicate LLC", "Debt Fund", "Securities", "Holdings"];

export function generate22KLenders() {
  const lenders = [];
  for (let i = 1; i <= 22450; i++) {
    const state = STATES[i % STATES.length];
    const asset = ASSET_TYPES[i % ASSET_TYPES.length];
    const prefix = LENDER_PREFIXES[i % LENDER_PREFIXES.length];
    const suffix = LENDER_SUFFIXES[(i * 3) % LENDER_SUFFIXES.length];
    
    lenders.push({
      id: `L-${10000 + i}`,
      name: `${prefix} ${suffix} #${i}`,
      assetClass: asset,
      minCredit: 500 + (i % 250),
      maxDealSize: 50000 + (i * 1000) % 5000000,
      minMonthlyRevenue: 10000 + (i * 500) % 200000,
      preferredStates: [state, "Nationwide"],
      matchRate: (90 + (i % 10) * 0.9).toFixed(1) + "%",
      status: "Active Buy-Box"
    });
  }
  return lenders;
}

export function generate1000Leads() {
  const leads = [];
  const INDUSTRIES = ["Restaurant", "Construction", "E-Commerce", "Healthcare", "Logistics", "Retail", "Manufacturing", "Auto Repair", "Professional Services"];
  
  for (let i = 1; i <= 1000; i++) {
    const state = STATES[i % STATES.length];
    const industry = INDUSTRIES[i % INDUSTRIES.length];
    const amount = 25000 + (i * 475) % 975000;
    const credit = 520 + (i * 3) % 280;
    
    leads.push({
      id: `BL-${80000 + i}`,
      businessName: `${industry} Enterprise ${i} LLC`,
      email: `owner${i}@business${i}.com`,
      requestedAmount: amount,
      creditScore: credit,
      monthlyRevenue: Math.round(amount * 0.8),
      state: state,
      industry: industry,
      assignedBroker: `P-${10000 + (i % 50)}`,
      status: i % 3 === 0 ? "Underwriting" : i % 5 === 0 ? "Term Sheet Issued" : "Matching Queued"
    });
  }
  return leads;
}
