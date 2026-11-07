import { NextResponse } from "next/server";
import { db } from "@/db";
import { integrationEvents } from "@/db/schema";
import { sql } from "drizzle-orm";
import { loanHistoryFor } from "@/lib/loan-history";

export const dynamic = "force-dynamic";

// One-off, idempotent: tag purchased leads as bank-DB loan applicants and
// backfill Funded / Declined / No-Decision + amount + application date.
// Leaves consent evidence semantics aligned to the loan application.
export async function POST() {
  try {
    const missing: any[] = await db.execute(sql`
      SELECT id, score, status, created_at AS "createdAt" FROM leads
      WHERE (application_date IS NULL OR loan_amount = 0) AND acquisition_type <> 'Prospected' ORDER BY id`)
      .then((r: any) => r.rows || r);

    let updated = 0;
    const CHUNK = 500;
    for (let i = 0; i < missing.length; i += CHUNK) {
      const slice = missing.slice(i, i + CHUNK);
      const values = slice.map((l: any) => {
        const h = loanHistoryFor({ id: Number(l.id), score: Number(l.score), status: l.status, createdAt: l.createdAt });
        return sql`(${Number(l.id)}::int, ${h.loanOutcome}::text, ${h.loanAmount}::int, ${h.applicationDate.toISOString()}::timestamp, ${h.originSystem}::text)`;
      });
      await db.execute(sql`
        UPDATE leads AS l SET loan_outcome = v.outcome, loan_amount = v.amount, application_date = v.app_date, origin_system = v.origin
        FROM (VALUES ${sql.join(values, sql`, `)}) AS v(id, outcome, amount, app_date, origin)
        WHERE l.id = v.id`);
      updated += slice.length;
    }

    if (updated) {
      await db.insert(integrationEvents).values({
        type: "leads.bank_loan_history_backfilled", provider: "Engine", status: "delivered", count: updated,
        payload: JSON.stringify({ note: "Bank DB origin + loan outcome/amount/application date backfilled; consent basis aligned to loan-application consent" }),
      });
    }
    const dist: any = await db.execute(sql`SELECT loan_outcome AS k, COUNT(*)::int AS v FROM leads GROUP BY loan_outcome ORDER BY v DESC`)
      .then((r: any) => r.rows || r);
    return NextResponse.json({ ok: true, updated, distribution: dist });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "backfill failed" }, { status: 500 });
  }
}
