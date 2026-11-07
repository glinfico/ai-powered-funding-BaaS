import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, enrichments, deals, consentRecords } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { renderLenderDocs } from "@/lib/consent-form";

export const dynamic = "force-dynamic";

// GET /api/consent/docs?leadId=… → auto-generated lender packet (IDs excluded by design)
export async function GET(req: NextRequest) {
  try {
    const lid = Number(req.nextUrl.searchParams.get("leadId"));
    if (!lid) return NextResponse.json({ error: "leadId required" }, { status: 400 });
    const [lead] = await db.select().from(leads).where(eq(leads.id, lid));
    if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
    const [e] = await db.select().from(enrichments).where(eq(enrichments.leadId, lid));
    const [deal] = await db.select().from(deals).where(eq(deals.leadId, lid)).orderBy(desc(deals.id)).limit(1);
    const consents = await db.select().from(consentRecords).where(eq(consentRecords.leadId, lid));
    const docs = renderLenderDocs(lead, e || null, deal || null);
    const zipNote = "ID documents are intentionally NOT generated — identity verification happens via IDIQ IDV or human review.";
    if (req.nextUrl.searchParams.get("format") === "txt") {
      const all = docs.map(d => `===== ${d.doc} =====\n${d.content}\n`).join("\n") + `\n${zipNote}\n`;
      return new NextResponse(all, { headers: { "Content-Type": "text/plain; charset=utf-8", "Content-Disposition": `attachment; filename="lender-packet-lead-${lid}.txt"` } });
    }
    return NextResponse.json({ leadId: lid, lead: { id: lead.id, name: `${lead.firstName} ${lead.lastName}`, company: lead.company }, consents, docs, note: zipNote });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
