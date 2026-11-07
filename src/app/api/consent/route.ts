import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, consentRecords, enrichments, integrationEvents } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { purchasedConsentRows } from "@/lib/consent";

export const dynamic = "force-dynamic";

async function one(q: any) { const r: any = await db.execute(q); return (r.rows || r)[0] || {}; }

async function summary() {
  const totals: any = await one(sql`
    SELECT
      (SELECT COUNT(*)::int FROM leads) AS total_leads,
      (SELECT COUNT(*)::int FROM leads WHERE acquisition_type='Purchased') AS purchased,
      (SELECT COUNT(*)::int FROM leads WHERE acquisition_type='Prospected') AS prospected,
      (SELECT COUNT(*)::int FROM consent_records) AS records,
      (SELECT COUNT(*)::int FROM consent_records WHERE scope='credit_pull' AND status='Granted') AS credit_granted,
      (SELECT COUNT(*)::int FROM consent_records WHERE scope='banking_search' AND status='Granted') AS banking_granted,
      (SELECT COUNT(*)::int FROM consent_records WHERE scope='monitoring' AND status='Granted') AS monitoring_granted,
      (SELECT COUNT(*)::int FROM consent_records WHERE status='Revoked') AS revoked,
      (SELECT COUNT(*)::int FROM consent_records WHERE status='Pending') AS pending
  `);
  const both: any = await one(sql`
    SELECT COUNT(*)::int AS v FROM leads l
    WHERE EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id=l.id AND c.scope='credit_pull' AND c.status='Granted')
      AND EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id=l.id AND c.scope='banking_search' AND c.status='Granted')`);
  const without: any = await one(sql`SELECT COUNT(*)::int AS v FROM leads l WHERE NOT EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id=l.id)`);

  const sampleRows: any[] = await db.execute(sql`
    SELECT l.id, l.first_name, l.last_name, l.email, l.acquisition_type, l.vendor_name,
      MAX(CASE WHEN c.scope='credit_pull' THEN c.status END) AS credit_status,
      MAX(CASE WHEN c.scope='banking_search' THEN c.status END) AS banking_status,
      MAX(CASE WHEN c.scope='monitoring' THEN c.status END) AS monitoring_status,
      MAX(c.evidence_ref) AS evidence_ref, MIN(c.captured_at) AS captured_at, MAX(c.expires_at) AS expires_at,
      (SELECT e.scored_status FROM enrichments e WHERE e.lead_id=l.id LIMIT 1) AS scored_status
    FROM leads l LEFT JOIN consent_records c ON c.lead_id=l.id
    GROUP BY l.id ORDER BY l.acquisition_type DESC, l.id DESC LIMIT 15`).then((r: any) => r.rows || r);

  const outcomes: any = await db.execute(sql`SELECT loan_outcome AS label, COUNT(*)::int AS count, COALESCE(SUM(loan_amount),0)::bigint AS amount FROM leads GROUP BY loan_outcome ORDER BY count DESC`).then((r: any) => r.rows || r).catch(() => []);
  return {
    ...totals, bothGranted: Number(both.v || 0), noConsent: Number(without.v || 0),
    blockedFromPipeline: Number(totals.total_leads || 0) - Number(both.v || 0),
    sample: sampleRows, loanOutcomes: outcomes,
    origin: "Bank DB — Loan Application: consent was given in the loan application itself; the lead (and consent) transferred from the bank's database. Most applicants were already decided — funded or declined — before purchase.",
    principle: "Pipeline gate: a lead may only enter IDIQ (credit) + FinGoal (banking) if BOTH credit_pull and banking_search consent are Granted and not expired/revoked. Bank-DB purchased leads arrive with that consent transferred; prospected leads arrive with none.",
  };
}

export async function GET() {
  try { return NextResponse.json(await summary()); }
  catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "register_purchased") {
      const missing: any[] = await db.execute(sql`
        SELECT l.id, l.created_at AS "createdAt", l.batch_id AS "batchId", l.vendor_name AS "vendorName"
        FROM leads l WHERE NOT EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id=l.id) ORDER BY l.id`)
        .then((r: any) => r.rows || r);
      const CHUNK = 1500; // rows (500 leads x 3 scopes)
      let insertedLeads = 0;
      for (let i = 0; i < missing.length; i += 500) {
        const rows = missing.slice(i, i + 500).flatMap((l: any) => purchasedConsentRows({ id: Number(l.id), createdAt: l.createdAt, batchId: l.batchId, vendorName: l.vendorName }));
        if (rows.length) { await db.insert(consentRecords).values(rows.slice(0, CHUNK * 3) as any); insertedLeads += Math.min(500, missing.length - i); }
      }
      if (missing.length) await db.insert(integrationEvents).values({ type: "consent.purchased_registered", provider: "Engine", status: "delivered", count: missing.length, payload: JSON.stringify({ basis: "Purchased-Transferred", scopes: ["credit_pull", "banking_search", "monitoring"], note: "Seller-captured consent transferred with purchased leads; evidence ref + capture date stored per lead/scope" }) });
      return NextResponse.json({ ok: true, registered: missing.length, ...(await summary()) });
    }

    if (action === "revoke" || action === "restore") {
      const leadId = Number(body.leadId);
      if (!leadId) return NextResponse.json({ ok: false, error: "leadId required" }, { status: 400 });
      if (action === "revoke") {
        await db.execute(sql`UPDATE consent_records SET status='Revoked', revoked_at=NOW() WHERE lead_id=${leadId}`);
        await db.insert(integrationEvents).values({ type: "consent.revoked", provider: "Engine", status: "delivered", count: 1, payload: JSON.stringify({ leadId, note: "All scopes revoked — lead is blocked from any future pull/search and must be suppressed" }) });
      } else {
        await db.execute(sql`UPDATE consent_records SET status='Granted', revoked_at=NULL WHERE lead_id=${leadId}`);
        await db.insert(integrationEvents).values({ type: "consent.restored", provider: "Engine", status: "delivered", count: 1, payload: JSON.stringify({ leadId }) });
      }
      return NextResponse.json({ ok: true, ...(await summary()) });
    }

    if (action === "create_prospect_demo") {
      const existing: any = await one(sql`SELECT id FROM leads WHERE acquisition_type='Prospected' ORDER BY id DESC LIMIT 1`);
      if (existing?.id) return NextResponse.json({ ok: true, demoLeadId: Number(existing.id), note: "Prospect demo already exists — check the ledger, it has NO credit/banking consent and is blocked.", ...(await summary()) });
      const [lead] = await db.insert(leads).values({
        firstName: "Prospect", lastName: "Demo", email: `prospect.demo.${Date.now()}@example.com`,
        phone: "+1 (555) 010-0100", company: "— (not yet a customer)", jobTitle: "—", source: "Prospecting (future)",
        status: "New", score: 0, estimatedValue: 0, city: "—", country: "USA",
        batchLabel: "Prospecting Demo — NO CONSENT", acquisitionType: "Prospected", vendorName: "— (self-sourced)",
      }).returning();
      await db.insert(consentRecords).values([
        { leadId: lead.id, scope: "communications", status: "Pending", basis: "None", vendorName: "—", evidenceRef: "", consentTextVersion: "none — outreach consent not captured" },
        { leadId: lead.id, scope: "credit_pull", status: "Pending", basis: "None", vendorName: "—", evidenceRef: "", consentTextVersion: "none — cannot pull until consumer opts in" },
        { leadId: lead.id, scope: "banking_search", status: "Pending", basis: "None", vendorName: "—", evidenceRef: "", consentTextVersion: "none — cannot search until consumer opts in" },
      ]);
      await db.insert(integrationEvents).values({ type: "lead.prospect_created_blocked", provider: "Engine", status: "delivered", count: 1, payload: JSON.stringify({ leadId: lead.id, note: "Prospected lead created with NO consent — pipeline gate will skip it. This lane would need Twilio + opt-in capture before anything else." }) });
      return NextResponse.json({ ok: true, demoLeadId: lead.id, ...(await summary()) });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "consent failed" }, { status: 500 });
  }
}
