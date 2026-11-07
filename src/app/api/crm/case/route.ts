import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, enrichments, consentRecords, activities } from "@/db/schema";
import { desc, eq, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// CCD — full customer case detail for one lead:
// identity/contact + bank loan history + enrichment (IDIQ/FinGoal) + consent ledger + activity timeline
export async function GET(req: NextRequest) {
  try {
    const leadId = Number(req.nextUrl.searchParams.get("leadId"));
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
    const [lead] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!lead) return NextResponse.json({ error: "not found" }, { status: 404 });
    const [enrichment] = await db.select().from(enrichments).where(eq(enrichments.leadId, leadId));
    const consents = await db.select().from(consentRecords).where(eq(consentRecords.leadId, leadId));
    const timeline = await db.select().from(activities).where(eq(activities.leadId, leadId)).orderBy(desc(activities.createdAt)).limit(200);
    return NextResponse.json({ lead, enrichment: enrichment || null, consents, timeline });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message }, { status: 500 });
  }
}
