// IDE scoring pass (set-based, serverless-safe for 10k+ leads).
// Every lead is scored regardless of SSN/DOB:
//   • IDIQ (credit)  — queued only with credit consent + SSN + DOB (legal requirement + IDIQ input).
//   • FinGoal (bank) — queued with banking consent; fills gaps when credit data is missing.
//   • Final score    — 60% credit (300–850 → 0–100) + 40% cash-flow when both exist;
//                      otherwise the one available ("Partial"); none → "Pending". Never invented.
import { db } from "@/db";
import { sql } from "drizzle-orm";

const one = async (q: any) => (await db.execute(q).then((r: any) => r.rows || r))[0] || {};

export async function runIdeScoring() {
  // 1) Every lead gets an enrichment row to carry its scoring state.
  await db.execute(sql`INSERT INTO enrichments (lead_id)
    SELECT l.id FROM leads l WHERE NOT EXISTS (SELECT 1 FROM enrichments e WHERE e.lead_id = l.id)`);

  // 2) Route to providers based on consent (and IDIQ's SSN/DOB input requirement).
  await db.execute(sql`UPDATE enrichments e SET soft_pull_status = 'Queued'
    FROM leads l
    WHERE e.lead_id = l.id AND e.soft_pull_status = 'Pending' AND e.credit_score = 0
      AND l.ssn IS NOT NULL AND l.dob IS NOT NULL
      AND EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id = l.id AND c.scope = 'credit_pull' AND c.status = 'Granted')`);
  await db.execute(sql`UPDATE enrichments e SET fingoal_status = 'Queued'
    WHERE e.fingoal_status = 'Pending' AND e.cashflow_score = 0
      AND EXISTS (SELECT 1 FROM consent_records c WHERE c.lead_id = e.lead_id AND c.scope = 'banking_search' AND c.status = 'Granted')`);

  // 3) Combined score from whatever real provider data exists.
  await db.execute(sql`UPDATE enrichments SET
      final_score = LEAST(100, GREATEST(0, CASE
        WHEN credit_score > 0 AND cashflow_score > 0 THEN ROUND(0.6 * ((credit_score - 300) / 5.5) + 0.4 * cashflow_score)
        WHEN credit_score > 0 THEN ROUND((credit_score - 300) / 5.5)
        WHEN cashflow_score > 0 THEN cashflow_score
        ELSE 0 END))::int,
      scored_status = CASE
        WHEN credit_score > 0 AND cashflow_score > 0 THEN 'Scored'
        WHEN credit_score > 0 OR cashflow_score > 0 THEN 'Partial'
        ELSE 'Pending' END`);

  const s = await one(sql`SELECT COUNT(*)::int AS total,
      COUNT(*) FILTER (WHERE scored_status = 'Scored')::int AS scored,
      COUNT(*) FILTER (WHERE scored_status = 'Partial')::int AS partial,
      COUNT(*) FILTER (WHERE scored_status = 'Pending')::int AS pending,
      COUNT(*) FILTER (WHERE soft_pull_status = 'Queued')::int AS idiq_queued,
      COUNT(*) FILTER (WHERE fingoal_status = 'Queued')::int AS fingoal_queued
    FROM enrichments`);
  return {
    total: s.total, scored: s.scored, partial: s.partial, pending: s.pending,
    idiqQueued: s.idiq_queued, fingoalQueued: s.fingoal_queued,
  };
}
