// PayPal REST helpers (server-side only). Credentials come from the site environment:
// PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_ENV (live | sandbox), PAYPAL_WEBHOOK_ID.

export function paypalBase(): string {
  return String(process.env.PAYPAL_ENV || "live").toLowerCase().startsWith("sand")
    ? "https://api-m.sandbox.paypal.com"
    : "https://api-m.paypal.com";
}

export function paypalConfigured() {
  return {
    clientId: !!process.env.PAYPAL_CLIENT_ID,
    clientSecret: !!process.env.PAYPAL_CLIENT_SECRET,
    webhookId: !!process.env.PAYPAL_WEBHOOK_ID,
    env: String(process.env.PAYPAL_ENV || "live"),
  };
}

export async function paypalToken(): Promise<string> {
  const id = process.env.PAYPAL_CLIENT_ID || "";
  const secret = process.env.PAYPAL_CLIENT_SECRET || "";
  if (!id || !secret) throw new Error("PayPal credentials missing");
  const res = await fetch(`${paypalBase()}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      Authorization: `Basic ${Buffer.from(`${id}:${secret}`).toString("base64")}`,
      "Content-Type": "application/x-www-form-urlencoded",
    },
    body: "grant_type=client_credentials",
    cache: "no-store",
  });
  if (!res.ok) throw new Error(`PayPal auth failed (HTTP ${res.status})`);
  const j = (await res.json()) as { access_token?: string };
  if (!j.access_token) throw new Error("PayPal auth returned no token");
  return j.access_token;
}

export async function paypalGet(path: string, token: string): Promise<any> {
  const res = await fetch(`${paypalBase()}${path}`, { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

/** Verifies a webhook event with PayPal (official verify-webhook-signature API). */
export async function verifyWebhook(headers: Headers, event: unknown, token: string): Promise<boolean> {
  const webhookId = process.env.PAYPAL_WEBHOOK_ID || "";
  if (!webhookId) return false;
  const res = await fetch(`${paypalBase()}/v1/notifications/verify-webhook-signature`, {
    method: "POST",
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
    body: JSON.stringify({
      auth_algo: headers.get("paypal-auth-algo"),
      cert_url: headers.get("paypal-cert-url"),
      transmission_id: headers.get("paypal-transmission-id"),
      transmission_sig: headers.get("paypal-transmission-sig"),
      transmission_time: headers.get("paypal-transmission-time"),
      webhook_id: webhookId,
      webhook_event: event,
    }),
    cache: "no-store",
  });
  if (!res.ok) return false;
  const j = (await res.json()) as { verification_status?: string };
  return j.verification_status === "SUCCESS";
}

// Broker packages by amount paid (USD, monthly). Matches the Pricing page and Broker rules.
export const BROKER_PACKAGES = [
  { amount: 999, prefix: "S", plan: "Starter", name: "SILVER", leadQuota: 25 },
  { amount: 1499, prefix: "G", plan: "Growth", name: "GOLD", leadQuota: 100 },
  { amount: 2999, prefix: "P", plan: "Pro", name: "PLATINUM", leadQuota: 500 },
  { amount: 7999, prefix: "E", plan: "Enterprise", name: "EMEROD", leadQuota: 1000 },
] as const;

export function packageForAmount(value: unknown) {
  const n = Number(value);
  if (!Number.isFinite(n)) return null;
  return BROKER_PACKAGES.find((p) => Math.abs(p.amount - n) < 1) || null;
}

/** Pulls payer email, amount and a reference out of the PayPal event types we act on. */
export async function extractPayment(event: any, token: string): Promise<{ email: string; name: string; amount: string; ref: string } | null> {
  const type = String(event?.event_type || "");
  const r = event?.resource || {};
  if (type === "CHECKOUT.ORDER.COMPLETED" || type === "CHECKOUT.ORDER.APPROVED") {
    const pu = r.purchase_units?.[0] || {};
    return {
      email: r.payer?.email_address || "",
      name: [r.payer?.name?.given_name, r.payer?.name?.surname].filter(Boolean).join(" "),
      amount: pu.amount?.value || pu.payments?.captures?.[0]?.amount?.value || "",
      ref: r.id || "",
    };
  }
  if (type === "PAYMENT.CAPTURE.COMPLETED") {
    const orderId = r.supplementary_data?.related_ids?.order_id;
    const order = orderId ? await paypalGet(`/v2/checkout/orders/${orderId}`, token) : null;
    return {
      email: order?.payer?.email_address || r.payee?.email_address || "",
      name: [order?.payer?.name?.given_name, order?.payer?.name?.surname].filter(Boolean).join(" "),
      amount: r.amount?.value || "",
      ref: orderId || r.id || "",
    };
  }
  if (type === "BILLING.SUBSCRIPTION.ACTIVATED") {
    return {
      email: r.subscriber?.email_address || "",
      name: [r.subscriber?.name?.given_name, r.subscriber?.name?.surname].filter(Boolean).join(" "),
      amount: r.billing_info?.last_payment?.amount?.value || "",
      ref: r.id || "",
    };
  }
  if (type === "PAYMENT.SALE.COMPLETED") {
    const subId = r.billing_agreement_id;
    const sub = subId ? await paypalGet(`/v1/billing/subscriptions/${subId}`, token) : null;
    return {
      email: sub?.subscriber?.email_address || "",
      name: [sub?.subscriber?.name?.given_name, sub?.subscriber?.name?.surname].filter(Boolean).join(" "),
      amount: r.amount?.total || "",
      ref: subId || r.id || "",
    };
  }
  return null;
}
