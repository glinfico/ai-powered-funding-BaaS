/**
 * GLINFICO API Server
 * Express + Supabase backend
 * Deploy to Render.com (free tier) or Railway
 */

import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { calculateMCAScore, calculateMCAOffer, detectStacking } from './engines/mcaScoring.js';
import { matchFunders, generateBlindDealSummary } from './engines/funderMatching.js';
import { calculateCommission, SUBSCRIPTION_PLANS } from './engines/commissions.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://fod.glinfico.com' }));
app.use(express.json());

// ─── CLIENTS ──────────────────────────────────────────────────────────────────

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// ─── HEALTH CHECK ─────────────────────────────────────────────────────────────

app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'GLINFICO', version: '1.0.0' });
});

// ═══════════════════════════════════════════════════════════════════════════════
// MCA ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/mca/score
 * Takes IDIQ credit data + FinGoal bank data → returns MCA score + offer + matches
 */
app.post('/api/mca/score', async (req, res) => {
  try {
    const { applicationId, idiqData, finGoalData, merchantInfo } = req.body;

    if (!idiqData || !finGoalData) {
      return res.status(400).json({ error: 'idiqData and finGoalData are required' });
    }

    // 1. Score the application
    const scoreResult = calculateMCAScore(idiqData, finGoalData);

    // 2. Calculate offer (if not declined)
    const offerResult = scoreResult.tier !== 'F'
      ? calculateMCAOffer(finGoalData, scoreResult.tier)
      : { eligible: false, reason: 'Score too low for funding.' };

    // 3. Detect stacking
    const stackingResult = detectStacking(finGoalData);

    // 4. Match funders (if eligible)
    let matchResult = null;
    if (offerResult.eligible) {
      matchResult = matchFunders({
        id: applicationId,
        amount: offerResult.recommendedAdvance,
        tier: scoreResult.tier,
        creditScore: idiqData.ownerCreditScore || 0,
        industry: merchantInfo?.industry || '',
        state: merchantInfo?.state || '',
        avgMonthlyDeposits: finGoalData.avgMonthlyDeposits,
        detectedDailyACH: finGoalData.detectedDailyACH || 0,
        depositTrend: finGoalData.depositTrend
      });
    }

    // 5. Save to Supabase
    const { data: savedApp, error: dbError } = await supabase
      .from('mca_applications')
      .upsert({
        id: applicationId,
        merchant_info: merchantInfo,
        idiq_data: idiqData,
        fingoal_data: finGoalData,
        mca_score: scoreResult.score,
        mca_tier: scoreResult.tier,
        score_breakdown: scoreResult.breakdown,
        recommended_advance: offerResult.eligible ? offerResult.recommendedAdvance : 0,
        factor_rate: offerResult.eligible ? offerResult.assignedRate : null,
        payback_amount: offerResult.eligible ? offerResult.paybackAmount : null,
        daily_payment: offerResult.eligible ? offerResult.dailyPayment : null,
        stacking_risk: stackingResult.stackingRisk,
        stacking_flags: stackingResult.flags,
        funder_matches: matchResult?.matched || [],
        status: scoreResult.action,
        scored_at: new Date().toISOString()
      })
      .select()
      .single();

    if (dbError) console.error('DB Error:', dbError);

    return res.json({
      success: true,
      applicationId,
      score: scoreResult,
      offer: offerResult,
      stacking: stackingResult,
      matches: matchResult,
    });

  } catch (err) {
    console.error('Score error:', err);
    return res.status(500).json({ error: err.message });
  }
});

/**
 * POST /api/mca/submit
 * Broker submits a new MCA application
 */
app.post('/api/mca/submit', async (req, res) => {
  try {
    const { brokerId, merchantInfo, requestedAmount } = req.body;

    const appId = `MCA-${Date.now()}-${Math.random().toString(36).substr(2, 5).toUpperCase()}`;

    const { data, error } = await supabase
      .from('mca_applications')
      .insert({
        id: appId,
        broker_id: brokerId,
        merchant_info: merchantInfo,
        requested_amount: requestedAmount,
        status: 'submitted',
        created_at: new Date().toISOString()
      })
      .select()
      .single();

    if (error) throw error;

    return res.json({ success: true, applicationId: appId, application: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/mca/applications
 * Get all applications (optionally filter by brokerId)
 */
app.get('/api/mca/applications', async (req, res) => {
  try {
    const { brokerId, status, limit = 50 } = req.query;

    let query = supabase.from('mca_applications').select('*').limit(Number(limit));
    if (brokerId) query = query.eq('broker_id', brokerId);
    if (status)   query = query.eq('status', status);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, applications: data, total: data.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/mca/applications/:id/fund
 * Mark deal as funded → trigger commission calculation
 */
app.patch('/api/mca/applications/:id/fund', async (req, res) => {
  try {
    const { id } = req.params;
    const { fundedAmount, funderId, brokerId } = req.body;

    // Calculate commission
    const commission = calculateCommission({
      dealId: id,
      productType: 'MCA',
      fundedAmount,
      brokerId,
      funderId
    });

    // Update application status
    await supabase
      .from('mca_applications')
      .update({ status: 'funded', funded_amount: fundedAmount, funded_at: new Date().toISOString() })
      .eq('id', id);

    // Save commission record
    await supabase.from('commissions').insert(commission);

    return res.json({ success: true, commission });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// LEADS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/leads
 * Get leads with optional filtering
 */
app.get('/api/leads', async (req, res) => {
  try {
    const { status, assignedTo, limit = 100 } = req.query;

    let query = supabase.from('leads').select('*').limit(Number(limit));
    if (status)     query = query.eq('status', status);
    if (assignedTo) query = query.eq('assigned_to', assignedTo);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, leads: data, total: data.length });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * PATCH /api/leads/:id
 * Update lead status / assignment
 */
app.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const { data, error } = await supabase
      .from('leads')
      .update({ ...updates, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, lead: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ═══════════════════════════════════════════════════════════════════════════════
// STRIPE SUBSCRIPTION ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * POST /api/subscriptions/create
 * Create Stripe checkout session for broker subscription
 */
app.post('/api/subscriptions/create', async (req, res) => {
  try {
    const { brokerId, planId, brokerEmail } = req.body;
    const plan = SUBSCRIPTION_PLANS[planId];

    if (!plan) return res.status(400).json({ error: 'Invalid plan' });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ['card'],
      mode: 'subscription',
      customer_email: brokerEmail,
      line_items: [{ price: plan.stripePriceId, quantity: 1 }],
      metadata: { brokerId, planId },
      success_url: `${process.env.FRONTEND_URL}/dashboard?subscribed=true`,
      cancel_url: `${process.env.FRONTEND_URL}/pricing`,
    });

    return res.json({ success: true, checkoutUrl: session.url, sessionId: session.id });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

/**
 * GET /api/subscriptions/plans
 * Return all available subscription plans
 */
app.get('/api/subscriptions/plans', (req, res) => {
  res.json({ success: true, plans: SUBSCRIPTION_PLANS });
});

/**
 * POST /api/webhooks/stripe
 * Handle Stripe subscription events
 */
app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;

  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).json({ error: `Webhook Error: ${err.message}` });
  }

  if (event.type === 'checkout.session.completed') {
    const session = event.data.object;
    const { brokerId, planId } = session.metadata;

    await supabase.from('brokers').update({
      subscription_plan: planId,
      subscription_status: 'active',
      stripe_customer_id: session.customer,
      stripe_subscription_id: session.subscription,
      subscribed_at: new Date().toISOString()
    }).eq('id', brokerId);
  }

  if (event.type === 'customer.subscription.deleted') {
    const sub = event.data.object;
    await supabase.from('brokers')
      .update({ subscription_status: 'cancelled' })
      .eq('stripe_subscription_id', sub.id);
  }

  res.json({ received: true });
});

// ═══════════════════════════════════════════════════════════════════════════════
// COMMISSIONS ROUTES
// ═══════════════════════════════════════════════════════════════════════════════

/**
 * GET /api/commissions
 * Get commissions for a broker
 */
app.get('/api/commissions', async (req, res) => {
  try {
    const { brokerId } = req.query;

    let query = supabase.from('commissions').select('*');
    if (brokerId) query = query.eq('broker_id', brokerId);
    query = query.order('created_at', { ascending: false });

    const { data, error } = await query;
    if (error) throw error;

    return res.json({ success: true, commissions: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

// ─── START ────────────────────────────────────────────────────────────────────

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`GLINFICO API running on port ${PORT}`);
});

export default app;
