# GLINFICO.FOD Base44 / Stripe Removal Audit

**Status:** Preliminary repository audit; no application code or production deployment changed.
**Branch:** `migration/base44-removal-audit`
**Source:** `main` in `glinfico/ai-powered-funding-BaaS`

## Findings

### Base44 is still embedded in the repository

- Root `package.json` includes `@base44/sdk` and `@base44/vite-plugin`.
- `vite.config.js` imports and activates the Base44 Vite plugin, including Base44-specific editor/notifier options.
- `src/api/base44Client.js` is a compatibility shim, but it does not implement `base44.functions.invoke`.
- Multiple CRM pages and utilities import the shim. Search results include Leads, Deals, Pipeline, Tasks, Team, Lenders, Reports, Settings, DocumentVault, RoleRedirect, NavigationTracker, and automation utilities.
- UI code calls Base44 functions for subscription checkout, lead enrichment, AI communications, engine actions, and task reminders.
- The `base44/functions/` directory contains Deno handlers that import `createClientFromRequest` from the Base44 SDK. They are not automatically usable as Express routes.
- `README.md` still identifies the project as a “Base44 App”.

### Stripe is still referenced

- The broker subscription page presents Stripe card and ACH options and defaults to Stripe card.
- Root dependencies include `@stripe/react-stripe-js` and `@stripe/stripe-js`.
- The backend entry file imports Stripe and initializes it from `STRIPE_SECRET_KEY`.
- `server/package.json` includes the Stripe server dependency.
- A Base44 Stripe checkout function remains in `base44/functions/stripeCheckout/`.

### PayPal checkout is not yet recurring billing in the main branch

- The main-branch `base44/functions/paypalCheckout/entry.ts` creates a one-time PayPal Orders API order (`/v2/checkout/orders`) with intent `CAPTURE`.
- It is dependent on Base44 authentication and Deno, so it is not a native Express endpoint.
- The existing broker plan amounts are:
  - Starter: $999 monthly / $9,990 annual
  - Growth: $1,499 monthly / $14,990 annual
  - Pro (key `professional`): $2,999 monthly / $29,990 annual
  - Enterprise: $7,999 monthly / $79,990 annual
- Annual amounts and free deal-submission/commission rules must be preserved unless the owner explicitly changes them.

### Production safety concern to address separately

- `server/index.js` currently has a login handler that accepts any non-empty email and password and returns a fabricated owner token. This is not production-grade authentication. Do not build subscription authorization on that placeholder or treat it as secure.

## Safe migration sequence

1. Inventory all Base44 imports, entity calls, function invocations, configuration, and Deno handlers; classify each as active, replace, or retire.
2. Confirm the deployed frontend/backend and database schema before changing runtime behavior.
3. Verify PayPal account/Sandbox API capability and required permissions. PayPal's official integration guide notes that its documented JavaScript SDK integration is available to select partners; API access must be confirmed rather than assumed.
4. Implement subscription checkout and verified, idempotent webhook handling in the Express backend, backed by a Supabase subscription/event schema and appropriate access controls.
5. Change the subscription UI to PayPal-only while preserving the approved price table and annual billing amounts.
6. Replace Base44 data/function dependencies in small groups, add tests, build, and validate the branch before any production release.
7. Remove Base44/Stripe packages and files only after their remaining references have been migrated or explicitly retired.

## Guardrails

- Do not merge or deploy this audit branch as a release.
- Do not modify the existing PayPal Live webhook.
- Do not place API secrets in source control or chat.
- Keep deal submission and routing free for users who do not subscribe.
- Broker-originated eligible deals submitted through the broker's own portal retain the broker's 100% commission; platform-originated deals submitted outside a broker portal remain GLINFICO deals.
