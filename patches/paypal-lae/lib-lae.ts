// src/lib/lae.ts (NEW) — Leads Assignment Engine provisioning hook.
// Called by the PayPal webhook after BILLING.SUBSCRIPTION.ACTIVATED:
// creates/links the broker account (staff.portal='broker'), creates the brokers row,
// assigns the AAI broker code for the plan prefix (S/G/P/E), logs id_ledger + engine event.
import { db } from "@/db";
import { staff, brokers, idLedger, integrationEvents } from "@/db/schema";
import { eq, sql } from "drizzle-orm";
import { TIERS, currentCohort, makeCode, monthLetter, nextSeq, parseCode, labelFor } from "@/lib/idEngine";

export const PLAN_PREFIX: Record<string, string> = { STARTER: "S", GOLD: "G", PLATINUM: "P", ENTERPRISE: "E" };
export const PLAN_NAME: Record<string, string> = { STARTER: "Silver", GOLD: "Gold", PLATINUM: "Platinum", ENTERPRISE: "Emerald" };

export async function provisionBroker(o: { email: string; name?: string; planKey: string }) {
  const prefix = PLAN_PREFIX[o.planKey] || "G";
  const plan = PLAN_NAME[o.planKey] || "Growth";
  const email = o.email.toLowerCase();

  // 1) account: staff row with portal=broker (gate falls back to Supabase SSO by email)
  const [existing] = await db.select().from(staff).where(eq(staff.email, email)).limit(1);
  if (existing) {
    await db.execute(sql`UPDATE staff SET portal='broker', role=CASE WHEN role='admin' THEN role ELSE 'user' END WHERE id=${existing.id}`);
  } else {
    const salt = Math.random().toString(36).slice(2);
    await db.insert(staff).values({ email, name: o.name || email, passHash: "sso:" + salt, salt, role: "user", portal: "broker" });
  }

  // 2) brokers row (idempotent on email-ish name)
  let [brow] = await db.select().from(brokers).where(eq(brokers.name, o.name || email)).limit(1);
  if (!brow) {
    [brow] = await db.insert(brokers).values({ name: o.name || email, plan, title: "Broker", phone: "", legacyRef: "", simulated: 0 }).returning();
  }

  // 3) AAI code by plan prefix (current cohort, e.g. P-1126-N100xxx)
  if (!brow.code) {
    const rows: any = await db.execute(sql`SELECT code FROM brokers WHERE code LIKE ${prefix + "-%"}`).then((r: any) => r.rows || r);
    const seq = nextSeq(rows.map((r: any) => parseCode(r.code)?.seq).filter((n: any) => !!n));
    const code = makeCode(prefix, seq);
    await db.execute(sql`UPDATE brokers SET code=${code}, tier=${TIERS[prefix].label} WHERE id=${brow.id}`);
    await db.insert(idLedger).values({ entityType: "Broker", entityId: brow.id, fromCode: "", toCode: code, action: "assign", note: labelFor(code) + " — PayPal " + plan + " subscription" });
    await db.insert(integrationEvents).values({ type: "LAE.broker_provisioned", provider: "Engines", status: "delivered", count: 1, payload: JSON.stringify({ email, plan, prefix, code, at: new Date().toISOString() }) });
    return { code, plan, prefix };
  }
  return { code: brow.code, plan, prefix, already: true };
}
