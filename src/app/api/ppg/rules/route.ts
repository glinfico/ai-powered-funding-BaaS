import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, integrationEvents } from "@/db/schema";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { sql } from "drizzle-orm";
import { rulesFor, RULES_VERSION } from "@/lib/ppgRules";
import { hasAccepted, recordAcceptance } from "@/lib/ppgAcceptance";
import { backfillIds } from "@/lib/idBackfill";

export const dynamic = "force-dynamic";

// GET  /api/ppg/rules → the signed-in member's rules + whether they accepted them.
// POST /api/ppg/rules → accept. Borrowers also submit their application, which is
//      sent to the IDE and receives a GLINFICO ID (SL-MMYY-L######).
export async function GET(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const r = rulesFor(s.role);
  if (!r) return NextResponse.json({ role: s.role, accepted: true, rules: null });
  const accepted = await hasAccepted(s.email, r.key);
  return NextResponse.json({ role: r.key, version: RULES_VERSION, accepted, rules: r.rules });
}

export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const r = rulesFor(s.role);
  if (!r) return NextResponse.json({ ok: false, error: "No rules for this role" }, { status: 400 });
  const b = await req.json().catch(() => ({}));
  if (b.accept !== true) return NextResponse.json({ ok: false, error: "You must accept the rules" }, { status: 400 });

  try {
    let code: string | null = null;
    if (r.rules.collectsApplication) {
      const fullName = String(b.fullName || "").trim();
      const company = String(b.company || "").trim();
      const phone = String(b.phone || "").trim();
      const amount = Math.max(0, Math.round(Number(String(b.amount || "0").replace(/[^0-9.]/g, "")) || 0));
      if (!fullName || !company) return NextResponse.json({ ok: false, error: "Full name and company are required" }, { status: 400 });
      const [first, ...rest] = fullName.split(/\s+/);
      const existing: any = await db.execute(sql`SELECT id, code FROM leads WHERE lower(email) = ${s.email} ORDER BY id LIMIT 1`).then((x: any) => x.rows || x);
      let leadId: number;
      if (existing.length) {
        leadId = existing[0].id;
        code = existing[0].code || null;
      } else {
        const [l] = await db.insert(leads).values({
          firstName: first, lastName: rest.join(" ") || "-", email: s.email, phone, company, jobTitle: "Owner",
          source: "Borrower Portal", status: "New", acquisitionType: "Direct", vendorName: "Borrower Portal (PPG)",
          originSystem: "PPG — Borrower application", loanOutcome: "Pending", loanAmount: amount, estimatedValue: amount,
          applicationDate: new Date(), city: "", country: "", batchLabel: "Borrower Portal",
        }).returning({ id: leads.id });
        leadId = l.id;
      }
      if (!code) {
        await backfillIds("leads", "SL", `id = ${leadId}`);
        const row: any = await db.execute(sql`SELECT code FROM leads WHERE id = ${leadId}`).then((x: any) => x.rows || x);
        code = row[0]?.code || null;
      }
      await db.insert(integrationEvents).values({
        type: "IDE.borrower_application", provider: "Engines", status: "delivered", count: 1,
        payload: JSON.stringify({ email: s.email, leadId, code, at: new Date().toISOString() }),
      });
      await recordAcceptance(s.email, r.key, { leadId, code, company, amount });
    } else {
      await recordAcceptance(s.email, r.key, {});
    }
    return NextResponse.json({ ok: true, role: r.key, code });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "failed" }, { status: 500 });
  }
}
