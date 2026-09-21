import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __dirname = dirname(fileURLToPath(import.meta.url));

const app = express();

app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PATCH, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type, Authorization');
  if (req.method === 'OPTIONS') return res.sendStatus(200);
  next();
});

app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_KEY || ''
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

const RESTRICTED_INDUSTRIES = ['cannabis','marijuana','adult','gambling','crypto','cryptocurrency','firearms','tobacco'];

function calculateMCAScore(idiqData, finGoalData) {
  const breakdown = {};
  let totalScore = 0;

  const avgDeposits = finGoalData.avgMonthlyDeposits || 0;
  let depositScore = 0;
  if (avgDeposits >= 100000) depositScore = 25;
  else if (avgDeposits >= 50000) depositScore = 20;
  else if (avgDeposits >= 25000) depositScore = 14;
  else if (avgDeposits >= 10000) depositScore = 8;
  else if (avgDeposits >= 5000) depositScore = 3;
  breakdown.avgDeposits = { score: depositScore, max: 25, value: avgDeposits };
  totalScore += depositScore;

  const trend = finGoalData.depositTrend || 'stable';
  const trendScore = trend === 'growing' ? 10 : trend === 'stable' ? 6 : 1;
  breakdown.depositTrend = { score: trendScore, max: 10, value: trend };
  totalScore += trendScore;

  const avgEndingBalance = finGoalData.avgEndingBalance || 0;
  const balanceRatio = avgDeposits > 0 ? avgEndingBalance / avgDeposits : 0;
  let balanceScore = 0;
  if (balanceRatio >= 0.30) balanceScore = 10;
  else if (balanceRatio >= 0.20) balanceScore = 8;
  else if (balanceRatio >= 0.10) balanceScore = 5;
  else if (balanceRatio >= 0.05) balanceScore = 2;
  breakdown.balanceHealth = { score: balanceScore, max: 10, value: balanceRatio };
  totalScore += balanceScore;

  const nsfCount = finGoalData.nsfCount || 0;
  const negativeDays = finGoalData.negativeDays || 0;
  const nsfRisk = nsfCount + negativeDays;
  let nsfScore = 0;
  if (nsfRisk === 0) nsfScore = 15;
  else if (nsfRisk <= 2) nsfScore = 11;
  else if (nsfRisk <= 5) nsfScore = 7;
  else if (nsfRisk <= 10) nsfScore = 3;
  breakdown.nsfRisk = { score: nsfScore, max: 15, value: nsfRisk };
  totalScore += nsfScore;

  const detectedDailyACH = finGoalData.detectedDailyACH || 0;
  const dailyDepositAvg = avgDeposits / 21;
  const loadRatio = dailyDepositAvg > 0 ? detectedDailyACH / dailyDepositAvg : 1;
  let loadScore = 0;
  if (loadRatio === 0) loadScore = 20;
  else if (loadRatio < 0.10) loadScore = 17;
  else if (loadRatio < 0.20) loadScore = 12;
  else if (loadRatio < 0.30) loadScore = 6;
  else if (loadRatio < 0.40) loadScore = 2;
  breakdown.existingLoad = { score: loadScore, max: 20, value: loadRatio };
  totalScore += loadScore;

  const monthsInBusiness = idiqData.businessAgeMonths || 0;
  let timeScore = 0;
  if (monthsInBusiness >= 36) timeScore = 10;
  else if (monthsInBusiness >= 24) timeScore = 8;
  else if (monthsInBusiness >= 12) timeScore = 5;
  else if (monthsInBusiness >= 6) timeScore = 2;
  breakdown.timeInBusiness = { score: timeScore, max: 10, value: monthsInBusiness };
  totalScore += timeScore;

  const creditScore = idiqData.ownerCreditScore || 0;
  let creditPts = 0;
  if (creditScore >= 700) creditPts = 5;
  else if (creditScore >= 650) creditPts = 4;
  else if (creditScore >= 600) creditPts = 3;
  else if (creditScore >= 550) creditPts = 2;
  else if (creditScore >= 500) creditPts = 1;
  breakdown.ownerCredit = { score: creditPts, max: 5, value: creditScore };
  totalScore += creditPts;

  const industry = (idiqData.industry || '').toLowerCase();
  const isRestricted = RESTRICTED_INDUSTRIES.some(r => industry.includes(r));
  const industryScore = isRestricted ? 0 : 5;
  breakdown.industryRisk = { score: industryScore, max: 5, value: industry };
  totalScore += industryScore;

  let tier, action, label;
  if (totalScore >= 80) { tier = 'A'; action = 'auto_route'; label = 'A-Paper — Lender Ready'; }
  else if (totalScore >= 65) { tier = 'B'; action = 'route_with_review'; label = 'B-Paper — Near Ready'; }
  else if (totalScore >= 50) { tier = 'C'; action = 'limited_funders'; label = 'C-Paper — Limited Options'; }
  else if (totalScore >= 35) { tier = 'D'; action = 'high_risk_only'; label = 'High Risk — Restricted'; }
  else { tier = 'F'; action = 'decline'; label = 'Decline'; }

  return { score: Math.min(100, Math.round(totalScore)), tier, action, label, breakdown, isRestricted, timestamp: new Date().toISOString() };
}

function calculateMCAOffer(finGoalData, tier) {
  const avgDeposits = finGoalData.avgMonthlyDeposits || 0;
  const detectedDailyACH = finGoalData.detectedDailyACH || 0;
  if (tier === 'F') return { eligible: false, reason: 'Application does not meet minimum criteria.' };
  const multiples = { A: 1.75, B: 1.50, C: 1.25, D: 1.00 };
  const haircuts = { A: 1.00, B: 0.85, C: 0.75, D: 0.65 };
  const grossEligible = avgDeposits * (multiples[tier] || 1);
  const existingLoad = detectedDailyACH * 20;
  const netEligible = Math.max(0, grossEligible - existingLoad);
  const rawAdvance = netEligible * (haircuts[tier] || 0.65);
  const recommendedAdvance = Math.min(500000, Math.max(5000, Math.round(rawAdvance / 1000) * 1000));
  const factorRates = { A: { min: 1.18, max: 1.28 }, B: { min: 1.29, max: 1.38 }, C: { min: 1.39, max: 1.49 }, D: { min: 1.50, max: 1.55 } };
  const rates = factorRates[tier] || factorRates.D;
  const assignedRate = parseFloat(((rates.min + rates.max) / 2).toFixed(2));
  const paybackAmount = Math.round(recommendedAdvance * assignedRate);
  const dailyPayment = Math.round(paybackAmount / 60);
  return { eligible: true, recommendedAdvance, assignedRate, paybackAmount, dailyPayment, estimatedTermDays: 60, commissionAmount: Math.round(recommendedAdvance * 0.05), commissionRate: 0.05 };
}

function detectStacking(finGoalData) {
  const detectedDailyACH = finGoalData.detectedDailyACH || 0;
  const avgDailyDeposit = (finGoalData.avgMonthlyDeposits || 0) / 21;
  const loadRatio = avgDailyDeposit > 0 ? detectedDailyACH / avgDailyDeposit : 0;
  const flags = [];
  let stackingRisk = 'LOW';
  let recommendation = 'Proceed normally.';
  if (detectedDailyACH > 0) flags.push('Detected existing daily ACH: $' + detectedDailyACH + '/day');
  if (loadRatio > 0.35) { stackingRisk = 'HIGH'; recommendation = 'Require payoff of existing positions OR reduce advance.'; }
  else if (loadRatio > 0.20) { stackingRisk = 'MODERATE'; recommendation = 'Approve with payoff condition or reduce advance.'; }
  return { stackingRisk, recommendation, flags, detectedPositions: detectedDailyACH > 0 ? 1 : 0 };
}

const FUNDER_NETWORK = [
  { id: 'funder_001', name: 'Rapid Capital Group', minDealSize: 10000, maxDealSize: 500000, acceptedTiers: ['A','B'], minCreditScore: 550, preferredIndustries: ['restaurant','retail','service','construction','hvac','plumbing'], restrictedIndustries: ['cannabis','adult','gambling'], baseFactorRate: 1.28, avgDecisionHours: 4, approvalRate: 0.72, active: true, notes: 'Fast decisioner, strong in service businesses' },
  { id: 'funder_002', name: 'Merchant Growth Fund', minDealSize: 5000, maxDealSize: 250000, acceptedTiers: ['A','B','C'], minCreditScore: 500, preferredIndustries: ['auto','medical','dental','legal','retail'], restrictedIndustries: ['cannabis','gambling'], baseFactorRate: 1.35, avgDecisionHours: 6, approvalRate: 0.65, active: true, notes: 'Accepts 1 existing MCA; broader credit tolerance' },
  { id: 'funder_003', name: 'National Advance Partners', minDealSize: 25000, maxDealSize: 1000000, acceptedTiers: ['A'], minCreditScore: 620, preferredIndustries: ['construction','manufacturing','wholesale','logistics'], restrictedIndustries: ['cannabis','adult','gambling','crypto'], baseFactorRate: 1.22, avgDecisionHours: 8, approvalRate: 0.80, active: true, notes: 'Best rates for A-paper; large deal specialist' },
  { id: 'funder_004', name: 'Horizon Business Finance', minDealSize: 5000, maxDealSize: 150000, acceptedTiers: ['B','C','D'], minCreditScore: 480, preferredIndustries: [], restrictedIndustries: ['cannabis','adult','gambling'], baseFactorRate: 1.45, avgDecisionHours: 12, approvalRate: 0.58, active: true, notes: 'High-risk specialist; lower credit floor' },
  { id: 'funder_005', name: 'Sunbelt Funding Corp', minDealSize: 10000, maxDealSize: 300000, acceptedTiers: ['A','B','C'], minCreditScore: 520, preferredIndustries: ['restaurant','hospitality','retail','beauty','fitness'], restrictedIndustries: ['cannabis','gambling','firearms'], baseFactorRate: 1.32, avgDecisionHours: 6, approvalRate: 0.68, active: true, notes: 'Southeast market specialist' },
  { id: 'funder_006', name: 'First Advance Capital', minDealSize: 15000, maxDealSize: 400000, acceptedTiers: ['A','B'], minCreditScore: 580, preferredIndustries: ['medical','dental','veterinary','pharmacy','healthcare'], restrictedIndustries: ['cannabis','adult','gambling','crypto'], baseFactorRate: 1.25, avgDecisionHours: 5, approvalRate: 0.75, active: true, notes: 'Healthcare specialist' }
];

function matchFunders(application) {
  const { amount, tier, creditScore, industry = '' } = application;
  const industryLower = industry.toLowerCase();
  const eligible = [];
  const eliminated = [];
  for (const funder of FUNDER_NETWORK) {
    if (!funder.active) continue;
    const failReasons = [];
    if (amount < funder.minDealSize) failReasons.push('Below min $' + funder.minDealSize);
    if (amount > funder.maxDealSize) failReasons.push('Exceeds max $' + funder.maxDealSize);
    if (!funder.acceptedTiers.includes(tier)) failReasons.push('Tier ' + tier + ' not accepted');
    if (creditScore < funder.minCreditScore) failReasons.push('Credit too low');
    if (funder.restrictedIndustries.some(r => industryLower.includes(r))) failReasons.push('Industry restricted');
    if (failReasons.length > 0) { eliminated.push({ funder: funder.name, reasons: failReasons }); continue; }
    let fitScore = 0;
    const sweetSpot = (funder.minDealSize + funder.maxDealSize) / 2;
    fitScore += (1 - Math.min(1, Math.abs(amount - sweetSpot) / sweetSpot)) * 25;
    if (funder.preferredIndustries.some(i => industryLower.includes(i))) fitScore += 20;
    else if (funder.preferredIndustries.length === 0) fitScore += 10;
    const tierIndex = funder.acceptedTiers.indexOf(tier);
    fitScore += tierIndex === 0 ? 20 : tierIndex === 1 ? 14 : 8;
    fitScore += Math.max(0, 20 - (funder.avgDecisionHours / 24) * 20);
    fitScore += (funder.approvalRate || 0.5) * 15;
    eligible.push({ funderId: funder.id, funderName: funder.name, fitScore: Math.round(fitScore), factorRate: funder.baseFactorRate, avgDecisionHours: funder.avgDecisionHours, approvalRate: funder.approvalRate, notes: funder.notes, decisionLabel: funder.avgDecisionHours <= 4 ? 'Same Day' : funder.avgDecisionHours <= 8 ? 'Within 8 Hours' : 'Next Day' });
  }
  const ranked = eligible.sort((a, b) => b.fitScore - a.fitScore).slice(0, 5).map((f, i) => ({ ...f, rank: i + 1 }));
  return { matched: ranked, eliminated, totalFundersEvaluated: FUNDER_NETWORK.length, totalMatched: ranked.length };
}

const COMMISSION_RATES = { MCA: 0.05, CRE: 0.03, REI: 0.03, MA: 0.05, ALS: 0.02 };
const PRODUCT_LABELS = { MCA: 'Merchant Cash Advance', CRE: 'Commercial Real Estate', REI: 'Real Estate Investment', MA: 'Business Acquisition (M&A)', ALS: 'Automated Loan Services' };

function calculateCommission(deal) {
  const { productType, fundedAmount, brokerId, dealId, funderId } = deal;
  const rate = COMMISSION_RATES[productType];
  if (!rate) throw new Error('Unknown product type: ' + productType);
  const grossCommission = fundedAmount * rate;
  return { dealId, brokerId, funderId, productType, productLabel: PRODUCT_LABELS[productType], fundedAmount, commissionRate: rate, grossCommission: Math.round(grossCommission), brokerShare: Math.round(grossCommission * 0.70), platformShare: Math.round(grossCommission * 0.30), status: 'pending_payout', payoutMethod: 'paypal', createdAt: new Date().toISOString() };
}

const SUBSCRIPTION_PLANS = {
  starter: {
    id: 'starter',
    name: 'Starter',
    price: 299,
    stripePriceId: process.env.STRIPE_PRICE_STARTER || 'price_starter',
    dealLimit: 10,
    productAccess: ['MCA']
  },
  pro: {
    id: 'pro',
    name: 'Pro',
    price: 499,
    stripePriceId: process.env.STRIPE_PRICE_PRO || 'price_pro',
    dealLimit: null,
    productAccess: ['MCA','CRE','REI']
  },
  business: {
    id: 'business',
    name: 'Business',
    price: 999,
    stripePriceId: process.env.STRIPE_PRICE_BUSINESS || 'price_business',
    dealLimit: null,
    productAccess: ['MCA','CRE','REI','MA','ALS']
  },
  enterprise: {
    id: 'enterprise',
    name: 'Enterprise',
    price: 0,
    stripePriceId: process.env.STRIPE_PRICE_ENTERPRISE || 'price_enterprise',
    dealLimit: null,
    productAccess: ['MCA','CRE','REI','MA','ALS'],
    notes: 'Contact us for pricing'
  }
};

app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'GLINFICO', version: '1.0.0' });
});
app.get('/admin', (req, res) => {
  try {
    const html = readFileSync(join(__dirname, 'admin.html'), 'utf8');
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  } catch(e) {
    res.status(404).send('Admin panel not found. Please upload admin.html to the server folder.');
  }
});
app.get('/admin', (req, res) => {
  res.setHeader('Content-Type', 'text/html');
  res.redirect('https://glinfico-admin.netlify.app');
});
app.post('/api/mca/score', async (req, res) => {
  try {
    const { applicationId, idiqData, finGoalData, merchantInfo } = req.body;
    if (!idiqData || !finGoalData) return res.status(400).json({ error: 'idiqData and finGoalData are required' });
    const scoreResult = calculateMCAScore(idiqData, finGoalData);
    const offerResult = scoreResult.tier !== 'F' ? calculateMCAOffer(finGoalData, scoreResult.tier) : { eligible: false, reason: 'Score too low.' };
    const stackingResult = detectStacking(finGoalData);
    let matchResult = null;
    if (offerResult.eligible) {
      matchResult = matchFunders({ id: applicationId, amount: offerResult.recommendedAdvance, tier: scoreResult.tier, creditScore: idiqData.ownerCreditScore || 0, industry: merchantInfo ? merchantInfo.industry || '' : '' });
    }
    await supabase.from('mca_applications').upsert({ id: applicationId, merchant_info: merchantInfo, idiq_data: idiqData, fingoal_data: finGoalData, mca_score: scoreResult.score, mca_tier: scoreResult.tier, score_breakdown: scoreResult.breakdown, recommended_advance: offerResult.eligible ? offerResult.recommendedAdvance : 0, factor_rate: offerResult.eligible ? offerResult.assignedRate : null, payback_amount: offerResult.eligible ? offerResult.paybackAmount : null, daily_payment: offerResult.eligible ? offerResult.dailyPayment : null, stacking_risk: stackingResult.stackingRisk, stacking_flags: stackingResult.flags, funder_matches: matchResult ? matchResult.matched : [], status: scoreResult.action, scored_at: new Date().toISOString() });
    return res.json({ success: true, applicationId, score: scoreResult, offer: offerResult, stacking: stackingResult, matches: matchResult });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ error: err.message });
  }
});

app.post('/api/mca/submit', async (req, res) => {
  try {
    const { brokerId, merchantInfo, requestedAmount } = req.body;
    const appId = 'MCA-' + Date.now() + '-' + Math.random().toString(36).substr(2,5).toUpperCase();
    const { data, error } = await supabase.from('mca_applications').insert({ id: appId, broker_id: brokerId, merchant_info: merchantInfo, requested_amount: requestedAmount, status: 'submitted', created_at: new Date().toISOString() }).select().single();
    if (error) throw error;
    return res.json({ success: true, applicationId: appId, application: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/mca/applications', async (req, res) => {
  try {
    const { brokerId, status, limit = 50 } = req.query;
    let query = supabase.from('mca_applications').select('*').limit(Number(limit));
    if (brokerId) query = query.eq('broker_id', brokerId);
    if (status) query = query.eq('status', status);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, applications: data, total: data.length });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.patch('/api/mca/applications/:id/fund', async (req, res) => {
  try {
    const { id } = req.params;
    const { fundedAmount, funderId, brokerId } = req.body;
    const commission = calculateCommission({ dealId: id, productType: 'MCA', fundedAmount, brokerId, funderId });
    await supabase.from('mca_applications').update({ status: 'funded', funded_amount: fundedAmount, funded_at: new Date().toISOString() }).eq('id', id);
    await supabase.from('commissions').insert(commission);
    return res.json({ success: true, commission });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/leads', async (req, res) => {
  try {
    const { status, assignedTo, limit = 100 } = req.query;
    let query = supabase.from('leads').select('*').limit(Number(limit));
    if (status) query = query.eq('status', status);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, leads: data, total: data.length });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase.from('leads').update({ ...req.body, updated_at: new Date().toISOString() }).eq('id', id).select().single();
    if (error) throw error;
    return res.json({ success: true, lead: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/subscriptions/plans', (req, res) => {
  res.json({ success: true, plans: SUBSCRIPTION_PLANS });
});

app.post('/api/subscriptions/create', async (req, res) => {
  try {
    const { brokerId, planId, brokerEmail } = req.body;
    const plan = SUBSCRIPTION_PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });
    const session = await stripe.checkout.sessions.create({ payment_method_types: ['card'], mode: 'subscription', customer_email: brokerEmail, line_items: [{ price: plan.stripePriceId, quantity: 1 }], metadata: { brokerId, planId }, success_url: (process.env.FRONTEND_URL || 'https://fod.glinfico.com') + '/dashboard?subscribed=true', cancel_url: (process.env.FRONTEND_URL || 'https://fod.glinfico.com') + '/pricing' });
    return res.json({ success: true, checkoutUrl: session.url });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

app.get('/api/commissions', async (req, res) => {
  try {
    const { brokerId } = req.query;
    let query = supabase.from('commissions').select('*');
    if (brokerId) query = query.eq('broker_id', brokerId);
    const { data, error } = await query.order('created_at', { ascending: false });
    if (error) throw error;
    return res.json({ success: true, commissions: data });
  } catch (err) { return res.status(500).json({ error: err.message }); }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log('GLINFICO API running on port ' + PORT));

export default app;
