import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PLANS = {
  starter:      { name: 'Starter',      monthly: 999,  annual: 9990 },
  growth:       { name: 'Growth',       monthly: 1499, annual: 14990 },
  professional: { name: 'Pro',          monthly: 2999, annual: 29990 },
  enterprise:   { name: 'Enterprise',   monthly: 7999, annual: 79990 },
};

function paypalBase() {
  // Sandbox is the safe default. Set PAYPAL_ENV=live only after Sandbox verification.
  return Deno.env.get('PAYPAL_ENV') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

function planEnvironmentKey(plan, billing) {
  return `PAYPAL_PLAN_${plan.toUpperCase()}_${billing.toUpperCase()}`;
}

async function getPayPalToken(base) {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  if (!clientId || !secret) throw new Error('PayPal API credentials are not configured.');
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) {
    throw new Error('PayPal authentication failed. Check the configured environment and credentials.');
  }
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user?.id) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const body = await req.json();
    const plan = String(body.plan || 'professional').toLowerCase();
    const billing = String(body.billing || 'monthly').toLowerCase();
    if (!Object.hasOwn(PLANS, plan) || !['monthly', 'annual'].includes(billing)) {
      return Response.json({ error: 'Invalid subscription plan or billing interval.' }, { status: 400 });
    }

    const planConfig = PLANS[plan];
    const amount = planConfig[billing];
    const paypalPlanId = Deno.env.get(planEnvironmentKey(plan, billing));
    if (!paypalPlanId) {
      return Response.json({
        error: 'This PayPal billing plan is not configured yet. Please contact support; no payment was taken.',
      }, { status: 503 });
    }

    const originHeader = req.headers.get('origin') || '';
    const allowedOrigins = (Deno.env.get('PAYPAL_ALLOWED_ORIGINS') || 'https://fod.glinfico.com')
      .split(',').map(v => v.trim()).filter(Boolean);
    const origin = allowedOrigins.includes(originHeader) ? originHeader : allowedOrigins[0];
    const base = paypalBase();
    const token = await getPayPalToken(base);

    const response = await fetch(`${base}/v1/billing/subscriptions`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
        Prefer: 'return=representation',
      },
      body: JSON.stringify({
        plan_id: paypalPlanId,
        custom_id: String(user.id).slice(0, 127),
        ...(user.email ? { subscriber: { email_address: user.email } } : {}),
        application_context: {
          brand_name: 'GLINFICO.FOD',
          locale: 'en-US',
          user_action: 'SUBSCRIBE_NOW',
          payment_method: { payer_selected: 'PAYPAL', payee_preferred: 'IMMEDIATE_PAYMENT_REQUIRED' },
          return_url: `${origin}/broker/subscribe?paypal=approved`,
          cancel_url: `${origin}/broker/subscribe?paypal=cancelled`,
        },
      }),
    });

    const subscription = await response.json();
    if (!response.ok || !subscription.id) {
      return Response.json({ error: 'PayPal could not create the subscription. No checkout link was issued.' }, { status: 502 });
    }

    await base44.asServiceRole.entities.BrokerSubscription.create({
      user_id: String(user.id),
      user_email: user.email || '',
      plan,
      billing,
      amount_usd: amount,
      currency: 'USD',
      provider: 'paypal',
      paypal_subscription_id: subscription.id,
      paypal_plan_id: paypalPlanId,
      status: 'approval_pending',
    });

    const approvalUrl = subscription.links?.find(link => link.rel === 'approve')?.href;
    if (!approvalUrl) {
      return Response.json({ error: 'PayPal created the subscription but did not return an approval URL. Contact support.' }, { status: 502 });
    }

    return Response.json({ url: approvalUrl, subscription_id: subscription.id });
  } catch (_error) {
    // Avoid returning internal provider details or credentials in client responses.
    return Response.json({ error: 'Unable to start PayPal subscription checkout. Please try again or contact support.' }, { status: 500 });
  }
});