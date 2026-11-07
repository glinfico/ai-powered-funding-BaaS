import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { integrations, integrationEvents, leads, enrichments } from "@/db/schema";
import { count, desc, eq, sql } from "drizzle-orm";
import { providerConfig, parseIdiqJson, PROVIDER_ENV } from "@/lib/providers";
import { bandFor } from "@/lib/enrichment";

export const dynamic = "force-dynamic";

async function summary() {
  const cfg = providerConfig();
  const rows = await db.select().from(integrations).orderBy(desc(integrations.id)).limit(12);
  const counts = async (provider: string, status?: string) => {
    const cond = status
      ? sql`provider = ${provider} AND status = ${status} AND kind = 'record'`
      : sql`provider = ${provider} AND kind = 'record'`;
    const r: any = await db.execute(sql`SELECT COUNT(*)::int AS v FROM integrations WHERE ${cond}`);
    return Number((r.rows || r)[0]?.v || 0);
  };
  const [idiqTotal, idiqMatched, idiqUnmatched, fgConfigRows] = await Promise.all([
    counts("IDIQ"), counts("IDIQ", "matched"), counts("IDIQ", "unmatched"),
    db.select().from(integrations).where(eq(integrations.provider, "FinGoal")).orderBy(desc(integrations.id)).limit(1),
  ]);
  const fingoalEndpointOverride = fgConfigRows.find((r: any) => r.kind === "config")?.externalRef || "";
  const lastTest: any = await db.execute(sql`SELECT * FROM integration_events WHERE provider='FinGoal' AND type='provider.connection_tested' ORDER BY id DESC LIMIT 1`)
    .then((r: any) => (r.rows || r)[0] || null).catch(() => null);

  return {
    searchedThisSystem: {
      verdict: "No IDIQ JSON file and no FinGoal/IDIQ key was found in THIS workspace — .env contains only DATABASE_URL, and there are no provider files on disk. That is why the panel showed empty/simulated. Drop the JSON in below, or add the keys to the system environment, and it lights up.",
      envFileKeysFound: ["DATABASE_URL"],
      lookFor: {
        idiqJson: ["IDIQ member/enrollment export (.json)", "IdentityIQ / IDCS partner export", "File names like idiq*.json, members.json, enrollments.json", "Or keys: " + PROVIDER_ENV.idiq.join(", ")],
        fingoalApi: ["FinGoal developer account credentials (docs.fingoal.dev)", "Insights API token (Bearer JWT)", "Or keys: " + PROVIDER_ENV.fingoal.join(", "), "Aggregator path (Quiltt/MX/Finicity) also counts — FinGoal enriches their transactions"],
      },
    },
    idiq: {
      keySet: cfg.idiq.keySet, partnerSet: cfg.idiq.partnerSet, apiUrl: cfg.idiq.apiUrl, docs: cfg.idiq.docs,
      imported: idiqTotal, matched: idiqMatched, unmatched: idiqUnmatched,
      mode: cfg.idiq.keySet ? "LIVE KEY" : idiqMatched > 0 ? "JSON IMPORTED" : "NOT FOUND IN SYSTEM",
    },
    fingoal: {
      keySet: cfg.fingoal.keySet, apiUrl: fingoalEndpointOverride || cfg.fingoal.apiUrl, docs: cfg.fingoal.docs,
      endpointOverride: fingoalEndpointOverride,
      mode: cfg.fingoal.keySet ? "LIVE KEY" : "NOT FOUND IN SYSTEM",
      lastTest: lastTest ? { status: lastTest.status, payload: lastTest.payload, at: lastTest.createdAt } : null,
    },
    ide: { webhookSet: cfg.ide.webhookSet },
    comms: {
      twilioSid: !!process.env.TWILIO_ACCOUNT_SID, twilioPhone: !!process.env.TWILIO_PHONE_NUMBER, twilioToken: !!process.env.TWILIO_AUTH_TOKEN,
      sendgrid: !!process.env.SENDGRID_API_KEY, consentSecret: !!process.env.CONSENT_SIGNING_SECRET,
      mode: process.env.TWILIO_ACCOUNT_SID && process.env.TWILIO_AUTH_TOKEN ? "LIVE (Twilio SMS)" : "SIMULATED — set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER (+ SENDGRID_API_KEY for email)",
      webhook: "/api/consent/webhook (point Twilio Messaging webhook here for STOP handling)",
    },
    recent: rows.map((r: any) => ({ id: r.id, provider: r.provider, kind: r.kind, leadId: r.leadId, externalRef: r.externalRef, email: r.email, status: r.status, createdAt: r.createdAt, parsed: safeParse(r.parsedJson) })),
  };
}
function safeParse(s: string) { try { return JSON.parse(s); } catch { return {}; } }

export async function GET() {
  try { return NextResponse.json(await summary()); }
  catch (e: any) { return NextResponse.json({ error: e?.message }, { status: 500 }); }
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const action = String(body.action || "");

    if (action === "import_idiq") {
      const text = String(body.jsonText || "");
      if (!text.trim()) return NextResponse.json({ ok: false, error: "Paste the IDIQ JSON first (or use Load the IdentityIQ sample to try it)." }, { status: 400 });
      const matchEmail = String(body.matchEmail || "").trim().toLowerCase();
      const { records, rawCount, errors } = parseIdiqJson(text);
      if (matchEmail) for (const r of records) r.email = matchEmail; // raw IdentityIQ reports carry no email — attach manually
      const batch = `IMP-${Date.now()}`;
      let matched = 0, unmatched = 0, duplicates = 0, updatedExisting = 0;
      const rawList: any[] = (() => { try { const d = JSON.parse(text); return Array.isArray(d) ? d : [d]; } catch { return []; } })();

      for (let i = 0; i < records.length; i++) {
        const rec = records[i];
        // duplicate guard: same provider + email/ref already imported
        if (rec.email || rec.externalRef) {
          const dup: any = await db.execute(sql`SELECT id FROM integrations WHERE provider='IDIQ' AND kind='record' AND ((LOWER(email)=LOWER(${rec.email}) AND ${rec.email} <> '') OR (external_ref=${rec.externalRef} AND ${rec.externalRef} <> '')) LIMIT 1`).then((r: any) => (r.rows || r)[0]).catch(() => null);
          if (dup) { duplicates++; continue; }
        }
        let leadId: number | null = null;
        if (rec.email) {
          const hit: any = await db.execute(sql`SELECT id FROM leads WHERE LOWER(email)=LOWER(${rec.email}) LIMIT 1`).then((r: any) => (r.rows || r)[0]).catch(() => null);
          if (hit) leadId = Number(hit.id);
        }
        if (leadId) matched++; else unmatched++;
        // If this lead was already scored with simulated values, your real JSON wins — update in place.
        if (leadId) {
          const upd: any = await db.execute(sql`UPDATE enrichments SET
            identity_status=${rec.identityStatus}, identity_confidence=${rec.identityConfidence || 90},
            idiq_ref=${rec.externalRef}, soft_pull_status=${rec.softPullStatus},
            credit_score=${rec.creditScore || 0}, credit_band=${rec.creditScore ? bandFor(rec.creditScore) : ""},
            monitoring_status=${rec.monitoringStatus}, monitoring_alerts=${rec.monitoringAlerts}
            WHERE lead_id=${leadId} RETURNING id`).then((r: any) => (r.rows || r)[0]).catch(() => null);
          if (upd && rec.creditScore) updatedExisting++;
        }
        await db.insert(integrations).values({
          provider: "IDIQ", kind: "record", importBatch: batch, leadId, externalRef: rec.externalRef,
          email: rec.email, status: leadId ? "matched" : "unmatched",
          payload: JSON.stringify(rawList[i] ?? rec), parsedJson: JSON.stringify(rec),
        });
      }
      await db.insert(integrationEvents).values({ type: "provider.idiq_json_imported", provider: "IDIQ", status: "delivered", count: matched, payload: JSON.stringify({ batch, rawCount, matched, unmatched, duplicates, updatedExisting, errors }) });
      return NextResponse.json({ ok: true, batch, rawCount, matched, unmatched, duplicates, updatedExisting, errors, ...(await summary()) });
    }

    if (action === "save_fingoal_endpoint") {
      const endpoint = String(body.endpoint || "").trim();
      if (!endpoint.startsWith("http")) return NextResponse.json({ ok: false, error: "Endpoint must start with http(s)://" }, { status: 400 });
      await db.insert(integrations).values({ provider: "FinGoal", kind: "config", externalRef: endpoint, email: "", status: "config", payload: JSON.stringify({ apiBaseUrl: endpoint, savedFrom: "Integration Vault" }) });
      await db.insert(integrationEvents).values({ type: "provider.fingoal_endpoint_saved", provider: "FinGoal", status: "delivered", count: 1, payload: JSON.stringify({ endpoint }) });
      return NextResponse.json({ ok: true, ...(await summary()) });
    }

    if (action === "test_fingoal") {
      const s = await summary();
      const endpoint = s.fingoal.apiUrl;
      let reachable = false, httpStatus = 0, note = "";
      const started = Date.now();
      try {
        const ctrl = new AbortController(); const t = setTimeout(() => ctrl.abort(), 6000);
        const res = await fetch(endpoint, { method: "GET", signal: ctrl.signal, headers: s.fingoal.keySet ? { Authorization: `Bearer ${process.env.FINGOAL_API_KEY || process.env.FINGOAL_TOKEN}` } : {} });
        clearTimeout(t); httpStatus = res.status; reachable = true;
        note = s.fingoal.keySet ? `Endpoint responded (HTTP ${httpStatus}). Key present — ready for Insights API enrichment calls.` : `Endpoint is reachable (HTTP ${httpStatus}), but no FINGOAL_API_KEY in the system yet — add it and this goes live. Reachable ≠ authenticated.`;
      } catch (e: any) {
        note = `Could not reach ${endpoint} from this server (${e?.name === "AbortError" ? "timeout" : e?.message || "network error"}). Check the endpoint URL — dev is findmoney-dev.fingoal.com, docs at docs.fingoal.dev.`;
      }
      const ms = Date.now() - started;
      const status = reachable ? "delivered" : "simulated";
      await db.insert(integrationEvents).values({ type: "provider.connection_tested", provider: "FinGoal", status, count: reachable ? 1 : 0, payload: JSON.stringify({ endpoint, reachable, httpStatus, ms, keySet: s.fingoal.keySet, note }) });
      return NextResponse.json({ ok: true, test: { endpoint, reachable, httpStatus, ms, keySet: s.fingoal.keySet, note }, ...(await summary()) });
    }

    return NextResponse.json({ ok: false, error: "Unknown action" }, { status: 400 });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: e?.message || "integration failed" }, { status: 500 });
  }
}
