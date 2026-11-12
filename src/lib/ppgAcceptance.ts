// Records each member's acceptance of their PPG rules (one row per email + role + version).
import { db } from "@/db";
import { sql } from "drizzle-orm";
import { RULES_VERSION } from "@/lib/ppgRules";

export async function ensureAcceptanceTable() {
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS ppg_acceptances (
    id serial PRIMARY KEY, email text NOT NULL, role text NOT NULL, version text NOT NULL,
    details text DEFAULT '{}' NOT NULL, accepted_at timestamp DEFAULT now() NOT NULL)`));
  await db.execute(sql.raw(`CREATE UNIQUE INDEX IF NOT EXISTS ppg_acceptances_uniq ON ppg_acceptances (email, role, version)`));
}

export async function hasAccepted(email: string, role: string): Promise<boolean> {
  await ensureAcceptanceTable();
  const r: any = await db.execute(sql`SELECT 1 FROM ppg_acceptances WHERE email=${email} AND role=${role} AND version=${RULES_VERSION} LIMIT 1`);
  return (r.rows || r).length > 0;
}

export async function recordAcceptance(email: string, role: string, details: Record<string, unknown> = {}) {
  await ensureAcceptanceTable();
  await db.execute(sql`INSERT INTO ppg_acceptances (email, role, version, details)
    VALUES (${email}, ${role}, ${RULES_VERSION}, ${JSON.stringify(details)})
    ON CONFLICT (email, role, version) DO NOTHING`);
}
