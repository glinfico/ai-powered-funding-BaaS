// Provider discovery + IDIQ JSON normalization.
// Real credentials are ONLY read server-side from the system environment.
// If they're not in the system, the engine honestly reports SIMULATED.

export const PROVIDER_ENV = {
  idiq: ["IDIQ_API_KEY", "IDIQ_API_URL", "IDIQ_PARTNER_ID"],
  fingoal: ["FINGOAL_API_KEY", "FINGOAL_API_URL"],
  ide: ["IDE_WEBHOOK_URL"],
};

export function providerConfig() {
  return {
    idiq: {
      keySet: !!process.env.IDIQ_API_KEY,
      partnerSet: !!process.env.IDIQ_PARTNER_ID,
      apiUrl: process.env.IDIQ_API_URL || "https://api.idandcredit.com",
      docs: "https://api.idandcredit.com",
    },
    fingoal: {
      keySet: !!(process.env.FINGOAL_API_KEY || process.env.FINGOAL_TOKEN),
      apiUrl: process.env.FINGOAL_API_URL || "https://findmoney.fingoal.com",
      docs: "https://docs.fingoal.dev",
    },
    ide: { webhookSet: !!process.env.IDE_WEBHOOK_URL },
  };
}

function lowerKeys(o: any): Record<string, any> {
  const out: Record<string, any> = {};
  if (o && typeof o === "object") for (const k of Object.keys(o)) out[k.toLowerCase().replace(/^@/, "").replace(/[\s_-]/g, "")] = o[k];
  return out;
}
function unwrapDollar(v: any): any {
  // IdentityIQ serializes attributes/values as { "$": "value" } — unwrap those.
  if (v && typeof v === "object" && !Array.isArray(v)) {
    const keys = Object.keys(v);
    if (keys.length === 1 && keys[0] === "$") return v["$"];
  }
  return v;
}
function pick(obj: any, names: string[]): any {
  if (!obj || typeof obj !== "object") return undefined;
  const lk = lowerKeys(obj);
  for (const n of names) { const v = unwrapDollar(lk[n.toLowerCase().replace(/[\s_-]/g, "")]); if (v !== undefined && v !== null && v !== "") return v; }
  return undefined;
}
// IdentityIQ dashboards answer JSONP: JSON_CALLBACK({ ... }); — strip any wrapper.
export function stripJsonp(text: string): string {
  const t = text.trim();
  const m = t.match(/^[A-Za-z_$][\w$]*\s*\(([\s\S]*)\)\s*;?\s*$/);
  if (m) {
    try { JSON.parse(m[1]); return m[1]; } catch { /* fall through */ }
  }
  return t;
}
function deepFind(obj: any, names: string[], depth = 0): any {
  if (!obj || typeof obj !== "object" || depth > 4) return undefined;
  const direct = pick(obj, names);
  if (direct !== undefined) return direct;
  for (const v of Object.values(obj)) { const f = deepFind(v, names, depth + 1); if (f !== undefined) return f; }
  return undefined;
}

export type NormalizedIdiq = {
  externalRef: string; email: string; firstName: string; lastName: string;
  identityStatus: string; identityConfidence: number; softPullStatus: string;
  creditScore: number; monitoringStatus: string; monitoringAlerts: number;
  // IdentityIQ report-specific fields (from JSON_CALLBACK / dsply.aspx payloads)
  creditModel?: string; populationRank?: number; inquiriesAffected?: string;
  factorCount?: number; negativeFactors?: number; factorTexts?: string[];
  reportTypes?: string[]; jsonp?: boolean;
};

function normStatus(v: any, kind: "identity" | "soft" | "monitoring"): string {
  const s = String(v ?? "").toLowerCase();
  if (kind === "identity") {
    if (["verified", "pass", "passed", "true", "yes", "approved", "complete", "completed"].includes(s) || v === true) return "Verified";
    if (["failed", "fail", "false", "no", "rejected", "declined"].includes(s) || v === false) return "Failed";
    return v ? "Review" : "Verified";
  }
  if (kind === "soft") {
    if (["nohit", "no hit", "none", "notfound"].includes(s)) return "No Hit";
    if (["review", "pending", "manual"].includes(s)) return "Review";
    return "Completed";
  }
  if (["enrolled", "active", "true", "yes", "on"].includes(s) || v === true) return "Enrolled";
  if (["not enrolled", "inactive", "false", "no", "off"].includes(s) || v === false) return "Not Enrolled";
  return v ? "Enrolled" : "Enrolled";
}

function extractStatus(raw: any): any {
  if (raw && typeof raw === "object") return raw.status ?? raw.state ?? raw.result ?? raw.verified ?? raw.enrolled ?? raw.value ?? undefined;
  return raw;
}

export function parseIdiqJson(text: string): { records: NormalizedIdiq[]; rawCount: number; errors: string[] } {
  const errors: string[] = [];
  const wasJsonp = text.trim() !== stripJsonp(text).trim();
  let data: any;
  try { data = JSON.parse(stripJsonp(text)); }
  catch { return { records: [], rawCount: 0, errors: ["That is not valid JSON — check for a trailing comma, missing quote, or a JSONP wrapper (we do strip JSON_CALLBACK(...))."] }; }

  let list: any[] = [];
  if (Array.isArray(data)) list = data;
  else if (data && typeof data === "object") {
    const container = pick(data, ["members", "enrollments", "enrollment", "leads", "records", "data", "results", "items", "customers", "users", "persons", "member", "reports", "bundleComponents"]);
    if (Array.isArray(container)) list = container;
    else if (container && typeof container === "object") list = [container];
    else list = [data]; // single object (e.g. one IdentityIQ report payload)
  }
  if (!list.length) errors.push("JSON parsed, but no records found inside it.");

  const records: NormalizedIdiq[] = list.map((rec: any, i: number) => {
    const fullName = pick(rec, ["name", "fullName", "memberName", "customerName", "consumerName"]);
    const firstName = pick(rec, ["firstName", "first", "givenName", "fname"]) || (fullName ? String(fullName).split(" ")[0] : "");
    const lastName = pick(rec, ["lastName", "last", "familyName", "lname", "surname"]) || (fullName ? String(fullName).split(" ").slice(1).join(" ") : "");

    // IdentityIQ report payloads (member.identityiq.com / dsply.aspx JSON_CALLBACK):
    // CreditScoreType: { "@riskScore": "770", "@scoreName": "VantageScore3", "@populationRank": "79",
    //                    "@inquiriesAffectedScore": "true", "CreditScoreFactor": [ { BureauCode, FactorType,
    //                    Factor: { @abbreviation, @description, @symbol, @rank }, FactorText: [ {"$": "..."} ] } ] }
    const creditRaw = deepFind(rec, ["riskScore", "creditScore", "ficoScore", "vantageScore", "scoreValue", "score"]);
    const creditScore = creditRaw !== undefined && Number(creditRaw) >= 300 && Number(creditRaw) <= 900 ? Math.round(Number(creditRaw)) : 0;
    const creditModel = deepFind(rec, ["scoreName", "scoreModel", "scoringModel"]) ? String(deepFind(rec, ["scoreName", "scoreModel", "scoringModel"])) : "";
    const popRankRaw = deepFind(rec, ["populationRank"]);
    const inquiriesRaw = deepFind(rec, ["inquiriesAffectedScore"]);

    let factors: any[] = [];
    const fRaw = deepFind(rec, ["creditScoreFactor", "factors", "creditFactors"]);
    if (Array.isArray(fRaw)) factors = fRaw; else if (fRaw && typeof fRaw === "object") factors = [fRaw];
    const negativeFactors = factors.filter(f => String(pick(f, ["factorType", "type"]) || "").toLowerCase() === "negative").length;
    const factorTexts: string[] = [];
    for (const f of factors) {
      const ft = pick(f, ["factorText", "factorExplanation"]);
      const arr = Array.isArray(ft) ? ft : ft ? [ft] : [];
      for (const t of arr) factorTexts.push(String(unwrapDollar(t)));
    }

    // Bundle components carry the bureau report types: BundleComponent: [ { Type: {"$":"TUCReportV6"} }, ... ]
    let comps: any[] = [];
    const cRaw = deepFind(rec, ["bundleComponent", "components"]);
    if (Array.isArray(cRaw)) comps = cRaw; else if (cRaw && typeof cRaw === "object") comps = [cRaw];
    const reportTypes = comps.map(c => String(unwrapDollar(pick(c, ["type"])) || "")).filter(Boolean);

    const confRaw = deepFind(rec, ["identityConfidence", "confidence", "identityScore", "verificationScore", "matchScore", "populationRank"]);
    return {
      externalRef: String(pick(rec, ["idiqRef", "memberId", "enrollmentId", "reference", "ref", "customerId", "pdt", "id", "uid", "memberNumber"]) || `JSON-${i + 1}`),
      email: String(pick(rec, ["email", "emailAddress", "mail", "memberEmail"]) || "").trim().toLowerCase(),
      firstName: String(firstName || ""), lastName: String(lastName || ""),
      identityStatus: normStatus(extractStatus(deepFind(rec, ["identityStatus", "identityVerified", "idVerified", "verified", "identity", "verificationStatus", "idStatus"])), "identity"),
      identityConfidence: confRaw !== undefined && !isNaN(Number(confRaw)) ? Math.max(0, Math.min(100, Math.round(Number(confRaw)))) : 90,
      softPullStatus: creditScore > 0 ? "Completed" : normStatus(extractStatus(deepFind(rec, ["softPullStatus", "softPull", "creditStatus", "pullStatus"])), "soft"),
      creditScore,
      monitoringStatus: normStatus(extractStatus(deepFind(rec, ["monitoringStatus", "monitoringEnrolled", "monitoring", "alertsEnrolled", "enrolledInMonitoring"])), "monitoring"),
      monitoringAlerts: Number(deepFind(rec, ["monitoringAlerts", "alerts", "alertCount"]) || 0) || 0,
      creditModel, populationRank: popRankRaw !== undefined ? Number(popRankRaw) : undefined,
      inquiriesAffected: inquiriesRaw !== undefined ? String(inquiriesRaw) : undefined,
      factorCount: factors.length || undefined, negativeFactors: negativeFactors || undefined,
      factorTexts: factorTexts.length ? factorTexts.slice(0, 6) : undefined,
      reportTypes: reportTypes.length ? reportTypes : undefined, jsonp: wasJsonp || undefined,
    };
  });
  const noEmail = records.filter(r => !r.email).length;
  if (noEmail) errors.push(`${noEmail} record(s) have no email inside the payload (a raw IdentityIQ report doesn't carry one) — pass "match to lead email" below, or match on the IDIQ ref, to attach them to a lead.`);
  return { records, rawCount: list.length, errors };
}

// A trimmed copy of the real IdentityIQ member-dashboard payload shape
// (JSON_CALLBACK({...}) from dsply.aspx on member.identityiq.com) — exactly what
// the DevTools "Sources" view shows, as in the user's screenshot.
export const SAMPLE_IDIQ_JSON = `JSON_CALLBACK({
  "BundleComponents": {
    "BundleComponent": [
      { "Type": { "$": "TUCReportV6" } },
      { "Type": { "$": "EQFReportV6" } },
      { "Type": { "$": "EXPRReportV6" } },
      {
        "Type": { "$": "ScoreModel" },
        "CreditScoreType": {
          "@riskScore": "770",
          "@scoreName": "VantageScore3",
          "@populationRank": "79",
          "@inquiriesAffectedScore": "true",
          "CreditScoreFactor": [
            {
              "BureauCode": "55",
              "FactorType": "Negative",
              "Factor": { "@abbreviation": "", "@description": "", "@symbol": "55", "@rank": "100000" },
              "FactorText": [
                { "$": "factor: Open real estate account balances are too high compared to their loan amounts" },
                { "$": "cANDO: As monthly real estate payments are made, a portion of the outstanding principal balance will be paid down" }
              ]
            },
            {
              "BureauCode": "12",
              "FactorType": "Negative",
              "Factor": { "@abbreviation": "", "@description": "", "@symbol": "12", "@rank": "100000" },
              "FactorText": [
                { "$": "factor: Your oldest account is still too recent. A credit file containing older accounts will usually increase your score" },
                { "$": "cANDO: Don't open more accounts than you actually need" }
              ]
            }
          ]
        }
      }
    ]
  }
})`;
