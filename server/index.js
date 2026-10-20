/**
 * GLINFICO FOD API Server v3.0
 * Clean rebuild — No Stripe, No Base44
 * Integrations: Supabase, PayPal, Twilio, Slack
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';

const app = express();

// ── Environment ───────────────────────────────────────────────────────────────
const SUPABASE_URL         = process.env.SUPABASE_URL;
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY;
const PAYPAL_CLIENT_ID     = process.env.PAYPAL_CLIENT_ID;
const PAYPAL_SECRET        = process.env.PAYPAL_SECRET;
const PAYPAL_MODE          = process.env.PAYPAL_MODE || 'sandbox'; // 'sandbox' or 'live'
const PAYPAL_BASE          = PAYPAL_MODE === 'live'
  ? 'https://api-m.paypal.com'
  : 'https://api-m.sandbox.paypal.com';
const TWILIO_SID           = process.env.TWILIO_ACCOUNT_SID;
const TWILIO_TOKEN         = process.env.TWILIO_AUTH_TOKEN;
const TWILIO_FROM          = process.env.TWILIO_FROM_NUMBER;
const SLACK_WEBHOOK        = process.env.SLACK_WEBHOOK_URL;
const FRONTEND_URL         = process.env.FRONTEND_URL || 'https://fod.glinfico.com';
const PORT                 = process.env.PORT || 3001;

// ── Supabase ──────────────────────────────────────────────────────────────────
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY);

// ── CORS ──────────────────────────────────────────────────────────────────────
app.use(cors({
  origin: [
    'https://fod.glinfico.com',
    'https://ai-poweredfundingplatform.netlify.app',
    'https://moonlit-beijinho-ae5509.netlify.app',
    'https://claude.ai',
    'http://localhost:3000',
    'http://localhost:5173',
  ],
  methods: ['GET','POST','PATCH','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));
app.options('*', cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ── Request Logger ────────────────────────────────────────────────────────────
app.use((req, _res, next) => {
  console.log(`${new Date().toISOString()} ${req.method} ${req.path}`);
  next();
});

// ── Commission Rates ──────────────────────────────────────────────────────────
const COMMISSION_RATES = {
  MCA:        0.05,
  REAL_ESTATE: 0.03,
  REI:        0.03,
  MA:         0.05,
  SERVICING:  0.02,
  ALS:        0.02,
};

// ── Subscription Plans ────────────────────────────────────────────────────────
const PLANS = {
  starter:    { id: 'starter',    name: 'Starter',    price: 299,  features: ['MCA'],                        paypalPlanId: process.env.PAYPAL_PLAN_STARTER    || '' },
  pro:        { id: 'pro',        name: 'Pro',        price: 499,  features: ['MCA','CRE','REI'],             paypalPlanId: process.env.PAYPAL_PLAN_PRO        || '' },
  business:   { id: 'business',   name: 'Business',   price: 999,  features: ['MCA','CRE','REI','MA','ALS'], paypalPlanId: process.env.PAYPAL_PLAN_BUSINESS   || '' },
  enterprise: { id: 'enterprise', name: 'Enterprise', price: 0,    features: ['ALL'],                        paypalPlanId: process.env.PAYPAL_PLAN_ENTERPRISE || '' },
};

// ═══════════════════════════════════════════════════════════════════════════════
// HELPERS
// ═══════════════════════════════════════════════════════════════════════════════

// PayPal access token
async function getPayPalToken() {
  const creds = Buffer.from(`${PAYPAL_CLIENT_ID}:${PAYPAL_SECRET}`).toString('base64');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

// Twilio SMS
async function sendSMS(to, body) {
  if (!TWILIO_SID || !TWILIO_TOKEN || !TWILIO_FROM) {
    console.log('Twilio not configured — skipping SMS');
    return;
  }
  const creds = Buffer.from(`${TWILIO_SID}:${TWILIO_TOKEN}`).toString('base64');
  await fetch(`https://api.twilio.com/2010-04-01/Accounts/${TWILIO_SID}/Messages.json`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${creds}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: new URLSearchParams({ From: TWILIO_FROM, To: to, Body: body }).toString(),
  });
}

// Slack alert
async function sendSlack(message) {
  if (!SLACK_WEBHOOK) return;
  await fetch(SLACK_WEBHOOK, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(
      typeof message === 'string'
        ? { text: message }
        : message
    ),
  });
}

// MCA Scoring engine
function scoreMCA(idiq, finGoal) {
  let score = 0;
  const amr = finGoal.avgMonthlyDeposits || 0;

  // Revenue (25pts)
  score += amr >= 100000 ? 25 : amr >= 50000 ? 20 : amr >= 25000 ? 14 : amr >= 10000 ? 8 : 3;
  // Deposit trend (10pts)
  score += finGoal.depositTrend === 'growing' ? 10 : finGoal.depositTrend === 'stable' ? 6 : 1;
  // NSF/negative days (15pts)
  const nsf = (finGoal.nsfCount || 0) + (finGoal.negativeDays || 0);
  score += nsf === 0 ? 15 : nsf <= 2 ? 11 : nsf <= 5 ? 7 : 3;
  // Credit score (5pts)
  const cs = idiq.ownerCreditScore || 0;
  score += cs >= 700 ? 5 : cs >= 650 ? 4 : cs >= 600 ? 3 : cs >= 550 ? 2 : cs >= 500 ? 1 : 0;
  // Time in business (10pts)
  const mo = idiq.businessAgeMonths || 0;
  score += mo >= 36 ? 10 : mo >= 24 ? 8 : mo >= 12 ? 5 : mo >= 6 ? 2 : 0;
  // ACH load (20pts)
  const daily = amr / 21;
  const ratio = daily > 0 ? (finGoal.detectedDailyACH || 0) / daily : 0;
  score += ratio === 0 ? 20 : ratio < 0.10 ? 17 : ratio < 0.20 ? 12 : ratio < 0.30 ? 6 : 2;
  // Balance health (10pts)
  const bal = amr > 0 ? (finGoal.avgEndingBalance || 0) / amr : 0;
  score += bal >= 0.30 ? 10 : bal >= 0.20 ? 8 : bal >= 0.10 ? 5 : 2;
  // Industry (5pts)
  const restricted = ['cannabis','adult','gambling','crypto'];
  score += restricted.some(r => (idiq.industry || '').toLowerCase().includes(r)) ? 0 : 5;

  const finalScore = Math.min(100, Math.round(score));
  const tier   = finalScore >= 80 ? 'A' : finalScore >= 65 ? 'B' : finalScore >= 50 ? 'C' : finalScore >= 35 ? 'D' : 'F';
  const action = finalScore >= 80 ? 'auto_route' : finalScore >= 65 ? 'route_with_review' : finalScore >= 50 ? 'limited_funders' : finalScore >= 35 ? 'high_risk_only' : 'decline';
  const label  = { A:'A-Paper — Lender Ready', B:'B-Paper — Near Ready', C:'C-Paper — Limited', D:'High Risk', F:'Decline' }[tier];
  return { score: finalScore, tier, action, label };
}

function calcOffer(finGoal, tier) {
  const amr  = finGoal.avgMonthlyDeposits || 0;
  const ach  = finGoal.detectedDailyACH || 0;
  const mult = { A:1.75, B:1.50, C:1.25, D:1.00 }[tier] || 1;
  const hair = { A:1.00, B:0.85, C:0.75, D:0.65 }[tier] || 0.65;
  const raw  = (amr * mult - ach * 20) * hair;
  const adv  = Math.min(500000, Math.max(5000, Math.round(raw / 1000) * 1000));
  const rate = { A:1.23, B:1.33, C:1.44, D:1.52 }[tier] || 1.35;
  const pay  = Math.round(adv * rate);
  return {
    eligible: tier !== 'F',
    recommendedAdvance: adv,
    assignedRate: rate,
    paybackAmount: pay,
    dailyPayment: Math.round(pay / 60),
    estimatedTermDays: 60,
    commissionAmount: Math.round(adv * 0.05),
  };
}

// ═══════════════════════════════════════════════════════════════════════════════
// HEALTH
// ═══════════════════════════════════════════════════════════════════════════════
const healthHandler = (_req, res) =>
  res.json({ status: 'ok', platform: 'GLINFICO', version: '3.0.0', ts: new Date().toISOString() });

app.get('/health',     healthHandler);
app.get('/api/health', healthHandler);
// ── Auth ──────────────────────────────────────────────────────────────────────
api.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) return res.status(400).json({ error: 'Email and password required' });

    // Authenticate via Supabase Auth
    const sbRes = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await sbRes.json();

    if (!sbRes.ok || data.error) {
      // Fallback hardcoded admin
      if (email === 'admin@glinfico.com' && password === 'Glinfico2024!') {
        return res.json({
          success: true,
          user: { email, name: 'GLINFICO Admin', role: 'admin' },
          access_token: 'admin-token',
        });
      }
      return res.status(401).json({ error: data.error_description || 'Invalid credentials' });
    }

    res.json({
      success: true,
      user: {
        id:    data.user?.id,
        email: data.user?.email,
        name:  data.user?.user_metadata?.full_name || data.user?.email,
        role:  data.user?.user_metadata?.role || 'admin',
      },
      access_token: data.access_token,
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});
// ── Auth ──────────────────────────────────────────────────────────────────────
api.post('/auth/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email || !password) 
      return res.status(400).json({ error: 'Email and password required' });

    // Try Supabase Auth first
    const sbRes = await fetch(
      `${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
      method: 'POST',
      headers: {
        'apikey': SUPABASE_SERVICE_KEY,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    const data = await sbRes.json();

    if (!sbRes.ok || data.error) {
      // Fallback: hardcoded admin
      if (email === 'admin@glinfico.com' && password === 'Glinfico2024!') {
        return res.json({
          success: true,
          user: { email, name: 'GLINFICO Admin', role: 'admin' },
          access_token: 'admin-token',
        });
      }
      return res.status(401).json({ 
        error: data.error_description || 'Invalid credentials' 
      });
    }

    res.json({
      success: true,
      user: {
        id:    data.user?.id,
        email: data.user?.email,
        name:  data.user?.user_metadata?.full_name || data.user?.email,
        role:  data.user?.user_metadata?.role || 'admin',
      },
      access_token: data.access_token,
    });
  } catch (e) { 
    res.status(500).json({ error: e.message }); 
  }
});
// ═══════════════════════════════════════════════════════════════════════════════
// API ROUTER
// ═══════════════════════════════════════════════════════════════════════════════
const api = express.Router();
app.use('/api',    api);
app.use('/api/v1', api);

// ── Deals ─────────────────────────────────────────────────────────────────────
api.get('/deals', async (req, res) => {
  try {
    const { status, vertical, limit = 100 } = req.query;
    let q = supabase.from('deals').select('*').order('created_at', { ascending: false }).limit(Number(limit));
    if (status)   q = q.eq('status', status);
    if (vertical) q = q.eq('vertical', vertical);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, deals: data, total: data.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/deals/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('deals').select('*').eq('id', req.params.id).single();
    if (error) throw error;
    res.json({ success: true, deal: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/deals/submit', async (req, res) => {
  try {
    const deal = {
      ...req.body,
      status: 'submitted',
      created_at: new Date().toISOString(),
    };
    const { data, error } = await supabase.from('deals').insert(deal).select().single();
    if (error) throw error;

    // Notify Slack
    await sendSlack(`🏦 New Deal Submitted: *${data.company_name}* — $${Number(data.requested_amount || 0).toLocaleString()} (${data.vertical || 'MCA'})`);

    // SMS if phone provided
    if (data.owner_phone) {
      await sendSMS(data.owner_phone,
        `GLINFICO: Thank you ${data.owner_name || ''}! Your funding application for ${data.company_name} has been received. We will contact you within 24 hours.`
      );
    }

    res.json({ success: true, dealId: data.id, deal: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/deals/bulk', async (req, res) => {
  try {
    const { records = [], source = 'api' } = req.body;
    const batchId = `batch-${Date.now()}`;
    const rows = records.map(r => ({
      vertical:               r.vertical || 'MCA',
      company_name:           r.company_name || r.business_name || 'Unknown',
      requested_amount:       Number(r.requested_amount || 0),
      owner_name:             r.owner_name || r.contact_name || null,
      owner_email:            r.owner_email || r.email || null,
      owner_phone:            r.owner_phone || r.phone || null,
      idiq_credit_score:      r.idiq_credit_score ? Number(r.idiq_credit_score) : null,
      fingoal_monthly_revenue: r.estimated_revenue ? Number(r.estimated_revenue) : null,
      status:                 'submitted',
      metadata:               { source, batch_id: batchId },
      created_at:             new Date().toISOString(),
    }));
    const { data, error } = await supabase.from('deals').insert(rows).select('id');
    if (error) throw error;
    await sendSlack(`📦 Bulk import: *${data.length} deals* ingested from ${source} (batch: ${batchId})`);
    res.json({ success: true, batchId, inserted: data.length, dealIds: data.map(d => d.id) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.patch('/deals/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('deals')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, deal: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// Fund a deal + calculate commission
api.patch('/deals/:id/fund', async (req, res) => {
  try {
    const { fundedAmount, brokerId } = req.body;
    const { data: deal } = await supabase.from('deals').select('*').eq('id', req.params.id).single();
    const rate       = COMMISSION_RATES[deal?.vertical || 'MCA'];
    const commission = Math.round(fundedAmount * rate);

    await supabase.from('deals').update({
      status: 'funded',
      funded_at: new Date().toISOString(),
      commission_amount: commission,
      commission_rate_pct: rate * 100,
      paypal_payout_status: 'pending',
    }).eq('id', req.params.id);

    await supabase.from('commissions').insert({
      deal_id:       req.params.id,
      broker_id:     brokerId || null,
      product_type:  deal?.vertical || 'MCA',
      funded_amount: fundedAmount,
      commission_rate: rate,
      gross_commission: commission,
      broker_share:  Math.round(commission * 0.7),
      platform_share: Math.round(commission * 0.3),
      status:        'pending_payout',
      created_at:    new Date().toISOString(),
    });

    await sendSlack(`✅ Deal FUNDED: *${deal?.company_name}* — $${fundedAmount.toLocaleString()} | Commission: $${commission.toLocaleString()}`);
    res.json({ success: true, commission, rate });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── MCA Engine ────────────────────────────────────────────────────────────────
api.post('/mca/score', async (req, res) => {
  try {
    const { applicationId, merchantInfo, idiqData, finGoalData } = req.body;
    if (!idiqData || !finGoalData) return res.status(400).json({ error: 'idiqData and finGoalData required' });

    const score   = scoreMCA(idiqData, finGoalData);
    const offer   = score.tier !== 'F' ? calcOffer(finGoalData, score.tier) : { eligible: false, reason: 'Score below minimum threshold' };

    // Fetch matched funders
    const { data: funders } = await supabase.from('funders')
      .select('id,name,base_factor_rate,avg_decision_hours,approval_rate,notes,accepted_tiers')
      .eq('active', true)
      .contains('accepted_tiers', [score.tier])
      .limit(10);

    const matches = {
      matched: (funders || []).map((f, i) => ({
        rank: i + 1,
        funderName: f.name,
        factorRate: f.base_factor_rate,
        decisionLabel: f.avg_decision_hours <= 4 ? 'Same Day' : f.avg_decision_hours <= 8 ? 'Within 8 Hours' : '24-48 Hours',
        approvalRate: f.approval_rate,
        notes: f.notes,
        fitScore: Math.round(90 - i * 8),
      })),
      totalMatched: funders?.length || 0,
      totalFundersEvaluated: funders?.length || 0,
    };

    // Save to deals table
    if (applicationId) {
      await supabase.from('deals').upsert({
        id:              applicationId,
        company_name:    merchantInfo?.legalName || 'Unknown',
        vertical:        'MCA',
        score:           score.score,
        requested_amount: offer.eligible ? offer.recommendedAdvance : (finGoalData.avgMonthlyDeposits * 1.5),
        ai_decision:     score.action,
        ai_summary:      score.label,
        status:          score.action,
        commission_amount: offer.commissionAmount || 0,
        commission_rate_pct: 5,
        metadata: {
          idiq: idiqData,
          fingoal: finGoalData,
          merchant: merchantInfo,
          scoreBreakdown: score,
          matched_lenders: matches.matched,
        },
        processed_at: new Date().toISOString(),
      });
    }

    res.json({ success: true, applicationId, score, offer, matches, stacking: {
      stackingRisk: (finGoalData.detectedDailyACH || 0) > (finGoalData.avgMonthlyDeposits / 21) * 0.3 ? 'HIGH' : (finGoalData.detectedDailyACH || 0) > 0 ? 'MODERATE' : 'LOW',
      recommendation: (finGoalData.detectedDailyACH || 0) === 0 ? 'Proceed normally.' : 'Verify existing positions before funding.',
    }});
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.get('/mca/applications', async (req, res) => {
  try {
    const { limit = 100 } = req.query;
    const { data, error } = await supabase.from('deals')
      .select('*').eq('vertical', 'MCA')
      .order('created_at', { ascending: false }).limit(Number(limit));
    if (error) throw error;
    res.json({ success: true, applications: data, total: data.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Leads ─────────────────────────────────────────────────────────────────────
api.get('/leads', async (req, res) => {
  try {
    const { status, limit = 2000 } = req.query;
    let q = supabase.from('leads').select('*').order('created_at', { ascending: false }).limit(Number(limit));
    if (status) q = q.eq('status', status);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, leads: data, total: data.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.patch('/leads/:id', async (req, res) => {
  try {
    const { data, error } = await supabase.from('leads')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, lead: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Funders / Lenders ─────────────────────────────────────────────────────────
api.get('/funders', async (req, res) => {
  try {
    const { data, error } = await supabase.from('funders').select('*').eq('active', true).order('name');
    if (error) throw error;
    res.json({ success: true, funders: data, total: data.length });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.put('/lenders/:id/buy-box', async (req, res) => {
  try {
    const { data, error } = await supabase.from('funders')
      .update({ buy_box: req.body.buyBox, updated_at: new Date().toISOString() })
      .eq('id', req.params.id).select().single();
    if (error) throw error;
    res.json({ success: true, lender: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Term Sheets ───────────────────────────────────────────────────────────────
api.get('/term-sheets', async (req, res) => {
  try {
    const { dealId } = req.query;
    let q = supabase.from('term_sheets').select('*').order('created_at', { ascending: false });
    if (dealId) q = q.eq('deal_id', dealId);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, termSheets: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Commissions ───────────────────────────────────────────────────────────────
api.get('/commissions', async (req, res) => {
  try {
    const { brokerId } = req.query;
    let q = supabase.from('commissions').select('*').order('created_at', { ascending: false });
    if (brokerId) q = q.eq('broker_id', brokerId);
    const { data, error } = await q;
    if (error) throw error;
    res.json({ success: true, commissions: data });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Dossier ───────────────────────────────────────────────────────────────────
api.get('/dossier/:token', async (req, res) => {
  try {
    const { token } = req.params;
    const { data: deals } = await supabase.from('deals').select('*').eq('id', token).limit(1);
    const deal = deals?.[0];
    if (!deal) return res.status(404).json({ error: 'Dossier not found or expired' });
    const amr   = deal.fingoal_monthly_revenue || 0;
    const offer = Math.round(amr * 1.5 / 1000) * 1000;
    res.json({
      version: '1.0', dealId: deal.id,
      generatedAt: new Date().toISOString(),
      expiresAt: new Date(Date.now() + 48 * 3600000).toISOString(),
      company: { name: deal.company_name, vertical: deal.vertical, requestedAmount: deal.requested_amount, ownerName: deal.owner_name, ownerEmail: deal.owner_email, ownerPhone: deal.owner_phone },
      underwriting: { score: deal.score, decision: deal.ai_decision, summary: deal.ai_summary, metrics: deal.metadata?.metrics || {}, scorecard: deal.metadata?.scorecard || {} },
      creditProfile: { creditScore: deal.idiq_credit_score, idiqStatus: deal.idiq_status },
      bankProfile: { monthlyRevenue: deal.fingoal_monthly_revenue, avgDailyBalance: deal.fingoal_avg_daily_balance },
      topTermSheet: { offer_amount: offer, factor_rate: 1.28, payback_amount: Math.round(offer * 1.28), daily_payment: Math.round(offer * 1.28 / 60) },
      matchedLenders: deal.metadata?.matched_lenders || [],
      commission: { rate: 0.05, estimatedAmount: Math.round(offer * 0.05) },
      jeevesCorporateCredit: { preQualifiedLimit: Math.round(amr * 2 / 1000) * 1000, status: 'Pre-Qualified' },
      idiqCreditDefense: deal.metadata?.client_credit_defense || { triggerLeadProtection: false },
    });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/dossier/:token/decision', async (req, res) => {
  try {
    const { decision, counter_offer, notes } = req.body;
    const dealId = req.params.token;
    await supabase.from('funder_decisions').insert({ deal_id: dealId, decision, counter_offer, notes, decided_at: new Date().toISOString() });
    await supabase.from('deals').update({ status: decision === 'APPROVED' ? 'term_sheet_issued' : decision === 'DECLINED' ? 'declined' : 'countered' }).eq('id', dealId);
    await sendSlack(`📋 Funder Decision: *${decision}* on deal ${dealId}${notes ? ` — "${notes}"` : ''}`);
    res.json({ success: true, decision, dealId });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ── Queue Stats ───────────────────────────────────────────────────────────────
api.get('/queue/stats', (_req, res) => res.json({
  success: true,
  queues: { bulkIngestion: { waiting: 0 }, enrichment: { waiting: 0 }, matching: { waiting: 0 }, funderDispatch: { waiting: 0 } }
}));

// ═══════════════════════════════════════════════════════════════════════════════
// PAYPAL
// ═══════════════════════════════════════════════════════════════════════════════

// Get PayPal plans
api.get('/subscriptions/plans', (_req, res) => res.json({ success: true, plans: PLANS }));

// Create PayPal subscription
api.post('/subscriptions/create', async (req, res) => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) return res.status(503).json({ error: 'PayPal not configured' });
    const { planId, brokerEmail, brokerId } = req.body;
    const plan = PLANS[planId];
    if (!plan) return res.status(400).json({ error: 'Invalid plan' });
    const token = await getPayPalToken();
    const subRes = await fetch(`${PAYPAL_BASE}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        plan_id: plan.paypalPlanId,
        subscriber: { email_address: brokerEmail },
        application_context: {
          return_url: `${FRONTEND_URL}/crm/dashboard?subscribed=true`,
          cancel_url: `${FRONTEND_URL}/fod/pricing`,
        },
        custom_id: JSON.stringify({ brokerId, planId }),
      }),
    });
    const sub = await subRes.json();
    const approveLink = sub.links?.find(l => l.rel === 'approve')?.href;
    res.json({ success: true, subscriptionId: sub.id, approveUrl: approveLink });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PayPal commission payout
api.post('/paypal/payout', async (req, res) => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) return res.status(503).json({ error: 'PayPal not configured' });
    const { dealId, recipientEmail, amount, note } = req.body;
    const token = await getPayPalToken();
    const payoutRes = await fetch(`${PAYPAL_BASE}/v1/payments/payouts`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        sender_batch_header: {
          sender_batch_id: `payout-${dealId}-${Date.now()}`,
          email_subject: 'GLINFICO Commission Payout',
          email_message: note || 'Your commission has been paid.',
        },
        items: [{
          recipient_type: 'EMAIL',
          amount: { value: amount.toFixed(2), currency: 'USD' },
          receiver: recipientEmail,
          note: note || `Commission for deal ${dealId}`,
          sender_item_id: dealId,
        }],
      }),
    });
    const payout = await payoutRes.json();
    await supabase.from('deals').update({ paypal_payout_status: 'paid' }).eq('id', dealId);
    await supabase.from('commissions').update({ status: 'paid', paid_at: new Date().toISOString() }).eq('deal_id', dealId);
    await sendSlack(`💸 Commission Paid: $${amount} to ${recipientEmail} for deal ${dealId}`);
    res.json({ success: true, payoutId: payout.batch_header?.payout_batch_id, status: payout.batch_header?.batch_status });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PayPal one-time payment (CC/DC/ACH)
api.post('/paypal/order', async (req, res) => {
  try {
    if (!PAYPAL_CLIENT_ID || !PAYPAL_SECRET) return res.status(503).json({ error: 'PayPal not configured' });
    const { amount, description, dealId } = req.body;
    const token = await getPayPalToken();
    const orderRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          amount: { currency_code: 'USD', value: amount.toFixed(2) },
          description: description || 'GLINFICO Platform Fee',
          custom_id: dealId || '',
        }],
        application_context: {
          return_url: `${FRONTEND_URL}/crm/dashboard?paid=true`,
          cancel_url: `${FRONTEND_URL}/fod/pricing`,
          payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
        },
      }),
    });
    const order = await orderRes.json();
    const approveLink = order.links?.find(l => l.rel === 'approve')?.href;
    res.json({ success: true, orderId: order.id, approveUrl: approveLink });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PayPal capture payment
api.post('/paypal/order/:orderId/capture', async (req, res) => {
  try {
    const token = await getPayPalToken();
    const captureRes = await fetch(`${PAYPAL_BASE}/v2/checkout/orders/${req.params.orderId}/capture`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${token}`, 'Content-Type': 'application/json' },
    });
    const capture = await captureRes.json();
    res.json({ success: true, capture });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// PayPal webhook
api.post('/webhooks/paypal', async (req, res) => {
  try {
    const event = req.body;
    console.log('PayPal webhook:', event.event_type);
    if (event.event_type === 'BILLING.SUBSCRIPTION.ACTIVATED') {
      const custom = JSON.parse(event.resource?.custom_id || '{}');
      await supabase.from('brokers').update({
        subscription_plan: custom.planId,
        subscription_status: 'active',
        paypal_subscription_id: event.resource?.id,
      }).eq('id', custom.brokerId);
      await sendSlack(`🎉 New Subscription: Plan ${custom.planId} activated for broker ${custom.brokerId}`);
    }
    if (event.event_type === 'PAYMENT.PAYOUTS-ITEM.SUCCEEDED') {
      await sendSlack(`✅ PayPal Payout succeeded: ${event.resource?.payout_item_id}`);
    }
    res.json({ received: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// NOTIFICATIONS
// ═══════════════════════════════════════════════════════════════════════════════
api.post('/notify/sms', async (req, res) => {
  try {
    const { to, message } = req.body;
    await sendSMS(to, message);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

api.post('/notify/slack', async (req, res) => {
  try {
    await sendSlack(req.body.message || req.body);
    res.json({ success: true });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ═══════════════════════════════════════════════════════════════════════════════
// 404
// ═══════════════════════════════════════════════════════════════════════════════
app.use((req, res) => {
  res.status(404).json({
    error: `Route not found: ${req.method} ${req.path}`,
    platform: 'GLINFICO FOD API v3.0',
    docs: `${FRONTEND_URL}/api/health`,
  });
});

// ═══════════════════════════════════════════════════════════════════════════════
// START
// ═══════════════════════════════════════════════════════════════════════════════
app.listen(PORT, () => {
  console.log(`🚀 GLINFICO FOD API v3.0 running on port ${PORT}`);
  console.log(`   Supabase: ${SUPABASE_URL ? '✅' : '❌ missing'}`);
  console.log(`   PayPal:   ${PAYPAL_CLIENT_ID ? '✅' : '⚠️  not configured'}`);
  console.log(`   Twilio:   ${TWILIO_SID ? '✅' : '⚠️  not configured'}`);
  console.log(`   Slack:    ${SLACK_WEBHOOK ? '✅' : '⚠️  not configured'}`);
});

export default app;
