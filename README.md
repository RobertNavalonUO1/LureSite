# Limoneo

Last updated: 2026-03-25

Limoneo is an ecommerce project built with Laravel 11, Inertia.js, React, Vite, Sanctum, Stripe, PayPal, and Socialite.

This repository currently contains:

- the public web storefront
- the authenticated customer area
- the admin area
- the canonical mobile API under `api/mobile/v1`
- the backend support required by the Android app

## Current status

As of 2026-03-25:

- production is live at `https://limoneo.com`
- `api/mobile/v1/products` is fixed and returns real products from the production database again
- product payloads now return valid `image_url_full` values for both local and absolute image URLs
- mobile checkout sandbox smoke works on production for Stripe test and PayPal sandbox
- mobile browser OAuth routes are deployed:
  - `/auth/mobile/{provider}/redirect`
  - `/auth/mobile/{provider}/callback`
- the production server now returns provider redirects for both Google and Facebook mobile OAuth routes
- Facebook data deletion endpoints and the public instructions page are deployed on production
- order shipping, coupon, discount, and payment metadata are now persisted in orders
- the production checkout UI has been refreshed with the profile address-book flow and live shipping total feedback
- order tracking fields and shipment update email are deployed
- Zoho SMTP is live on production for transactional mail
- mobile and web accounts share the same `users` table, profile serializer, and Sanctum-based identity layer
- order cancellation and refund workflows are covered by backend tests

Still pending in production:

- Android still needs to be audited against the real backend project by project
- Google and Facebook redirects are operational, but end-to-end provider login still needs manual validation in production
- Facebook live-mode or app-review restrictions may still block real-user login until Meta-side configuration is confirmed
- payments are still not in live mode
- end-to-end device smoke for Android checkout callback still needs to be run manually

## Main docs

- Production runbook: [docs/PRODUCTION.md](docs/PRODUCTION.md)
- Environment setup: [docs/ENVIRONMENTS.md](docs/ENVIRONMENTS.md)
- Next priorities: [docs/NEXT_STEPS.md](docs/NEXT_STEPS.md)
- Handoff guide: [docs/GUIDE_NEXT_AGENT.md](docs/GUIDE_NEXT_AGENT.md)
- Android mobile API contract: [docs/MOBILE_API_ANDROID_SPEC.md](docs/MOBILE_API_ANDROID_SPEC.md)
- Android sync matrix: [docs/ANDROID_WEB_SYNC_MATRIX.md](docs/ANDROID_WEB_SYNC_MATRIX.md)
- Android sync prompt: [docs/ANDROID_AGENT_SYNC_PROMPT.md](docs/ANDROID_AGENT_SYNC_PROMPT.md)
- Android prompt overview: [docs/ANDROID_APP_PROMPT_GUIDE.md](docs/ANDROID_APP_PROMPT_GUIDE.md)
- Android base prompt: [docs/ANDROID_APP_BASE_PROMPT.md](docs/ANDROID_APP_BASE_PROMPT.md)
- QA dataset: [docs/QA_DATASET.md](docs/QA_DATASET.md)
- QA manual checklist: [docs/QA_MANUAL_CHECKLIST.md](docs/QA_MANUAL_CHECKLIST.md)
- Legacy and historical docs: [docs/legacy/README.md](docs/legacy/README.md)

## Local development

Requirements:

- PHP 8.2+
- Node.js 18+
- Composer
- SQLite for local dev, or Postgres if you prefer

Typical setup:

```bash
composer install
npm install
composer env:dev
php artisan key:generate
php artisan migrate
php artisan storage:link
```

Run locally:

```bash
php artisan serve --host=127.0.0.1 --port=8000
npm run dev
```

Recommended one-command dev mode:

```bash
composer run dev
```

## QA and validation

Local QA dataset:

```bash
composer qa:refresh
composer test:qa-dataset
```

Critical backend suites:

```bash
php artisan test tests/Feature/MobileApiV1Test.php tests/Feature/PublicCatalogApiTest.php tests/Feature/OrderAuthorizationTest.php tests/Feature/OrderLineItemWorkflowTest.php tests/Feature/AddressManagementTest.php
php artisan test tests/Feature/AdminRestWorkflowTest.php tests/Feature/AdminDashboardMetricsTest.php tests/Feature/RouteSecurityTest.php tests/Feature/OrderAuthorizationTest.php tests/Feature/AddressManagementTest.php tests/Feature/PublicCatalogApiTest.php
```

Useful API checks:

```bash
php artisan route:list --path=api/mobile/v1
php artisan mobile:checkout-sandbox-smoke
```

## Architecture notes

- Guest cart uses session on web and Room on Android.
- Authenticated cart is persisted in `cart_items` and shared between web and mobile.
- Users created from web register, mobile register, mobile social auth, or browser OAuth all resolve to the same backend `users` records.
- Mobile login and social login issue Sanctum tokens; web login keeps the same identity in the server session.
- Mobile locale is stateless through `Accept-Language: es|en|fr`.
- The canonical mobile contract is `api/mobile/v1`.
- The old `/api/mobile/*` endpoints are legacy only.

## Production notes

Production currently runs with:

- Stripe test keys
- PayPal sandbox
- product catalog endpoint fixed and verified
- checkout sandbox smoke verified on the server

Before declaring the platform fully finished, these last operational gaps must be closed:

1. validate Google and Facebook login end to end on production
2. run manual device smoke for Android login, product list, cart sync, checkout return, and order refresh
3. decide and execute the switch from sandbox/test payments to live payments
