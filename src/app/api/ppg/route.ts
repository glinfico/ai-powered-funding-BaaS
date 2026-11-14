import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, deals, docs, activities, lenders, investors, termSheets } from "@/db/schema";
import { verifySession, GATE_COOKIE } from "@/lib/gate";
import { ensureReiSchema } from "@/lib/rei";
import { ensureSyndicationSchema } from "@/lib/syndication";
import { and, desc, eq, gte, inArray, lte, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

// /api/ppg — the signed-in person's OWN private portal.
// Role-aware view: broker/user (LAE-assigned leads), borrower (own application),
// lender (deals assigned to their lender profile), investor (funded deals in ticket range).
// Every query is scoped to the signed-in email — nobody sees anyone else's records.

type Card = { label: string; value: number | string };
type Cell = string | number | { termSheetId: number } | { shareId: number };
type View = { title: string; subtitle: string; cards: Card[]; columns: string[]; rows: Cell[][]; empty: string };

const money = (n: number) => (n >= 1e6 ? `$${(n / 1e6).toFixed(2)}M` : n >= 1000 ? `$${(n / 1000).toFixed(1)}k` : `$${n || 0}`);
const pct = (bp: number) => `${((bp || 0) / 100).toFixed(2)}%`;

async function brokerView(email: string): Promise<View> {
  const myLeads = await db.select().from(leads).where(eq(leads.assignedTo, email)).orderBy(desc(leads.id)).limit(100);
  const ids = myLeads.map((l) => l.id);
  const myDeals = ids.length ? await db.select().from(deals).where(inArray(deals.leadId, ids)).orderBy(desc(deals.id)).limit(100) : [];
  const myDocs = ids.length ? await db.select().from(docs).where(inArray(docs.leadId, ids)).limit(500) : [];
  const myTasks = ids.length
    ? await db.select().from(activities).where(sql`${activities.leadId} IN ${ids} AND ${activities.type} IN ('task','ai_draft')`).limit(200)
    : [];
  return {
    title: "Broker Portal",
    subtitle: "Leads assigned to you by the LAE",
    cards: [
      { label: "MY LEADS (LAE-assigned)", value: myLeads.length },
      { label: "MY DEALS", value: myDeals.length },
      { label: "MY DOCS", value: myDocs.length },
      { label: "OPEN TASKS", value: myTasks.filter((t) => !t.done).length },
    ],
    columns: ["Lead", "Code", "Loan history", "Deal", "Docs"],
    rows: myLeads.map((l) => {
      const d = myDeals.find((x) => x.leadId === l.id);
      const dc = myDocs.filter((x) => x.leadId === l.id);
      return [
        `${l.firstName} ${l.lastName} · ${l.email}`,
        l.code,
        `${l.loanOutcome}${l.loanAmount ? ` · ${money(l.loanAmount)}` : ""}`,
        d ? `${d.stage} · ${money(d.amount)}` : "—",
        dc.length ? `${dc.filter((x) => x.status !== "missing").length}/${dc.length} ready` : "—",
      ];
    }),
    empty: "No leads assigned to you yet — the LAE assigns leads to brokers.",
  };
}

async function borrowerView(email: string): Promise<View> {
  const mine = await db.select().from(leads).where(sql`lower(${leads.email}) = ${email}`).orderBy(desc(leads.id)).limit(20);
  const ids = mine.map((l) => l.id);
  const myDeals = ids.length ? await db.select().from(deals).where(inArray(deals.leadId, ids)).orderBy(desc(deals.id)) : [];
  const myDocs = ids.length ? await db.select().from(docs).where(inArray(docs.leadId, ids)) : [];
  return {
    title: "Borrower Portal",
    subtitle: "Your funding application, deal status and documents",
    cards: [
      { label: "APPLICATIONS", value: mine.length },
      { label: "DEALS", value: myDeals.length },
      { label: "DOCS READY", value: myDocs.filter((d) => d.status !== "missing").length },
      { label: "DOCS MISSING", value: myDocs.filter((d) => d.status === "missing").length },
    ],
    columns: ["Reference", "Company", "Requested", "Deal stage", "Documents"],
    rows: mine.map((l) => {
      const d = myDeals.find((x) => x.leadId === l.id);
      const dc = myDocs.filter((x) => x.leadId === l.id);
      return [
        l.code || `#${l.id}`,
        l.company,
        money(d?.amount || l.estimatedValue || l.loanAmount),
        d ? d.stage : l.status,
        dc.length ? `${dc.filter((x) => x.status !== "missing").length}/${dc.length} ready` : "—",
      ];
    }),
    empty: "No application is linked to this email yet.",
  };
}

async function shareRows(partyType: "lender" | "investor", partyId: number): Promise<Cell[][]> {
  await ensureSyndicationSchema();
  const sh: any[] = await db.execute(sql`SELECT s.id, s.role, s.amount, s.status, s.due_at, d.title, d.vertical, d.amount AS deal_amount
    FROM syndicate_shares s JOIN deals d ON d.id = s.deal_id WHERE s.party_type = ${partyType} AND s.party_id = ${partyId}
    ORDER BY (s.status = 'Requested') DESC, s.id DESC LIMIT 50`).then((r: any) => r.rows || r);
  return sh.map((x) => [
    `${x.title} (syndicated)`, `${x.vertical} · ${x.role}`, `${money(Number(x.amount))} of ${money(Number(x.deal_amount))}`,
    "Syndicate share", x.status === "Requested" ? `Open · ${Math.max(0, Math.floor((new Date(x.due_at).getTime() - Date.now()) / 3600000))}h left` : x.status,
    x.status === "Requested" && new Date(x.due_at) > new Date() ? { shareId: Number(x.id) } : "—",
  ]);
}

async function lenderView(email: string): Promise<View> {
  const [me] = await db.select().from(lenders).where(sql`lower(${lenders.contactEmail}) = ${email}`).limit(1);
  if (!me) return { title: "Lender Portal", subtitle: "Term sheets sent to your lender profile", cards: [], columns: [], rows: [], empty: "No lender profile is linked to this email yet." };
  await ensureReiSchema();
  const sheets: any[] = await db.execute(sql`SELECT t.id, t.status, t.rate_pct, t.advance_pct, t.term_months, t.fees_pct, t.due_at, t.round,
      d.title, d.vertical, d.amount, d.uw_status
    FROM term_sheets t JOIN deals d ON d.id = t.deal_id WHERE t.lender_id = ${me.id}
    ORDER BY (t.status = 'Sent') DESC, t.id DESC LIMIT 100`).then((r: any) => r.rows || r);
  const [tot]: any = await db.execute(sql`SELECT COUNT(*) FILTER (WHERE status='Sent')::int AS open, COUNT(*) FILTER (WHERE status='Accepted')::int AS acc,
      COUNT(*)::int AS n FROM term_sheets WHERE lender_id=${me.id}`).then((r: any) => r.rows || r);
  const [fv]: any = await db.execute(sql`SELECT COALESCE(SUM(amount) FILTER (WHERE stage='Funded'),0)::bigint AS v FROM deals WHERE lender_id=${me.id}`).then((r: any) => r.rows || r);
  const left = (due: string) => {
    const ms = new Date(due).getTime() - Date.now();
    return ms <= 0 ? "expired" : `${Math.floor(ms / 3600000)}h ${Math.floor((ms % 3600000) / 60000)}m left`;
  };
  return {
    title: "Lender Portal",
    subtitle: `${me.name} · ${me.code || "ID pending"} · respond to each term sheet within 24 hours`,
    cards: [
      { label: "AWAITING YOUR RESPONSE", value: tot.open },
      { label: "ACCEPTED", value: tot.acc },
      { label: "TERM SHEETS RECEIVED", value: tot.n },
      { label: "FUNDED VOLUME", value: money(Number(fv.v)) },
    ],
    columns: ["Deal", "Type", "Amount", "Terms", "Status", "Your decision"],
    rows: [...(await shareRows("lender", Number(me.id))), ...sheets.map((t) => [
      t.title,
      `${t.vertical}${t.uw_status === "Review" ? " (conditional)" : ""}`,
      money(Number(t.amount)),
      `${pct(t.rate_pct)} · ${t.advance_pct}% advance · ${t.term_months} mo · ${pct(t.fees_pct)} fees`,
      t.status === "Sent" ? `Open · ${left(t.due_at)}` : t.status,
      t.status === "Sent" && new Date(t.due_at) > new Date() ? { termSheetId: Number(t.id) } : "—",
    ])],
    empty: "No term sheets yet — the ACE sends you deals that match your guidelines.",
  };
}

async function investorView(email: string): Promise<View> {
  const [me] = await db.select().from(investors).where(sql`lower(${investors.contactEmail}) = ${email}`).limit(1);
  if (!me) return { title: "Investor Portal", subtitle: "Syndicate share requests and funded deals", cards: [], columns: [], rows: [], empty: "No investor profile is linked to this email yet." };
  const shares = await shareRows("investor", Number(me.id));
  const [tot]: any = await db.execute(sql`SELECT COUNT(*) FILTER (WHERE status='Requested')::int AS open, COUNT(*) FILTER (WHERE status='Committed')::int AS com,
      COALESCE(SUM(amount) FILTER (WHERE status='Committed'),0)::bigint AS v FROM syndicate_shares WHERE party_type='investor' AND party_id=${me.id}`).then((r: any) => r.rows || r);
  return {
    title: "Investor Portal",
    subtitle: `${me.name} · ${me.code || "ID pending"} · ${me.focus}`,
    cards: [
      { label: "SHARE REQUESTS OPEN", value: tot.open },
      { label: "COMMITMENTS", value: tot.com },
      { label: "COMMITTED CAPITAL", value: money(Number(tot.v)) },
      { label: "MAX TICKET", value: money(Number(me.maxTicket)) },
    ],
    columns: ["Deal", "Type / role", "Your share", "Kind", "Status", "Your decision"],
    rows: shares,
    empty: "No share requests yet — ACE invites you when a deal fits your focus and ticket size.",
  };
}

export async function GET(req: NextRequest) {
  const s = await verifySession(req.cookies.get(GATE_COOKIE)?.value);
  if (!s.ok) return NextResponse.json({ error: "sign in required" }, { status: 401 });
  const email = s.email.toLowerCase();
  try {
    const view =
      s.role === "borrower" ? await borrowerView(email)
      : s.role === "lender" ? await lenderView(email)
      : s.role === "investor" ? await investorView(email)
      : await brokerView(email); // broker, user (and admin previewing)
    return NextResponse.json({ email, role: s.role, ...view });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "failed" }, { status: 500 });
  }
}
