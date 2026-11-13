import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { integrationEvents } from "@/db/schema";
import { paypalToken, verifyWebhook, extractPayment, packageForAmount, paypalConfigured } from "@/lib/paypal";
import { claimEvent, finishEvent, provisionBroker } from "@/lib/laeProvision";

export const dynamic = "force-dynamic";

// PayPal → LAE. Register this URL in your PayPal app's webhook:
//   https://admin-glinfico.netlify.app/api/paypal/webhook
// Every event is verified with PayPal before anything happens.
const ACTED_ON = new Set(["CHECKOUT.ORDER.COMPLETED", "CHECKOUT.ORDER.APPROVED", "PAYMENT.CAPTURE.COMPLETED", "BILLING.SUBSCRIPTION.ACTIVATED", "PAYMENT.SALE.COMPLETED"]);

export async function GET() {
  // Status only — never returns secrets.
  return NextResponse.json({ ok: true, endpoint: "PayPal → LAE webhook", configured: paypalConfigured() });
}

export async function POST(req: NextRequest) {
  const raw = await req.text();
  let event: any;
  try { event = JSON.parse(raw); } catch { return NextResponse.json({ ok: false, error: "invalid JSON" }, { status: 400 }); }

  let token: string;
  try { token = await paypalToken(); } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "PayPal auth failed" }, { status: 500 });
  }
  const verified = await verifyWebhook(req.headers, event, token);
  if (!verified) return NextResponse.json({ ok: false, error: "signature verification failed" }, { status: 401 });

  const id = String(event.id || "");
  const type = String(event.event_type || "");
  if (!id) return NextResponse.json({ ok: false, error: "missing event id" }, { status: 400 });
  if (!(await claimEvent(id, type))) return NextResponse.json({ ok: true, duplicate: true });

  try {
    if (!ACTED_ON.has(type)) {
      await finishEvent(id, "ignored", { reason: "event type not used by the LAE" });
      return NextResponse.json({ ok: true, ignored: type });
    }
    const pay = await extractPayment(event, token);
    const pkg = packageForAmount(pay?.amount);
    if (!pay?.email || !pkg) {
      await finishEvent(id, "needs_review", { email: pay?.email || "", amount: pay?.amount || "", reason: !pay?.email ? "no payer email" : "amount does not match a broker package" });
      await db.insert(integrationEvents).values({ type: "LAE.payment_needs_review", provider: "PayPal", status: "pending", count: 1, payload: JSON.stringify({ eventId: id, type, amount: pay?.amount || "" }) });
      return NextResponse.json({ ok: true, needsReview: true });
    }
    const result = await provisionBroker({ email: pay.email, name: pay.name, pkg, ref: pay.ref });
    await finishEvent(id, "provisioned", { ...result, email: pay.email });
    return NextResponse.json({ ok: true, ...result });
  } catch (e: any) {
    await finishEvent(id, "error", { error: e?.message || "failed" }).catch(() => {});
    // 500 makes PayPal retry later.
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
