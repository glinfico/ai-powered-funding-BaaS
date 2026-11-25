export {};
// ORCHESTRATOR — single entry door for every entity entering GLINFICO (see docs/SYSTEM.md).
// Saves the entity, registers the intake, then hands it to the Hyper-Processor (IDE/AAI first).
// It does NOT create AAIs or score anything itself.
const SB_URL = Deno.env.get("SUPABASE_URL")!;
const SB_KEY = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
const ORCH_KEY = Deno.env.get("ORCHESTRATOR_KEY") || "";

const H = { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json", Prefer: "return=representation" };
const json = (b: unknown, s = 200) => new Response(JSON.stringify(b), { status: s, headers: { "Content-Type": "application/json" } });
const s = (v: unknown) => (v == null ? "" : String(v).trim());

async function insert(table: string, row: Record<string, unknown>) {
  const r = await fetch(`${SB_URL}/rest/v1/${table}`, { method: "POST", headers: H, body: JSON.stringify(row) });
  const t = await r.text();
  if (!r.ok) throw new Error(`${table}: ${r.status} ${t.slice(0, 200)}`);
  return JSON.parse(t)[0];
}

// Map incoming data to the existing tables' columns (required columns get safe defaults).
function rowFor(entity: string, d: Record<string, unknown>, source: string) {
  if (entity === "lead") return { table: "leads", row: {
    first_name: s(d.firstName) || "Unknown", last_name: s(d.lastName) || "Unknown",
    email: s(d.email).toLowerCase(), phone: s(d.phone), company: s(d.company), job_title: s(d.jobTitle) || "Owner",
    city: s(d.city), country: s(d.country), address: s(d.address), source: s(d.source) || source,
    estimated_value: Math.round(Number(String(d.estimatedValue ?? "").replace(/[^0-9.]/g, "")) || 0),
  } };
  if (entity === "lender") return { table: "lenders", row: {
    name: s(d.name), contact_email: s(d.contactEmail || d.email), phone: s(d.phone), notes: s(d.notes),
  } };
  if (entity === "investor") return { table: "investors", row: {
    name: s(d.name), contact_email: s(d.contactEmail || d.email), focus: s(d.focus), notes: s(d.notes),
  } };
  return null; // broker | deal | vendor | partner | sponsor → registered as "queued" until their table is wired
}

Deno.serve(async (req) => {
  if (req.method !== "POST") return json({ ok: false, error: "POST only" }, 405);
  if (!ORCH_KEY || req.headers.get("x-orchestrator-key") !== ORCH_KEY) return json({ ok: false, error: "unauthorized" }, 401);
  try {
    const { entity, source = "api", data = {} } = await req.json();
    const e = s(entity).toLowerCase();
    if (!e) return json({ ok: false, error: "entity required" }, 400);
    const m = rowFor(e, data, source);
    let entityId: number | null = null;
    if (m) {
      if (e === "lead" && !String(m.row.email).includes("@")) return json({ ok: false, error: "lead needs a valid email" }, 400);
      if (e !== "lead" && !m.row.name) return json({ ok: false, error: `${e} needs a name` }, 400);
      const created = await insert(m.table, m.row);
      if (!created) return json({ ok: false, error: "blocked (placeholder guard or constraint)" }, 422);
      entityId = created.id;
    }
    const reg = await insert("intake_register", {
      entity_type: e, entity_table: m?.table ?? null, entity_id: entityId, source,
      status: m ? "received" : "queued", payload: data,
    });
    if (m) {
      // Hand off to the Hyper-Processor without making the caller wait.
      const p = fetch(`${SB_URL}/functions/v1/hyper-processor`, {
        method: "POST", headers: { Authorization: `Bearer ${SB_KEY}`, "Content-Type": "application/json" },
        body: JSON.stringify({ register_id: reg.id }),
      }).catch(() => {});
      // @ts-ignore EdgeRuntime exists in Supabase Edge Functions
      if (typeof EdgeRuntime !== "undefined") EdgeRuntime.waitUntil(p);
    }
    return json({ ok: true, register_id: reg.id, entity: e, entity_id: entityId, status: reg.status });
  } catch (err) {
    return json({ ok: false, error: (err as Error).message }, 500);
  }
});
