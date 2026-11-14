// GLINFICO — import the real lender / funder / investor directories from the MAIN
// Supabase project into CCD-V2. Run from ~/ccd-v2-site (uses its "pg" package).
//
//   MAIN_DB_URL   = main project connection string (entered hidden, never stored)
//   TARGET_DB_URL = CCD-V2 DATABASE_URL (read from Netlify, never printed)
//
// Default is a DRY RUN (no changes). Add --apply to write. Single transaction:
// any error rolls everything back. Re-runnable: rows already imported are skipped.
// Placeholders (contact emails ending in .example) are removed only after the
// real rows are in.
import { createRequire } from "module";
const require = createRequire(process.cwd() + "/");
const { Client } = require("pg");

const APPLY = process.argv.includes("--apply");
const SRC = process.env.MAIN_DB_URL || "";
const DST = process.env.TARGET_DB_URL || "";
if (!SRC || !DST) { console.error("Missing MAIN_DB_URL or TARGET_DB_URL."); process.exit(1); }
if (SRC === DST) { console.error("Source and target are the same database — refusing."); process.exit(1); }

const ssl = (u) => (/(localhost|127\.0\.0\.1)/.test(u) ? false : { rejectUnauthorized: false });
const json = (t) => { try { const v = JSON.parse(t || "{}"); return v && typeof v === "object" ? v : {}; } catch { return {}; } };
const num = (v) => { const n = Number(String(v ?? "").replace(/[^0-9.]/g, "")); return Number.isFinite(n) && n > 0 ? n : 0; };
const INT_MAX = 2147483647;
const mask = (e) => (e ? String(e).replace(/^(.).*(@.*)$/, "$1***$2") : "");

async function batchInsert(db, table, cols, rows, size = 1000) {
  for (let i = 0; i < rows.length; i += size) {
    const part = rows.slice(i, i + size);
    const params = [];
    const values = part.map((r, k) => `(${cols.map((_, c) => { params.push(r[c]); return `$${k * cols.length + c + 1}`; }).join(",")})`);
    await db.query(`INSERT INTO ${table} (${cols.join(",")}) VALUES ${values.join(",")}`, params);
  }
}

const src = new Client({ connectionString: SRC, ssl: ssl(SRC) });
const dst = new Client({ connectionString: DST, ssl: ssl(DST) });
await src.connect();
await dst.connect();
console.log(`Connected. Mode: ${APPLY ? "APPLY (writes)" : "DRY RUN (no changes)"}`);

try {
  // Read source (read-only queries).
  const L = (await src.query("SELECT id::text AS id, name, buy_box::text AS buy_box, is_active FROM lenders")).rows;
  const F = (await src.query("SELECT id::text AS id, name, min_deal_size::numeric AS min_d, max_deal_size::numeric AS max_d, min_credit_score::int AS min_cs, lender_type::text AS lt, contact_email, contact_phone, active, notes, row_to_json(f)::text AS row_json FROM funders f")).rows;
  const I = (await src.query("SELECT id::text AS id, aai::text AS aai, investor_name, tranche_preference::text AS tp, email FROM investors")).rows;
  console.log(`Source (main): lenders=${L.length} funders=${F.length} investors=${I.length}`);

  await dst.query("BEGIN");
  await dst.query(`ALTER TABLE lenders ADD COLUMN IF NOT EXISTS buy_box text DEFAULT '{}' NOT NULL, ADD COLUMN IF NOT EXISTS verticals text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS min_amount bigint DEFAULT 0 NOT NULL, ADD COLUMN IF NOT EXISTS source text DEFAULT '' NOT NULL, ADD COLUMN IF NOT EXISTS source_id text DEFAULT '' NOT NULL`);
  await dst.query(`ALTER TABLE investors ADD COLUMN IF NOT EXISTS source text DEFAULT '' NOT NULL, ADD COLUMN IF NOT EXISTS source_id text DEFAULT '' NOT NULL`);

  const have = async (table, source) => new Set((await dst.query(`SELECT source_id FROM ${table} WHERE source=$1`, [source])).rows.map((r) => r.source_id));
  const haveL = await have("lenders", "main.lenders"), haveF = await have("lenders", "main.funders"), haveI = await have("investors", "main.investors");

  const lenderRows = L.filter((r) => !haveL.has(r.id)).map((r) => {
    const b = json(r.buy_box), uc = b.underwriting_criteria || {}, fl = b.funding_limits || {};
    const p = b.products || uc.loan_types || b.loan_types || b.product_types || "See buy box";
    return [
      String(r.name || b.name || "Lender").slice(0, 200), "Lender", (Array.isArray(p) ? p.join(", ") : String(p)).slice(0, 240),
      Math.round(num(uc.min_credit_score || uc.min_fico)), Math.min(Math.round(num(fl.max_amount)), INT_MAX), Math.round(num(fl.min_amount)),
      String(b.contact_email || (b.contact && b.contact.email) || "").slice(0, 160), r.is_active === false ? 0 : 1,
      "Imported from main.lenders", r.buy_box || "{}", "main.lenders", r.id,
    ];
  });
  const funderRows = F.filter((r) => !haveF.has(r.id)).map((r) => [
    String(r.name || "MCA Funder").slice(0, 200), r.lt || "MCA Funder", "Merchant cash advance", r.min_cs || 0,
    Math.min(Math.round(num(r.max_d)), INT_MAX), Math.round(num(r.min_d)), String(r.contact_email || "").slice(0, 160), String(r.contact_phone || "").slice(0, 40),
    r.active === false ? 0 : 1, String(r.notes || "").slice(0, 500), r.row_json || "{}", "MCA", "main.funders", r.id,
  ]);
  const AAI = /^[A-Z]+-[0-9]{4}-[A-Z][0-9]+$/;
  const investorRows = I.filter((r) => !haveI.has(r.id)).map((r) => [
    AAI.test(r.aai || "") ? r.aai : "", String(r.investor_name || "Investor").slice(0, 200), String(r.tp || "").slice(0, 200), 0, INT_MAX,
    String(r.email || "").slice(0, 160), r.aai ? `Original AAI: ${r.aai}` : "", "main.investors", r.id,
  ]);

  console.log(`To import: lenders=${lenderRows.length} funders=${funderRows.length} investors=${investorRows.length} (rows already imported are skipped)`);
  const s = lenderRows[0];
  if (s) console.log(`Sample lender: "${s[0]}" | products="${s[2].slice(0, 60)}" | $${s[5]}–$${s[4]} | min score ${s[3]} | email ${mask(s[6]) || "(none)"}`);
  const si = investorRows[0];
  if (si) console.log(`Sample investor: "${si[1]}" | AAI ${si[0] || "(new ID will be issued)"} | focus "${si[2]}" | email ${mask(si[5]) || "(none)"}`);

  await batchInsert(dst, "lenders", ["name","kind","products","min_fico","max_amount","min_amount","contact_email","active","notes","buy_box","source","source_id"], lenderRows);
  await batchInsert(dst, "lenders", ["name","kind","products","min_fico","max_amount","min_amount","contact_email","phone","active","notes","buy_box","verticals","source","source_id"], funderRows);
  await batchInsert(dst, "investors", ["code","name","focus","min_ticket","max_ticket","contact_email","notes","source","source_id"], investorRows);

  await dst.query(`UPDATE lenders SET verticals = TRIM(BOTH ',' FROM CONCAT_WS(',',
      CASE WHEN (products||' '||buy_box) ~* '(residential|fix|flip|rental|dscr|bridge|single.family|1-4 unit|\\mrei\\M|real estate investor|investment property)' THEN 'REI' END,
      CASE WHEN (products||' '||buy_box) ~* '(commercial real estate|\\mcre\\M|multifamily|multi-family|office|industrial|retail property|construction|commercial property)' THEN 'CRE' END,
      CASE WHEN (products||' '||buy_box) ~* '(acquisition|m&a|buyout|senior debt|mezzanine)' THEN 'MA' END,
      CASE WHEN (products||' '||buy_box) ~* '(merchant|\\mmca\\M|revenue.based|working capital|invoice|factoring|line of credit|term loan|equipment)' THEN 'MCA' END))
    WHERE source IN ('main.lenders','main.funders') AND verticals = ''`);

  const realL = (await dst.query("SELECT count(*)::int AS n FROM lenders WHERE source IN ('main.lenders','main.funders')")).rows[0].n;
  if (realL < 1) throw new Error("No real lenders present after import — placeholders kept.");
  const dl = await dst.query("DELETE FROM lenders WHERE source='' AND contact_email LIKE '%.example'");
  const di = await dst.query("DELETE FROM investors WHERE source='' AND contact_email LIKE '%.example'");
  console.log(`Placeholders ${APPLY ? "removed" : "that would be removed"} (.example emails): lenders=${dl.rowCount} investors=${di.rowCount}`);

  const c = (await dst.query(`SELECT
      (SELECT count(*) FROM lenders WHERE source='main.lenders')::int AS real_lenders,
      (SELECT count(*) FROM lenders WHERE source='main.funders')::int AS mca_funders,
      (SELECT count(*) FROM investors WHERE source='main.investors')::int AS real_investors,
      (SELECT count(*) FROM lenders WHERE contact_email LIKE '%.example')::int AS fakes_left,
      (SELECT count(*) FROM lenders WHERE verticals LIKE '%REI%')::int AS rei,
      (SELECT count(*) FROM lenders WHERE verticals LIKE '%CRE%')::int AS cre,
      (SELECT count(*) FROM lenders WHERE verticals LIKE '%MCA%')::int AS mca`)).rows[0];
  console.log(`Result: real_lenders=${c.real_lenders} mca_funders=${c.mca_funders} real_investors=${c.real_investors} fakes_left=${c.fakes_left} | REI=${c.rei} CRE=${c.cre} MCA=${c.mca}`);

  if (APPLY) { await dst.query("COMMIT"); console.log("APPLIED — changes saved."); }
  else { await dst.query("ROLLBACK"); console.log("DRY RUN complete — nothing was changed. Re-run with --apply to save."); }
} catch (e) {
  await dst.query("ROLLBACK").catch(() => {});
  console.error("ERROR — rolled back, nothing changed:", e.message);
  process.exitCode = 1;
} finally {
  await src.end().catch(() => {});
  await dst.end().catch(() => {});
}
