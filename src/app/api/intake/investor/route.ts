import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { ensureSyncSchema, mainRequest } from "@/lib/directorySync";
import { backfillIds } from "@/lib/idBackfill";
import { sealEnvelope } from "@/lib/consentEnvelope";
import { vaultReady, sha256, randomToken } from "@/lib/vault";

export const dynamic = "force-dynamic";

// Investor Capturer: investors opt in themselves (accredited self-certification + consent to
// receive deal offers). Saved to the MAIN Supabase investors table (master) and to CCD-V2,
// with an AAI ID and a sealed, encrypted consent record.
const SELF = (process.env.NEXT_PUBLIC_APP_URL || "").replace(/\/$/, "");
const ALLOWED = [SELF, ...(process.env.INTAKE_ALLOWED_ORIGINS || "https://fod.glinfico.com,https://www.fod.glinfico.com").split(",")].map((s) => s.trim()).filter(Boolean);
const FOCUS = ["MCA", "REI", "CRE", "M&A", "Senior Debt", "Secondary market packages"];
const TYPES = ["Individual (HNW)", "Family office", "Fund / Asset manager", "Bank / Credit union", "Other"];
const CONSENT_TEXT_V = "glf-investor-optin-v1";

function cors(req: NextRequest, res: NextResponse) {
  const o = req.headers.get("origin") || "";
  if (ALLOWED.includes(o)) {
    res.headers.set("Access-Control-Allow-Origin", o); res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS"); res.headers.set("Access-Control-Allow-Headers", "Content-Type");
  }
  return res;
}
export async function OPTIONS(req: NextRequest) { return cors(req, new NextResponse(null, { status: 204 })); }

const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);
const money = (v: unknown) => Math.round(Number(String(v ?? "").replace(/[^0-9.]/g, "")) || 0);

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  if (origin && !ALLOWED.includes(origin)) return NextResponse.json({ ok: false, error: "origin not allowed" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return cors(req, NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 }));
  if (str(b.website)) return cors(req, NextResponse.json({ ok: true, reference: null })); // honeypot

  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = sha256(`intake|${ip}`);
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS intake_log (id serial PRIMARY KEY, ip_hash text NOT NULL, at timestamp DEFAULT now() NOT NULL)`));
  const recent: any = await db.execute(sql`SELECT COUNT(*)::int AS n FROM intake_log WHERE ip_hash=${ipHash} AND at > NOW() - INTERVAL '1 hour'`).then((r: any) => (r.rows || r)[0]);
  if ((recent?.n || 0) >= 20) return cors(req, NextResponse.json({ ok: false, error: "Too many submissions — please try again later." }, { status: 429 }));
  await db.execute(sql`INSERT INTO intake_log (ip_hash) VALUES (${ipHash})`);

  const name = str(b.full_name, 160), email = str(b.email, 160).toLowerCase(), company = str(b.company, 160), phone = str(b.phone, 40);
  const type = TYPES.includes(str(b.investor_type)) ? str(b.investor_type) : "Other";
  const focus = (Array.isArray(b.focus) ? b.focus : []).map((f: unknown) => str(f, 40)).filter((f: string) => FOCUS.includes(f));
  const minT = money(b.min_ticket), maxT = money(b.max_ticket), states = str(b.states, 200);
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return cors(req, NextResponse.json({ ok: false, error: "Your name and a valid email are required." }, { status: 400 }));
  if (!focus.length) return cors(req, NextResponse.json({ ok: false, error: "Choose at least one investment focus." }, { status: 400 }));
  if (maxT <= 0 || minT > maxT) return cors(req, NextResponse.json({ ok: false, error: "Enter a valid ticket size (maximum ≥ minimum)." }, { status: 400 }));
  if (b.accredited !== true) return cors(req, NextResponse.json({ ok: false, error: "Please confirm you are an accredited investor." }, { status: 400 }));
  if (b.consent !== true) return cors(req, NextResponse.json({ ok: false, error: "Please agree to receive deal offers." }, { status: 400 }));
  if (!vaultReady()) return cors(req, NextResponse.json({ ok: false, error: "Secure storage is not configured yet — please try again later." }, { status: 503 }));

  try {
    await ensureSyncSchema();
    const focusText = focus.join(" / ");
    // 1) Master record in the MAIN project (update if the email already exists).
    let source = "capture", sourceId = randomToken().slice(0, 16), mainNote = "main not configured";
    const existing = await mainRequest(`investors?select=id&email=eq.${encodeURIComponent(email)}&limit=1`, { method: "GET" });
    if (existing?.ok && Array.isArray(existing.data) && existing.data[0]) {
      sourceId = String(existing.data[0].id); source = "main.investors";
      await mainRequest(`investors?id=eq.${encodeURIComponent(sourceId)}`, { method: "PATCH", body: { investor_name: name, tranche_preference: focusText } });
      mainNote = "updated in main";
    } else if (existing) {
      const ins = await mainRequest("investors", { method: "POST", body: { investor_name: name, email, tranche_preference: focusText }, prefer: "return=representation" });
      if (ins?.ok && Array.isArray(ins.data) && ins.data[0]?.id !== undefined) { sourceId = String(ins.data[0].id); source = "main.investors"; mainNote = "added to main"; }
      else mainNote = `main write failed (HTTP ${ins?.status})`;
    }
    // Never create a duplicate: if main was unavailable, reuse an existing CCD-V2 record with this email.
    if (source === "capture") {
      const loc: any[] = await db.execute(sql`SELECT source, source_id FROM investors WHERE lower(contact_email)=${email} AND source <> '' ORDER BY id LIMIT 1`).then((x: any) => x.rows || x);
      if (loc[0]) { source = loc[0].source; sourceId = loc[0].source_id; }
    }
    // 2) CCD-V2 copy with the full profile (ticket sizes are kept by the sync).
    const notes = `Captured ${new Date().toISOString().slice(0, 10)} · ${type}${company ? ` · ${company}` : ""}${phone ? ` · ${phone}` : ""}${states ? ` · States: ${states}` : ""} · Accredited (self-certified) · Opted in to deal offers`;
    const r: any = await db.execute(sql`INSERT INTO investors (code, name, focus, min_ticket, max_ticket, contact_email, notes, active, source, source_id)
      VALUES ('', ${name}, ${focusText}, ${minT}, ${maxT}, ${email}, ${notes}, 1, ${source}, ${sourceId})
      ON CONFLICT (source, source_id) WHERE source <> '' DO UPDATE SET name=EXCLUDED.name, focus=EXCLUDED.focus, min_ticket=EXCLUDED.min_ticket,
        max_ticket=EXCLUDED.max_ticket, contact_email=EXCLUDED.contact_email, notes=EXCLUDED.notes, active=1
      RETURNING id`).then((x: any) => x.rows || x);
    const id = Number(r[0].id);
    await backfillIds("investors", "I", `id = ${id}`);
    const code: any = await db.execute(sql`SELECT code FROM investors WHERE id=${id}`).then((x: any) => (x.rows || x)[0]);
    // 3) Sealed consent evidence.
    await sealEnvelope(id, "investor_optin", {
      investorId: id, name, email, accredited: true, consentOffers: true, textVersion: CONSENT_TEXT_V,
      ipHash, userAgent: req.headers.get("user-agent") || "", at: new Date().toISOString(),
    });
    await db.execute(sql`INSERT INTO integration_events (type, provider, status, count, payload)
      VALUES ('intake.investor_captured', 'Capturer', 'delivered', 1, ${JSON.stringify({ investorId: id, code: code?.code, source, mainNote })})`);
    return cors(req, NextResponse.json({ ok: true, reference: code?.code || null }));
  } catch {
    return cors(req, NextResponse.json({ ok: false, error: "Could not save your registration" }, { status: 500 }));
  }
}
