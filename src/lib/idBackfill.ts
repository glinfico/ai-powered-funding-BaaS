// Set-based AAI ID assignment: gives every row without a code its ID in ONE
// SQL statement per table (fast enough for 20k+ rows inside a serverless call).
// Same format as makeCode(): {PREFIX}-{COHORT}-{MonthLetter}{seq}, seq from 100001.
import { db } from "@/db";
import { idLedger } from "@/db/schema";
import { sql } from "drizzle-orm";
import { COHORT, TIERS, makeCode, monthLetter, nextSeq, parseCode } from "@/lib/idEngine";

export type IdTable = "lenders" | "investors" | "leads";

export function defaultPrefix(table: IdTable, batch?: unknown): string {
  return table === "lenders" ? "L" : table === "investors" ? "I" : String(batch) === "1" ? "BL" : "SL";
}

export async function backfillIds(table: IdTable, prefix = defaultPrefix(table)) {
  const tier = TIERS[prefix];
  if (!tier) throw new Error(`Unknown prefix ${prefix}`);
  const rows: any = await db
    .execute(sql.raw(`SELECT code FROM ${table} WHERE code LIKE '${prefix}-%'`))
    .then((r: any) => r.rows || r);
  const seqs = (rows as { code: string }[]).map((r) => parseCode(r.code)?.seq).filter((n): n is number => !!n);
  const start = nextSeq(seqs);
  const head = `${prefix}-${COHORT}-${monthLetter(COHORT)}`;
  const res: any = await db.execute(
    sql.raw(
      `WITH todo AS (SELECT id, row_number() OVER (ORDER BY id) AS rn FROM ${table} WHERE code = '' OR code IS NULL)
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
      toCode: `${makeCode(prefix, start)} … ${makeCode(prefix, start + done - 1)}`,
      action: "assign",
      note: `Backfill ${done} ${table} with ${prefix} codes`,
    });
  }
  return { table, prefix, backfilled: done, lastSeq: done ? start + done - 1 : start - 1 };
}

export async function backfillAllIds() {
  const out = [];
  for (const t of ["lenders", "investors", "leads"] as const) out.push(await backfillIds(t));
  return out;
}
