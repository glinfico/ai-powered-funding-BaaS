import express from 'express';
import cors from 'cors';
import { createClient } from '@supabase/supabase-js';
import Stripe from 'stripe';
import { calculateMCAScore, calculateMCAOffer, detectStacking } from './engines/mcaScoring.js';
import { matchFunders } from './engines/funderMatching.js';
import { calculateCommission, SUBSCRIPTION_PLANS } from './engines/commissions.js';

const app = express();
app.use(cors({ origin: process.env.FRONTEND_URL || 'https://fod.glinfico.com' }));
app.use(express.json());

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
);

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || 'sk_test_placeholder');

app.get('/health', (req, res) => {
  res.json({ status: 'ok', platform: 'GLINFICO', version: '1.0.0' });
});

app.post('/api/mca/score', async (req, res) => {
  try {
    const { applicationId, idiqData, finGoalData, merchantInfo } = req.body;
    if (!idiqData || !finGoalData) {
      return res.status(400).json({ error: 'idiqData and finGoalData are required' });
    }

    const scoreResult = calculateMCAScore(idiqData, finGoalData);
    const offerResult = scoreResult.tier !== 'F'
      ? calculateMCAOffer(finGoalData, scoreResult.tier)
      : { eligible: false, reason: 'Score too low for funding.' };

    const stackingResult = detectStacking(finGoalData);

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

    const { error: dbError } = await supabase
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
      });

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

app.patch('/api/mca/applications/:id/fund', async (req, res) => {
  try {
    const { id } = req.params;
    const { fundedAmount, funderId, brokerId } = req.body;

    const commission = calculateCommission({
      dealId: id,
      productType: 'MCA',
      fundedAmount,
      brokerId,
      funderId
    });

    await supabase
      .from('mca_applications')
      .update({ status: 'funded', funded_amount: fundedAmount, funded_at: new Date().toISOString() })
      .eq('id', id);

    await supabase.from('commissions').insert(commission);
    return res.json({ success: true, commission });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

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

app.patch('/api/leads/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('leads')
      .update({ ...req.body, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    return res.json({ success: true, lead: data });
  } catch (err) {
    return res.status(500).json({ error: err.message });
  }
});

app.get('/api/subscriptions/plans', (req, res) => {
  res.json({ success: true, plans: SUBSCRIPTION_PLANS });
});

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

app.post('/api/webhooks/stripe', express.raw({ type: 'application/json' }), async (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET || '');
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`GLINFICO API running on port ${PORT}`);
});

export default app;
