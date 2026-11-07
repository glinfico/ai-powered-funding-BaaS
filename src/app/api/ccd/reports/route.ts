import { NextResponse } from "next/server";
import { db } from "@/db";
import { deals, leads, lenders, activities } from "@/db/schema";
import { count, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const stageRows: any = await db.execute(sql`SELECT stage, COUNT(*)::int AS v, COALESCE(SUM(amount),0)::bigint AS amt FROM deals GROUP BY stage ORDER BY v DESC`).then((r: any) => r.rows || r);
    const productRows: any = await db.execute(sql`SELECT product, COUNT(*)::int AS v, COALESCE(SUM(amount),0)::bigint AS amt FROM deals GROUP BY product ORDER BY amt DESC`).then((r: any) => r.rows || r);
    const lenderRows: any = await db.execute(sql`SELECT COALESCE(l.name,'—') AS name, COUNT(d.id)::int AS v, COALESCE(SUM(d.amount),0)::bigint AS amt, COALESCE(SUM(CASE WHEN d.stage='Funded' THEN d.amount * d.commission_pct / 10000.0 ELSE 0 END),0)::bigint AS comm FROM deals d LEFT JOIN lenders l ON l.id=d.lender_id GROUP BY l.name ORDER BY amt DESC`).then((r: any) => r.rows || r);
    const funded: any = await db.execute(sql`SELECT COUNT(*)::int AS v, COALESCE(SUM(amount),0)::bigint AS volume, COALESCE(SUM(amount * commission_pct / 10000.0),0)::bigint AS comm FROM deals WHERE stage='Funded'`).then((r: any) => (r.rows || r)[0]);
    const leadStatus: any = await db.execute(sql`SELECT status AS label, COUNT(*)::int AS v FROM leads GROUP BY status ORDER BY v DESC`).then((r: any) => r.rows || r);
    const loanOutcome: any = await db.execute(sql`SELECT loan_outcome AS label, COUNT(*)::int AS v FROM leads GROUP BY loan_outcome ORDER BY v DESC`).then((r: any) => r.rows || r);
    const openTasks: any = await db.execute(sql`SELECT COUNT(*)::int AS v FROM activities WHERE type='task' AND done=0`).then((r: any) => (r.rows || r)[0]);
    const recentActs = await db.select().from(activities).orderBy(sql`created_at DESC`).limit(10);
    return NextResponse.json({
      stageRows, productRows, lenderRows,
      funded: { count: Number(funded.v || 0), volume: Number(funded.volume || 0), commission: Number(funded.comm || 0) },
      leadStatus, loanOutcome, openTasks: Number(openTasks.v || 0), recentActs,
      totalDeals: stageRows.reduce((a: number, r: any) => a + Number(r.v), 0),
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
