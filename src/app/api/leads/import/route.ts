import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { leads, batches, consentRecords } from "@/db/schema";
import { count, eq, sql } from "drizzle-orm";
import { purchasedConsentRows } from "@/lib/consent";
import { loanHistoryFor } from "@/lib/loan-history";
import { enqueueConsentRequest } from "@/lib/consent-form";

export const dynamic = "force-dynamic";

function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let cur: string[] = [], field = "", inQ = false;
  for (let i = 0; i < text.length; i++) {
    const c = text[i];
    if (inQ) {
      if (c === '"') { if (text[i + 1] === '"') { field += '"'; i++; } else inQ = false; }
      else field += c;
    } else if (c === '"') inQ = true;
    else if (c === ",") { cur.push(field); field = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && text[i + 1] === "\n") i++; cur.push(field); field = ""; if (cur.length > 1 || cur[0] !== "") rows.push(cur); cur = []; }
    else field += c;
  }
  if (field !== "" || cur.length) { cur.push(field); rows.push(cur); }
  return rows;
}

const H = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
const MAP: Record<string, string> = {
  firstname: "firstName", first: "firstName", fname: "firstName", givenname: "firstName",
  lastname: "lastName", last: "lastName", lname: "lastName", surname: "lastName", familyname: "lastName",
  email: "email", emailaddress: "email", mail: "email",
  phone: "phone", phonenumber: "phone", mobile: "phone", tel: "phone",
  company: "company", business: "company", businessname: "company", companyname: "company",
  jobtitle: "jobTitle", title: "jobTitle", role: "jobTitle",
  source: "source", leadsource: "source",
  city: "city", country: "country", address: "address", street: "address",
  ssn: "ssn", socialsecuritynumber: "ssn", ssnlast4: "ssn",
  dob: "dob", dateofbirth: "dob", birthdate: "dob", dateborn: "dob",
  status: "status", score: "score", estvalue: "estimatedValue", estimatedvalue: "estimatedValue", value: "estimatedValue", amount: "estimatedValue",
  loanooutcome: "loanOutcome", loanamount: "loanAmount", loan: "loanAmount",
  vendor: "vendorName", vendorname: "vendorName", origin: "originSystem",
};
function normDob(v: string): Date | null {
  if (!v) return null;
  const m = v.match(/^(\d{1,4})[-/](\d{1,2})[-/](\d{1,4})/);
  if (m) {
    let [_, a, b, c] = m;
    let y = Number(a.length === 4 ? a : c), mo = Number(a.length === 4 ? b : a), d = Number(a.length === 4 ? c : b);
    if (y > 31) { const t = new Date(y, mo - 1, d); if (!isNaN(t.getTime())) return t; }
  }
  const t = new Date(v); return isNaN(t.getTime()) ? null : t;
}
function normSsn(v: string): string {
  const d = v.replace(/\D/g, "");
  return d.length === 9 ? `${d.slice(0, 3)}-${d.slice(3, 5)}-${d.slice(5)}` : v.trim();
}

export async function POST(req: NextRequest) {
  try {
    let csvText = "";
    const ct = req.headers.get("content-type") || "";
    if (ct.includes("multipart/form-data")) {
      const f = await req.formData();
      const file = f.get("file") as File | null;
      if (file) csvText = await file.text();
    } else {
      const b = await req.json().catch(() => ({}));
      csvText = String(b.csv || "");
    }
    if (!csvText.trim()) return NextResponse.json({ ok: false, error: "Empty CSV. Upload a .csv file or paste CSV text." }, { status: 400 });

    const rows = parseCsv(csvText.replace(/^﻿/, ""));
    if (rows.length < 2) return NextResponse.json({ ok: false, error: "CSV needs a header row + at least 1 data row." }, { status: 400 });
    const headers = rows[0].map(h => MAP[H(h)] || H(h));
    const label = `CSV Upload ${new Date().toISOString().slice(0, 16).replace("T", " ")}`;
    const [batch] = await db.insert(batches).values({ label, requested: rows.length - 1, status: "running" }).returning();
    const [{ value: before }] = await db.select({ value: count() }).from(leads);

    let inserted = 0, skipped = 0, idiqReady = 0; const rejects: any[] = [];
    const CHUNK = 500;
    for (let i = 1; i < rows.length; i += CHUNK) {
      const slice = rows.slice(i, i + CHUNK);
      const vals: any[] = [];
      const createdMeta: any[] = [];
      for (const r of slice) {
        const o: any = {}; headers.forEach((h, j) => { if (h) o[h] = (r[j] || "").trim(); });
        const email = o.email || "";
        if (!email.includes("@")) { skipped++; continue; }
        const firstName = o.firstName || "Unknown"; const lastName = o.lastName || "Unknown";
        const ssn = o.ssn ? normSsn(o.ssn) : null;
        const dob = o.dob ? normDob(o.dob) : null;
        const ready = !!(ssn && dob && firstName && lastName);
        if (ready) idiqReady++; else if (rejects.length < 20) rejects.push({ email, missing: [ssn ? null : "SSN", dob ? null : "DOB", !firstName ? "first name" : null, !lastName ? "last name" : null].filter(Boolean) });
        const lead: any = {
          firstName, lastName, email, phone: o.phone || "", company: o.company || "", jobTitle: o.jobTitle || "",
          source: o.source || "CSV Upload", status: o.status || "New",
          score: Math.max(0, Math.min(100, Number(o.score) || 50)),
          estimatedValue: Number(o.estimatedValue) || 0,
          city: o.city || "", country: o.country || "", address: o.address || "",
          ssn, dob,
          acquisitionType: "Purchased", vendorName: o.vendorName || "CSV Upload — Bank DB",
          originSystem: o.originSystem || "Bank DB — Loan Application",
          loanOutcome: o.loanOutcome || "In System — No Decision Yet",
          loanAmount: Number(o.loanAmount) || 0,
          batchId: batch.id, batchLabel: label,
        };
        vals.push(lead); createdMeta.push({ lead, ready });
      }
      if (!vals.length) continue;
      const created = await db.insert(leads).values(vals).returning();
      for (let k = 0; k < created.length; k++) {
        const l = created[k]; const meta = createdMeta[k];
        const h = loanHistoryFor({ id: l.id, score: l.score, status: l.status, createdAt: l.createdAt });
        await db.execute(sql`UPDATE leads SET loan_outcome=${h.loanOutcome}, loan_amount=${h.loanAmount}, application_date=${h.applicationDate.toISOString()}::timestamp, origin_system=${h.originSystem} WHERE id=${l.id}`);
        const cr = purchasedConsentRows({ id: l.id, createdAt: l.createdAt, batchId: l.batchId, vendorName: l.vendorName });
        await db.insert(consentRecords).values(cr as any);
        await enqueueConsentRequest({ id: l.id, firstName: l.firstName, email: l.email, phone: l.phone }).catch(() => {});
        inserted++;
      }
    }
    await db.update(batches).set({ inserted, status: "done", totalAfter: before + inserted, finishedAt: new Date() }).where(eq(batches.id, batch.id));
    return NextResponse.json({
      ok: true, batch: label, inserted, skipped, totalNow: before + inserted,
      idiqReady, idiqWillReject: inserted - idiqReady, rejects,
      note: "IDIQ-ready = has SSN + DOB + first/last name. Rows without SSN/DOB will be rejected by IDIQ — they are still stored but flagged.",
    });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "import failed" }, { status: 500 });
  }
}
