import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, batches, reports, enrichments, integrationEvents, integrations, consentRecords, activities, deals, termSheets, lenders, investors, docs } from "@/db/schema";
import { and, count, desc, asc, eq, ilike, or } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const status = sp.get("status") || "";
  const source = sp.get("source") || "";
  const batch = sp.get("batch") || "";
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(sp.get("pageSize") || 25)));
  const sort = sp.get("sort") || "newest";

  const conds: any[] = [];
  if (q) conds.push(or(ilike(leads.firstName, `%${q}%`), ilike(leads.lastName, `%${q}%`), ilike(leads.email, `%${q}%`), ilike(leads.company, `%${q}%`)));
  if (status) conds.push(eq(leads.status, status));
  if (source) conds.push(eq(leads.source, source));
  if (batch) conds.push(eq(leads.batchLabel, batch));
  const where = conds.length ? and(...conds) : undefined;

  const t0 = Date.now();
  const [{ value: total }] = await db.select({ value: count() }).from(leads).where(where as any);
  const countMs = Date.now() - t0;

  const order = sort === "score" ? desc(leads.score) : sort === "value" ? desc(leads.estimatedValue) : sort === "oldest" ? asc(leads.id) : sort === "name" ? asc(leads.lastName) : desc(leads.id);

  const t1 = Date.now();
  const data = await db.select().from(leads).where(where as any).orderBy(order).limit(pageSize).offset((page - 1) * pageSize);
  const queryMs = Date.now() - t1;

  return NextResponse.json({
    data, total, page, pageSize, pageCount: Math.max(1, Math.ceil(total / pageSize)),
    timings: { countMs, queryMs, totalMs: Date.now() - t0 },
  });
}

export async function DELETE() {
  await db.delete(enrichments).catch(() => {});
  await db.delete(activities).catch(() => {});
  await db.delete(docs).catch(() => {});
  await db.delete(deals).catch(() => {});
  await db.delete(termSheets).catch(() => {});
  await db.delete(lenders).catch(() => {});
  await db.delete(investors).catch(() => {});
  await db.delete(consentRecords).catch(() => {});
  await db.delete(integrations).catch(() => {});
  await db.delete(integrationEvents).catch(() => {});
  await db.delete(leads);
  await db.delete(batches);
  try { await db.delete(reports); } catch {}
  return NextResponse.json({ ok: true });
}
