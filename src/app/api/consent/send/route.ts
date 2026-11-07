import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, consentLinks, messages, consentRecords, integrationEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { consentLinkUrl, consentSmsBody, consentEmailBody, makeToken, hashToken, FORM_VERSION } from "@/lib/consent-form";

export const dynamic = "force-dynamic";

const BASE = process.env.NEXT_PUBLIC_APP_URL || "http://127.0.0.1:3000";

async function sendSms(to: string, body: string) {
  const sid = process.env.TWILIO_ACCOUNT_SID, token = process.env.TWILIO_AUTH_TOKEN, from = process.env.TWILIO_PHONE_NUMBER;
  if (!sid || !token || !from) return { simulated: true, ref: "", note: "TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_PHONE_NUMBER not set — message queued as simulated" };
  const r = await fetch(`https://api.twilio.com/2010-04-01/Accounts/${sid}/Messages.json`, {
    method: "POST",
    headers: { Authorization: "Basic " + Buffer.from(`${sid}:${token}`).toString("base64"), "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({ From: from, To: to, Body: body }),
  });
  const j: any = await r.json().catch(() => ({}));
  if (!r.ok) return { simulated: false, ref: "", error: j.message || `Twilio HTTP ${r.status}` };
  return { simulated: false, ref: j.sid || "" };
}

async function sendEmail(to: string, subject: string, body: string) {
  const key = process.env.SENDGRID_API_KEY, from = process.env.SENDGRID_FROM || "noreply@glinfico.example";
  if (!key) return { simulated: true, ref: "", note: "SENDGRID_API_KEY not set — email queued as simulated" };
  const r = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: { Authorization: `Bearer ${key}`, "Content-Type": "application/json" },
    body: JSON.stringify({ personalizations: [{ to: [{ email: to }] }], from: { email: from }, subject, content: [{ type: "text/plain", value: body }] }),
  });
  if (!r.ok) return { simulated: false, ref: "", error: `SendGrid HTTP ${r.status}` };
  return { simulated: false, ref: r.headers.get("x-message-id") || "sendgrid" };
}

// POST /api/consent/send { leadId } | { all: true, onlyPending: true }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    let targets: any[] = [];
    if (b.all) {
      targets = await db.execute(sql`SELECT l.id, l.first_name AS "firstName", l.email, l.phone FROM leads l
        WHERE NOT EXISTS (SELECT 1 FROM consent_links cl JOIN consent_records cr ON cr.lead_id=l.id AND cr.scope='credit_pull' AND cr.status='Granted' WHERE cl.lead_id=l.id AND cl.used_at IS NOT NULL)
        ORDER BY l.id LIMIT 2000`).then((r: any) => r.rows || r);
    } else {
      const id = Number(b.leadId);
      if (!id) return NextResponse.json({ error: "leadId or all:true required" }, { status: 400 });
      const [l] = await db.select().from(leads).where(eq(leads.id, id));
      if (l) targets = [l];
    }

    const results: any[] = [];
    for (const l of targets) {
      const token = makeToken(l.id);
      const url = consentLinkUrl(l.id, BASE);
      const expires = new Date(Date.now() + 7 * 86400000);
      await db.insert(consentLinks).values({ leadId: l.id, tokenHash: hashToken(token), formVersion: FORM_VERSION, expiresAt: expires });

      const smsBody = consentSmsBody({ firstName: l.firstName }, url);
      const emailBody = consentEmailBody({ firstName: l.firstName, lastName: l.lastName }, url);
      const sms = await sendSms(l.phone, smsBody);
      const email = await sendEmail(l.email, `Your GLINFICO consent form, ${l.firstName}`, emailBody);

      const smsRow = await db.insert(messages).values({ leadId: l.id, channel: "sms", template: "consent_request", body: smsBody, status: sms.error ? "failed" : sms.simulated ? "simulated" : "sent", providerRef: sms.ref || "", error: sms.error || sms.note || "", sentAt: sms.simulated || sms.error ? null : new Date() }).returning();
      const emailRow = await db.insert(messages).values({ leadId: l.id, channel: "email", template: "consent_request", body: emailBody, status: email.error ? "failed" : email.simulated ? "simulated" : "sent", providerRef: email.ref || "", error: email.error || email.note || "", sentAt: email.simulated || email.error ? null : new Date() }).returning();
      results.push({ leadId: l.id, link: `/consent/${token}?lid=${l.id}`, sms: smsRow[0].status, email: emailRow[0].status, smsRef: smsRow[0].providerRef, emailRef: emailRow[0].providerRef });
    }
    if (results.length) await db.insert(integrationEvents).values({ type: "consent.request_sent", provider: "Twilio/SendGrid", status: results.every(r => r.sms === "simulated") ? "simulated" : "delivered", count: results.length, payload: JSON.stringify({ results: results.slice(0, 5), total: results.length, note: "Links expire in 7 days; one-time use" }) });
    return NextResponse.json({ ok: true, count: results.length, results: results.slice(0, 20), mode: process.env.TWILIO_ACCOUNT_SID ? "LIVE (Twilio)" : "SIMULATED — set TWILIO_ACCOUNT_SID/AUTH_TOKEN/PHONE_NUMBER + SENDGRID_API_KEY" });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// GET /api/consent/send?leadId=… → message log for a lead
export async function GET(req: NextRequest) {
  const lid = Number(req.nextUrl.searchParams.get("leadId") || 0);
  const rows = lid
    ? await db.select().from(messages).where(eq(messages.leadId, lid)).orderBy(sql`created_at DESC`).limit(50)
    : await db.select().from(messages).orderBy(sql`created_at DESC`).limit(50);
  return NextResponse.json({ rows });
}
