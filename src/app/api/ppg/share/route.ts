import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { ensureSyndicationSchema } from "@/lib/syndication";

export const dynamic = "force-dynamic";

// POST /api/ppg/share { id, action: "commit" | "decline", note? }
// Lenders/investors answer THEIR OWN syndicate share request (matched by contact email), within 24h.
export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok || !["lender", "investor", "admin"].includes(s.role)) return NextResponse.json({ ok: false, error: "Sign-in required" }, { status: 401 });
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id) || 0, action = String(b.action || ""), note = String(b.note || "").trim().slice(0, 1000);
  if (!id || !["commit", "decline"].includes(action)) return NextResponse.json({ ok: false, error: "id and a valid action are required" }, { status: 400 });
  await ensureSyndicationSchema();
  const [sh]: any[] = await db.execute(sql`SELECT s.*, d.lead_id,
      CASE WHEN s.party_type='lender' THEN (SELECT contact_email FROM lenders WHERE id=s.party_id)
           ELSE (SELECT contact_email FROM investors WHERE id=s.party_id) END AS email
    FROM syndicate_shares s JOIN deals d ON d.id=s.deal_id WHERE s.id=${id}`).then((r: any) => r.rows || r);
  if (!sh) return NextResponse.json({ ok: false, error: "Share request not found" }, { status: 404 });
  if (s.role !== "admin" && (sh.party_type !== s.role || String(sh.email || "").toLowerCase() !== s.email.toLowerCase())) {
    return NextResponse.json({ ok: false, error: "This share request was not sent to you" }, { status: 403 });
  }
  if (sh.status !== "Requested") return NextResponse.json({ ok: false, error: `This request is already ${sh.status}` }, { status: 409 });
  if (sh.due_at && new Date(sh.due_at) < new Date()) return NextResponse.json({ ok: false, error: "The 24-hour window has passed" }, { status: 410 });
  const status = action === "commit" ? "Committed" : "Declined";
  await db.execute(sql`UPDATE syndicate_shares SET status=${status}, responded_at=NOW(), note=${note} WHERE id=${id}`);
  await db.execute(sql`INSERT INTO activities (lead_id, type, body) VALUES (${sh.lead_id}, 'system',
    ${`Syndicate: ${sh.party_name} ${status.toLowerCase()} $${Number(sh.amount).toLocaleString()} (${sh.role}) on deal #${sh.deal_id} (by ${s.email})`})`);
  return NextResponse.json({ ok: true, id, status });
}
