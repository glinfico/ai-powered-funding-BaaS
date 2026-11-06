/**
 * Durable AAI sequence allocation.
 *
 * The previous implementation (src/lib/idEngineRunner.js) kept counters in a
 * module-level Map. That breaks in three ways that matter for an identity
 * engine:
 *
 *   1. Counters reset to zero on every redeploy or cold start, so AAI codes
 *      get reissued.
 *   2. Two server instances hold independent counters and will hand the same
 *      code to different leads.
 *   3. Two concurrent requests on one instance can interleave read and write.
 *
 * An AAI is a permanent external reference. It has to come from a single
 * authoritative counter. This module uses an atomic Postgres increment via
 * Supabase RPC, and only falls back to memory when Supabase is absent —
 * loudly, because codes issued in that mode are not safe to keep.
 */

const SUPABASE_URL = process.env.SUPABASE_URL || "";
const SUPABASE_KEY = process.env.SUPABASE_SERVICE_KEY || "";

/**
 * Supabase is imported lazily. The engine must remain runnable and testable
 * in environments where the client is not installed or not configured;
 * hard-importing it would make the whole pipeline fail to load.
 */
let supabase = null;
let supabaseInit = null;

async function getSupabase() {
  if (!SUPABASE_URL || !SUPABASE_KEY) return null;
  if (supabase) return supabase;
  if (!supabaseInit) {
    supabaseInit = import("@supabase/supabase-js")
      .then(({ createClient }) => {
        supabase = createClient(SUPABASE_URL, SUPABASE_KEY, {
          auth: { persistSession: false },
        });
        return supabase;
      })
      .catch((err) => {
        console.error(`[aai] Supabase client unavailable: ${err.message}`);
        return null;
      });
  }
  return supabaseInit;
}

export const SEQUENCE_DURABLE = Boolean(SUPABASE_URL && SUPABASE_KEY);

const memoryCounters = new Map();
let warnedAboutMemory = false;

function cohortKey(prefixCode, date = new Date()) {
  const mm = String(date.getMonth() + 1).padStart(2, "0");
  const yy = String(date.getFullYear()).slice(-2);
  return `${String(prefixCode).toUpperCase()}_${mm}${yy}`;
}

/**
 * Allocate the next sequence number for a prefix within the current cohort.
 * @returns {Promise<number>}
 */
export async function nextAaiSequence(prefixCode, date = new Date()) {
  const key = cohortKey(prefixCode, date);

  const client = await getSupabase();
  if (client) {
    // Atomic server-side increment. Requires the SQL function in
    // migrations/aai_sequence.sql.
    const { data, error } = await client.rpc("next_aai_sequence", {
      p_key: key,
    });
    if (!error && Number.isFinite(Number(data))) return Number(data);

    console.error(
      `[aai] Durable sequence failed for ${key}: ${error?.message || "no value returned"}. ` +
        `Falling back to in-memory — codes issued now may collide.`
    );
  }

  if (!warnedAboutMemory) {
    warnedAboutMemory = true;
    console.warn(
      "[aai] Running on in-memory sequences. Codes reset on restart and are " +
        "not unique across instances. Apply migrations/aai_sequence.sql and set " +
        "SUPABASE_URL + SUPABASE_SERVICE_KEY before issuing production AAIs."
    );
  }

  const next = (memoryCounters.get(key) || 0) + 1;
  memoryCounters.set(key, next);
  return next;
}

/** Test helper — not used in production paths. */
export function __resetMemoryCounters() {
  memoryCounters.clear();
  warnedAboutMemory = false;
}
