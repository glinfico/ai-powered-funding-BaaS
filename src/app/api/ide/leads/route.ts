import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, enrichments } from "@/db/schema";
import { desc, eq } from "drizzle-orm";
import { idePayload } from "@/lib/enrichment";

export const dynamic = "force-dynamic";

// This is the ONLY thing IDE needs to call. IDE never talks to IDIQ / FinGoal
// and never re-scores — it simply consumes scored results routed from the Engine.
// GET /api/ide/leads?minScore=70&limit=100
export async function GET(req: NextRequest) {
  const format = (req.nextUrl.searchParams.get("format") || "json").toLowerCase();
  if (format === "csv" || format === "xlsx" || format === "xls") {
    const { fetchExportRows } = await import("@/lib/export-rows");
    const { EXPORT_COLUMNS, rowToExport, toCsv } = await import("@/lib/export");
    const minScore = Number(req.nextUrl.searchParams.get("minScore") || 0);
    const raw = await fetchExportRows({ scope: "all", sort: "score", maxRows: 20000 });
    const filtered = raw.filter((r: any) => (r.enrichments?.finalScore ?? r.leads.score) >= minScore && r.enrichments?.routedToIde === "Routed");
    const rows = filtered.map(rowToExport);
    const date = new Date().toISOString().slice(0, 10);
    if (format === "csv") {
      return new Response(toCsv(rows), { headers: { "Content-Type": "text/csv; charset=utf-8", "Content-Disposition": `attachment; filename="ide-scored-leads-${date}.csv"` } });
    }
    const ExcelJS = (await import("exceljs")).default;
    const wb = new ExcelJS.Workbook(); wb.creator = "LeadScale Engine";
    const ws = wb.addWorksheet("IDE Scored Leads", { views: [{ state: "frozen", ySplit: 1 }] });
    ws.addRow([...EXPORT_COLUMNS]);
    ws.getRow(1).eachCell((c) => { c.font = { bold: true, color: { argb: "FFFFFFFF" } }; c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } }; });
    for (const r of rows) ws.addRow(r);
    ws.columns.forEach((col, i) => { col.width = i === 3 ? 34 : 18; });
    const buf = await wb.xlsx.writeBuffer();
    return new Response(buf as any, { headers: { "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet", "Content-Disposition": `attachment; filename="ide-scored-leads-${date}.xlsx"` } });
  }
  const minScore = Number(req.nextUrl.searchParams.get("minScore") || 0);
  const limit = Math.min(500, Math.max(1, Number(req.nextUrl.searchParams.get("limit") || 100)));
  const rows = await db
    .select()
    .from(enrichments)
    .innerJoin(leads, eq(enrichments.leadId, leads.id))
    .where(eq(enrichments.routedToIde, "Routed"))
    .orderBy(desc(enrichments.finalScore))
    .limit(2000);
  const data = rows
    .map((r: any) => idePayload(r.leads, r.enrichments))
    .filter((p: any) => p.score >= minScore)
    .slice(0, limit);
  return NextResponse.json({ destination: "IDE", event: "lead.scored", count: data.length, data });
}
