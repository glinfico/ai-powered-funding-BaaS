// ACE syndication: when no single lender can fund a deal, ACE builds a syndicate from
// lenders (by vertical, size, score) and investors (by focus + ticket size), until the
// requested amount is covered. Each participant gets its share as a commitment request
// with a 24-hour response window; declines/expiries are replaced on the next pass.
// Investors are only contacted when they have a real contact email (never placeholders).
import { db } from "@/db";
import { sql } from "drizzle-orm";

const rows = async (q: any): Promise<any[]> => db.execute(q).then((r: any) => r.rows || r);

export async function ensureSyndicationSchema() {
  // Amounts up to $20B+ (bigint), for deals, lenders and investors.
  await db.execute(sql.raw(`ALTER TABLE deals ALTER COLUMN amount TYPE bigint`));
  await db.execute(sql.raw(`ALTER TABLE lenders ALTER COLUMN max_amount TYPE bigint`));
  await db.execute(sql.raw(`ALTER TABLE investors ALTER COLUMN min_ticket TYPE bigint, ALTER COLUMN max_ticket TYPE bigint`));
  await db.execute(sql.raw(`ALTER TABLE leads ALTER COLUMN loan_amount TYPE bigint, ALTER COLUMN estimated_value TYPE bigint`));
  await db.execute(sql.raw(`ALTER TABLE deals ADD COLUMN IF NOT EXISTS syndicated integer DEFAULT 0 NOT NULL`));
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS syndicate_shares (
    id serial PRIMARY KEY, deal_id integer NOT NULL, party_type text NOT NULL, party_id integer NOT NULL,
    party_name text DEFAULT '' NOT NULL, role text DEFAULT 'participant' NOT NULL, amount bigint NOT NULL,
    status text DEFAULT 'Requested' NOT NULL, sent_at timestamp DEFAULT now(), due_at timestamp, responded_at timestamp,
    note text DEFAULT '' NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`));
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS syndicate_shares_deal_idx ON syndicate_shares (deal_id)`));
}

/** Vertical keywords used to match investors' free-text focus. */
const FOCUS: Record<string, string> = {
  REI: "(real estate|rei|residential|bridge|fix|flip|rental)",
  CRE: "(commercial|cre|real estate|multifamily|office|industrial)",
  MCA: "(mca|merchant|working capital|revenue)",
  MA: "(m&a|acquisition|buyout|senior debt|mezzanine)",
};

/** One syndication pass over deals that no single lender could take. */
export async function runSyndicationPass(limit = 50) {
  await ensureSyndicationSchema();
  // 1) Expire unanswered share requests (24h) so they can be replaced.
  const expired = await rows(sql`UPDATE syndicate_shares SET status='Expired', responded_at=NOW(), note='No response within 24h'
    WHERE status='Requested' AND due_at < NOW() RETURNING id`);

  // 2) Deals flagged by the REI pass as having no single matching lender, plus already-syndicated deals still short.
  const deals = await rows(sql`SELECT d.id, d.lead_id, d.amount, d.vertical, COALESCE(NULLIF(e.credit_score,0),0) AS credit
    FROM deals d LEFT JOIN enrichments e ON e.lead_id = d.lead_id
    WHERE d.vertical IN ('REI','CRE','MCA','MA') AND d.amount > 0 AND d.stage IN ('Application','Syndicating')
      AND (d.syndicated = 1 OR d.uw_notes LIKE '%No remaining matched lender%')
      AND COALESCE(d.uw_status,'') NOT IN ('Declined','Needs info')
    ORDER BY d.amount DESC LIMIT ${limit}`);

  let built = 0, requested = 0, short = 0;
  for (const d of deals) {
    const amount = Number(d.amount) || 0;
    const live = await rows(sql`SELECT COALESCE(SUM(amount),0)::bigint AS s FROM syndicate_shares WHERE deal_id=${d.id} AND status IN ('Requested','Committed')`);
    let remaining = amount - Number(live[0]?.s || 0);
    if (remaining <= 0) continue;
    const used = await rows(sql`SELECT party_type, party_id FROM syndicate_shares WHERE deal_id=${d.id}`);
    const usedKey = new Set(used.map((u) => `${u.party_type}:${u.party_id}`));
    const hasLead = (await rows(sql`SELECT 1 FROM syndicate_shares WHERE deal_id=${d.id} AND role='lead' AND status IN ('Requested','Committed') LIMIT 1`)).length > 0;
    const credit = Number(d.credit) || 0;

    // Candidates: lenders in the vertical (biggest capacity first), then investors whose focus fits.
    const lenders = await rows(sql`SELECT id, name, max_amount FROM lenders
      WHERE active=1 AND max_amount > 0 AND (',' || verticals || ',') LIKE ${"%," + d.vertical + ",%"} AND (${credit} = 0 OR min_fico <= ${credit})
      ORDER BY max_amount DESC LIMIT 40`);
    const investors = await rows(sql`SELECT id, name, max_ticket, min_ticket FROM investors
      WHERE active=1 AND contact_email <> '' AND contact_email NOT LIKE '%.example'
        AND focus ~* ${FOCUS[d.vertical] || "."} ORDER BY max_ticket DESC LIMIT 40`);
    const pool = [
      ...lenders.map((l) => ({ type: "lender", id: Number(l.id), name: l.name, cap: Number(l.max_amount), min: 0 })),
      ...investors.map((i) => ({ type: "investor", id: Number(i.id), name: i.name, cap: Number(i.max_ticket), min: Number(i.min_ticket) || 0 })),
    ].filter((p) => !usedKey.has(`${p.type}:${p.id}`) && p.cap > 0);

    let lead = hasLead;
    for (const p of pool) {
      if (remaining <= 0) break;
      const share = Math.min(p.cap, remaining);
      if (share < p.min) continue;
      await db.execute(sql`INSERT INTO syndicate_shares (deal_id, party_type, party_id, party_name, role, amount, due_at)
        VALUES (${d.id}, ${p.type}, ${p.id}, ${p.name}, ${lead ? "participant" : "lead"}, ${share}, NOW() + INTERVAL '24 hours')`);
      lead = true;
      remaining -= share;
      requested++;
    }
    await db.execute(sql`UPDATE deals SET syndicated=1, stage='Syndicating', updated_at=NOW() WHERE id=${d.id}`);
    await db.execute(sql`INSERT INTO activities (lead_id, type, body) VALUES (${d.lead_id}, 'system',
      ${`ACE syndication: $${amount.toLocaleString()} ${d.vertical} — ${remaining > 0 ? `$${remaining.toLocaleString()} still uncovered` : "fully covered by share requests"} (24h to respond)`})`);
    built++;
    if (remaining > 0) short++;
  }

  // 3) Fully committed syndicates move forward.
  const done = await rows(sql`UPDATE deals d SET stage='Approved', updated_at=NOW()
    WHERE d.syndicated=1 AND d.stage='Syndicating'
      AND (SELECT COALESCE(SUM(amount),0) FROM syndicate_shares s WHERE s.deal_id=d.id AND s.status='Committed') >= d.amount
    RETURNING d.id`);
  return { expiredShares: expired.length, deals: deals.length, built, shareRequests: requested, stillShort: short, fullyCommitted: done.length };
}
