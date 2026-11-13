// Tamper-evident, encrypted consent envelopes.
// Each signed form becomes one envelope: the evidence (who, what, when, from where,
// exact text hash) is AES-256-GCM encrypted, and every envelope is hash-chained to
// the previous one — editing or deleting any row breaks the chain (verifyChain()).
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { seal, open, sha256 } from "@/lib/vault";

export async function ensureEnvelopes() {
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS consent_envelopes (
    id serial PRIMARY KEY, lead_id integer NOT NULL, purpose text NOT NULL,
    payload_enc text NOT NULL, payload_hash text NOT NULL,
    prev_hash text NOT NULL, record_hash text NOT NULL, created_at timestamp DEFAULT now() NOT NULL)`));
  await db.execute(sql.raw(`CREATE INDEX IF NOT EXISTS consent_envelopes_lead_idx ON consent_envelopes (lead_id)`));
}

export async function sealEnvelope(leadId: number, purpose: string, evidence: Record<string, unknown>) {
  await ensureEnvelopes();
  const json = JSON.stringify(evidence);
  const payloadHash = sha256(json);
  const prev: any = await db.execute(sql`SELECT record_hash FROM consent_envelopes ORDER BY id DESC LIMIT 1`).then((r: any) => r.rows || r);
  const prevHash = prev[0]?.record_hash || "GENESIS";
  const recordHash = sha256(`${prevHash}|${leadId}|${purpose}|${payloadHash}`);
  const r: any = await db
    .execute(sql`INSERT INTO consent_envelopes (lead_id, purpose, payload_enc, payload_hash, prev_hash, record_hash)
      VALUES (${leadId}, ${purpose}, ${seal(json)}, ${payloadHash}, ${prevHash}, ${recordHash}) RETURNING id`)
    .then((x: any) => x.rows || x);
  return { envelopeId: r[0].id as number, recordHash };
}

/** Admin check: re-computes every hash and decrypts every payload. */
export async function verifyChain(limit = 5000) {
  await ensureEnvelopes();
  const rows: any[] = await db
    .execute(sql`SELECT id, lead_id, purpose, payload_enc, payload_hash, prev_hash, record_hash FROM consent_envelopes ORDER BY id LIMIT ${limit}`)
    .then((r: any) => r.rows || r);
  let prev = "GENESIS";
  for (const r of rows) {
    const json = open(r.payload_enc);
    const ok = r.prev_hash === prev && sha256(json) === r.payload_hash &&
      sha256(`${r.prev_hash}|${r.lead_id}|${r.purpose}|${r.payload_hash}`) === r.record_hash;
    if (!ok) return { ok: false, brokenAt: r.id, checked: rows.length };
    prev = r.record_hash;
  }
  return { ok: true, checked: rows.length };
}
