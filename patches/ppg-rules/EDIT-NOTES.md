# Edits to existing files (ccd-v2 branch, ~/ccd-v2-site)

## A) src/app/api/ppg/route.ts — include acceptance status in GET response
Add imports: `portalAcceptances` (schema) — and in GET, after session check:
  const [acc] = await db.select().from(portalAcceptances).where(eq(portalAcceptances.email, s.email)).limit(1);
  const [st] = await db.select().from(staff).where(eq(staff.email, s.email)).limit(1);
  ... response add: portal: st?.portal || "borrower", accepted: !!acc

## B) src/app/ppg/page.tsx — gate the portal behind the rules step
In the load effect, after setMe(await r.json()):
  const m = await r.json(); setMe(m);
  if (!m.accepted) { router.push(`/ppg/rules?portal=${m.portal || "borrower"}`); return; }
And show portal in the header sub-line: `portal: {me.portal}`.

## C) src/db/schema.ts — add portalAcceptances table:
export const portalAcceptances = pgTable("portal_acceptances", {
  id: serial("id").primaryKey(),
  email: text("email").notNull(),
  portal: text("portal").notNull(),
  acceptedAt: timestamp("accepted_at").defaultNow().notNull(),
}, (t) => [uniqueIndex("portal_acceptances_email_portal").on(t.email, t.portal)]);

## Apply order
1. Paste supabase/portal-acceptances.sql in Supabase (kpoqglkyvfaztaemhtsa) SQL editor.
2. schema.ts (C) + copy new files portal-rules.ts, api/ppg/accept/route.ts, ppg/rules/page.tsx.
3. Edits A + B.
4. cd ~/ccd-v2-site && npx --yes netlify-cli deploy --prod --site 84334923-61ca-4c15-a069-b9ecbba721e0
5. Test: sign in at /gate (portal=borrower) → /ppg redirects to /ppg/rules?portal=borrower → Agree → ID issued (SL-1126-N…) → back to /ppg.

## D) Broker PayPal -> LAE provisioning (files in patches/paypal-lae/)
1. Copy `patches/paypal-lae/lib-lae.ts` -> `src/lib/lae.ts`
   and `patches/paypal-lae/paypal-webhook-route.ts` -> `src/app/api/paypal/webhook/route.ts`
2. Env on the admin-glinfico site (hidden input + --force):
   PAYPAL_CLIENT_ID, PAYPAL_CLIENT_SECRET, PAYPAL_WEBHOOK_ID,
   PAYPAL_PLAN_STARTER_MONTHLY, PAYPAL_PLAN_STARTER_ANNUAL,
   PAYPAL_PLAN_GOLD_MONTHLY, PAYPAL_PLAN_GOLD_ANNUAL,
   PAYPAL_PLAN_PLATINUM_MONTHLY, PAYPAL_PLAN_PLATINUM_ANNUAL,
   PAYPAL_PLAN_ENTERPRISE_MONTHLY, PAYPAL_PLAN_ENTERPRISE_ANNUAL
3. PayPal dashboard: create webhook -> https://admin-glinfico.netlify.app/api/paypal/webhook
   (events: BILLING.SUBSCRIPTION.ACTIVATED etc.). Create the 8 subscription plans (999/1499/2999/7999 monthly+annual).
4. Broker rules page: add a "Pay & Subscribe" button linking https://fod.glinfico.com/fod/pricing
   (the PFE checkout creates the PayPal subscription; the webhook then provisions the account + code).
