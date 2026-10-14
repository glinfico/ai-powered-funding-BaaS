import { createClientFromRequest } from 'npm:@base44/sdk@0.8.31';

function paypalBase() {
  return Deno.env.get('PAYPAL_ENV') === 'live'
    ? 'https://api-m.paypal.com'
    : 'https://api-m.sandbox.paypal.com';
}

async function getPayPalToken(base) {
  const clientId = Deno.env.get('PAYPAL_CLIENT_ID');
  const secret = Deno.env.get('PAYPAL_CLIENT_SECRET');
  if (!clientId || !secret) throw new Error('PayPal credentials are not configured');
  const response = await fetch(`${base}/v1/oauth2/token`, {
    method: 'POST',
    headers: {
      Authorization: `Basic ${btoa(`${clientId}:${secret}`)}`,
      'Content-Type': 'application/x-www-form-urlencoded',
    },
    body: 'grant_type=client_credentials',
  });
  const data = await response.json();
  if (!response.ok || !data.access_token) throw new Error('PayPal authentication failed');
  return data.access_token;
}

async function verifyWebhook(req, event, token, base) {
  const webhookId = Deno.env.get('PAYPAL_WEBHOOK_ID');
  if (!webhookId) throw new Error('PAYPAL_WEBHOOK_ID is not configured');

  const headers = {
    transmissionId: req.headers.get('paypal-transmission-id'),
    transmissionTime: req.headers.get('paypal-transmission-time'),
    certUrl: req.headers.get('paypal-cert-url'),
    authAlgo: req.headers.get('paypal-auth-algo'),
    transmissionSig: req.headers.get('paypal-transmission-sig'),
  };
  if (Object.values(headers).some(value => !value)) return false;

  const response = await fetch(`${base}/v1/notifications/verify-webhook-signature`, {
    method: 'POST',
    headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      auth_algo: headers.authAlgo,
      cert_url: headers.certUrl,
      transmission_id: headers.transmissionId,
      transmission_sig: headers.transmissionSig,
      transmission_time: headers.transmissionTime,
      webhook_id: webhookId,
      webhook_event: event,
    }),
  });
  const result = await response.json();
  return response.ok && result.verification_status === 'SUCCESS';
}

function subscriptionIdFor(event) {
  const resource = event?.resource || {};
  if (resource.billing_agreement_id) return resource.billing_agreement_id;
  if (resource.subscription_id) return resource.subscription_id;
  if (String(event?.event_type || '').startsWith('BILLING.SUBSCRIPTION.')) return resource.id;
  return null;
}

function mapStatus(eventType) {
  if (eventType === 'BILLING.SUBSCRIPTION.ACTIVATED') return 'active';
  if (eventType === 'BILLING.SUBSCRIPTION.SUSPENDED') return 'suspended';
  if (eventType === 'BILLING.SUBSCRIPTION.CANCELLED') return 'cancelled';
  if (eventType === 'BILLING.SUBSCRIPTION.EXPIRED') return 'expired';
  if (eventType === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED') return 'payment_failed';
  return null;
}

Deno.serve(async (req) => {
  if (req.method !== 'POST') return Response.json({ error: 'Method not allowed' }, { status: 405 });

  try {
    const event = await req.json();
    if (!event?.id || !event?.event_type) return Response.json({ error: 'Invalid event' }, { status: 400 });

    const base = paypalBase();
    const token = await getPayPalToken(base);
    if (!await verifyWebhook(req, event, token, base)) {
      return Response.json({ error: 'Invalid PayPal webhook signature' }, { status: 401 });
    }

    const base44 = createClientFromRequest(req);
    const existing = await base44.asServiceRole.entities.PayPalWebhookEvent.filter({ event_id: event.id });
    if (existing?.length) {
      const prior = existing[0];
      if (prior.processing_status === 'processed' || prior.processing_status === 'ignored') {
        return Response.json({ received: true, duplicate: true });
      }
    } else {
      await base44.asServiceRole.entities.PayPalWebhookEvent.create({
        event_id: event.id,
        event_type: event.event_type,
        resource_id: String(event.resource?.id || ''),
        processing_status: 'processing',
        received_at: new Date().toISOString(),
      });
    }

    const subscriptionId = subscriptionIdFor(event);
    const status = mapStatus(event.event_type);
    if (!subscriptionId || (!status && !['PAYMENT.SALE.COMPLETED', 'PAYMENT.SALE.REFUNDED', 'PAYMENT.SALE.REVERSED'].includes(event.event_type))) {
      const records = await base44.asServiceRole.entities.PayPalWebhookEvent.filter({ event_id: event.id });
      if (records?.[0]) await base44.asServiceRole.entities.PayPalWebhookEvent.update(records[0].id, {
        processing_status: 'ignored', processed_at: new Date().toISOString(),
      });
      return Response.json({ received: true, ignored: true });
    }

    const subscriptions = await base44.asServiceRole.entities.BrokerSubscription.filter({
      paypal_subscription_id: subscriptionId,
    });
    const record = subscriptions?.[0];
    if (!record) {
      // A verified event can arrive before the local subscription record is visible.
      // Return 500 so PayPal retries instead of silently losing the state change.
      return Response.json({ error: 'Subscription record not found yet' }, { status: 500 });
    }

    const update = {
      last_webhook_event_id: event.id,
    };
    if (status) update.status = status;
    if (event.event_type === 'PAYMENT.SALE.COMPLETED') {
      update.last_payment_at = event.create_time || new Date().toISOString();
      update.last_payment_status = 'completed';
    } else if (event.event_type === 'BILLING.SUBSCRIPTION.PAYMENT.FAILED' || event.event_type === 'PAYMENT.SALE.REVERSED') {
      update.last_payment_status = event.event_type === 'PAYMENT.SALE.REVERSED' ? 'reversed' : 'failed';
    } else if (event.event_type === 'PAYMENT.SALE.REFUNDED') {
      update.last_payment_status = 'refunded';
    }

    const nextBillingTime = event.resource?.billing_info?.next_billing_time;
    if (nextBillingTime) update.next_billing_time = nextBillingTime;
    if (status === 'active' && !record.started_at) update.started_at = new Date().toISOString();
    if (status === 'cancelled') update.cancelled_at = new Date().toISOString();

    await base44.asServiceRole.entities.BrokerSubscription.update(record.id, update);

    const events = await base44.asServiceRole.entities.PayPalWebhookEvent.filter({ event_id: event.id });
    if (events?.[0]) await base44.asServiceRole.entities.PayPalWebhookEvent.update(events[0].id, {
      processing_status: 'processed',
      processed_at: new Date().toISOString(),
    });

    return Response.json({ received: true, processed: true });
  } catch (_error) {
    return Response.json({ error: 'Webhook processing failed; PayPal may retry this event.' }, { status: 500 });
  }
});