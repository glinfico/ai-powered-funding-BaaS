import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { activities, leads, enrichments, consentRecords } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// GET /api/crm/activities?leadId=123  → timeline for one case
// GET /api/crm/activities?recent=1   → latest activity across CRM
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  try {
    if (sp.get("leadId")) {
      const leadId = Number(sp.get("leadId"));
      const rows = await db.select().from(activities).where(eq(activities.leadId, leadId)).orderBy(desc(activities.createdAt)).limit(200);
      return NextResponse.json({ rows });
    }
    const limit = Math.min(100, Number(sp.get("limit") || 30));
    const rows = await db.select().from(activities).orderBy(desc(activities.createdAt)).limit(limit);
    return NextResponse.json({ rows });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const leadId = Number(body.leadId);
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
    const type = String(body.type || "note").slice(0, 12);
    const text = String(body.body || "").slice(0, 4000);
    const dueAt = body.dueAt ? new Date(body.dueAt) : null;
    const [row] = await db.insert(activities).values({
      leadId, type, body: text,
      dueAt: dueAt && !isNaN(dueAt.getTime()) ? dueAt : null,
      meta: JSON.stringify(body.meta || {}),
    }).returning();
    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const id = Number(body.id);
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    const set: any = {};
    if (body.done !== undefined) set.done = body.done ? 1 : 0;
    if (body.body !== undefined) set.body = String(body.body).slice(0, 4000);
    const [row] = await db.update(activities).set(set).where(eq(activities.id, id)).returning();
    return NextResponse.json({ ok: true, row });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const id = Number(req.nextUrl.searchParams.get("id"));
    if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
    await db.delete(activities).where(eq(activities.id, id));
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
