export {};
// HYPER-PROCESSOR — the engine room (see docs/SYSTEM.md). Runs the owner's order:
//   1. IDE first (AAI) — via the existing engine cycle; nothing continues without an AAI.
//   2. Gemini fills EMPTY public business profile fields only (never contact, SSN, DOB, income or credit).
//   3. Engines (ACE → LAE → DPE) continue through the existing engine cycle.
// It CALLS the existing engines; it never creates AAIs or scores by itself. Every step is logged in hp_jobs.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const CCD = (Deno.env.get("CCD_BASE_URL") || "").replace(/\/$/, "");
const CRON = Deno.env.get("CRON_SECRET") || "";
const GEMINI = Deno.env.get("GEMINI_API_KEY") || "";
const MODEL = Deno.env.get("GEMINI_MODEL") || "gemini-3.5-flash-lite";
const ORCH_KEY = Deno.env.get("ORCHESTRATOR_KEY") || "";

const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });

async function get(path: string) { const r = await fetch(`${SB_URL}/rest/v1/${path}`, { headers: H }); return r.ok ? r.json() : []; }
async function patch(table: string, id: number, body: Record<string, unknown>) {
  await fetch(`${SB_URL}/rest/v1/${table}?id=eq.${id}`, { method: "PATCH", headers: H, body: JSON.stringify(body) });
}
async function log(register_id: number, step: string, status: string, detail = "") {
  await fetch(`${SB_URL}/rest/v1/hp_jobs`, { method: "POST", headers: H, body: JSON.stringify({ register_id, step, status, detail: detail.slice(0, 500) }) });
}
async function runEngineCycle(): Promise<string> {
  if (!CCD || !CRON) return "CCD_BASE_URL / CRON_SECRET not set";
  const r = await fetch(`${CCD}/api/engines/cycle`, { method: "POST", headers: { "x-cron-secret": CRON } });
  return r.ok ? "ok" : `HTTP ${r.status}`;
}

// Gemini: public business profile only, empty fields only, high confidence only.
async function geminiProfile(e: Record<string, any>) {
  const ask = { company: e.company || e.name || "", email_domain: String(e.email || e.contact_email || "").split("@")[1] || "", phone_area: String(e.phone || "").replace(/\D/g, "").slice(-10, -7) };
  if (!ask.company) return null;
  const prompt = `You help a business-lending platform complete PUBLIC BUSINESS profile data.
Business: ${JSON.stringify(ask)}
Return ONLY JSON: {"city":"","state":"","country":"","address":"","industry":"","website":"","confidence":0.0}
Rules: public business information only. Use "" when not sure. NEVER provide personal data (no personal phone, email, SSN, DOB, income or credit). confidence = 0..1 for the whole answer.`;
  const r = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`, {
    method: "POST", headers: { "Content-Type": "application/json", "x-goog-api-key": GEMINI },
    body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }], generationConfig: { responseMimeType: "application/json", temperature: 0.1 } }),
  });
  if (!r.ok) throw new Error(`Gemini HTTP ${r.status}`);
  const t = (await r.json()).candidates?.[0]?.content?.parts?.[0]?.text || "{}";
  return JSON.parse(t);
}

async function processIntake(regId: number) {
  const [reg] = await get(`intake_register?id=eq.${regId}&select=*`);
  if (!reg || !reg.entity_table || !reg.entity_id) return { regId, status: "skipped" };
  const fetchEntity = async () => (await get(`${reg.entity_table}?id=eq.${reg.entity_id}&select=*`))[0];

  // 1. IDE first
  let ent = await fetchEntity();
  if (!ent) { await log(regId, "ide", "error", "entity not found"); await patch("intake_register", regId, { status: "error" }); return { regId, status: "error" }; }
  if (!ent.code) {
    const c = await runEngineCycle();
    ent = await fetchEntity();
    if (!ent?.code) { await log(regId, "ide", "waiting", `no AAI yet (cycle: ${c})`); await patch("intake_register", regId, { status: "waiting_aai", updated_at: new Date().toISOString() }); return { regId, status: "waiting_aai" }; }
  }
  await log(regId, "ide", "ok", ent.code);
  await patch("intake_register", regId, { status: "aai_ok", aai: ent.code, updated_at: new Date().toISOString() });

  // 2. Gemini — fill only EMPTY profile fields (leads have city/country/address columns)
  if (!GEMINI) await log(regId, "gemini", "skipped", "GEMINI_API_KEY not set");
  else {
    try {
      const p = await geminiProfile(ent);
      const fill: Record<string, string> = {};
      if (p && Number(p.confidence) >= 0.7 && reg.entity_table === "leads") {
        for (const k of ["city", "country", "address"]) if (!ent[k] && p[k]) fill[k] = String(p[k]);
      }
      if (Object.keys(fill).length) await patch(reg.entity_table, reg.entity_id, fill);
      await patch("intake_register", regId, { status: "enriched", ai_profile: { ...p, filled: Object.keys(fill), source: "gemini" }, updated_at: new Date().toISOString() });
      await log(regId, "gemini", "ok", `filled: ${Object.keys(fill).join(", ") || "nothing (already complete or low confidence)"}`);
    } catch (err) { await log(regId, "gemini", "error", (err as Error).message); }
  }

  // 3. Engines continue (ACE → LAE → DPE) through the existing engine cycle
  const c = await runEngineCycle();
  await log(regId, "engines", c === "ok" ? "ok" : "error", `engine cycle: ${c}`);
  await patch("intake_register", regId, { status: "handed_to_engines", updated_at: new Date().toISOString() });
  return { regId, status: "handed_to_engines", aai: ent.code };
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  const bearer = (req.headers.get("authorization") || "").replace(/^Bearer\s+/i, "");
  if (bearer !== SB_KEY && !(ORCH_KEY && req.headers.get("x-orchestrator-key") === ORCH_KEY)) return json({ ok: false, error: "unauthorized" }, 401);
  try {
    const body = await req.json().catch(() => ({}));
    if (body.register_id) return json({ ok: true, result: await processIntake(Number(body.register_id)) });
    // Batch mode: retry anything not finished (e.g. waiting for AAI)
    const limit = Math.min(Number(body.limit) || 20, 100);
    const pending = await get(`intake_register?status=in.(received,waiting_aai,aai_ok)&entity_id=not.is.null&order=id.asc&limit=${limit}&select=id`);
    const results = [];
    for (const r of pending) results.push(await processIntake(r.id));
    return json({ ok: true, processed: results.length, results });
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500);
  }
});
