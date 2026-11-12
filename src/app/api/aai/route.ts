import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lenders, investors, leads, idLedger } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";
import { COHORT, TIERS, makeCode, migrateCode, nextSeq, parseCode, reTier, labelFor, isValid } from "@/lib/idEngine";
import { backfillIds, defaultPrefix, ensureBrokers } from "@/lib/idBackfill";

export const dynamic = "force-dynamic";

async function seqs(table: "lenders" | "investors" | "leads", prefix: string): Promise<number[]> {
  const rows: any = await db.execute(sql.raw(`SELECT code FROM ${table} WHERE code LIKE '${prefix}-%'`)).then((r: any) => r.rows || r);
  return rows.map((r: any) => parseCode(r.code)?.seq).filter((n: any) => typeof n === "number");
}

async function assignCode(table: "lenders" | "investors" | "leads", id: number, prefix: string) {
  const list = await seqs(table, prefix);
  const code = makeCode(prefix, nextSeq(list));
  await db.execute(sql.raw(`UPDATE ${table} SET code='${code}', tier='${TIERS[prefix].label}' WHERE id=${id}`));
  await db.insert(idLedger).values({ entityType: TIERS[prefix].entity, entityId: id, fromCode: "", toCode: code, action: "assign", note: labelFor(code) });
  return code;
}

// GET /api/aai → ledger + sample codes per entity
export async function GET() {
  try {
    const ledger = await db.select().from(idLedger).orderBy(desc(idLedger.id)).limit(30);
    const samples: any = {};
    await ensureBrokers();
    for (const t of ["brokers", "lenders", "investors", "leads"] as const) {
      const nameCol = t === "leads" ? "first_name || ' ' || last_name AS name" : "name";
      const rows: any = await db.execute(sql.raw(`SELECT id, ${nameCol}, code, tier FROM ${t} WHERE code <> '' ORDER BY id DESC LIMIT 8`)).then((r: any) => r.rows || r);
      samples[t] = rows.map((r: any) => ({ ...r, label: labelFor(r.code) }));
    }
    const counts: any = await db.execute(sql`SELECT (SELECT COUNT(*) FROM brokers WHERE code<>'')::int AS b, (SELECT COUNT(*) FROM lenders WHERE code<>'')::int AS l, (SELECT COUNT(*) FROM investors WHERE code<>'')::int AS i, (SELECT COUNT(*) FROM leads WHERE code<>'')::int AS ld`).then((r: any) => (r.rows || r)[0]);
    return NextResponse.json({ ledger, samples, counts, standard: "PREFIX-YYMM-BASE (base from 100001, Oct 2026 cohort = 1026). Upgrade/downgrade changes only the prefix; cohort+sequence immutable; revert restores original instantly." });
  } catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }); }
}

// POST /api/aai { action: "backfill" | "upgrade" | "downgrade" | "revert" | "assign", entity, id, prefix? }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const action = String(b.action || "");
    const entity = String(b.entity || "lenders"); // lenders | investors | leads
    const table = entity as "lenders" | "investors" | "leads";

    if (action === "migrate_month_letter") {
      // One-time: insert the month's first letter before the sequence count
      // in every already-issued code (P-1026-100001 -> P-1026-O100001).
      let migrated = 0;
      for (const t of ["lenders", "investors", "leads"] as const) {
        const rows: any[] = await db.execute(sql.raw(`SELECT id, code FROM ${t} WHERE code <> ''`)).then((r: any) => r.rows || r);
        for (let i = 0; i < rows.length; i += 1000) {
          const slice = rows.slice(i, i + 1000);
          for (const r of slice) {
            const nc = migrateCode(r.code);
            if (nc !== r.code) { await db.execute(sql.raw(`UPDATE ${t} SET code='${nc}' WHERE id=${r.id}`)); migrated++; }
          }
          await db.insert(idLedger).values({ entityType: t, entityId: 0, fromCode: `${slice[0]?.code || ""}…`, toCode: "month-letter inserted", action: "migrate", note: `Month letter added before sequence count in ${slice.length} ${t} codes` });
        }
      }
      return NextResponse.json({ ok: true, migrated, note: "Format is now PREFIX-YYMM-MonthLetter+Seq (e.g. P-1026-O100001)." });
    }

    if (action === "backfill") {
      // Assign codes to every row missing one. Lenders=L, Investors=I, Leads=SL (bulk batches BL).
      // Set-based (one SQL per table) so 20k+ rows finish inside the serverless time limit.
      const r = await backfillIds(table, defaultPrefix(table, b.batch));
      return NextResponse.json({ ok: true, backfilled: r.backfilled, prefix: r.prefix, lastSeq: r.lastSeq });
    }

    const id = Number(b.id);
    if (!id) return NextResponse.json({ ok: false, error: "id required" }, { status: 400 });
    const [row]: any[] = await db.execute(sql.raw(`SELECT id, code, tier FROM ${table} WHERE id=${id}`)).then((r: any) => r.rows || r);
    if (!row) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });

    if (action === "assign") {
      const prefix = String(b.prefix || (table === "lenders" ? "L" : table === "investors" ? "I" : "SL"));
      const code = await assignCode(table, id, prefix);
      return NextResponse.json({ ok: true, code, label: labelFor(code) });
    }
    if (!row.code) return NextResponse.json({ ok: false, error: "Row has no code yet — run assign first." }, { status: 400 });

    if (action === "upgrade" || action === "downgrade") {
      const prefix = String(b.prefix || "");
      const t = TIERS[prefix];
      if (!t) return NextResponse.json({ ok: false, error: `prefix must be one of ${Object.keys(TIERS).join(", ")}` }, { status: 400 });
      if (t.entity !== TIERS[parseCode(row.code)!.prefix]?.entity) return NextResponse.json({ ok: false, error: `Cannot re-tier ${row.code} into ${t.entity} tier — entity type must match.` }, { status: 400 });
      const newCode = reTier(row.code, prefix);
      await db.execute(sql.raw(`UPDATE ${table} SET code='${newCode}', tier='${t.label}' WHERE id=${id}`));
      await db.insert(idLedger).values({ entityType: t.entity, entityId: id, fromCode: row.code, toCode: newCode, action, note: labelFor(newCode) });
      return NextResponse.json({ ok: true, from: row.code, to: newCode, label: labelFor(newCode), note: "Only the prefix changed — cohort & sequence untouched." });
    }
    if (action === "revert") {
      const hist = await db.select().from(idLedger).where(eq(idLedger.entityId, id)).orderBy(idLedger.id);
      const original = hist.find(h => h.action === "assign") || hist[0];
      if (!original) return NextResponse.json({ ok: false, error: "No history to revert to." }, { status: 400 });
      await db.execute(sql.raw(`UPDATE ${table} SET code='${original.toCode}', tier='${parseCode(original.toCode) ? TIERS[parseCode(original.toCode)!.prefix].label : row.tier}' WHERE id=${id}`));
      await db.insert(idLedger).values({ entityType: TIERS[parseCode(row.code)!.prefix]?.entity || "Lead", entityId: id, fromCode: row.code, toCode: original.toCode, action: "revert", note: `Reverted to original ${original.toCode}` });
      return NextResponse.json({ ok: true, from: row.code, to: original.toCode, note: "Original ID restored instantly from ledger." });
    }
    return NextResponse.json({ ok: false, error: "action must be backfill|assign|upgrade|downgrade|revert" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
