import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, deals, integrationEvents } from "@/db/schema";
import { sql } from "drizzle-orm";
import { backfillIds } from "@/lib/idBackfill";
import { classify, ensureReiSchema } from "@/lib/rei";
import { sha256 } from "@/lib/vault";

export const dynamic = "force-dynamic";

// Public deal intake for the PFE "Submit a Deal" page (and REI Deal Analyzer).
// Protections: origin allow-list (CORS), per-IP throttle, honeypot, validation.
const ALLOWED = (process.env.INTAKE_ALLOWED_ORIGINS || "https://fod.glinfico.com,https://www.fod.glinfico.com").split(",").map((s) => s.trim());

function cors(req: NextRequest, res: NextResponse) {
  const o = req.headers.get("origin") || "";
  if (ALLOWED.includes(o)) {
    res.headers.set("Access-Control-Allow-Origin", o);
    res.headers.set("Vary", "Origin");
    res.headers.set("Access-Control-Allow-Methods", "POST, OPTIONS");
    res.headers.set("Access-Control-Allow-Headers", "Content-Type");
    res.headers.set("Access-Control-Max-Age", "86400");
  }
  return res;
}

export async function OPTIONS(req: NextRequest) {
  return cors(req, new NextResponse(null, { status: 204 }));
}

const num = (v: unknown) => { const n = Number(String(v ?? "").replace(/[^0-9.\-]/g, "")); return Number.isFinite(n) ? n : 0; };
const str = (v: unknown, max = 200) => String(v ?? "").trim().slice(0, max);

export async function POST(req: NextRequest) {
  const origin = req.headers.get("origin") || "";
  if (origin && !ALLOWED.includes(origin)) return NextResponse.json({ ok: false, error: "origin not allowed" }, { status: 403 });
  const b = await req.json().catch(() => null);
  if (!b || typeof b !== "object") return cors(req, NextResponse.json({ ok: false, error: "invalid request" }, { status: 400 }));

  // Honeypot: real visitors never fill this hidden field.
  if (str(b.website)) return cors(req, NextResponse.json({ ok: true, reference: null }));

  // Per-IP throttle (30/hour), IP stored only as a hash.
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
  const ipHash = sha256(`intake|${ip}`);
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS intake_log (id serial PRIMARY KEY, ip_hash text NOT NULL, at timestamp DEFAULT now() NOT NULL)`));
  const recent: any = await db.execute(sql`SELECT COUNT(*)::int AS n FROM intake_log WHERE ip_hash=${ipHash} AND at > NOW() - INTERVAL '1 hour'`).then((r: any) => (r.rows || r)[0]);
  if ((recent?.n || 0) >= 30) return cors(req, NextResponse.json({ ok: false, error: "Too many submissions — please try again later." }, { status: 429 }));
  await db.execute(sql`INSERT INTO intake_log (ip_hash) VALUES (${ipHash})`);

  const first = str(b.first_name, 80), last = str(b.last_name, 80), email = str(b.email, 160).toLowerCase();
  const loanType = str(b.loan_type, 80), amount = Math.round(num(b.loan_amount));
  if (!first || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || amount <= 0) {
    return cors(req, NextResponse.json({ ok: false, error: "Name, a valid email and a loan amount are required." }, { status: 400 }));
  }
  const a = b.analysis && typeof b.analysis === "object" ? b.analysis : {};
  const propertyAddress = str(b.property_address || a.propertyAddress, 240);
  const vertical = classify(`${loanType} ${str(b.notes, 500)} ${propertyAddress ? "property" : ""}`);
  const metrics = {
    ltv: num(a.ltv) || undefined, ltc: num(a.ltc) || undefined, dscr: num(a.dscr) || undefined,
    capRate: num(a.capRate) || undefined, noi: num(a.noi) || undefined, maoDelta: a.maoDelta !== undefined ? num(a.maoDelta) : undefined,
    arv: num(a.arv) || undefined, purchasePrice: num(a.purchasePrice) || undefined, rehabCost: num(a.rehabCost) || undefined,
    grade: str(a.grade, 30) || undefined, propertyAddress: propertyAddress || undefined, propertyType: str(b.property_type || a.propertyType, 60) || undefined,
  };

  try {
    await ensureReiSchema();
    const [lead] = await db.insert(leads).values({
      firstName: first, lastName: last || "-", email, phone: str(b.phone, 40), company: str(b.company, 160) || `${first} ${last}`.trim(),
      jobTitle: "Owner", source: "PFE Submit", status: "New", acquisitionType: "Direct", vendorName: "PFE — Submit a Deal",
      originSystem: `PFE — ${loanType || "Deal"}`, loanOutcome: "Pending", loanAmount: amount, estimatedValue: amount,
      applicationDate: new Date(), city: "", country: "", address: propertyAddress, batchLabel: "PFE Intake",
    }).returning({ id: leads.id });
    const [deal] = await db.insert(deals).values({
      leadId: lead.id, title: `${str(b.company, 80) || first} — ${loanType || vertical}`, product: loanType || vertical, amount, stage: "Application",
      notes: str(b.notes, 1000),
    }).returning({ id: deals.id });
    await db.execute(sql`UPDATE deals SET vertical=${vertical}, metrics=${JSON.stringify(metrics)} WHERE id=${deal.id}`);
    await backfillIds("leads", "SL", `id = ${lead.id}`);
    const row: any = await db.execute(sql`SELECT code FROM leads WHERE id=${lead.id}`).then((r: any) => (r.rows || r)[0]);
    await db.insert(integrationEvents).values({ type: "intake.deal_received", provider: "PFE", status: "delivered", count: 1,
      payload: JSON.stringify({ leadId: lead.id, dealId: deal.id, code: row?.code, vertical, amount }) });
    return cors(req, NextResponse.json({ ok: true, reference: row?.code || null, vertical }));
  } catch (e: any) {
    return cors(req, NextResponse.json({ ok: false, error: "Could not record the deal" }, { status: 500 }));
  }
}
