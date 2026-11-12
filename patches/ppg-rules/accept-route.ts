// src/app/api/ppg/accept/route.ts  (NEW)
// POST /api/ppg/accept { portal } — record the PPG rules acceptance.
// For borrowers, also fire the application to IDE and issue their ID (SL code).
import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { staff, leads, idLedger, portalAcceptances } from "@/db/schema";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { eq } from "drizzle-orm";
import { sql } from "drizzle-orm";
import { COHORT, TIERS, makeCode, monthLetter, nextSeq, parseCode, labelFor } from "@/lib/idEngine";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const s = verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const portal = ["borrower","broker","lender","investor"].includes(String(b.portal)) ? String(b.portal) : "borrower";

  await db.execute(sql`INSERT INTO portal_acceptances (email, portal, accepted_at)
    VALUES (${s.email}, ${portal}, now())
    ON CONFLICT (email, portal) DO UPDATE SET accepted_at = now()`);

  let issuedId: string | null = null;
  if (portal === "borrower") {
    // application → IDE: find/create the lead by email and issue the ID now
    const [lead] = await db.select().from(leads).where(eq(leads.email, s.email)).limit(1);
    if (lead && !lead.code) {
      const rows: any = await db.execute(sql`SELECT code FROM leads WHERE code LIKE 'SL-%'`).then((r: any) => r.rows || r);
      const seq = nextSeq(rows.map((r: any) => parseCode(r.code)?.seq).filter((n: any) => !!n));
      const code = makeCode("SL", seq);           // current cohort (e.g. SL-1126-N100xxx)
      await db.execute(sql`UPDATE leads SET code=${code}, tier=${TIERS.SL.label} WHERE id=${lead.id}`);
      await db.insert(idLedger).values({ entityType: "Single Lead", entityId: lead.id, fromCode: "", toCode: code, action: "assign", note: labelFor(code) + " — PPG borrower application" });
      issuedId = code;
    } else if (lead?.code) {
      issuedId = lead.code;
    }
  }
  return NextResponse.json({ ok: true, portal, accepted: true, issuedId });
}
