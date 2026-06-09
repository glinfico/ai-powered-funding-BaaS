import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

// Broker subscription plans
const PLANS = {
  starter: { name: 'Starter', price_monthly: 9900, price_annual: 99000 },   // $99/mo or $990/yr
  professional: { name: 'Professional', price_monthly: 29900, price_annual: 299000 },
  enterprise: { name: 'Enterprise', price_monthly: 79900, price_annual: 799000 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const { plan = 'professional', billing = 'monthly', payment_method_types = ['card'] } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const planConfig = PLANS[plan] || PLANS.professional;
    const amount = billing === 'annual' ? planConfig.price_annual : planConfig.price_monthly;

    const session = await stripe.checkout.sessions.create({
      payment_method_types, // ['card'] for CC, ['us_bank_account'] for ACH
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `GLINFICO Broker ${planConfig.name} — ${billing === 'annual' ? 'Annual' : 'Monthly'}`,
            description: 'Broker portal subscription. Grants full pipeline & lender access.',
          },
          unit_amount: amount,
          recurring: { interval: billing === 'annual' ? 'year' : 'month' },
        },
        quantity: 1,
      }],
      success_url: `${req.headers.get('origin') || 'https://app.glinfico.com'}/portal/broker?subscribed=1`,
      cancel_url: `${req.headers.get('origin') || 'https://app.glinfico.com'}/portal/broker?cancelled=1`,
      metadata: { user_id: user.id, plan, billing },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});