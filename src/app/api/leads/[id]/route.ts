import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ id: string }> }) {
  const { id } = await ctx.params;
  const body = await req.json().catch(() => ({}));
  const status = String(body.status || "");
  if (!status) return NextResponse.json({ error: "status required" }, { status: 400 });
  const [row] = await db.update(leads).set({ status }).where(eq(leads.id, Number(id))).returning();
  return NextResponse.json({ ok: true, lead: row });
}
