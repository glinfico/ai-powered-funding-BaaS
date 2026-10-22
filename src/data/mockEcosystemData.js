// 2,002 Live Leads Generation Engine
export function generate1000Leads() {
  const industries = ["Retail", "Construction", "Logistics", "Healthcare", "E-Commerce", "Hospitality", "Manufacturing"];
  const states = ["CA", "NY", "TX", "FL", "IL", "PA", "OH", "GA", "NC", "MI"];
  const statuses = ["Underwriting", "Term Sheet Issued", "Matching Queued", "Vault Locked", "Funded"];
  const brokers = ["P-10001", "P-10002", "P-10003", "P-10004", "P-10005"];

  const leads = [];
  for (let i = 1; i <= 2002; i++) {
    const idNum = 80000 + i;
    leads.push({
      id: `BL-${idNum}`,
      businessName: `Enterprise Deal #${i} ${industries[i % industries.length]} Corp`,
      industry: industries[i % industries.length],
      state: states[i % states.length],
      requestedAmount: Math.floor(25000 + (i * 450) % 750000),
      creditScore: 620 + (i % 160),
      monthlyRevenue: Math.floor(45000 + (i * 1200) % 350000),
      status: statuses[i % statuses.length],
      assignedBroker: brokers[i % brokers.length]
    });
  }
  return leads;
}

export function generate22KLenders() {
  const tiers = ["Prime Tier 1", "Alternative A+", "Specialty Debt", "Subprime MCA"];
  const lenders = [];
  for (let i = 1; i <= 100; i++) {
    lenders.push({
      id: `LND-${10000 + i}`,
      name: `Institutional Capital Fund #${i}`,
      tier: tiers[i % tiers.length],
      maxAdvance: `$${(250000 + i * 50000).toLocaleString()}`,
      minFico: 580 + (i % 100),
      buyBoxMatch: `${99 - (i % 20)}%`
    });
  }
  return lenders;
}
