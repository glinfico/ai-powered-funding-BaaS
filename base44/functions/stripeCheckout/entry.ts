import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';
import Stripe from 'npm:stripe@14.21.0';

// Broker subscription plans
const BROKER_PLANS = {
  starter: { name: 'Starter', price_monthly: 9900, price_annual: 99000 },
  growth: { name: 'Growth', price_monthly: 14900, price_annual: 149000 },
  professional: { name: 'Professional', price_monthly: 29900, price_annual: 299000 },
  enterprise: { name: 'Enterprise', price_monthly: 79900, price_annual: 799000 },
};

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();
    if (!user) return Response.json({ error: 'Unauthorized' }, { status: 401 });

    const {
      plan = 'professional',
      billing = 'monthly',
      payment_method_types = ['card'],
      success_path,
      cancel_path,
    } = await req.json();

    const stripe = new Stripe(Deno.env.get('STRIPE_SECRET_KEY'));
    const origin = req.headers.get('origin') || 'https://app.glinfico.com';

    // Determine plan config
    const planConfig = BROKER_PLANS[plan] || BROKER_PLANS.professional;
    const amount = billing === 'annual' ? planConfig.price_annual : planConfig.price_monthly;
    const interval = billing === 'annual' ? 'year' : 'month';

    const session = await stripe.checkout.sessions.create({
      payment_method_types,
      mode: 'subscription',
      customer_email: user.email,
      line_items: [{
        price_data: {
          currency: 'usd',
          product_data: {
            name: `${planConfig.name} — ${billing === 'annual' ? 'Annual' : 'Monthly'}`,
            description: 'GLINFICO subscription. Cancel anytime.',
          },
          unit_amount: amount,
          recurring: { interval },
        },
        quantity: 1,
      }],
      success_url: `${origin}${success_path || '/portal/broker'}?subscribed=1`,
      cancel_url: `${origin}${cancel_path || '/portal/broker'}?cancelled=1`,
      metadata: { user_id: user.id, plan, billing },
    });

    return Response.json({ url: session.url, session_id: session.id });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});