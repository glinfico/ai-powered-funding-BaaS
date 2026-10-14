# GLINFICO.FOD Base44 Feature Inventory (Preliminary)

This document is a migration planning aid based on code search and representative file inspection on the repository's `main` branch. Search results are not a complete runtime trace; validate each feature before retiring its old implementation.

## Key finding: the compatibility shim is mostly a stub

`src/api/base44Client.js` points at a Render API for limited Lead/Deal list operations, but:
- `auth.me()` always returns `null`;
- Lead create/update/delete and filtering return empty/no-op values;
- Deal mutations/filtering are no-op;
- Task, Lender, TeamMember, Activity, NotificationAlert, AutomationRule, CalendarEvent, MagazineArticle, SyncState and User methods mostly return empty arrays/objects or no-op values;
- `base44.functions.invoke` is not implemented in this shim.

This means source code that still calls these methods may appear to exist while functionality silently fails or displays empty data. Do not treat a stub method as a working replacement.

## Feature groups requiring migration decisions

| Feature group | Representative files | Migration decision |
|---|---|---|
| Public individual deal submission and bulk lead upload | `src/pages/fod/Submit.jsx`, `src/components/crm/LeadBulkUpload.jsx` | High priority: implement native API calls while keeping submission and routing free. Validate input and report server failures rather than showing success after a no-op. |
| Leads and pipeline | `src/pages/Leads.jsx`, `src/pages/Pipeline.jsx`, `src/components/crm/PipelineBoard.jsx`, `src/components/crm/LeadDetailPanel.jsx` | High priority: connect list/create/update/delete/filter operations to native backend endpoints and Supabase tables. |
| Deals and role portals | `src/pages/Deals.jsx`, `src/pages/portals/BrokerPortal.jsx`, `src/pages/portals/BorrowerPortal.jsx`, `src/pages/portals/InvestorPortal.jsx`, `src/pages/portals/LenderPortalPage.jsx` | High priority: map portal-specific data access and enforce server-side ownership/role authorization; never rely on frontend filtering alone. |
| Authentication, identity and permissions | `src/pages/portal/PortalHome.jsx`, `src/pages/RoleRedirect.jsx`, `src/pages/portals/RolePermissionsPage.jsx`, `server/index.js` | Critical security dependency: use real Supabase Auth or another verified identity provider; replace placeholder login before protected data or billing. Preserve existing accounts where feasible. |
| Tasks, reminders, team, activities and settings | `src/pages/Tasks.jsx`, `src/pages/Team.jsx`, `src/pages/Settings.jsx`, `src/components/layout/TaskNotificationBell.jsx`, `src/components/settings/TaskReminderSettings.jsx` | Migrate CRUD to backend endpoints. Identify whether reminder scheduling/email services are active before replacing. |
| Automation and enrichment | `src/utils/automation.js`, `src/pages/AICommunicationHub.jsx`, `src/components/dashboard/EnginesStatus.jsx`, plus handlers in `base44/functions/` | Classify each handler by trigger, required secrets, database writes, external service and role policy. Replace high-value flows with Express jobs/routes or another explicitly selected runtime; do not delete en masse. |
| Lenders and matching | `src/pages/Lenders.jsx`, `src/components/crm/LenderMatchBadge.jsx`, `src/utils/automation.js` | Reuse the existing native funding-institution/matching backend where appropriate; reconcile field names and response shapes before switching UI calls. |
| Magazine/content generation | `src/utils/magazineGenerator.js`, `base44/functions/generateCapitalDigest/` | Decide whether this belongs in this product and whether it is actively used; then migrate or explicitly retire. |
| Subscription checkout | `src/pages/BrokerSubscription.jsx`, `base44/functions/paypalCheckout/`, `base44/functions/stripeCheckout/` | PayPal-only recurring billing in native Express backend, after verifying account API access. Remove Stripe choices/dependencies only after references and deployment configuration are cleared. |
| External integrations | `base44/functions/plaidLink/`, `base44/functions/idiqCredit/`, `base44/functions/syncGoogleCalendar/` | Treat as sensitive integrations: verify contracts, consent, secrets, data retention, provider access and operational need before migration or retirement. |

## Native backend already present

`server/index.js` includes Express, Supabase client initialization and several funding-related calculations/API handlers. This is the natural place to extend carefully.

### Authentication findings (verified in source)

- `POST /api/auth/login` in `server/index.js` checks only that email and password are non-empty, then returns success with a fabricated `glinfico-token-<timestamp>` and assigns the submitted email the `owner` role. It does not verify the password with Supabase Auth or another identity provider.
- `src/pages/fod/Portal.jsx` calls this endpoint. This is a separate legacy login path from the user's currently working Supabase Auth sign-in, so do not replace or disrupt the working Supabase flow while migrating.
- The frontend compatibility shim's `base44.auth.me()` always returns `null`, so components relying on that method cannot correctly detect the signed-in user.
- The server sets `Access-Control-Allow-Origin: *`. CORS should be restricted to approved production origins, but CORS is not an authentication control.
- The server initializes a Supabase client using `SUPABASE_SERVICE_KEY`; that privileged key must remain server-side and must not be exposed in frontend code.

**Safety gate:** do not use the fabricated token or `owner` role to protect admin routes, broker subscriptions, commission data, or other private records. Before implementing protected billing, validate a real Supabase access token on the server and derive the user's identity and role from trusted server-side data. Keep the legacy endpoint isolated until a tested migration plan is ready; do not make a production auth change as part of this inventory step.

## Suggested implementation order

1. Establish secure identity and authorization foundations (without disrupting current working login until the replacement is verified).
2. Create a small API contract for subscriptions and billing state, plus Supabase tables/migrations and tests.
3. Implement PayPal checkout and webhook verification/idempotency in Express.
4. Connect the PayPal-only subscription UI.
5. Migrate the core free submission → lead storage → matching workflow.
6. Migrate remaining CRM entities and portal-specific access one feature group at a time.
7. Replace remaining function calls, retire obsolete handlers, then remove Base44 and Stripe packages/configuration after a repository-wide search and build/test pass.

## Business rules to preserve

- Deal submission and routing stay free; subscriptions sell broker platform features, not permission to submit a deal.
- Broker-submitted eligible deals through that broker's own portal: broker keeps 100% of eligible broker commission.
- Platform-originated deals submitted outside a broker's own portal: GLINFICO keeps 100% of commission.
- Subscription fees are separate from deal commissions.
- Existing approved subscription amounts remain Starter $999/$9,990, Growth $1,499/$14,990, Professional $2,999/$29,990, Enterprise $7,999/$79,990 (monthly/annual).
