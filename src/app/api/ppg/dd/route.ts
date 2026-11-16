import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sql } from "drizzle-orm";
import crypto from "crypto";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { ensureDdSchema } from "@/lib/dpeMA";
import { seal, open, vaultReady } from "@/lib/vault";

export const dynamic = "force-dynamic";
const rows = async (q: any): Promise<any[]> => db.execute(q).then((r: any) => r.rows || r);
const MAX_BYTES = 8 * 1024 * 1024; // 8 MB per document
const ALLOWED = ["application/pdf", "image/png", "image/jpeg", "text/csv", "application/vnd.ms-excel",
  "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "application/msword",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document"];

/** Deals the signed-in person may see: borrower (own email) or the deal's lender (contact email); admin sees all. */
async function canAccess(role: string, email: string, dealId: number) {
  if (role === "admin") return true;
  const r = await rows(sql`SELECT 1 FROM deals d JOIN leads l ON l.id = d.lead_id LEFT JOIN lenders le ON le.id = d.lender_id
    WHERE d.id = ${dealId} AND ((${role} = 'borrower' AND lower(l.email) = ${email}) OR (${role} = 'lender' AND lower(le.contact_email) = ${email}))`);
  return r.length > 0;
}

// GET ?deal=ID → checklist (no file contents). GET ?doc=ID → download (generated text or decrypted upload).
export async function GET(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  await ensureDdSchema();
  const email = s.email.toLowerCase();
  const docId = Number(req.nextUrl.searchParams.get("doc") || 0);
  if (docId) {
    const [d] = await rows(sql`SELECT id, deal_id, name, status, content, source FROM docs WHERE id = ${docId} AND dd_key <> ''`);
    if (!d || !(await canAccess(s.role, email, Number(d.deal_id)))) return NextResponse.json({ error: "not found" }, { status: 404 });
    if (d.status === "generated") return new NextResponse(d.content, { headers: { "content-type": "text/plain; charset=utf-8", "content-disposition": `attachment; filename="${d.name.replace(/[^\w.-]+/g, "_")}.txt"`, "cache-control": "no-store" } });
    if (d.status === "received" && String(d.content).startsWith("v1.")) {
      const meta = JSON.parse(open(d.content));
      return new NextResponse(Buffer.from(meta.b64, "base64"), { headers: { "content-type": meta.type, "content-disposition": `attachment; filename="${String(meta.filename).replace(/[^\w.-]+/g, "_")}"`, "cache-control": "no-store" } });
    }
    return NextResponse.json({ error: "no file yet" }, { status: 404 });
  }
  const dealId = Number(req.nextUrl.searchParams.get("deal") || 0);
  if (!dealId || !(await canAccess(s.role, email, dealId))) return NextResponse.json({ error: "not found" }, { status: 404 });
  const items = await rows(sql`SELECT id, name, category, method, provider, status, stored_at FROM docs WHERE deal_id = ${dealId} AND dd_key <> '' ORDER BY category, id`);
  return NextResponse.json({ dealId, items, note: "ID documents and authorizations are signed at closing and are not part of this checklist." });
}

// POST multipart { doc: ID, file } → borrower uploads a requested document (encrypted at rest).
export async function POST(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok || !["borrower", "admin"].includes(s.role)) return NextResponse.json({ ok: false, error: "Borrower sign-in required" }, { status: 401 });
  if (!vaultReady()) return NextResponse.json({ ok: false, error: "Secure storage is not configured" }, { status: 503 });
  await ensureDdSchema();
  const form = await req.formData().catch(() => null);
  const docId = Number(form?.get("doc") || 0);
  const file = form?.get("file");
  if (!docId || !(file instanceof File)) return NextResponse.json({ ok: false, error: "Choose a file" }, { status: 400 });
  if (file.size <= 0 || file.size > MAX_BYTES) return NextResponse.json({ ok: false, error: "File must be under 8 MB" }, { status: 400 });
  if (!ALLOWED.includes(file.type)) return NextResponse.json({ ok: false, error: "Allowed: PDF, image, Excel, Word or CSV" }, { status: 400 });
  const [d] = await rows(sql`SELECT id, deal_id, lead_id, name, status, method FROM docs WHERE id = ${docId} AND dd_key <> ''`);
  if (!d || !(await canAccess(s.role, s.email.toLowerCase(), Number(d.deal_id)))) return NextResponse.json({ ok: false, error: "not found" }, { status: 404 });
  if (d.method === "generate") return NextResponse.json({ ok: false, error: "This document is produced by the platform" }, { status: 400 });
  const buf = Buffer.from(await file.arrayBuffer());
  const hash = crypto.createHash("sha256").update(buf).digest("hex").slice(0, 16);
  const sealed = seal(JSON.stringify({ filename: file.name.slice(0, 120), type: file.type, b64: buf.toString("base64") }));
  await db.execute(sql`UPDATE docs SET status = 'received', size = ${buf.length}, content_hash = ${hash}, content = ${sealed}, source = 'client-upload', stored_at = NOW() WHERE id = ${docId}`);
  await db.execute(sql`INSERT INTO activities (lead_id, type, body) VALUES (${d.lead_id}, 'system', ${`DPE received "${d.name}" (${(buf.length / 1024).toFixed(1)} KB, encrypted) from ${s.email}`})`);
  return NextResponse.json({ ok: true, status: "received" });
}
