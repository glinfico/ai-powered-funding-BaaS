// Directory sync: the MAIN Supabase project is the master for lenders, funders and
// investors. CCD-V2 keeps a synced copy for its engines (fast matching), refreshed
// every engine cycle via the Supabase REST API with the main project's service-role
// key (server-side only). Nothing flows back to main.
//
// Env: SUPABASE_URL (main project URL), MAIN_SUPABASE_SERVICE_KEY (service_role, secret).
// First full copy is checkpointed (resumes next cycle) so no run exceeds the time limit.
// Placeholders (contact emails ending in .example) are removed only after the first full
// lender copy has completed.
import { db } from "@/db";
import { sql } from "drizzle-orm";

const PAGE = 1000;
const INT_MAX = 2147483647;
const rows = async (q: any): Promise<any[]> => db.execute(q).then((r: any) => r.rows || r);
const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^0-9.]/g, "")); return Number.isFinite(n) && n > 0 ? n : 0; };
const json = (v: unknown): any => { if (v && typeof v === "object") return v; try { const o = JSON.parse(String(v || "{}")); return o && typeof o === "object" ? o : {}; } catch { return {}; } };
const AAI = /^[A-Z]+-[0-9]{4}-[A-Z][0-9]+$/;

function cfg() {
  const url = (process.env.SUPABASE_URL || "").replace(/\/$/, "");
  const key = process.env.MAIN_SUPABASE_SERVICE_KEY || "";
  return url && key ? { url, key } : null;
}

async function rest(path: string): Promise<any[]> {
  const c = cfg()!;
  const r = await fetch(`${c.url}/rest/v1/${path}`, { headers: { apikey: c.key, Authorization: `Bearer ${c.key}` }, cache: "no-store" });
  if (!r.ok) throw new Error(`main ${path.split("?")[0]}: HTTP ${r.status} ${(await r.text()).slice(0, 120)}`);
  return r.json();
}

export async function ensureSyncSchema() {
  await db.execute(sql.raw(`ALTER TABLE lenders ADD COLUMN IF NOT EXISTS buy_box text DEFAULT '{}' NOT NULL, ADD COLUMN IF NOT EXISTS verticals text DEFAULT '' NOT NULL,
    ADD COLUMN IF NOT EXISTS min_amount bigint DEFAULT 0 NOT NULL, ADD COLUMN IF NOT EXISTS source text DEFAULT '' NOT NULL, ADD COLUMN IF NOT EXISTS source_id text DEFAULT '' NOT NULL`));
  await db.execute(sql.raw(`ALTER TABLE investors ADD COLUMN IF NOT EXISTS source text DEFAULT '' NOT NULL, ADD COLUMN IF NOT EXISTS source_id text DEFAULT '' NOT NULL`));
  await db.execute(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS lenders_source_uidx ON lenders (source, source_id) WHERE source <> ''`));
  await db.execute(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS investors_source_uidx ON investors (source, source_id) WHERE source <> ''`));
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS sync_state (name text PRIMARY KEY, cursor text DEFAULT '' NOT NULL,
    watermark text DEFAULT '' NOT NULL, initial_done integer DEFAULT 0 NOT NULL, last_run timestamp, last_note text DEFAULT '' NOT NULL)`));
}

async function state(name: string) {
  const r = await rows(sql`SELECT * FROM sync_state WHERE name=${name}`);
  if (r[0]) return r[0];
  await db.execute(sql`INSERT INTO sync_state (name) VALUES (${name}) ON CONFLICT DO NOTHING`);
  return { name, cursor: "", watermark: "", initial_done: 0 };
}
async function save(name: string, patch: { cursor?: string; watermark?: string; initial_done?: number; note: string }) {
  await db.execute(sql`UPDATE sync_state SET cursor=COALESCE(${patch.cursor ?? null}, cursor), watermark=COALESCE(${patch.watermark ?? null}, watermark),
    initial_done=COALESCE(${patch.initial_done ?? null}, initial_done), last_run=NOW(), last_note=${patch.note} WHERE name=${name}`);
}

async function upsertLender(v: any[]) {
  await db.execute(sql`INSERT INTO lenders (name, kind, products, min_fico, max_amount, min_amount, contact_email, phone, active, notes, buy_box, verticals, source, source_id)
    VALUES (${v[0]}, ${v[1]}, ${v[2]}, ${v[3]}, ${v[4]}, ${v[5]}, ${v[6]}, ${v[7]}, ${v[8]}, ${v[9]}, ${v[10]}, ${v[11]}, ${v[12]}, ${v[13]})
    ON CONFLICT (source, source_id) WHERE source <> '' DO UPDATE SET name=EXCLUDED.name, kind=EXCLUDED.kind, products=EXCLUDED.products,
      min_fico=EXCLUDED.min_fico, max_amount=EXCLUDED.max_amount, min_amount=EXCLUDED.min_amount, contact_email=EXCLUDED.contact_email,
      phone=EXCLUDED.phone, active=EXCLUDED.active, buy_box=EXCLUDED.buy_box,
      verticals=CASE WHEN lenders.buy_box IS DISTINCT FROM EXCLUDED.buy_box THEN EXCLUDED.verticals ELSE lenders.verticals END`);
}

function lenderValues(r: any) {
  const b = json(r.buy_box), uc = b.underwriting_criteria || {}, fl = b.funding_limits || {};
  const p = b.products || uc.loan_types || b.loan_types || b.product_types || "See buy box";
  return [String(r.name || b.name || "Lender").slice(0, 200), "Lender", (Array.isArray(p) ? p.join(", ") : String(p)).slice(0, 240),
    Math.round(num(uc.min_credit_score || uc.min_fico)), Math.min(Math.round(num(fl.max_amount)), INT_MAX), Math.round(num(fl.min_amount)),
    String(b.contact_email || (b.contact && b.contact.email) || "").slice(0, 160), "", r.is_active === false ? 0 : 1,
    "Synced from main.lenders", JSON.stringify(b), "", "main.lenders", String(r.id)];
}

const TAG = `TRIM(BOTH ',' FROM CONCAT_WS(',',
  CASE WHEN (products||' '||buy_box) ~* '(residential|fix|flip|rental|dscr|bridge|single.family|1-4 unit|\\mrei\\M|real estate investor|investment property)' THEN 'REI' END,
  CASE WHEN (products||' '||buy_box) ~* '(commercial real estate|\\mcre\\M|multifamily|multi-family|office|industrial|retail property|construction|commercial property)' THEN 'CRE' END,
  CASE WHEN (products||' '||buy_box) ~* '(acquisition|m&a|buyout|senior debt|mezzanine)' THEN 'MA' END,
  CASE WHEN (products||' '||buy_box) ~* '(merchant|\\mmca\\M|revenue.based|working capital|invoice|factoring|line of credit|term loan|equipment)' THEN 'MCA' END))`;

/** One sync pass. budgetMs keeps it inside the serverless time limit. */
export async function runDirectorySync(budgetMs = 12000) {
  if (!cfg()) return { ok: false, skipped: "MAIN_SUPABASE_SERVICE_KEY not set" };
  const started = Date.now();
  await ensureSyncSchema();
  const out: Record<string, unknown> = {};

  // Lenders: checkpointed initial copy (by id), then incremental (by updated_at).
  const ls = await state("lenders");
  let imported = 0;
  if (!Number(ls.initial_done)) {
    let cursor = ls.cursor;
    while (Date.now() - started < budgetMs) {
      const page = await rest(`lenders?select=id,name,buy_box,is_active,updated_at&order=id.asc&limit=${PAGE}${cursor ? `&id=gt.${encodeURIComponent(cursor)}` : ""}`);
      for (const r of page) await upsertLender(lenderValues(r));
      imported += page.length;
      if (page.length) cursor = String(page[page.length - 1].id);
      if (page.length < PAGE) { await save("lenders", { cursor, initial_done: 1, watermark: new Date(started).toISOString(), note: "initial copy complete" }); ls.initial_done = 1; break; }
      await save("lenders", { cursor, note: `initial copy in progress (${cursor})` });
    }
  } else {
    const since = ls.watermark || new Date(0).toISOString();
    const page = await rest(`lenders?select=id,name,buy_box,is_active,updated_at&order=updated_at.asc&limit=${PAGE}&updated_at=gt.${encodeURIComponent(since)}`);
    for (const r of page) await upsertLender(lenderValues(r));
    imported = page.length;
    const wm = page.length ? String(page[page.length - 1].updated_at) : since;
    await save("lenders", { watermark: wm, note: `incremental: ${page.length} changed` });
  }
  out.lenders = { synced: imported, initialComplete: !!Number(ls.initial_done) };

  // Funders (small) and investors (3k): full refresh each pass, upsert by source id.
  if (Date.now() - started < budgetMs) {
    const f = await rest("funders?select=*&order=id.asc");
    for (const r of f) {
      await upsertLender([String(r.name || "MCA Funder").slice(0, 200), r.lender_type || "MCA Funder", "Merchant cash advance", Number(r.min_credit_score) || 0,
        Math.min(Math.round(num(r.max_deal_size)), INT_MAX), Math.round(num(r.min_deal_size)), String(r.contact_email || "").slice(0, 160),
        String(r.contact_phone || "").slice(0, 40), r.active === false ? 0 : 1, String(r.notes || "").slice(0, 500), JSON.stringify(r), "MCA", "main.funders", String(r.id)]);
    }
    out.funders = f.length;
  }
  if (Date.now() - started < budgetMs) {
    let n = 0, cursor = "";
    while (Date.now() - started < budgetMs) {
      const page = await rest(`investors?select=id,aai,investor_name,tranche_preference,email&order=id.asc&limit=${PAGE}${cursor ? `&id=gt.${encodeURIComponent(cursor)}` : ""}`);
      for (const r of page) {
        const aai = String(r.aai || "");
        await db.execute(sql`INSERT INTO investors (code, name, focus, min_ticket, max_ticket, contact_email, notes, source, source_id)
          VALUES (${AAI.test(aai) ? aai : ""}, ${String(r.investor_name || "Investor").slice(0, 200)}, ${String(r.tranche_preference || "").slice(0, 200)}, 0, ${INT_MAX},
            ${String(r.email || "").slice(0, 160)}, ${aai ? `Original AAI: ${aai}` : ""}, 'main.investors', ${String(r.id)})
          ON CONFLICT (source, source_id) WHERE source <> '' DO UPDATE SET name=EXCLUDED.name, focus=EXCLUDED.focus, contact_email=EXCLUDED.contact_email,
            code=CASE WHEN investors.code = '' THEN EXCLUDED.code ELSE investors.code END`);
      }
      n += page.length;
      if (page.length) cursor = String(page[page.length - 1].id);
      if (page.length < PAGE) break;
    }
    out.investors = n;
  }

  // Tag lender categories for new/changed rows.
  await db.execute(sql.raw(`UPDATE lenders SET verticals = ${TAG} WHERE source IN ('main.lenders','main.funders') AND verticals = ''`));

  // Remove placeholders only after the first full lender copy is complete.
  if (Number(ls.initial_done)) {
    const real = await rows(sql`SELECT count(*)::int AS n FROM lenders WHERE source = 'main.lenders'`);
    if ((real[0]?.n || 0) > 0) {
      const dl: any = await db.execute(sql`DELETE FROM lenders WHERE source = '' AND contact_email LIKE '%.example'`);
      const di: any = await db.execute(sql`DELETE FROM investors WHERE source = '' AND contact_email LIKE '%.example'`);
      out.placeholdersRemoved = { lenders: Number(dl.rowCount || 0), investors: Number(di.rowCount || 0) };
    }
  }
  const c = await rows(sql`SELECT (SELECT count(*) FROM lenders WHERE source='main.lenders')::int AS lenders,
    (SELECT count(*) FROM lenders WHERE source='main.funders')::int AS funders, (SELECT count(*) FROM investors WHERE source='main.investors')::int AS investors,
    (SELECT count(*) FROM lenders WHERE contact_email LIKE '%.example')::int AS placeholders_left`);
  return { ok: true, ms: Date.now() - started, ...out, totals: c[0] };
}
