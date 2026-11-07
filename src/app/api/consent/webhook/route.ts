import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, messages, consentRecords, integrationEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// Twilio inbound SMS webhook (set as Messaging webhook URL in Twilio console).
// Handles STOP/STOPALL/UNSUBSCRIBE → revoke communications consent + mark opted_out.
export async function POST(req: NextRequest) {
  try {
    const form = await req.formData().catch(() => null);
    const from = String(form?.get("From") || "");
    const body = String(form?.get("Body") || "").trim().toUpperCase();
    if (!from) return NextResponse.json({ ok: true });
    const raw = await db.execute(sql`SELECT id FROM leads WHERE phone = ${from} OR REPLACE(REPLACE(REPLACE(REPLACE(phone,' ',''),'-',''),'(',''),')','') = ${from.replace(/[^\d+]/g, "")} LIMIT 1`).then((r: any) => r.rows || r);
    const lead = raw[0];
    if (body.match(/\b(STOP|STOPALL|UNSUBSCRIBE|CANCEL|END|QUIT)\b/)) {
      if (lead?.id) {
        await db.execute(sql`UPDATE consent_records SET status='Revoked', revoked_at=NOW() WHERE lead_id=${lead.id} AND scope='communications'`);
        await db.insert(messages).values({ leadId: Number(lead.id), channel: "sms", template: "opt_out_ack", body: "You have been unsubscribed from GLINFICO texts. No further SMS will be sent. Reply START to resubscribe.", status: "queued" });
        await db.insert(integrationEvents).values({ type: "consent.opt_out", provider: "Twilio", status: "delivered", count: 1, payload: JSON.stringify({ leadId: lead.id, from, body }) });
        return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response><Message>You've been unsubscribed from GLINFICO texts. No further SMS will be sent.</Message></Response>`, { headers: { "Content-Type": "text/xml" } });
      }
      return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, { headers: { "Content-Type": "text/xml" } });
    }
    if (body.match(/\bSTART\b/) && lead?.id) {
      await db.execute(sql`UPDATE consent_records SET status='Granted', revoked_at=NULL WHERE lead_id=${lead.id} AND scope='communications'`);
    }
    return new NextResponse(`<?xml version="1.0" encoding="UTF-8"?><Response></Response>`, { headers: { "Content-Type": "text/xml" } });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
