// REI / CRE vertical for the ACE: classification, underwriting (same thresholds as the
// PFE REI Deal Analyzer), lender matching by vertical, term sheets with a 24-hour lender
// response window, and automatic reassignment to the next lender on expiry.
import { db } from "@/db";
import { sql } from "drizzle-orm";

const rows = async (q: any): Promise<any[]> => db.execute(q).then((r: any) => r.rows || r);

export type Vertical = "REI" | "CRE" | "MA" | "MCA";

export async function ensureReiSchema() {
  await db.execute(sql.raw(`ALTER TABLE deals
    ADD COLUMN IF NOT EXISTS vertical text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS metrics text DEFAULT '{}' NOT NULL,
    ADD COLUMN IF NOT EXISTS uw_status text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS uw_notes text DEFAULT '' NOT NULL`));
  await db.execute(sql.raw(`ALTER TABLE lenders ADD COLUMN IF NOT EXISTS verticals text DEFAULT '' NOT NULL`));
  await db.execute(sql.raw(`ALTER TABLE term_sheets
    ADD COLUMN IF NOT EXISTS sent_at timestamp,
    ADD COLUMN IF NOT EXISTS due_at timestamp,
    ADD COLUMN IF NOT EXISTS responded_at timestamp,
    ADD COLUMN IF NOT EXISTS response_note text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS round integer DEFAULT 1 NOT NULL`));
  // Derive lender verticals once from their product text (editable afterwards).
  await db.execute(sql.raw(`UPDATE lenders SET verticals = TRIM(BOTH ',' FROM CONCAT_WS(',',
      CASE WHEN products ~* '(real estate|bridge|fix|flip|rental|dscr|construction|property)' THEN 'REI' END,
      CASE WHEN products ~* '(commercial|cre|bridge|construction|property|real estate)' THEN 'CRE' END,
      CASE WHEN products ~* '(acquisition|m&a|buyout|sba)' THEN 'MA' END,
      CASE WHEN products ~* '(merchant|mca|revenue|working capital|invoice|factoring|line|term|equipment)' THEN 'MCA' END))
    WHERE verticals = ''`));
}

export function classify(text: string): Vertical {
  const t = (text || "").toLowerCase();
  if (/(commercial real estate|\bcre\b|commercial property|multifamily|office|retail center|industrial)/.test(t)) return "CRE";
  if (/(real estate|\brei\b|property|rental|fix.?and.?flip|flip|bridge|dscr|residential)/.test(t)) return "REI";
  if (/(acquisition|m&a|merger|buyout|business sale|valuation)/.test(t)) return "MA";
  return "MCA";
}

type Metrics = { ltv?: number; ltc?: number; dscr?: number; maoDelta?: number; arv?: number; purchasePrice?: number; rehabCost?: number; capRate?: number };

/** Same thresholds the PFE REI Deal Analyzer shows to borrowers. */
export function underwrite(vertical: Vertical, amount: number, m: Metrics) {
  const limits = vertical === "CRE" ? { ltv: 75, ltc: 85, dscr: 1.25 } : { ltv: 80, ltc: 90, dscr: 1.25 };
  const notes: string[] = [];
  const has = (v: unknown) => typeof v === "number" && Number.isFinite(v);
  if (!amount) return { status: "Needs info", notes: ["No loan amount"], maxAdvancePct: 0 };
  if (!has(m.ltv) && !has(m.dscr) && !has(m.ltc)) return { status: "Needs info", notes: ["No property analysis — run the REI Deal Analyzer"], maxAdvancePct: 0 };
  let hard = 0, soft = 0;
  if (has(m.ltv)) { if (m.ltv! > limits.ltv + 5) { hard++; notes.push(`LTV ${m.ltv!.toFixed(1)}% > ${limits.ltv}%`); } else if (m.ltv! > limits.ltv) { soft++; notes.push(`LTV ${m.ltv!.toFixed(1)}% slightly over ${limits.ltv}%`); } else notes.push(`LTV ${m.ltv!.toFixed(1)}% ✓`); }
  if (has(m.ltc)) { if (m.ltc! > limits.ltc) { soft++; notes.push(`LTC ${m.ltc!.toFixed(1)}% > ${limits.ltc}%`); } else notes.push(`LTC ${m.ltc!.toFixed(1)}% ✓`); }
  if (has(m.dscr) && Number.isFinite(m.dscr!)) { if (m.dscr! < 1.0) { hard++; notes.push(`DSCR ${m.dscr!.toFixed(2)} < 1.00`); } else if (m.dscr! < limits.dscr) { soft++; notes.push(`DSCR ${m.dscr!.toFixed(2)} below ${limits.dscr}`); } else notes.push(`DSCR ${m.dscr!.toFixed(2)} ✓`); }
  if (has(m.maoDelta)) { if (m.maoDelta! < -10000) { soft++; notes.push("70% rule exceeded"); } else notes.push("70% rule ✓"); }
  const status = hard ? "Declined" : soft >= 2 ? "Review" : "Approved";
  return { status, notes, maxAdvancePct: limits.ltv };
}

/** ACE REI/CRE pass: expire stale term sheets, underwrite, match, issue term sheets. */
export async function runReiPass(limit = 300) {
  await ensureReiSchema();
  // 1) 24-hour rule: expire unanswered term sheets and free the deal for the next lender.
  const expired = await rows(sql`UPDATE term_sheets SET status='Expired', responded_at=NOW(), response_note='No response within 24h'
    WHERE status='Sent' AND due_at < NOW() RETURNING deal_id, lender_id`);
  for (const e of expired) {
    await db.execute(sql`UPDATE deals SET lender_id=NULL, stage='Application', updated_at=NOW() WHERE id=${e.deal_id}`);
  }

  // 2) Deals waiting for a term sheet.
  const open = await rows(sql`SELECT d.id, d.lead_id, d.amount, d.product, d.title, d.vertical, d.metrics,
      COALESCE(NULLIF(e.credit_score,0), 0) AS credit
    FROM deals d LEFT JOIN enrichments e ON e.lead_id = d.lead_id
    WHERE d.vertical IN ('REI','CRE') AND d.stage IN ('Lead','Application')
      AND NOT EXISTS (SELECT 1 FROM term_sheets t WHERE t.deal_id=d.id AND t.status IN ('Sent','Accepted'))
    ORDER BY d.id LIMIT ${limit}`);

  let issued = 0, declined = 0, review = 0, needsInfo = 0, noLender = 0;
  for (const d of open) {
    let m: Metrics = {};
    try { m = JSON.parse(d.metrics || "{}"); } catch {}
    const uw = underwrite(d.vertical, Number(d.amount) || 0, m);
    await db.execute(sql`UPDATE deals SET uw_status=${uw.status}, uw_notes=${uw.notes.join(" · ")}, updated_at=NOW() WHERE id=${d.id}`);
    if (uw.status === "Declined") { declined++; await db.execute(sql`UPDATE deals SET stage='Declined' WHERE id=${d.id}`); continue; }
    if (uw.status === "Needs info") { needsInfo++; continue; }
    if (uw.status === "Review") review++;

    const tried = await rows(sql`SELECT lender_id FROM term_sheets WHERE deal_id=${d.id} AND lender_id IS NOT NULL`);
    const triedIds = tried.map((t) => Number(t.lender_id));
    const credit = Number(d.credit) || 0;
    const lenders = await rows(sql`SELECT id, name, rate_pct, advance_rate_pct FROM lenders
      WHERE active=1 AND (',' || verticals || ',') LIKE ${"%," + d.vertical + ",%"}
        AND max_amount >= ${Number(d.amount) || 0}
        AND (${credit} = 0 OR min_fico <= ${credit})
      ORDER BY NULLIF(rate_pct,0) ASC NULLS LAST, id ASC LIMIT 25`);
    const L = lenders.find((x) => !triedIds.includes(Number(x.id)));
    if (!L) { noLender++; await db.execute(sql`UPDATE deals SET uw_notes = uw_notes || ' · No remaining matched lender' WHERE id=${d.id}`); continue; }

    const round = triedIds.length + 1;
    const ratePct = Number(L.rate_pct) || 1100;
    const advancePct = Math.min(Number(L.advance_rate_pct) || uw.maxAdvancePct, uw.maxAdvancePct);
    const termMonths = d.vertical === "CRE" ? 60 : 12;
    const conditions = `${d.vertical} ${uw.status === "Review" ? "(conditional) " : ""}· ${uw.notes.join(" · ")} · Subject to appraisal, title & insurance · Borrower ID & authorization at closing`;
    await db.execute(sql`INSERT INTO term_sheets (deal_id, lender_id, rate_pct, advance_pct, term_months, fees_pct, conditions, status, sent_at, due_at, round)
      VALUES (${d.id}, ${L.id}, ${ratePct}, ${advancePct}, ${termMonths}, 200, ${conditions}, 'Sent', NOW(), NOW() + INTERVAL '24 hours', ${round})`);
    await db.execute(sql`UPDATE deals SET lender_id=${L.id}, stage='Term Sheet', rate_pct=${ratePct}, updated_at=NOW() WHERE id=${d.id}`);
    await db.execute(sql`INSERT INTO activities (lead_id, type, body) VALUES (${d.lead_id}, 'system',
      ${`ACE ${d.vertical}: term sheet #${round} sent to ${L.name} — ${(ratePct / 100).toFixed(2)}%, ${advancePct}% advance, ${termMonths} mo. Lender must respond within 24h.`})`);
    issued++;
  }
  return { expired: expired.length, considered: open.length, issued, declined, review, needsInfo, noLender };
}
