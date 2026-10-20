/**
 * REI Underwriting, MCA Scoring, and Lender Matching Engine
 */

// 1. MCA CASH FLOW & CREDIT RISK SCORING
export function calculateMCAScore({ monthlyRevenue = 0, averageDailyBalance = 0, timeInBusinessMonths = 0, creditScore = 650, positionCount = 1 }) {
  let score = 500;

  // Monthly Revenue Weighting (up to 200 pts)
  if (monthlyRevenue >= 100000) score += 200;
  else if (monthlyRevenue >= 50000) score += 150;
  else if (monthlyRevenue >= 25000) score += 100;
  else if (monthlyRevenue >= 10000) score += 50;

  // Average Daily Balance Weighting (up to 100 pts)
  if (averageDailyBalance >= 10000) score += 100;
  else if (averageDailyBalance >= 5000) score += 70;
  else if (averageDailyBalance >= 2000) score += 40;

  // Time in Business Weighting (up to 100 pts)
  if (timeInBusinessMonths >= 36) score += 100;
  else if (timeInBusinessMonths >= 24) score += 75;
  else if (timeInBusinessMonths >= 12) score += 50;

  // Personal Credit Score Weighting (up to 100 pts)
  if (creditScore >= 720) score += 100;
  else if (creditScore >= 680) score += 75;
  else if (creditScore >= 620) score += 50;

  // Deduction for existing debt positions
  score -= (positionCount - 1) * 35;

  const mcaTier = score >= 800 ? 'Prime' : score >= 680 ? 'Standard' : score >= 580 ? 'Subprime' : 'High Risk';
  
  return { mcaScore: Math.max(300, Math.min(850, score)), mcaTier };
}

// 2. REI UNDERWRITING CALCULATIONS
export function underwriteREIDeal({ purchasePrice = 0, rehabCost = 0, arv = 0, monthlyRent = 0, annualTaxes = 0, annualInsurance = 0, requestedLoanAmount = 0, mcaMetrics = {} }) {
  const totalCost = Number(purchasePrice) + Number(rehabCost);
  const loanAmount = requestedLoanAmount > 0 ? Number(requestedLoanAmount) : totalCost * 0.75;
  
  // LTV & LTC
  const ltv = arv > 0 ? (loanAmount / arv) * 100 : 0;
  const ltc = totalCost > 0 ? (loanAmount / totalCost) * 100 : 0;

  // Debt Service & DSCR (Assuming 8.5% interest rate, 30-yr amortization benchmark)
  const monthlyInterestRate = 0.085 / 12;
  const numPayments = 360;
  const monthlyPI = loanAmount > 0 
    ? (loanAmount * (monthlyInterestRate * Math.pow(1 + monthlyInterestRate, numPayments))) / (Math.pow(1 + monthlyInterestRate, numPayments) - 1)
    : 0;
  
  const monthlyPitai = monthlyPI + (Number(annualTaxes) / 12) + (Number(annualInsurance) / 12);
  const dscr = monthlyPitai > 0 ? Number(monthlyRent) / monthlyPitai : 0;

  // Blend with MCA Scoring
  const mcaRisk = calculateMCAScore(mcaMetrics);
  
  // Underwriting Pass/Fail Thresholds
  const isApproved = ltv <= 75 && ltc <= 85 && (dscr >= 1.2 || mcaRisk.mcaScore >= 650);

  return {
    loanAmount: Math.round(loanAmount),
    ltv: Number(ltv.toFixed(1)),
    ltc: Number(ltc.toFixed(1)),
    dscr: Number(dscr.toFixed(2)),
    monthlyPayment: Math.round(monthlyPitai),
    mcaRisk,
    isApproved,
    underwritingStatus: isApproved ? 'APPROVED_FOR_TERM_SHEET' : 'NEEDS_MANUAL_REVIEW'
  };
}

// 3. LENDER MATCHING ENGINE
export function matchLenders(underwritingResult) {
  const { ltv, dscr, mcaRisk } = underwritingResult;
  
  const matches = [];

  if (ltv <= 75 && dscr >= 1.25) {
    matches.push({ lenderName: 'Apex Institutional DSCR Capital', maxLtv: '75%', rateRange: '6.99% - 7.75%', speed: '10-14 Days' });
  }
  if (ltv <= 80) {
    matches.push({ lenderName: 'Bridge & Fix-Flip Express Lenders', maxLtv: '85% LTC / 75% ARV', rateRange: '9.50% - 11.25%', speed: '5-7 Days' });
  }
  if (mcaRisk.mcaScore >= 600) {
    matches.push({ lenderName: 'GLINFICO Hybrid MCA-REI Bridge Pool', maxLtv: '70%', rateRange: '10.99% - 12.99%', speed: '48 Hours' });
  }

  return matches;
}

// 4. REI TERM SHEET STRUCTURE (SUPABASE-READY)
export function generateREITermSheetPayload(dealData, underwritingResult, matchedLenders) {
  return {
    deal_id: dealData.id || `REI-${Date.now()}`,
    borrower_name: dealData.fullName || dealData.borrowerName,
    property_address: dealData.propertyAddress,
    loan_amount: underwritingResult.loanAmount,
    ltv: underwritingResult.ltv,
    ltc: underwritingResult.ltc,
    dscr: underwritingResult.dscr,
    estimated_monthly_payment: underwritingResult.monthlyPayment,
    mca_score: underwritingResult.mcaRisk.mcaScore,
    mca_tier: underwritingResult.mcaRisk.mcaTier,
    underwriting_status: underwritingResult.underwritingStatus,
    primary_lender_match: matchedLenders[0]?.lenderName || 'GLINFICO In-House Funding',
    term_sheet_type: 'REI_HYBRID_DEAL',
    created_at: new Date().toISOString()
  };
}
