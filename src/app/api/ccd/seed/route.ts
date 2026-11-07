import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lenders, investors, deals, leads, enrichments } from "@/db/schema";
import { count, sql } from "drizzle-orm";

export const dynamic = "force-dynamic";

const LENDER_SEED = [
  { name: "First National Capital", kind: "Bank", products: "Term loans, business LOC", minFico: 640, maxAmount: 500000, advanceRatePct: 85, ratePct: 900, contactEmail: "deals@firstnational.example", phone: "+1 (212) 555-0101", notes: "Fast approval, 24-48h term sheet" },
  { name: "Harborline Credit Union", kind: "Credit Union", products: "SBA-style term loans, LOC", minFico: 660, maxAmount: 350000, advanceRatePct: 80, ratePct: 1050, contactEmail: "lending@harborlinecu.example", phone: "+1 (617) 555-0142", notes: "Relationship lender" },
  { name: "BluePeak Private Fund", kind: "Private Fund", products: "Revenue-based advances, MCA", minFico: 580, maxAmount: 1000000, advanceRatePct: 90, ratePct: 1800, contactEmail: "capital@bluepeak.example", phone: "+1 (415) 555-0177", notes: "Funds in 24h" },
  { name: "Summit Marketplace Lending", kind: "Marketplace", products: "Invoice financing, AR line", minFico: 600, maxAmount: 250000, advanceRatePct: 92, ratePct: 1400, contactEmail: "originations@summitmcl.example", phone: "+1 (312) 555-0119", notes: "AR advance up to 92%" },
  { name: "Meridian Broker Desk", kind: "Broker", products: "Multi-lender placement", minFico: 550, maxAmount: 2000000, advanceRatePct: 0, ratePct: 0, contactEmail: "desk@meridianbroker.example", phone: "+1 (646) 555-0188", notes: "40+ lender panel" },
];
const INVESTOR_SEED = [
  { name: "Atlas Growth Partners", focus: "Term loans 25k–250k", minTicket: 25000, maxTicket: 250000, contactEmail: "deals@atlasgp.example", notes: "Buys paper monthly" },
  { name: "Northshore Family Office", focus: "Short-term bridge 6–12mo", minTicket: 50000, maxTicket: 500000, contactEmail: "invest@northshorefo.example", notes: "Seasoned deals" },
  { name: "Cedar Rock Capital", focus: "AR / invoice finance portfolios", minTicket: 10000, maxTicket: 1000000, contactEmail: "portfolios@cedarrock.example", notes: "Portfolio only" },
];

const KINDS = ["Bank", "Credit Union", "Private Fund", "Broker", "Marketplace", "Fintech", "Community Bank"];
const L_A = ["First", "Harbor", "Blue", "Summit", "Meridian", "Capital", "Union", "Pacific", "Atlantic", "Liberty", "Pioneer", "Crown", "Gateway", "Beacon", "Sovereign", "Heritage", "Metro", "National", "Provident", "Anchor"];
const L_B = ["National Bank", "Trust Co.", "Capital Group", "Lending Partners", "Fund LLC", "Credit Union", "Commercial Bank", "Financial Corp", "Advisory LLC", "Holdings"];
const CITIES = ["New York", "Chicago", "Dallas", "Atlanta", "Denver", "Seattle", "Boston", "Miami", "Austin", "Phoenix", "Charlotte", "Columbus", "Nashville", "Portland", "Salt Lake City"];
const INV_A = ["Atlas", "Northshore", "Cedar Rock", "Golden", "Silverline", "Ironwood", "Summit", "Bluecrest", "Everest", "Harborview", "Keystone", "Lighthouse", "Meridian", "Oakmont", "Redwood", "Stonebridge", "Trinity", "Vantage", "Westbrook", "Zenith"];
const INV_B = ["Growth Partners", "Family Office", "Capital Partners", "Ventures", "Holdings", "Investments", "Asset Mgmt", "Fund I", "Credit Partners", "Equity Trust"];
const FOCUS = ["Term loans 25k-250k", "Short-term bridge 6-12mo", "AR / invoice finance", "SBA loans", "Equipment finance", "CRE bridge", "Merchant cash advance", "Portfolio purchases", "Distressed paper", "Revenue-based finance"];
function rng(seed: number) { const x = Math.sin(seed * 12.9898 + 78.233) * 43758.5453; return x - Math.floor(x); }

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "seed");

    if (action === "fill_directories") {
      const targetLenders = 22450, targetInvestors = 3000;
      const [{ value: lc }] = await db.select({ value: count() }).from(lenders);
      const [{ value: ic }] = await db.select({ value: count() }).from(investors);
      let addedL = 0, addedI = 0;
      if (Number(lc) < targetLenders) {
        for (let i = Number(lc); i < targetLenders; i += 1000) {
          const vals: any[] = [];
          for (let j = i; j < Math.min(i + 1000, targetLenders); j++) {
            vals.push({
              name: `${L_A[Math.floor(rng(j * 7 + 3) * L_A.length)]} ${L_B[Math.floor(rng(j * 11 + 5) * L_B.length)]} #${j + 1}`,
              kind: KINDS[Math.floor(rng(j * 3 + 1) * KINDS.length)],
              products: FOCUS[Math.floor(rng(j * 13 + 7) * FOCUS.length)],
              minFico: 550 + Math.floor(rng(j * 17 + 9) * 180),
              maxAmount: 50000 + Math.floor(rng(j * 19 + 11) * 40) * 50000,
              advanceRatePct: 70 + Math.floor(rng(j * 23 + 13) * 25),
              ratePct: 700 + Math.floor(rng(j * 29 + 15) * 160) * 10,
              contactEmail: `desk${j + 1}@lender${(j % 997) + 1}.example`,
              phone: `+1 (${200 + Math.floor(rng(j * 31) * 700)}) 555-${String(1000 + Math.floor(rng(j * 37) * 9000))}`,
              notes: `${CITIES[Math.floor(rng(j * 5 + 2) * CITIES.length)]} based`,
            });
          }
          await db.insert(lenders).values(vals);
          addedL += vals.length;
        }
      }
      if (Number(ic) < targetInvestors) {
        for (let i = Number(ic); i < targetInvestors; i += 1000) {
          const vals: any[] = [];
          for (let j = i; j < Math.min(i + 1000, targetInvestors); j++) {
            vals.push({
              name: `${INV_A[Math.floor(rng(j * 3 + 2) * INV_A.length)]} ${INV_B[Math.floor(rng(j * 5 + 4) * INV_B.length)]} #${j + 1}`,
              focus: FOCUS[Math.floor(rng(j * 7 + 6) * FOCUS.length)],
              minTicket: 5000 + Math.floor(rng(j * 11 + 8) * 20) * 5000,
              maxTicket: 100000 + Math.floor(rng(j * 13 + 10) * 90) * 10000,
              contactEmail: `invest${j + 1}@investor${(j % 499) + 1}.example`,
              notes: `${CITIES[Math.floor(rng(j * 17 + 12) * CITIES.length)]} office`,
            });
          }
          await db.insert(investors).values(vals);
          addedI += vals.length;
        }
      }
      return NextResponse.json({ ok: true, addedLenders: addedL, addedInvestors: addedI, lenders: Math.max(Number(lc), targetLenders), investors: Math.max(Number(ic), targetInvestors) });
    }

    const [{ value: lenderCount }] = await db.select({ value: count() }).from(lenders);
    if (!lenderCount) await db.insert(lenders).values(LENDER_SEED as any);
    const [{ value: invCount }] = await db.select({ value: count() }).from(investors);
    if (!invCount) await db.insert(investors).values(INVESTOR_SEED as any);

    const [{ value: dealCount }] = await db.select({ value: count() }).from(deals);
    let createdDeals = 0;
    if (!dealCount) {
      const rows: any[] = await db.execute(sql`
        SELECT l.id AS "leadId", l.loan_outcome AS outcome, l.loan_amount AS amount, l.status,
               COALESCE(e.credit_score, l.score * 7 + 505) AS creditscore
        FROM leads l LEFT JOIN enrichments e ON e.lead_id = l.id
        WHERE l.acquisition_type <> 'Prospected' ORDER BY l.id`)
        .then((r: any) => r.rows || r);
      const lenderRows = await db.select().from(lenders);
      const CHUNK = 400;
      for (let i = 0; i < rows.length; i += CHUNK) {
        const slice = rows.slice(i, i + CHUNK);
        const values = slice.map((r: any, j: number) => {
          const lender = lenderRows[(Number(r.leadId) * 3 + j) % lenderRows.length];
          const amount = Math.max(5000, Number(r.amount) || Math.round(10000 + (Number(r.leadId) % 90) * 1000));
          const outcome = r.outcome;
          const stage = outcome === "Funded" ? "Funded" : outcome === "Declined" ? "Declined"
            : ["Lead", "Application", "Term Sheet", "Underwriting"][Number(r.leadId) % 4];
          const commissionPct = stage === "Funded" ? 500 + (Number(r.leadId) % 4) * 100 : 0;
          const fundedAt = stage === "Funded" ? new Date(Date.now() - (Number(r.leadId) % 120) * 86400000) : null;
          return {
            leadId: Number(r.leadId), lenderId: lender.id,
            title: `${lender.name.split(" ")[0]} — ${stage === "Funded" ? "funded loan" : stage === "Declined" ? "declined application" : "open " + (r.status || "deal")}`,
            product: ["Term Loan", "Line of Credit", "Invoice Financing", "Bridge"][Number(r.leadId) % 4],
            amount, stage, ratePct: lender.ratePct || 0, commissionPct,
            fundedAt, closedAt: stage === "Declined" || stage === "Funded" ? fundedAt : null,
            notes: `Derived from bank DB loan history (${outcome}).`,
          };
        });
        await db.insert(deals).values(values as any);
        createdDeals += slice.length;
      }
    }
    return NextResponse.json({ ok: true, lenders: LENDER_SEED.length, investors: INVESTOR_SEED.length, dealsCreated: createdDeals });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message }, { status: 500 });
  }
}

export async function GET() {
  const [l, i, d] = await Promise.all([
    db.select({ v: count() }).from(lenders), db.select({ v: count() }).from(investors), db.select({ v: count() }).from(deals),
  ]);
  return NextResponse.json({ lenders: l[0].v, investors: i[0].v, deals: d[0].v });
}
