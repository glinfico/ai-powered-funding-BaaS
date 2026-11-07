import { NextResponse } from "next/server";
import { db } from "@/db";
import { leads, batches, reports } from "@/db/schema";
import { count, desc, ilike, or, sql, sum, avg } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const [latest] = await db.select().from(reports).orderBy(desc(reports.id)).limit(1);
    if (!latest) return NextResponse.json({ report: null });
    return NextResponse.json({
      report: {
        ...latest,
        steps: JSON.parse(latest.stepsJson || "[]"),
        probes: JSON.parse(latest.probesJson || "{}"),
        checklist: JSON.parse(latest.checklistJson || "[]"),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ report: null, error: e?.message }, { status: 500 });
  }
}

export async function POST() {
  try {
    const t0 = Date.now();
    const [{ value: total }] = await db.select({ value: count() }).from(leads);
    const countMs = Date.now() - t0;

    const t1 = Date.now();
    const pageRows = await db.select().from(leads).orderBy(desc(leads.id)).limit(25);
    const list25Ms = Date.now() - t1;

    const t2 = Date.now();
    const searchRows = await db
      .select()
      .from(leads)
      .where(or(ilike(leads.company, "%nova%"), ilike(leads.email, "%smith%")))
      .limit(25);
    const searchMs = Date.now() - t2;

    const batchList = await db.select().from(batches).orderBy(desc(batches.id)).limit(20);
    const chronological = [...batchList].reverse();
    const combinedMs = chronological.reduce((a, b) => a + (b.durationMs || 0), 0);
    const totalInserted = chronological.reduce((a, b) => a + (b.inserted || 0), 0);
    const avgThroughput = combinedMs > 0 ? Math.round((totalInserted / combinedMs) * 1000) : 0;

    const [agg] = await db.select({ pipeline: sum(leads.estimatedValue), avgScore: avg(leads.score) }).from(leads);

    let dbSize = "—";
    try {
      const rows: any = await db.execute(sql`SELECT pg_size_pretty(pg_total_relation_size('leads')) as size`);
      dbSize = rows.rows?.[0]?.size || rows[0]?.size || "—";
    } catch {}

    const hasSeq =
      chronological.some((b) => b.inserted === 100) &&
      chronological.some((b) => b.inserted === 7900) &&
      chronological.some((b) => b.inserted === 2000);

    const probes = { countMs, list25Ms, searchMs, searchedRows: searchRows.length, pageRows: pageRows.length };
    const checklist = [
      { label: "10,000 leads loaded in one system", ok: total >= 10000, detail: `${total.toLocaleString()} / 10,000` },
      { label: "Sequence preserved: 100 → 7,900 → 2,000", ok: hasSeq, detail: hasSeq ? "All 3 batches found" : "Batch sizes differ — see Batch History" },
      { label: "Count query stays fast at scale", ok: countMs < 100, detail: `${countMs}ms` },
      { label: "Search stays fast (name / company)", ok: searchMs < 100, detail: `${searchMs}ms` },
      { label: "Pagination renders one page, not 10,000 rows", ok: list25Ms < 100, detail: `${list25Ms}ms for 25 rows` },
      { label: "System ready for morning review", ok: total >= 10000 && countMs < 100 && searchMs < 100, detail: total >= 10000 ? "No action needed — just open & check" : "Run the full sequence first" },
    ];

    const verdict = total >= 10000 ? "PASSED AT 10K" : total >= 8000 ? "AT 8,000 — TOP-UP PENDING" : total > 0 ? "IN PROGRESS" : "NOT STARTED";

    const [report] = await db
      .insert(reports)
      .values({
        title: "Morning Briefing — 10K Lead Load Test",
        totalLeads: total,
        combinedMs,
        avgThroughput,
        pipelineValue: Number(agg?.pipeline || 0),
        avgScore: Math.round(Number(agg?.avgScore || 0)),
        dbSize,
        stepsJson: JSON.stringify(chronological.map((b) => ({ label: b.label, inserted: b.inserted, durationMs: b.durationMs, throughput: b.throughput, totalAfter: b.totalAfter, createdAt: b.createdAt }))),
        probesJson: JSON.stringify(probes),
        checklistJson: JSON.stringify(checklist),
        verdict,
        note: "Prepared overnight so the completed 10,000-lead result is ready to check first thing in the morning. Data left loaded on purpose — do not clear before reviewing.",
      })
      .returning();

    return NextResponse.json({
      ok: true,
      report: { ...report, steps: JSON.parse(report.stepsJson), probes: JSON.parse(report.probesJson), checklist: JSON.parse(report.checklistJson) },
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "report failed" }, { status: 500 });
  }
}
