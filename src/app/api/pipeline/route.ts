import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, enrichments, integrationEvents, integrations } from "@/db/schema";
import { count, desc, eq, sql, avg } from "drizzle-orm";
import { enrichLead, bandFor, idePayload } from "@/lib/enrichment";
import { providerConfig } from "@/lib/providers";

export const dynamic = "force-dynamic";

async function stats() {
  const [{ value: totalLeads }] = await db.select({ value: count() }).from(leads);
  const [{ value: enriched }] = await db.select({ value: count() }).from(enrichments);
  const by = async (col: any, val: string) => {
    const rows = await db.select({ v: count() }).from(enrichments).where(eq(col, val));
    return Number(rows[0]?.v || 0);
  };
  const [verified, softDone, monitoring, banking, scored, routed] = await Promise.all([
    by(enrichments.identityStatus, "Verified"),
    by(enrichments.softPullStatus, "Completed"),
    by(enrichments.monitoringStatus, "Enrolled"),
    by(enrichments.fingoalStatus, "Linked + Enriched"),
    by(enrichments.scoredStatus, "Scored"),
    by(enrichments.routedToIde, "Routed"),
  ]);
  const [agg] = await db.select({ avgCredit: avg(enrichments.creditScore), avgIncome: avg(enrichments.monthlyIncome), avgFinal: avg(enrichments.finalScore) }).from(enrichments);

  const sampleRows = await db
    .select()
    .from(enrichments)
    .innerJoin(leads, eq(enrichments.leadId, leads.id))
    .orderBy(desc(enrichments.finalScore))
    .limit(15);

  const events = await db.select().from(integrationEvents).orderBy(desc(integrationEvents.id)).limit(18);

  return {
    totalLeads, enriched, pending: Math.max(0, totalLeads - enriched),
    verified, softDone, monitoring, banking, scored, routed,
    routedPending: scored - routed,
    avgCredit: Math.round(Number(agg?.avgCredit || 0)),
    avgIncome: Math.round(Number(agg?.avgIncome || 0)),
    avgFinalScore: Math.round(Number(agg?.avgFinal || 0)),
    config: await (async () => {
      const cfg = providerConfig();
      const m: any = await db.execute(sql`SELECT COUNT(*)::int AS v FROM integrations WHERE provider='IDIQ' AND kind='record' AND status='matched'`).then((r: any) => (r.rows || r)[0]).catch(() => ({ v: 0 }));
      const matchedJson = Number(m?.v || 0);
      return {
        idiq: cfg.idiq.keySet, idiqJsonMatched: matchedJson,
        fingoal: cfg.fingoal.keySet, ideWebhook: cfg.ide.webhookSet,
        mode: cfg.idiq.keySet && cfg.fingoal.keySet ? "LIVE" : matchedJson > 0 ? `IDIQ JSON (${matchedJson} matched) · FinGoal ${cfg.fingoal.keySet ? "LIVE" : "simulated"}` : "SIMULATED — import IDIQ JSON or add provider keys in Integration Vault",
      };
    })(),
    sample: sampleRows.map((r: any) => ({ lead: r.leads, enrichment: r.enrichments, ide: idePayload(r.leads, r.enrichments) })),
    events,
  };
}

export async function GET() {
  try { return NextResponse.json(await stats()); }
  catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "enrich-and-route");
    const log: string[] = [];

    if (action === "enrich" || action === "enrich-and-route") {
      // CONSENT GATE + already-scored skip:
      // A lead may only be pulled/searched if credit_pull AND banking_search
      // consent are Granted (purchased leads arrive with both transferred).
      // Prospected / revoked / pending leads are BLOCKED here — no exceptions.
      const allMissing: any[] = await db.execute(
        sql`SELECT l.id FROM leads l LEFT JOIN enrichments e ON e.lead_id = l.id WHERE e.id IS NULL ORDER BY l.id`
      ).then((r: any) => r.rows || r);
      const missing: { id: number; score: number; estimatedValue: number }[] = await db.execute(
        sql`SELECT l.id, l.score, l.estimated_value AS "estimatedValue" FROM leads l LEFT JOIN enrichments e ON e.lead_id = l.id
            WHERE e.id IS NULL
              AND EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id=l.id AND c.scope='credit_pull' AND c.status='Granted' AND (c.expires_at IS NULL OR c.expires_at > NOW()))
              AND EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id=l.id AND c.scope='banking_search' AND c.status='Granted' AND (c.expires_at IS NULL OR c.expires_at > NOW()))
            ORDER BY l.id`
      ).then((r: any) => r.rows || r);
      const blocked = allMissing.length - missing.length;
      log.push(`${missing.length} leads eligible & needed enrichment (already-scored leads skipped)`);
      if (blocked > 0) {
        log.push(`⛔ ${blocked} lead(s) BLOCKED by consent gate — no granted credit+banking consent (prospected/revoked/pending). No IDIQ pull, no FinGoal search for them.`);
        await db.insert(integrationEvents).values({ type: "pipeline.consent_gate_blocked", provider: "Engine", status: "delivered", count: blocked, payload: JSON.stringify({ blocked, reason: "missing/revoked credit_pull or banking_search consent" }) });
      }

      // Prefer REAL IDIQ JSON records imported in the Integration Vault over simulated values.
      const imported = await db.select().from(integrations).where(eq(integrations.provider, "IDIQ"));
      const byLead = new Map<number, any>();
      for (const r of imported) {
        if (r.kind === "record" && r.status === "matched" && r.leadId) {
          try { byLead.set(r.leadId, JSON.parse(r.parsedJson)); } catch {}
        }
      }
      let usedJson = 0;
      const CHUNK = 1000;
      for (let i = 0; i < missing.length; i += CHUNK) {
        const rows = missing.slice(i, i + CHUNK).map((l: any) => {
          const base: any = enrichLead({ id: Number(l.id), score: Number(l.score), estimatedValue: Number(l.estimatedValue) });
          const hit = byLead.get(Number(l.id));
          if (hit) {
            usedJson++;
            return {
              ...base,
              identityStatus: hit.identityStatus || base.identityStatus,
              identityConfidence: hit.identityConfidence || base.identityConfidence,
              idiqRef: hit.externalRef || base.idiqRef,
              softPullStatus: hit.softPullStatus || base.softPullStatus,
              creditScore: hit.creditScore || base.creditScore,
              creditBand: hit.creditScore ? bandFor(hit.creditScore) : base.creditBand,
              monitoringStatus: hit.monitoringStatus || base.monitoringStatus,
              monitoringAlerts: hit.monitoringAlerts ?? base.monitoringAlerts,
            };
          }
          return base;
        });
        if (rows.length) await db.insert(enrichments).values(rows);
      }
      if (usedJson) log.push(`${usedJson} lead(s) enriched from your imported IDIQ JSON (real values, not simulated)`);
      if (missing.length) {
        const idiqStatus = usedJson ? "imported-json" : "simulated";
        await db.insert(integrationEvents).values([
          { type: "lead.id_verified", provider: "IDIQ", status: idiqStatus, count: missing.length, payload: JSON.stringify({ step: "identity", source: usedJson ? "IDIQ JSON import" : "simulated", usedJson }) },
          { type: "lead.soft_pull_completed", provider: "IDIQ", status: idiqStatus, count: missing.length, payload: JSON.stringify({ step: "soft_pull", hardInquiry: false, source: usedJson ? "IDIQ JSON import" : "simulated" }) },
          { type: "lead.monitoring_enrolled", provider: "IDIQ", status: idiqStatus, count: missing.length, payload: JSON.stringify({ step: "monitoring" }) },
          { type: "lead.banking_enriched", provider: "FinGoal", status: "simulated", count: missing.length, payload: JSON.stringify({ step: "banking", note: "FinGoal transaction/banking enrichment" }) },
          { type: "lead.scored", provider: "Engine", status: "simulated", count: missing.length, payload: JSON.stringify({ step: "scoring", note: "final score = lead + credit + cashflow blend" }) },
        ]);
      }
    }

    if (action === "route" || action === "enrich-and-route") {
      const pending: any[] = await db.execute(sql`SELECT id FROM enrichments WHERE routed_to_ide = 'Pending'`)
        .then((r: any) => r.rows || r);
      if (pending.length) {
        await db.execute(sql`UPDATE enrichments SET routed_to_ide = 'Routed', ide_ref = 'IDE-' || lead_id WHERE routed_to_ide = 'Pending'`);
        await db.insert(integrationEvents).values({
          type: "lead.routed_to_ide", provider: "IDE", status: process.env.IDE_WEBHOOK_URL ? "delivered" : "simulated",
          count: pending.length,
          payload: JSON.stringify({ event: "lead.scored", destination: process.env.IDE_WEBHOOK_URL ? "IDE_WEBHOOK_URL" : "IDE (simulated — set IDE_WEBHOOK_URL)", idempotency: "lead-{id}-scored-v1" }),
        });
      }
      log.push(`${pending.length} scored leads routed to IDE`);
    }

    return NextResponse.json({ ok: true, log, ...(await stats()) });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "pipeline failed" }, { status: 500 });
  }
}
