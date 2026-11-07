import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { investors } from "@/db/schema";
import { count, desc, eq, ilike } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(sp.get("pageSize") || 24)));
  const cond = q ? ilike(investors.name, `%${q}%`) : undefined;
  const [{ value: total }] = await db.select({ value: count() }).from(investors).where(cond as any);
  const rows = await db.select().from(investors).where(cond as any).orderBy(desc(investors.id)).limit(pageSize).offset((page - 1) * pageSize);
  return NextResponse.json({ rows, total, page, pageSize });
}
export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const [row] = await db.insert(investors).values({
    name: String(b.name || "New investor"), focus: String(b.focus || ""),
    minTicket: Number(b.minTicket) || 10000, maxTicket: Number(b.maxTicket) || 500000,
    contactEmail: String(b.contactEmail || ""), notes: String(b.notes || ""),
  } as any).returning();
  return NextResponse.json({ ok: true, row });
}
export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const set: any = {};
  for (const k of ["name", "focus", "contactEmail", "notes"]) if (b[k] !== undefined) set[k] = String(b[k]);
  for (const k of ["minTicket", "maxTicket", "active"]) if (b[k] !== undefined) set[k] = Number(b[k]);
  const [row] = await db.update(investors).set(set).where(eq(investors.id, id)).returning();
  return NextResponse.json({ ok: true, row });
}
export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (id) await db.delete(investors).where(eq(investors.id, id));
  return NextResponse.json({ ok: true });
}
