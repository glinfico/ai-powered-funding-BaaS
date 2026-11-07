import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { termSheets, deals, lenders } from "@/db/schema";
import { desc, eq } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const dealId = req.nextUrl.searchParams.get("dealId");
  let rows;
  if (dealId) {
    rows = await db.select({ t: termSheets, d: deals, l: lenders })
      .from(termSheets).leftJoin(deals, eq(termSheets.dealId, deals.id)).leftJoin(lenders, eq(termSheets.lenderId, lenders.id))
      .where(eq(termSheets.dealId, Number(dealId))).orderBy(desc(termSheets.id));
  } else {
    rows = await db.select({ t: termSheets, d: deals, l: lenders })
      .from(termSheets).leftJoin(deals, eq(termSheets.dealId, deals.id)).leftJoin(lenders, eq(termSheets.lenderId, lenders.id))
      .orderBy(desc(termSheets.id)).limit(200);
  }
  return NextResponse.json({ rows });
}
