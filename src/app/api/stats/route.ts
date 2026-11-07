import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads, batches } from "@/db/schema";
import { count, desc, eq, ilike, or, sql, sum, avg } from "drizzle-orm";

export const dynamic = "force-dynamic";

async function timed<T>(fn: () => Promise<T>) {
  const t = Date.now();
  const r = await fn();
  return { result: r, ms: Date.now() - t };
}

export async function GET() {
  try {
    const totalProbe = await timed(async () => {
      const [{ value }] = await db.select({ value: count() }).from(leads);
      return value;
    });
    const total = totalProbe.result;

    const listProbe = await timed(() => db.select().from(leads).orderBy(desc(leads.id)).limit(25));
    const searchProbe = await timed(() =>
      db.select().from(leads).where(or(ilike(leads.company, "%nova%"), ilike(leads.email, "%smith%"))).limit(25)
    );

    const byStatusRows = await db.select({ k: leads.status, v: count() }).from(leads).groupBy(leads.status);
    const bySourceRows = await db.select({ k: leads.source, v: count() }).from(leads).groupBy(leads.source);
    const byBatchRows = await db.select({ k: leads.batchLabel, v: count() }).from(leads).groupBy(leads.batchLabel);

    const [agg] = await db.select({ pipeline: sum(leads.estimatedValue), avgScore: avg(leads.score) }).from(leads);
    const batchList = await db.select().from(batches).orderBy(desc(batches.id)).limit(20);

    // DB size estimate
    let dbSize = "—";
    try {
      const rows: any = await db.execute(sql`SELECT pg_size_pretty(pg_total_relation_size('leads')) as size`);
      dbSize = rows.rows?.[0]?.size || rows[0]?.size || "—";
    } catch {}

    const lastBatch = batchList[0] || null;

    return NextResponse.json({
      total,
      pipelineValue: Number(agg?.pipeline || 0),
      avgScore: Math.round(Number(agg?.avgScore || 0)),
      byStatus: byStatusRows.map(r => ({ label: r.k, count: Number(r.v) })).sort((a,b)=>b.count-a.count),
      bySource: bySourceRows.map(r => ({ label: r.k, count: Number(r.v) })).sort((a,b)=>b.count-a.count),
      byBatch: byBatchRows.map(r => ({ label: r.k, count: Number(r.v) })).sort((a,b)=>b.count-a.count),
      batches: batchList,
      lastBatch,
      dbSize,
      probes: {
        countMs: totalProbe.ms,
        list25Ms: listProbe.ms,
        searchMs: searchProbe.ms,
        searchedRows: (searchProbe.result as any[]).length,
      },
      target: 10000,
      remaining: Math.max(0, 10000 - total),
      percent: Math.min(100, Math.round((total / 10000) * 1000) / 10),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "stats failed" }, { status: 500 });
  }
}
