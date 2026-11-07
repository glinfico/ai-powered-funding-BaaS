import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, deals, docs, activities } from "@/db/schema";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { desc, eq, inArray, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// /api/ppg — the signed-in user's OWN private portal data (leads assigned to
// them by the LAE, plus those leads' deals, docs and tasks).
export async function GET(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const myLeads = await db.select().from(leads).where(eq(leads.assignedTo, s.email)).orderBy(desc(leads.id)).limit(100);
  const ids = myLeads.map(l => l.id);
  const myDeals = ids.length ? await db.select().from(deals).where(inArray(deals.leadId, ids)).orderBy(desc(deals.id)).limit(100) : [];
  const myDocs = ids.length ? await db.select().from(docs).where(inArray(docs.leadId, ids)).orderBy(desc(docs.id)).limit(100) : [];
  const myTasks = ids.length ? await db.select().from(activities).where(sql`${activities.leadId} IN ${ids} AND ${activities.type} IN ('task','ai_draft')`).orderBy(desc(activities.createdAt)).limit(100) : [];
  return NextResponse.json({ email: s.email, role: s.role, leads: myLeads, deals: myDeals, docs: myDocs, tasks: myTasks, counts: { leads: myLeads.length, deals: myDeals.length, docs: myDocs.length, openTasks: myTasks.filter(t => !t.done).length } });
}
