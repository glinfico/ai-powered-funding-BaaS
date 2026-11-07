import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { lenders } from "@/db/schema";
import { and, count, desc, eq, ilike } from "drizzle-orm";

export const dynamic = "force-dynamic";

export async function GET(req: NextRequest) {
  const sp = req.nextUrl.searchParams;
  const q = (sp.get("q") || "").trim();
  const page = Math.max(1, Number(sp.get("page") || 1));
  const pageSize = Math.min(100, Math.max(10, Number(sp.get("pageSize") || 24)));
  const cond = q ? ilike(lenders.name, `%${q}%`) : undefined;
  const [{ value: total }] = await db.select({ value: count() }).from(lenders).where(cond as any);
  const rows = await db.select().from(lenders).where(cond as any).orderBy(desc(lenders.id)).limit(pageSize).offset((page - 1) * pageSize);
  return NextResponse.json({ rows, total, page, pageSize });
}

export async function POST(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const [row] = await db.insert(lenders).values({
    name: String(b.name || "New lender"), kind: String(b.kind || "Bank"),
    products: String(b.products || ""), minFico: Number(b.minFico) || 600,
    maxAmount: Number(b.maxAmount) || 250000, advanceRatePct: Number(b.advanceRatePct) || 80,
    ratePct: Number(b.ratePct) || 0, contactEmail: String(b.contactEmail || ""),
    phone: String(b.phone || ""), notes: String(b.notes || ""),
  } as any).returning();
  return NextResponse.json({ ok: true, row });
}

export async function PATCH(req: NextRequest) {
  const b = await req.json().catch(() => ({}));
  const id = Number(b.id); if (!id) return NextResponse.json({ error: "id required" }, { status: 400 });
  const set: any = {};
  for (const k of ["name", "kind", "products", "contactEmail", "phone", "notes"]) if (b[k] !== undefined) set[k] = String(b[k]);
  for (const k of ["minFico", "maxAmount", "advanceRatePct", "ratePct", "active"]) if (b[k] !== undefined) set[k] = Number(b[k]);
  const [row] = await db.update(lenders).set(set).where(eq(lenders.id, id)).returning();
  return NextResponse.json({ ok: true, row });
}

export async function DELETE(req: NextRequest) {
  const id = Number(req.nextUrl.searchParams.get("id"));
  if (id) await db.delete(lenders).where(eq(lenders.id, id));
  return NextResponse.json({ ok: true });
}
