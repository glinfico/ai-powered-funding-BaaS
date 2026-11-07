import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, enrichments, deals, activities } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

// AI Comms = DRAFT generator only. It never sends. Sending happens in your
// comms tool (and only where communications consent exists — purchased bank
// leads carry credit/banking consent; verify comms consent before any send).
const TEMPLATES: Record<string, (l: any, e: any, d: any) => { subject: string; body: string }> = {
  follow_up: (l, e, d) => ({
    subject: `Following up — ${l.company || l.firstName + " " + l.lastName}`,
    body: `Hi ${l.firstName},\n\nFollowing up on your loan application. Our records show ${l.loanOutcome === "Funded" ? `your ${d ? "deal" : "loan"} was funded` : l.loanOutcome === "Declined" ? "a previous application was declined" : "an application still in process"}${e ? `, and your current score profile (${e.creditScore})` : ""}.\n\nWe have ${d ? `a ${d.product} option around $${Number(d.amount).toLocaleString()}` : "financing options"} that may fit. Happy to talk this week?\n\nBest,\nGLINFICO Control Center`,
  }),
  funded_congrats: (l, e, d) => ({
    subject: `Your funding is confirmed — ${l.company || "your business"}`,
    body: `Hi ${l.firstName},\n\nGood news — your ${d?.product || "loan"} of $${Number(d?.amount || l.loanAmount || 0).toLocaleString()} is funded${d?.fundedAt ? ` as of ${new Date(d.fundedAt).toLocaleDateString()}` : ""}.\n\nNext steps and your repayment schedule are attached in the portal. Any questions, just reply.\n\nBest,\nGLINFICO Control Center`,
  }),
  term_sheet_intro: (l, e, d) => ({
    subject: `Term sheet ready — ${d?.title || "your financing"}`,
    body: `Hi ${l.firstName},\n\nYour term sheet is ready: ${d ? `${d.product}, $${Number(d.amount).toLocaleString()}, ${d.termMonths || 12} months` : ""}.\n\nLog in to review and accept, or reply here with questions.\n\nBest,\nGLINFICO Control Center`,
  }),
  declined_reengage: (l, e) => ({
    subject: `New options since your last application, ${l.firstName}`,
    body: `Hi ${l.firstName},\n\nWe know your last application wasn't approved — that happens. Since then, ${e ? `your profile (score ${e.creditScore})` : "your profile"} may now qualify with a different lender on our panel.\n\nWorth a 10-minute call?\n\nBest,\nGLINFICO Control Center`,
  }),
};

export async function POST(req: NextRequest) {
  try {
    const b = await req.json().catch(() => ({}));
    const leadId = Number(b.leadId);
    const template = String(b.template || "follow_up");
    if (!leadId) return NextResponse.json({ error: "leadId required" }, { status: 400 });
    const [l] = await db.select().from(leads).where(eq(leads.id, leadId));
    if (!l) return NextResponse.json({ error: "lead not found" }, { status: 404 });
    const [e] = await db.select().from(enrichments).where(eq(enrichments.leadId, leadId));
    const [d] = await db.select().from(deals).where(eq(deals.leadId, leadId)).orderBy(desc(deals.id)).limit(1);
    const t = TEMPLATES[template] || TEMPLATES.follow_up;
    const draft = t(l, e || null, d || null);
    if (b.save) {
      await db.insert(activities).values({ leadId, type: "ai_draft", body: `[${template}] ${draft.subject}\n\n${draft.body}` });
    }
    return NextResponse.json({
      ok: true, template, draft,
      context: { lead: { id: l.id, name: `${l.firstName} ${l.lastName}`, company: l.company, loanOutcome: l.loanOutcome, loanAmount: l.loanAmount }, enrichment: e ? { creditScore: e.creditScore, finalScore: e.finalScore } : null, deal: d ? { id: d.id, title: d.title, stage: d.stage, amount: d.amount, product: d.product } : null },
      complianceNote: "DRAFT ONLY — not sent. Verify communications consent for this lead before any send. Twilio/A2P sending belongs to the prospecting lane, not purchased bank leads.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}
