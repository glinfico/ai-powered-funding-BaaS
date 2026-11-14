// Secondary market: lenders/investors list loan packages; investors buy at ask or offer.
// Sellers accept/decline within 24h; 2.0% settlement fee on acceptance. Every trade is
// recorded (integration_events) for the engines' cross-confirmation.
import { db } from "@/db";
import { sql } from "drizzle-orm";

export const FEE_RATE = 0.02;
export const ASSET_CLASSES = ["MCA", "REI", "CRE", "M&A", "Senior Debt", "Other"] as const;
export const GRADES = ["A+", "A", "B+", "B", "C"] as const;
const rows = async (q: any): Promise<any[]> => db.execute(q).then((r: any) => r.rows || r);

export async function ensureMarketSchema() {
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS market_packages (
    id serial PRIMARY KEY, ref text DEFAULT '' NOT NULL, seller_type text NOT NULL, seller_id integer NOT NULL, seller_email text NOT NULL,
    asset_class text NOT NULL, title text NOT NULL, principal bigint NOT NULL, asking_price bigint NOT NULL, yield_pct numeric(6,2) DEFAULT 0 NOT NULL,
    term_months integer DEFAULT 12 NOT NULL, risk_grade text DEFAULT 'B' NOT NULL, description text DEFAULT '' NOT NULL,
    status text DEFAULT 'Active' NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`));
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS market_offers (
    id serial PRIMARY KEY, package_id integer NOT NULL, buyer_type text NOT NULL, buyer_id integer NOT NULL, buyer_email text NOT NULL,
    price bigint NOT NULL, fee bigint DEFAULT 0 NOT NULL, status text DEFAULT 'Pending' NOT NULL, due_at timestamp NOT NULL,
    responded_at timestamp, created_at timestamp DEFAULT now() NOT NULL)`));
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS market_offers_pkg_idx ON market_offers (package_id)`));
}

/** The signed-in party (lender or investor profile linked to the sign-in email). */
export async function partyFor(role: string, email: string) {
  const e = email.toLowerCase();
  if (role === "lender" || role === "admin") {
    const l = await rows(sql`SELECT id, name, code FROM lenders WHERE lower(contact_email)=${e} LIMIT 1`);
    if (l[0]) return { type: "lender", id: Number(l[0].id), name: l[0].name as string, code: l[0].code as string };
  }
  if (role === "investor" || role === "admin") {
    const i = await rows(sql`SELECT id, name, code FROM investors WHERE lower(contact_email)=${e} LIMIT 1`);
    if (i[0]) return { type: "investor", id: Number(i[0].id), name: i[0].name as string, code: i[0].code as string };
  }
  return null;
}

export async function expireOffers() {
  const ex = await rows(sql`UPDATE market_offers SET status='Expired', responded_at=NOW() WHERE status='Pending' AND due_at < NOW() RETURNING package_id`);
  for (const e of ex) {
    await db.execute(sql`UPDATE market_packages SET status='Active' WHERE id=${e.package_id} AND status='Under Offer'
      AND NOT EXISTS (SELECT 1 FROM market_offers WHERE package_id=${e.package_id} AND status='Pending')`);
  }
}

export async function logTrade(type: string, payload: Record<string, unknown>) {
  await db.execute(sql`INSERT INTO integration_events (type, provider, status, count, payload)
    VALUES (${type}, 'Market', 'delivered', 1, ${JSON.stringify(payload)})`);
}
