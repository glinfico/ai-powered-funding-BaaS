// Set-based AAI ID assignment: gives every row without a code its ID in ONE
// SQL statement per table (fast enough for 20k+ rows inside a serverless call).
// Same format as makeCode(): {PREFIX}-{COHORT}-{MonthLetter}{seq}, seq from 100001.
import { db } from "@/db";
import { idLedger } from "@/db/schema";
import { sql } from "drizzle-orm";
import { TIERS, currentCohort, makeCode, monthLetter, nextSeq, parseCode } from "@/lib/idEngine";

export type IdTable = "lenders" | "investors" | "leads" | "brokers";

export function defaultPrefix(table: IdTable, batch?: unknown): string {
  if (table === "brokers") return "G";
  return table === "lenders" ? "L" : table === "investors" ? "I" : String(batch) === "1" ? "BL" : "SL";
}

export async function backfillIds(table: IdTable, prefix = defaultPrefix(table), extraWhere = "") {
  const tier = TIERS[prefix];
  if (!tier) throw new Error(`Unknown prefix ${prefix}`);
  const rows: any = await db
    .execute(sql.raw(`SELECT code FROM ${table} WHERE code LIKE '${prefix}-%'`))
    .then((r: any) => r.rows || r);
  const seqs = (rows as { code: string }[]).map((r) => parseCode(r.code)?.seq).filter((n): n is number => !!n);
  const start = nextSeq(seqs);
  const cohort = currentCohort();
  const head = `${prefix}-${cohort}-${monthLetter(cohort)}`;
  const res: any = await db.execute(
    sql.raw(
      `WITH todo AS (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM ${table} WHERE (code = '' OR code IS NULL)${extraWhere ? ` AND (${extraWhere})` : ""})
       UPDATE ${table} t SET code = '${head}' || (${start} + todo.rn - 1)::text, tier = '${tier.label.replace(/'/g, "''")}'
       FROM todo WHERE t.id = todo.id`,
    ),
  );
  const done = Number(res?.rowCount ?? 0);
  if (done > 0) {
    await db.insert(idLedger).values({
      entityType: tier.entity,
      entityId: 0,
      fromCode: "",
      toCode: `${makeCode(prefix, start, cohort)} … ${makeCode(prefix, start + done - 1, cohort)}`,
      action: "assign",
      note: `Backfill ${done} ${table} with ${prefix} codes`,
    });
  }
  return { table, prefix, backfilled: done, lastSeq: done ? start + done - 1 : start - 1 };
}

// Simulated broker list carried over from the old CCD (BrokerAssignment ACTIVE_BROKERS).
const LEGACY_BROKERS = [
  { ref: "BRK-01", name: "Sarah Jenkins", phone: "(555) 234-8901", title: "Senior VP" },
  { ref: "BRK-02", name: "Marcus Vance", phone: "(555) 345-9012", title: "Capital Advisor" },
  { ref: "BRK-03", name: "Elena Rostova", phone: "(555) 456-0123", title: "Senior VP" },
  { ref: "BRK-04", name: "David Chen", phone: "(555) 567-1234", title: "Underwriting Specialist" },
  { ref: "BRK-05", name: "Aisha Patel", phone: "(555) 678-2345", title: "Capital Advisor" },
];

/** Creates the brokers table if missing and seeds the simulated list once (idempotent). */
export async function ensureBrokers() {
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS brokers (
    id serial PRIMARY KEY, code text DEFAULT '' NOT NULL, tier text DEFAULT '' NOT NULL, name text NOT NULL,
    plan text DEFAULT 'Growth' NOT NULL, title text DEFAULT '' NOT NULL, phone text DEFAULT '' NOT NULL,
    legacy_ref text DEFAULT '' NOT NULL, simulated integer DEFAULT 1 NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`));
  // Paying-member fields (PayPal → LAE). Added in place so existing databases upgrade themselves.
  await db.execute(sql.raw(`ALTER TABLE brokers
    ADD COLUMN IF NOT EXISTS email text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS lead_quota integer DEFAULT 0 NOT NULL,
    ADD COLUMN IF NOT EXISTS paypal_ref text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS status text DEFAULT 'active' NOT NULL,
    ADD COLUMN IF NOT EXISTS paid_at timestamp`));
  for (const b of LEGACY_BROKERS) {
    const plan = b.title === "Senior VP" ? "Pro" : "Growth";
    await db.execute(sql`INSERT INTO brokers (name, plan, title, phone, legacy_ref, simulated)
      SELECT ${b.name}, ${plan}, ${b.title}, ${b.phone}, ${b.ref}, 1
      WHERE NOT EXISTS (SELECT 1 FROM brokers WHERE legacy_ref = ${b.ref})`);
  }
}

export async function backfillAllIds() {
  await ensureBrokers();
  const out = [];
  // Broker tier by plan: Enterprise → E, Pro → P, Growth → G, Starter → S.
  out.push(await backfillIds("brokers", "E", "plan = 'Enterprise'"));
  out.push(await backfillIds("brokers", "P", "plan = 'Pro'"));
  out.push(await backfillIds("brokers", "G", "plan NOT IN ('Enterprise','Pro','Starter')"));
  out.push(await backfillIds("brokers", "S", "plan = 'Starter'"));
  for (const t of ["lenders", "investors", "leads"] as const) out.push(await backfillIds(t));
  return out;
}
