import { db } from "@/db";
import { leads, enrichments, consentRecords } from "@/db/schema";
import { and, asc, desc, eq, ilike, or, sql } from "drizzle-orm";

export type ExportQuery = {
  scope: "all" | "filtered" | "page";
  q?: string; status?: string; source?: string; batch?: string; outcome?: string;
  page?: number; pageSize?: number; sort?: string; maxRows?: number;
};

export async function fetchExportRows(query: ExportQuery) {
  const conds: any[] = [];
  if (query.scope !== "all") {
    if (query.q) conds.push(or(ilike(leads.firstName, `%${query.q}%`), ilike(leads.lastName, `%${query.q}%`), ilike(leads.email, `%${query.q}%`), ilike(leads.company, `%${query.q}%`)));
    if (query.status) conds.push(eq(leads.status, query.status));
    if (query.source) conds.push(eq(leads.source, query.source));
    if (query.batch) conds.push(eq(leads.batchLabel, query.batch));
  }
  if (query.outcome && query.outcome !== "all") conds.push(eq(leads.loanOutcome, query.outcome));
  const where = conds.length ? and(...conds) : undefined;

  const order = query.sort === "score" ? desc(leads.score) : query.sort === "value" ? desc(leads.estimatedValue)
    : query.sort === "oldest" ? asc(leads.id) : query.sort === "name" ? asc(leads.lastName) : desc(leads.id);

  let q: any = db.select().from(leads).leftJoin(enrichments, eq(enrichments.leadId, leads.id)).where(where as any).orderBy(order);
  if (query.scope === "page") q = q.limit(query.pageSize || 25).offset(((query.page || 1) - 1) * (query.pageSize || 25));
  else q = q.limit(query.maxRows || 20000);

  const rows = await q;

  // Attach one row of consent evidence per lead (collapsed into columns)
  const ids = rows.map((r: any) => r.leads.id);
  const consentByLead = new Map<number, any>();
  if (ids.length) {
    const CH = 2000;
    for (let i = 0; i < ids.length; i += CH) {
      const slice = ids.slice(i, i + CH);
      const cons = await db.select().from(consentRecords).where(sql`${consentRecords.leadId} IN ${slice}`);
      for (const c of cons) {
        const cur = consentByLead.get(c.leadId) || {};
        if (c.scope === "credit_pull") { cur.creditConsent = c.status; cur.consentEvidence = c.evidenceRef; cur.consentCaptured = c.capturedAt; cur.consentBasis = c.basis; }
        if (c.scope === "banking_search") cur.bankingConsent = c.status;
        if (c.scope === "monitoring") cur.monitoringConsent = c.status;
        consentByLead.set(c.leadId, cur);
      }
    }
  }
  return rows.map((r: any) => ({ ...r, ...(consentByLead.get(r.leads.id) || {}) }));
}

export async function loanOutcomeStats() {
  const rows: any = await db.execute(sql`SELECT loan_outcome AS k, COUNT(*)::int AS v, COALESCE(SUM(loan_amount),0)::bigint AS amt FROM leads GROUP BY loan_outcome ORDER BY v DESC`);
  return (rows.rows || rows).map((r: any) => ({ label: r.k, count: Number(r.v), amount: Number(r.amt) }));
}
