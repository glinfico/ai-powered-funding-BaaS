import { NextRequest, NextResponse } from "next/server";
import { fetchExportRows, loanOutcomeStats, type ExportQuery } from "@/lib/export-rows";
import { EXPORT_COLUMNS, rowToExport, toCsv, scopeLabel } from "@/lib/export";

export const dynamic = "force-dynamic";

function parseQuery(req: NextRequest): ExportQuery {
  const sp = req.nextUrl.searchParams;
  const scope = (["all", "filtered", "page"].includes(sp.get("scope") || "") ? sp.get("scope") : "all") as ExportQuery["scope"];
  return {
    scope,
    q: sp.get("q") || "", status: sp.get("status") || "", source: sp.get("source") || "",
    batch: sp.get("batch") || "", outcome: sp.get("outcome") || "all",
    page: Math.max(1, Number(sp.get("page") || 1)), pageSize: Math.min(100, Math.max(10, Number(sp.get("pageSize") || 25))),
    sort: sp.get("sort") || "newest", maxRows: 20000,
  };
}

function fileBase(scope: string, outcome: string) {
  const date = new Date().toISOString().slice(0, 10);
  const o = outcome && outcome !== "all" ? `-${outcome.toLowerCase().replace(/[^a-z]+/g, "-")}` : "";
  return `bank-leads-${scope}${o}-${date}`;
}

export async function GET(req: NextRequest) {
  try {
    const format = (req.nextUrl.searchParams.get("format") || "csv").toLowerCase();
    const query = parseQuery(req);
    const t0 = Date.now();
    const raw = await fetchExportRows(query);
    const rows = raw.map(rowToExport);
    const outcomeStats = await loanOutcomeStats();
    const label = scopeLabel(query.scope, "leads", query.outcome || "all");
    const generatedAt = new Date().toLocaleString();

    if (format === "xlsx" || format === "xls") {
      const ExcelJS = (await import("exceljs")).default;
      const wb = new ExcelJS.Workbook();
      wb.creator = "LeadScale Engine"; wb.created = new Date();

      // Sheet 1 — Summary / cover
      const cover = wb.addWorksheet("Summary");
      cover.getColumn(1).width = 34; cover.getColumn(2).width = 60;
      const titleStyle = { font: { bold: true, size: 14 } } as any;
      cover.addRow(["Bank Leads Export"]).font = titleStyle.font;
      const summary: [string, any][] = [
        ["Export", label],
        ["Generated", generatedAt],
        ["Rows in this file", rows.length],
        ["Loan-outcome breakdown (whole DB)", ""],
        ...outcomeStats.map((s: any): [string, any] => [`  ${s.label}`, `${s.count.toLocaleString()} leads · $${Number(s.amount).toLocaleString()}`]),
        ["Origin", "Bank DB — loan applications. Consent was given in the loan application and transferred with the lead."],
        ["Consent scopes", "credit_pull (IDIQ soft pull) · banking_search (FinGoal) · monitoring — see Consent Evidence per row."],
        ["Privacy note", "Contains personal + credit/banking-derived data. Store securely, share only with authorized parties, honor revocations."],
        ["Generated in", `${Date.now() - t0}ms (server-side, all rows — browser never loads 10K rows)`],
      ];
      for (const [a, b] of summary) { const r = cover.addRow([a, b]); r.getCell(1).font = { bold: true }; r.getCell(2).alignment = { wrapText: true }; }
      cover.getRow(1).getCell(1).font = { bold: true, size: 14 };

      // Sheet 2 — Leads
      const ws = wb.addWorksheet("Bank Leads", { views: [{ state: "frozen", ySplit: 1 }] });
      ws.addRow([...EXPORT_COLUMNS]);
      ws.getRow(1).eachCell((c) => {
        c.font = { bold: true, color: { argb: "FFFFFFFF" } };
        c.fill = { type: "pattern", pattern: "solid", fgColor: { argb: "FF065F46" } };
        c.alignment = { vertical: "middle" };
      });
      for (const r of rows) ws.addRow(r);
      ws.columns.forEach((col, i) => { col.width = i === 3 ? 34 : i === 0 ? 10 : 18; });
      ws.autoFilter = { from: "A1", to: `${ws.getColumn(EXPORT_COLUMNS.length).letter}1` };

      const buf = await wb.xlsx.writeBuffer();
      return new NextResponse(buf as any, {
        headers: {
          "Content-Type": "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
          "Content-Disposition": `attachment; filename="${fileBase(query.scope, query.outcome || "all")}.xlsx"`,
          "X-Row-Count": String(rows.length),
        },
      });
    }

    const csv = toCsv(rows);
    return new NextResponse(csv, {
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="${fileBase(query.scope, query.outcome || "all")}.csv"`,
        "X-Row-Count": String(rows.length),
      },
    });
  } catch (e: any) {
    return NextResponse.json({ error: e?.message || "export failed" }, { status: 500 });
  }
}
