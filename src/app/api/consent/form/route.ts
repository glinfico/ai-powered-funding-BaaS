import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, consentLinks, consentRecords, messages, integrationEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { CONSENT_TEXT, FORM_VERSION, hashToken, verifyToken } from "@/lib/consent-form";
import { sealEnvelope } from "@/lib/consentEnvelope";
import { vaultReady, sha256 } from "@/lib/vault";

// Resolves a link from its token. New links: random token looked up by hash (no lead id
// in the URL). Legacy links (?lid=…) are still honoured until they expire.
async function resolveLink(token: string, lid: number) {
  if (!token || token.length < 20) return null;
  if (lid && !verifyToken(lid, token)) return null;
  const [link] = await db.select().from(consentLinks).where(eq(consentLinks.tokenHash, hashToken(token)));
  if (!link || (lid && link.leadId !== lid)) return null;
  return link;
}

export const dynamic = "force-dynamic";

// GET /api/consent/form?token=…&lid=… → validate link, return masked lead + formulation
export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const token = String(sp.get("token") || "");
  const lid = Number(sp.get("lid") || 0);
  const link = await resolveLink(token, lid);
  if (!link) return NextResponse.json({ valid: false, error: "Invalid or expired consent link." }, { status: 403 });
  if (link.usedAt) return NextResponse.json({ valid: false, error: "This consent form was already submitted." }, { status: 410 });
  if (new Date(link.expiresAt) < new Date()) return NextResponse.json({ valid: false, error: "This consent link has expired — request a new one." }, { status: 410 });
  const [lead] = await db.select().from(leads).where(eq(leads.id, link.leadId));
  if (!lead) return NextResponse.json({ valid: false, error: "Lead not found." }, { status: 404 });
  return NextResponse.json({
    valid: true,
    form: CONSENT_TEXT,
    lead: { id: lead.id, firstName: lead.firstName, lastName: lead.lastName, email: lead.email, phone: "••• ••• " + String(lead.phone).slice(-4), company: lead.company, loanOutcome: lead.loanOutcome, loanAmount: lead.loanAmount },
    expiresAt: link.expiresAt,
  });
}

// POST /api/consent/form { token, lid, scopes: {credit_pull: true, ...}, signature }
export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const token = String(b.token || "");
    const lidIn = Number(b.lid || 0);
    const scopes: Record<string, boolean> = b.scopes || {};
    const signature = String(b.signature || "");
    if (!vaultReady()) return NextResponse.json({ ok: false, error: "Secure storage is not configured yet — please try again later." }, { status: 503 });
    const link = await resolveLink(token, lidIn);
    if (!link) return NextResponse.json({ ok: false, error: "Invalid link." }, { status: 403 });
    const lid = link.leadId;
    if (!signature.trim()) return NextResponse.json({ ok: false, error: "Type your full name to sign." }, { status: 400 });
    if (link.usedAt) return NextResponse.json({ ok: false, error: "Link already used." }, { status: 410 });
    if (new Date(link.expiresAt) < new Date()) return NextResponse.json({ ok: false, error: "Link expired." }, { status: 410 });

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    const ua = req.headers.get("user-agent") || "unknown";
    await db.update(consentLinks).set({ usedAt: new Date(), ip, userAgent: ua }).where(eq(consentLinks.id, link.id));

    const [lead] = await db.select().from(leads).where(eq(leads.id, lid));
    const evidence = `ELINK-${hashToken(token).slice(0, 10).toUpperCase()}`;
    const now = new Date();
    const expires = new Date(now.getTime() + 365 * 86400000);

    // Upsert one consent record per scope, all marked Direct Opt-In via the link
    for (const s of CONSENT_TEXT.sections) {
      const granted = !!scopes[s.id];
      const status = granted ? "Granted" : "Declined";
      const upd: any = await db.execute(sql`
        UPDATE consent_records SET status=${status}, basis='Direct Opt-In', evidence_ref=${evidence}, consent_text_version=${FORM_VERSION}, captured_at=NOW(), expires_at=${expires}, revoked_at=NULL
        WHERE lead_id=${lid} AND scope=${s.id}`);
      const updated = Number(upd.rowCount ?? upd.rowsAffected ?? 0);
      if (!updated) {
        await db.execute(sql`
          INSERT INTO consent_records (lead_id, scope, status, basis, vendor_name, evidence_ref, consent_text_version, captured_at, expires_at)
          VALUES (${lid}, ${s.id}, ${status}, 'Direct Opt-In', 'GLINFICO e-form', ${evidence}, ${FORM_VERSION}, NOW(), ${expires})`);
      }
    }
    // Sealed, encrypted, hash-chained evidence of exactly what was signed.
    const granted = CONSENT_TEXT.sections.filter((x) => !!scopes[x.id]).map((x) => x.id);
    const env = await sealEnvelope(lid, "consent", {
      leadId: lid, formVersion: FORM_VERSION, textHash: sha256(JSON.stringify(CONSENT_TEXT)),
      scopes: Object.fromEntries(CONSENT_TEXT.sections.map((x) => [x.id, !!scopes[x.id]])),
      signatureName: signature.trim(), signedAt: now.toISOString(), ip, userAgent: ua, evidence,
    });
    await db.insert(messages).values({ leadId: lid, channel: "system", template: "consent_submitted", body: `Consent form ${FORM_VERSION} signed via secure e-link ${evidence}. Evidence sealed in encrypted envelope #${env.envelopeId} (${env.recordHash.slice(0, 12)}). Granted: ${granted.join(", ") || "none"}.`, status: "delivered" });
    await db.insert(integrationEvents).values({ type: "consent.form_submitted", provider: "Engine", status: "delivered", count: 1, payload: JSON.stringify({ leadId: lid, evidence, scopes: Object.keys(scopes).filter(k => scopes[k]), ip, ua, signature: signature.slice(0, 40) }) });

    const consents = await db.select().from(consentRecords).where(eq(consentRecords.leadId, lid));
    const fg = process.env.FINGOAL_CONNECT_URL || "";
    const fingoalConnectUrl = scopes.banking_search && fg ? `${fg}${fg.includes("?") ? "&" : "?"}ref=${encodeURIComponent(env.recordHash.slice(0, 16))}` : null;
    return NextResponse.json({ ok: true, leadId: lid, evidence, envelope: env.envelopeId, fingoalConnectUrl, consents, message: `Thank you, ${signature.split(" ")[0]} — your consent is recorded. The credit pull, banking access, monitoring and card offer are active per your selections.` });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
