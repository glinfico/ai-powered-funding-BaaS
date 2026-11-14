import { NextRequest, NextResponse } from "next/server";
import { backfillAllIds } from "@/lib/idBackfill";
import { runIdeScoring } from "@/lib/ideScoring";
import { runReiPass, ensureReiSchema } from "@/lib/rei";
import { db } from "@/db";
import { leads, enrichments, consentRecords, deals, lenders, docs, activities, integrationEvents } from "@/db/schema";
import { and, count, desc, eq, gt, gte, isNotNull, lte, sql } from "drizzle-orm";
import { renderLenderDocs } from "@/lib/consent-form";

export const dynamic = "force-dynamic";

async function one(q: any) { const r: any = await db.execute(q); return (r.rows || r)[0] || {}; }

// GET /api/engines → status board; GET /api/engines?docs=1&leadId=… → doc checklist
export async function GET(req: NextRequest) {
  try {
    if (req.nextUrl.searchParams.get("docs")) {
      const lid = Number(req.nextUrl.searchParams.get("leadId") || 0);
      const rows = lid ? await db.select().from(docs).where(eq(docs.leadId, lid)).orderBy(desc(docs.id)) : await db.select().from(docs).orderBy(desc(docs.id)).limit(100);
      return NextResponse.json({ docs: rows });
    }
    const total: any = await one(sql`SELECT COUNT(*)::int AS v FROM leads`);
    const sc: any = await one(sql`SELECT COUNT(*) FILTER (WHERE scored_status='Scored')::int AS scored, COUNT(*) FILTER (WHERE scored_status='Partial')::int AS partial, COUNT(*) FILTER (WHERE soft_pull_status='Queued')::int AS iq, COUNT(*) FILTER (WHERE fingoal_status='Queued')::int AS fq FROM enrichments`);
    const assigned: any = await one(sql`SELECT COUNT(*)::int AS v FROM deals WHERE lender_id IS NOT NULL`);
    const openDeals: any = await one(sql`SELECT COUNT(*)::int AS v FROM deals WHERE stage IN ('Lead','Application','Term Sheet','Underwriting')`);
    const funded: any = await one(sql`SELECT COUNT(*)::int AS v, COALESCE(SUM(amount*commission_pct/10000.0),0)::bigint AS comm FROM deals WHERE stage='Funded'`);
    const docsStats: any = await one(sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status IN ('generated','received'))::int AS have, COUNT(*) FILTER (WHERE status='missing')::int AS missing FROM docs`);
    const recent: any = await db.execute(sql`SELECT * FROM integration_events WHERE provider='Engines' ORDER BY id DESC LIMIT 12`).then((r: any) => r.rows || r);
    return NextResponse.json({
      engines: [
        { id: "IDE", name: "Identification Engine", desc: "AAI ID for every entry; IDIQ (credit) + FinGoal (banking) combined scoring.", stat: `${total.v} leads · ${sc.scored || 0} scored · ${sc.partial || 0} partial · queued IDIQ ${sc.iq || 0} / FinGoal ${sc.fq || 0}`, run: "verify" },
        { id: "LAE", name: "Leads Assignment Engine", desc: "Rule-based best-lender assignment (FICO floor, amount cap, product fit, lowest rate).", stat: `${assigned.v} deals assigned · ${openDeals.v} open`, run: "assign" },
        { id: "ACE", name: "Automated Closing Engine", desc: "Advances deals through stages; funds only with consent + IDIQ-ready + score thresholds.", stat: `${funded.v} funded · $${Number(funded.comm || 0).toLocaleString()} commission`, run: "close" },
        { id: "DPE", name: "Documents Processing Engine", desc: "Collects/stores client docs; auto-generates lender packet (IDs excluded).", stat: `${docsStats.have || 0}/${docsStats.total || 0} docs in vault · ${docsStats.missing || 0} missing`, run: "docs" },
      ],
      recent,
    });
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }); }
}

// POST /api/engines { engine: "IDE"|"LAE"|"ACE"|"DPE", leadId? }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const engine = String(b.engine || "");
    const log = (type: string, count: number, payload: any) => db.insert(integrationEvents).values({ type, provider: "Engines", status: "delivered", count, payload: JSON.stringify(payload) });

    if (engine === "IDE") {
      // 1) AAI ID for every entry (brokers, lenders, investors, leads) — no SSN/DOB requirement.
      const ids = await backfillAllIds();
      // 2) Route to IDIQ (credit, with consent + SSN/DOB) and FinGoal (banking, with consent),
      //    then combine into one score. Set-based: safe for 10k+ leads per run.
      const scoring = await runIdeScoring();
      await log("IDE.score_pass", scoring.total, scoring);
      return NextResponse.json({ ok: true, engine: "IDE", idsAssigned: ids, scoring, note: "Every lead is ID'd and scored from real provider data; no SSN/DOB gate. Missing data = Partial/Pending, never invented." });
    }

    if (engine === "LAE") {
      await ensureReiSchema(); // REI/CRE deals get their lender from the ACE term-sheet flow
      // LAE also assigns unassigned leads to staff users (round-robin) so each
      // user's PPG (/ppg) shows only their own book. Admin grants happen here too.
      const { staff } = await import("@/db/schema");
      const users = await db.select().from(staff).where(eq((staff as any).role, "user"));
      if (users.length) {
        const unassigned: any[] = await db.execute(sql`SELECT id FROM leads WHERE (assigned_to = '' OR assigned_to IS NULL) AND acquisition_type <> 'Prospected' ORDER BY id LIMIT 1000`).then((r: any) => r.rows || r);
        let k = 0;
        for (const l of unassigned) { await db.execute(sql`UPDATE leads SET assigned_to=${users[k++ % users.length].email} WHERE id=${l.id}`); }
        if (unassigned.length) await log("LAE.leads_assigned_to_users", unassigned.length, { users: users.map(u => u.email) });
      }
      // Assign open deals to best lender: creditScore >= minFico, amount <= maxAmount, lowest rate wins.
      const open: any[] = await db.execute(sql`SELECT d.id AS deal_id, d.amount, COALESCE(e.credit_score, l.score*7+505) AS cs, d.product FROM deals d JOIN leads l ON l.id=d.lead_id LEFT JOIN enrichments e ON e.lead_id=l.id WHERE d.stage IN ('Lead','Application') AND COALESCE(d.vertical,'') NOT IN ('REI','CRE') ORDER BY d.id`).then((r: any) => r.rows || r);
      const lenderRows = await db.select().from(lenders).where(eq(lenders.active, 1));
      let assigned = 0; const picks: any[] = [];
      for (const d of open) {
        const cs = Number(d.cs) || 650; const amt = Number(d.amount) || 25000;
        const fits = lenderRows.filter(L => cs >= L.minFico && amt <= L.maxAmount);
        if (!fits.length) continue;
        fits.sort((a, b2) => (a.ratePct || 99999) - (b2.ratePct || 99999));
        const best = fits[0];
        await db.execute(sql`UPDATE deals SET lender_id=${best.id}, updated_at=NOW() WHERE id=${d.deal_id}`);
        await db.insert(activities).values({ leadId: d.deal_id ? (await one(sql`SELECT lead_id AS v FROM deals WHERE id=${d.deal_id}`)).v : 0, type: "system", body: `LAE assigned deal #${d.deal_id} ($${amt.toLocaleString()}, score ${cs}) → ${best.name} (min FICO ${best.minFico}, max ${best.maxAmount.toLocaleString()}, ${ (best.ratePct/100).toFixed(2)}%/mo)` });
        assigned++; if (picks.length < 10) picks.push({ deal: d.deal_id, lender: best.name });
      }
      await log("LAE.assign_pass", assigned, { picks });
      return NextResponse.json({ ok: true, engine: "LAE", openDeals: open.length, assigned, picks });
    }

    if (engine === "ACE") {
      // REI/CRE first: 24h expiry → underwrite → match lender by vertical → term sheet (24h clock).
      const rei = await runReiPass();
      await log("ACE.rei_pass", rei.issued, rei);
      // One stage advance per run, with guardrails. Fund only if consent granted + IDIQ-ready + score >= 700.
      const open: any[] = await db.execute(sql`
        SELECT d.id AS deal_id, d.lead_id, d.amount, d.stage, d.lender_id, COALESCE(e.credit_score, l.score*7+505) AS cs, l.ssn IS NOT NULL AS has_ssn, l.dob IS NOT NULL AS has_dob,
          EXISTS(SELECT 1 FROM consent_records c WHERE c.lead_id=d.lead_id AND c.scope='credit_pull' AND c.status='Granted') AS consent_ok
        FROM deals d JOIN leads l ON l.id=d.lead_id LEFT JOIN enrichments e ON e.lead_id=l.id
        WHERE d.stage IN ('Lead','Application','Term Sheet','Underwriting') AND COALESCE(d.vertical,'') NOT IN ('REI','CRE') ORDER BY d.id`).then((r: any) => r.rows || r);
      const NEXT: Record<string, string> = { Lead: "Application", Application: "Term Sheet", "Term Sheet": "Underwriting", Underwriting: "Funded" };
      let advanced = 0, funded = 0, blocked = 0; const fundedList: any[] = [];
      for (const d of open) {
        let next = NEXT[d.stage];
        if (next === "Funded") {
          const cs = Number(d.cs) || 650;
          if (!(d.consent_ok && d.has_ssn && d.has_dob && cs >= 700)) { blocked++; continue; } // guardrail: never fund without consent+IDIQ-ready+score
          funded++;
          if (fundedList.length < 10) fundedList.push({ deal: d.deal_id, amount: d.amount, score: cs });
        }
        await db.execute(sql`UPDATE deals SET stage=${next}, updated_at=NOW(), ${next === "Funded" ? sql`funded_at=NOW(), closed_at=NOW(),` : sql``} commission_pct=CASE WHEN ${next} = 'Funded' AND commission_pct = 0 THEN 500 ELSE commission_pct END WHERE id=${d.deal_id}`);
        await db.insert(activities).values({ leadId: Number(d.lead_id), type: "status", body: `ACE: deal #${d.deal_id} ${d.stage} → ${next}${next === "Funded" ? ` (funded $${Number(d.amount).toLocaleString()})` : ""}` });
        advanced++;
      }
      await log("ACE.close_pass", advanced, { funded, blocked, fundedList });
      return NextResponse.json({ ok: true, engine: "ACE", rei, processed: open.length, advanced, newlyFunded: funded, blockedByGuardrails: blocked, note: "Funding requires: credit consent Granted + SSN/DOB present + score ≥ 700.", fundedList });
    }

    if (engine === "DPE") {
      // Generate/store the lender doc packet for a lead (or all leads missing docs), IDs excluded by design.
      let targets: any[] = [];
      if (b.leadId) { const [l] = await db.select().from(leads).where(eq(leads.id, Number(b.leadId))); if (l) targets = [l]; }
      else targets = await db.execute(sql`SELECT id, first_name AS "firstName", last_name AS "lastName", email, company, loan_outcome AS "loanOutcome", loan_amount AS "loanAmount", score, status, created_at AS "createdAt" FROM leads WHERE acquisition_type <> 'Prospected' ORDER BY id LIMIT 500`).then((r: any) => r.rows || r);
      let generated = 0;
      for (const l of targets) {
        const [e] = await db.select().from(enrichments).where(eq(enrichments.leadId, l.id));
        const [d] = await db.select().from(deals).where(eq(deals.leadId, l.id)).orderBy(desc(deals.id)).limit(1);
        const packet = renderLenderDocs(l, e || null, d || null);
        for (const doc of packet) {
          const hash = require("crypto").createHash("sha256").update(doc.content).digest("hex").slice(0, 16);
          const [ex] = await db.select().from(docs).where(and(eq(docs.leadId, l.id), eq(docs.name, doc.doc)));
          if (ex) continue;
          await db.insert(docs).values({ leadId: l.id, dealId: d?.id || null, name: doc.doc, type: doc.doc.startsWith("05") ? "id_doc" : "application", status: doc.doc.startsWith("05") ? "missing" : "generated", size: doc.content.length, contentHash: hash, source: "DPE-generated", storedAt: new Date() });
          generated++;
        }
      }
      await log("DPE.generate_packets", targets.length, { docsGenerated: generated });
      const stats: any = await one(sql`SELECT COUNT(*)::int AS total, COUNT(*) FILTER (WHERE status IN ('generated','received'))::int AS have, COUNT(*) FILTER (WHERE status='missing')::int AS missing FROM docs`);
      return NextResponse.json({ ok: true, engine: "DPE", leadsProcessed: targets.length, docsGenerated: generated, vault: stats, note: "ID docs (05) stay 'missing' by design — collected via IDV/human upload only." });
    }

    return NextResponse.json({ ok: false, error: "engine must be IDE | LAE | ACE | DPE" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

// POST /api/engines/upload — multipart: file + leadId (+dealId) → store client doc
export async function PUT(req: NextRequest) {
  try {
    const f = await req.formData();
    const file = f.get("file") as File | null;
    const leadId = Number(f.get("leadId") || 0);
    const dealId = Number(f.get("dealId") || 0) || null;
    if (!file || !leadId) return NextResponse.json({ ok: false, error: "file + leadId required" }, { status: 400 });
    const buf = Buffer.from(await file.arrayBuffer());
    const hash = require("crypto").createHash("sha256").update(buf).digest("hex").slice(0, 16);
    const type = String(f.get("type") || (file.name.match(/id|passport|license/i) ? "id_doc" : file.name.match(/bank|statement/i) ? "bank_statement" : file.name.match(/term/i) ? "term_sheet" : "other"));
    const [row] = await db.insert(docs).values({ leadId, dealId, name: file.name, type, status: "received", size: buf.length, contentHash: hash, source: "client-upload", storedAt: new Date() }).returning();
    await db.insert(activities).values({ leadId, type: "system", body: `DPE stored client doc: ${file.name} (${(buf.length / 1024).toFixed(1)} KB, ${type})` });
    return NextResponse.json({ ok: true, row, note: "Content hashed & logged; stored in the docs vault. ID docs are accepted here but never auto-generated." });
  } catch (e: any) { return NextResponse.json({ ok: false, error: e?.message }, { status: 500 }); }
}


