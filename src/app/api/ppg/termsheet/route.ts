import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { ensureReiSchema } from "@/lib/rei";

export const dynamic = "force-dynamic";

// POST /api/ppg/termsheet { id, action: "approve" | "decline" | "counter", note? }
// A lender can only answer term sheets sent to THEIR lender profile, while still open (status Sent).
export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok || (s.role !== "lender" && s.role !== "admin")) return NextResponse.json({ ok: false, error: "Lender sign-in required" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id) || 0;
  const action = String(b.action || "");
  const note = String(b.note || "").trim().slice(0, 1000);
  if (!id || !["approve", "decline", "counter"].includes(action)) return NextResponse.json({ ok: false, error: "id and a valid action are required" }, { status: 400 });
  if (action === "counter" && !note) return NextResponse.json({ ok: false, error: "Add a note describing your counter-offer" }, { status: 400 });

  await ensureReiSchema();
  const [ts]: any[] = await db.execute(sql`SELECT t.id, t.deal_id, t.lender_id, t.status, t.due_at, l.contact_email, l.name AS lender_name, d.lead_id
    FROM term_sheets t JOIN lenders l ON l.id = t.lender_id JOIN deals d ON d.id = t.deal_id WHERE t.id = ${id}`).then((r: any) => r.rows || r);
  if (!ts) return NextResponse.json({ ok: false, error: "Term sheet not found" }, { status: 404 });
  if (s.role === "lender" && String(ts.contact_email || "").toLowerCase() !== s.email.toLowerCase()) {
    return NextResponse.json({ ok: false, error: "This term sheet was not sent to you" }, { status: 403 });
  }
  if (ts.status !== "Sent") return NextResponse.json({ ok: false, error: `This term sheet is already ${ts.status}` }, { status: 409 });
  if (ts.due_at && new Date(ts.due_at) < new Date()) return NextResponse.json({ ok: false, error: "The 24-hour window has passed" }, { status: 410 });

  const status = action === "approve" ? "Accepted" : action === "decline" ? "Rejected" : "Countered";
  await db.execute(sql`UPDATE term_sheets SET status=${status}, responded_at=NOW(), response_note=${note} WHERE id=${id}`);
  if (action === "approve") {
    await db.execute(sql`UPDATE deals SET stage='Approved', updated_at=NOW() WHERE id=${ts.deal_id}`);
  } else if (action === "decline") {
    await db.execute(sql`UPDATE deals SET stage='Application', lender_id=NULL, updated_at=NOW() WHERE id=${ts.deal_id}`); // ACE sends to next lender
  } else {
    await db.execute(sql`UPDATE deals SET stage='Counter', updated_at=NOW() WHERE id=${ts.deal_id}`);
  }
  await db.execute(sql`INSERT INTO activities (lead_id, type, body) VALUES (${ts.lead_id}, 'system',
    ${`Lender ${ts.lender_name} ${status.toLowerCase()} term sheet #${id}${note ? ` — "${note}"` : ""} (by ${s.email})`})`);
  return NextResponse.json({ ok: true, id, status });
}
