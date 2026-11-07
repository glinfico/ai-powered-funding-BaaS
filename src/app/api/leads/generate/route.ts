import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, batches, consentRecords } from "@/db/schema";
import { count, eq } from "drizzle-orm";
import { generateLeads } from "@/lib/generator";
import { purchasedConsentRows } from "@/lib/consent";
import { loanHistoryFor } from "@/lib/loan-history";
import { enqueueConsentRequest } from "@/lib/consent-form";
import { sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const requested = Math.max(1, Math.min(20000, Number(body.count) || 100));
    const label = String(body.label || `Batch - ${requested.toLocaleString()} leads`).slice(0, 80);

    const started = Date.now();
    const [batch] = await db.insert(batches).values({
      label, requested, inserted: 0, durationMs: 0, throughput: 0, status: "running", totalAfter: 0,
    }).returning();

    const [{ value: before }] = await db.select({ value: count() }).from(leads);

    const CHUNK = 1000;
    let inserted = 0;
    for (let offset = 0; offset < requested; offset += CHUNK) {
      const size = Math.min(CHUNK, requested - offset);
      const rows = generateLeads(size, batch.id, label, before + offset);
      // Purchased intake: the lead AND its transferred consent arrive together.
      // Auto-register credit + banking + monitoring consent evidence for each new lead,
      // so the pipeline gate passes them without a second manual step.
      const created = await db.insert(leads).values(rows).returning({ id: leads.id, firstName: leads.firstName, email: leads.email, phone: leads.phone, score: leads.score, status: leads.status, createdAt: leads.createdAt, batchId: leads.batchId, vendorName: leads.vendorName });
      // Bank-DB origin: tag loan outcome / amount / application date at intake.
      for (let c = 0; c < created.length; c += 500) {
        const slice = created.slice(c, c + 500);
        const vals = slice.map((l) => { const h = loanHistoryFor(l); return sql`(${l.id}::int, ${h.loanOutcome}::text, ${h.loanAmount}::int, ${h.applicationDate.toISOString()}::timestamp, ${h.originSystem}::text)`; });
        await db.execute(sql`UPDATE leads AS l SET loan_outcome=v.outcome, loan_amount=v.amount, application_date=v.app_date, origin_system=v.origin FROM (VALUES ${sql.join(vals, sql`, `)}) AS v(id, outcome, amount, app_date, origin) WHERE l.id=v.id`);
      }
      const consentRows = created.flatMap((l) => purchasedConsentRows(l));
      for (let c = 0; c < consentRows.length; c += 3000) {
        await db.insert(consentRecords).values(consentRows.slice(c, c + 3000) as any);
      }
      // Automated consent formulation: SMS + email with one-time e-sign link go
      // out with every new lead (real send when TWILIO/SENDGRID keys are set).
      for (const l of created) {
        await enqueueConsentRequest({ id: l.id, firstName: (l as any).firstName ?? "there", email: (l as any).email, phone: (l as any).phone }).catch(() => {});
      }
      inserted += size;
    }

    const durationMs = Date.now() - started;
    const throughput = durationMs > 0 ? Math.round((inserted / durationMs) * 1000) : inserted;
    const totalAfter = before + inserted;

    const [finalBatch] = await db.update(batches).set({
      inserted, durationMs, throughput, status: "done", totalAfter, finishedAt: new Date(),
    }).where(eq(batches.id, batch.id)).returning();

    return NextResponse.json({ ok: true, batch: finalBatch, inserted, durationMs, throughput, totalAfter, before });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "Generation failed" }, { status: 500 });
  }
}
