import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

const PAYPAL_BASE = 'https://api-m.paypal.com'; // switch to sandbox: api-m.sandbox.paypal.com

const PLANS = {
  starter: { name: 'Starter', price_monthly: '99.00', price_annual: '990.00' },
  professional: { name: 'Professional', price_monthly: '299.00', price_annual: '2990.00' },
  enterprise: { name: 'Enterprise', price_monthly: '799.00', price_annual: '7990.00' },
};

async function getPayPalToken() {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      'Authorization': `Basic ${btoa(`${clientId}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await res.json();
  return data.access_token;
}

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan = 'professional', billing = 'monthly' } = await req.json();
    const planConfig = PLANS[plan] || PLANS.professional;
    const amount = billing === 'annual' ? planConfig.price_annual : planConfig.price_monthly;
    const origin = req.headers.get('origin') || 'https://app.glinfico.com';

    const token = await getPayPalToken();

    const order = await fetch(`${PAYPAL_BASE}/v2/checkout/orders`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        intent: 'CAPTURE',
        purchase_units: [{
          description: `GLINFICO Broker ${planConfig.name} Subscription (${billing})`,
          amount: { currency_code: 'USD', value: amount },
          custom_id: `${user.id}|${plan}|${billing}`,
        }],
        payment_source: {
          paypal: {
            experience_context: {
              payment_method_preference: 'IMMEDIATE_PAYMENT_REQUIRED',
              landing_page: 'LOGIN',
              user_action: 'PAY_NOW',
              return_url: `${origin}/portal/broker?subscribed=1`,
              cancel_url: `${origin}/portal/broker?cancelled=1`,
            },
          },
        },
      }),
    });

    const orderData = await order.json();
    const approveLink = orderData.links?.find(l => l.rel === 'payer-action')?.href;

    return Response.json({ url: approveLink, order_id: orderData.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});