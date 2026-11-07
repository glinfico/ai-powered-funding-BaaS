import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { deals, leads, lenders, termSheets, activities } from "@/db/schema";
import { and, count, desc, eq, ilike, or, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export const STAGES = ["Lead", "Application", "Term Sheet", "Underwriting", "Funded", "Declined", "Dead"];

// GET /api/ccd/deals?stage=X&q=...&page=1&pageSize=25
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const stage = sp.get("stage") || "";
  const q = (sp.get("q") || "").trim();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.min(100, Number(sp.get("pageSize") || 25));
  const conds: any[] = [];
  if (stage) conds.push(eq(deals.stage, stage));
  if (q) conds.push(or(ilike(deals.title, `%${q}%`), ilike(deals.product, `%${q}%`)));
  const where = conds.length ? and(...conds) : undefined;
  const [{ value: total }] = await db.select({ value: count() }).from(deals).where(where as any);
  const rows = await db.select({ deal: deals, lead: leads, lender: lenders })
    .from(deals).leftJoin(leads, eq(deals.leadId, leads.id)).leftJoin(lenders, eq(deals.lenderId, lenders.id))
    .where(where as any).orderBy(desc(deals.updatedAt)).limit(pageSize).offset((page - 1) * pageSize);
  const stageCounts = await db.select({ s: deals.stage, v: count() }).from(deals).groupBy(deals.stage);
  return NextResponse.json({ rows, total, page, pageSize, stageCounts });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const leadId = Number(b.leadId);
  if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
  const [row] = await db.insert(deals).values({
    leadId, lenderId: b.lenderId ? Number(b.lenderId) : null,
    title: String(b.title || "New deal"), product: String(b.product || "Term Loan"),
    amount: Number(b.amount) || 0, stage: String(b.stage || "Lead"),
    ratePct: Number(b.ratePct) || 0, commissionPct: Number(b.commissionPct) || 500,
    notes: String(b.notes || ""),
  } as any).returning();
  await db.insert(activities).values({ leadId, type: "system", body: `Deal created: ${row.title} (${row.stage}, ${row.amount ? "$" + row.amount.toLocaleString() : "no amount"})` });
  return NextResponse.json({ ok: true, row });
}

export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const set: any = { updatedAt: new Date() };
  for (const k of ["title", "product", "stage", "notes"]) if (b[k] !== undefined) set[k] = String(b[k]);
  for (const k of ["amount", "ratePct", "commissionPct", "lenderId"]) if (b[k] !== undefined) set[k] = Number(b[k]);
  if (b.stage === "Funded" && !b.fundedAt) { set.fundedAt = new Date(); set.closedAt = new Date(); }
  const [row] = await db.update(deals).set(set).where(eq(deals.id, id)).returning();
  if (row && b.stage) {
    await db.insert(activities).values({ leadId: row.leadId, type: "status", body: `Deal “${row.title}” → ${b.stage}` });
    if (b.stage === "Funded") await db.insert(activities).values({ leadId: row.leadId, type: "system", body: `🎉 Deal funded — $${Number(row.amount).toLocaleString()} via lender #${row.lenderId}` });
  }
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (id) await db.delete(deals).where(eq(deals.id, id));
  return NextResponse.json({ ok: true });
}

// Term sheets CRUD lives here too: /api/ccd/deals?termsFor=dealId  and POST {action:"term"}
export async function PUT(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  if (b.action === "term_create") {
    const [row] = await db.insert(termSheets).values({
      dealId: Number(b.dealId), lenderId: b.lenderId ? Number(b.lenderId) : null,
      ratePct: Number(b.ratePct) || 0, advancePct: Number(b.advancePct) || 0,
      termMonths: Number(b.termMonths) || 12, feesPct: Number(b.feesPct) || 0,
      conditions: String(b.conditions || ""), status: String(b.status || "Draft"),
    } as any).returning();
    return NextResponse.json({ ok: true, row });
  }
  if (b.action === "term_update") {
    const set: any = {};
    for (const k of ["status", "conditions"]) if (b[k] !== undefined) set[k] = String(b[k]);
    for (const k of ["ratePct", "advancePct", "termMonths", "feesPct", "lenderId"]) if (b[k] !== undefined) set[k] = Number(b[k]);
    const [row] = await db.update(termSheets).set(set).where(eq(termSheets.id, Number(b.id))).returning();
    return NextResponse.json({ ok: true, row });
  }
  return NextResponse.json({ error: "unknown action" }, { status: 400 });
}
