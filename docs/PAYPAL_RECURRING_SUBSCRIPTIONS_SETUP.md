# GLINFICO.FOD PayPal Recurring Subscription Setup

This change is prepared on the `feature/paypal-recurring-subscriptions` branch. It is not production-ready until the Base44 functions/entities are deployed, the eight PayPal billing plans exist in the matching environment, and Sandbox webhook tests pass.

## Approved pricing

| Plan key | Display name | Monthly | Annual |
|---|---|---:|---:|
| `starter` | Starter | $999 | $9,990 |
| `growth` | Growth | $1,499 | $14,990 |
| `professional` | Pro | $2,999 | $29,990 |
| `enterprise` | Enterprise | $7,999 | $79,990 |

Annual plans must bill once per year at the annual amount, not monthly.

## Base44 secrets/environment variables

Set these in the Base44 backend environment, never in frontend code or GitHub:

- `PAYPAL_ENV=sandbox` for initial testing. The code defaults to Sandbox unless this is exactly `live`.
- `PAYPAL_CLIENT_ID` — Sandbox app client ID while testing.
- `PAYPAL_CLIENT_SECRET` — matching Sandbox secret while testing.
- `PAYPAL_ALLOWED_ORIGINS=https://fod.glinfico.com` (add another exact trusted origin only if the real subscription page uses it).
- `PAYPAL_PLAN_STARTER_MONTHLY`
- `PAYPAL_PLAN_STARTER_ANNUAL`
- `PAYPAL_PLAN_GROWTH_MONTHLY`
- `PAYPAL_PLAN_GROWTH_ANNUAL`
- `PAYPAL_PLAN_PROFESSIONAL_MONTHLY`
- `PAYPAL_PLAN_PROFESSIONAL_ANNUAL`
- `PAYPAL_PLAN_ENTERPRISE_MONTHLY`
- `PAYPAL_PLAN_ENTERPRISE_ANNUAL`
- `PAYPAL_WEBHOOK_ID` — the ID returned by PayPal when registering the webhook for the same environment.

## Create the eight billing plans in PayPal Sandbox

Use the Sandbox REST app and credentials first. Create a product named `GLINFICO.FOD Broker Subscription`, then create eight billing plans under that product. Each plan must have one recurring fixed-price billing cycle, USD currency, and the following amount/interval:

- Starter monthly: USD 999, interval MONTH, interval_count 1.
- Starter annual: USD 9990, interval YEAR, interval_count 1.
- Growth monthly: USD 1499, interval MONTH, interval_count 1.
- Growth annual: USD 14990, interval YEAR, interval_count 1.
- Pro monthly: USD 2999, interval MONTH, interval_count 1.
- Pro annual: USD 29990, interval YEAR, interval_count 1.
- Enterprise monthly: USD 7999, interval MONTH, interval_count 1.
- Enterprise annual: USD 79990, interval YEAR, interval_count 1.

Copy each plan's PayPal plan ID into the matching Base44 environment variable. Confirm each plan is ACTIVE. Never mix Sandbox plan IDs with Live credentials, or Live plan IDs with Sandbox credentials.

## Register a separate Sandbox webhook

Deploy the `paypalSubscriptionWebhook` Base44 function and obtain its actual public HTTPS function URL from Base44. Register that exact URL in the Sandbox REST app. Do not guess the URL and do not reuse or modify the existing Live Braintree webhook.

Subscribe to these event types:
- `BILLING.SUBSCRIPTION.ACTIVATED`
- `BILLING.SUBSCRIPTION.UPDATED`
- `BILLING.SUBSCRIPTION.CANCELLED`
- `BILLING.SUBSCRIPTION.SUSPENDED`
- `BILLING.SUBSCRIPTION.EXPIRED`
- `BILLING.SUBSCRIPTION.PAYMENT.FAILED`
- `PAYMENT.SALE.COMPLETED`
- `PAYMENT.SALE.REFUNDED`
- `PAYMENT.SALE.REVERSED`

Store the resulting Sandbox webhook ID as `PAYPAL_WEBHOOK_ID` in Base44. The handler verifies each notification with PayPal before changing a subscription record.

## Required Sandbox tests before Live

1. Complete approval for a monthly subscription and verify an `approval_pending` record becomes `active` only after a verified activation event.
2. Complete an annual subscription and verify the annual amount and yearly interval.
3. Verify a successful recurring payment event updates payment details.
4. Cancel a subscription and verify access status becomes `cancelled`.
5. Test a failed payment, refund, and reversed payment event.
6. Replay the same event and confirm it does not apply a second state change.
7. Send an invalid-signature webhook and confirm it is rejected.
8. Confirm subscription billing is separate from deal commissions and that no commission rule is changed.

## Live cutover

Only after Sandbox passes, create the same eight plans in PayPal Live (or confirm already-existing matching plans), set the Live credentials and Live plan IDs, register a separate Live webhook pointing to the deployed function, and set `PAYPAL_ENV=live` with the Live webhook ID. Keep the existing Braintree webhook untouched.

## Implementation notes

- The checkout function now calls PayPal's Billing Subscriptions API instead of creating a one-time Orders API charge.
- The broker subscription page offers PayPal only; the old Stripe and ACH UI options are removed.
- Subscription records and webhook-event records are defined as Base44 entities.
- No payment credentials are included in this repository.
- Do not merge/deploy this branch or enable Live billing until the setup and tests above are complete.
