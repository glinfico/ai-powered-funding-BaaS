// LAE broker provisioning: a verified PayPal payment creates (or upgrades) the broker
// account, sets the package lead quota and issues the tier ID (S/G/P/E-MMYY-L######).
import { db } from "@/db";
import { integrationEvents } from "@/db/schema";
import { sql } from "drizzle-orm";
import { ensureBrokers, backfillIds } from "@/lib/idBackfill";
import { TIERS, reTier, parseCode } from "@/lib/idEngine";
import { BROKER_PACKAGES } from "@/lib/paypal";

type Pkg = (typeof BROKER_PACKAGES)[number];

export async function ensurePaypalEvents() {
  await db.execute(sql.raw(`CREATE TABLE IF NOT EXISTS paypal_events (
    event_id text PRIMARY KEY, event_type text NOT NULL, status text NOT NULL,
    detail text DEFAULT '{}' NOT NULL, received_at timestamp DEFAULT now() NOT NULL)`));
}

/** Returns false if this PayPal event was already processed (PayPal retries deliveries). */
export async function claimEvent(id: string, type: string): Promise<boolean> {
  await ensurePaypalEvents();
  const r: any = await db.execute(sql`INSERT INTO paypal_events (event_id, event_type, status)
    VALUES (${id}, ${type}, 'received') ON CONFLICT (event_id) DO NOTHING RETURNING event_id`);
  return (r.rows || r).length > 0;
}

export async function finishEvent(id: string, status: string, detail: Record<string, unknown>) {
  await db.execute(sql`UPDATE paypal_events SET status=${status}, detail=${JSON.stringify(detail)} WHERE event_id=${id}`);
}

export async function provisionBroker(input: { email: string; name: string; pkg: Pkg; ref: string }) {
  await ensureBrokers();
  const email = input.email.trim().toLowerCase();
  const { pkg } = input;
  const found: any = await db
    .execute(sql`SELECT id, code FROM brokers WHERE lower(email) = ${email} ORDER BY id LIMIT 1`)
    .then((r: any) => r.rows || r);

  let id: number;
  let action: "created" | "upgraded" | "renewed";
  if (found.length) {
    id = found[0].id;
    const code: string = found[0].code || "";
    const current = parseCode(code)?.prefix;
    action = current && current !== pkg.prefix ? "upgraded" : "renewed";
    // Re-tier keeps cohort + sequence; only the prefix changes (AAI standard).
    const newCode = code && current !== pkg.prefix ? reTier(code, pkg.prefix) : code;
    await db.execute(sql`UPDATE brokers SET plan=${pkg.plan}, lead_quota=${pkg.leadQuota}, paypal_ref=${input.ref},
      status='active', paid_at=now(), simulated=0, code=${newCode}, tier=${newCode ? TIERS[pkg.prefix].label : ""}
      WHERE id=${id}`);
    if (code && newCode !== code) {
      await db.execute(sql`INSERT INTO id_ledger (entity_type, entity_id, from_code, to_code, action, note)
        VALUES ('Broker', ${id}, ${code}, ${newCode}, 'upgrade', ${`PayPal payment — ${pkg.name}`})`);
    }
  } else {
    const r: any = await db
      .execute(sql`INSERT INTO brokers (name, plan, title, email, lead_quota, paypal_ref, status, paid_at, simulated)
        VALUES (${input.name || email}, ${pkg.plan}, 'Broker', ${email}, ${pkg.leadQuota}, ${input.ref}, 'active', now(), 0)
        RETURNING id`)
      .then((x: any) => x.rows || x);
    id = r[0].id;
    action = "created";
  }
  // Issue the tier ID if the broker has none yet (current month cohort).
  await backfillIds("brokers", pkg.prefix, `id = ${id}`);
  const row: any = await db.execute(sql`SELECT code FROM brokers WHERE id=${id}`).then((x: any) => x.rows || x);
  const code = row[0]?.code || "";
  await db.insert(integrationEvents).values({
    type: "LAE.broker_provisioned", provider: "PayPal", status: "delivered", count: 1,
    payload: JSON.stringify({ email, brokerId: id, code, package: pkg.name, leadQuota: pkg.leadQuota, action, ref: input.ref }),
  });
  return { brokerId: id, code, action, package: pkg.name, leadQuota: pkg.leadQuota };
}
