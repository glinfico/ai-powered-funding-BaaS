// src/app/api/paypal/webhook/route.ts (NEW)
// PayPal webhook: on BILLING.SUBSCRIPTION.ACTIVATED -> LAE provisions the broker account + ID.
// Set in PayPal dashboard: webhook URL = https://admin-glinfico.netlify.app/api/paypal/webhook
// Env: PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID,
//      PAYPAL_PLAN_STARTER_MONTHLY/ANNUAL, _GOLD_, _PLATINUM_, _ENTERPRISE_ (8 plan ids)
import { NextRequest, NextResponse } from "next/server";
import { provisionBroker, PLAN_PREFIX } from "@/lib/lae";

export const dynamic = "force-dynamic";

async function verifySignature(req: NextRequest, body: string): Promise<boolean> {
  const wid = process.env.PAYPAL_WEBHOOK_ID, cid = process.env.PAYPAL_CLIENT_ID, sec = process.env.PAYPAL_CLIENT_SECRET;
  if (!wid || !cid || !sec) return true; // dev: no PayPal creds configured yet -> accept (log it)
  try {
    const tok = await fetch("https://api-m.paypal.com/v1/oauth2/token", {
      method: "POST",
      headers: { Authorization: "Basic " + Buffer.from(cid + ":" + sec).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
      body: "grant_type=client_credentials",
    }).then(r => r.json());
    const v = await fetch("https://api-m.paypal.com/v1/notifications/verify-webhook-signature", {
      method: "POST",
      headers: { Authorization: `Bearer ${tok.access_token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        auth_algo: req.headers.get("paypal-auth-algo"),
        cert_url: req.headers.get("paypal-cert-url"),
        transmission_id: req.headers.get("paypal-transmission-id"),
        transmission_sig: req.headers.get("paypal-transmission-sig"),
        transmission_time: req.headers.get("paypal-transmission-time"),
        webhook_id: wid,
        webhook_event: JSON.parse(body),
      }),
    }).then(r => r.json());
    return v.verification_status === "SUCCESS";
  } catch { return false; }
}

export async function POST(req: NextRequest) {
  const body = await req.text();
  const okSig = await verifySignature(req, body);
  if (!okSig) return NextResponse.json({ error: "bad signature" }, { status: 401 });
  const evt = JSON.parse(body);
  if (evt.event_type === "BILLING.SUBSCRIPTION.ACTIVATED") {
    const r = evt.resource || {};
    const email = r.subscriber?.email_address?.email || r.custom_id || "";
    const name = [r.subscriber?.name?.given_name, r.subscriber?.name?.surname].filter(Boolean).join(" ") || email;
    const planId = r.plan_id || "";
    // map plan id -> plan key via env: PAYPAL_PLAN_<KEY>_<TERM>
    let planKey = "GOLD";
    for (const k of Object.keys(PLAN_PREFIX)) {
      for (const term of ["MONTHLY", "ANNUAL"]) {
        if (process.env[`PAYPAL_PLAN_${k}_${term}`] === planId) planKey = k;
      }
    }
    if (!email.includes("@")) return NextResponse.json({ ok: false, error: "no payer email" }, { status: 400 });
    const out = await provisionBroker({ email, name, planKey });
    return NextResponse.json({ ok: true, provisioned: out });
  }
  return NextResponse.json({ ok: true, ignored: evt.event_type });
}
