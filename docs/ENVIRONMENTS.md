# Environments

Last updated: 2026-03-23

This document explains how Limoneo is expected to run in development, staging, and production.

## Environment files

Recommended local files:

- `.env.development`
- `.env.staging`
- `.env.production`

The repo includes the switch script:

- `scripts/switch-env.php`

Convenience commands:

```bash
composer env:dev
composer env:staging
composer env:prod
```

Each command copies the selected environment into `.env` and clears Laravel config/cache.

## Development

Recommended local baseline:

- `APP_ENV=local`
- `APP_DEBUG=true`
- SQLite local database or local Postgres
- Stripe test
- PayPal sandbox
- dummy or dev OAuth config

Useful commands:

```bash
php artisan serve --host=127.0.0.1 --port=8000
npm run dev
composer qa:refresh
php artisan test
```

## Staging

Staging should match production behavior as closely as possible, except for live credentials.

Recommended staging rules:

- `APP_ENV=staging`
- `APP_DEBUG=false`
- separate database branch or separate staging database
- Stripe test
- PayPal sandbox
- real Google/Facebook app credentials for the staging domain

If staging is not publicly resolving yet, that is still an infrastructure gap, not a code gap.

## Production

Current production status on 2026-03-23:

- `APP_ENV=production`
- `APP_DEBUG=false`
- mobile API `api/mobile/v1` deployed
- mobile product list fixed and verified
- Stripe test keys present
- PayPal sandbox credentials present
- Google/Facebook mobile routes deployed
- Google/Facebook provider redirects return `302` on production
- Facebook data deletion endpoints and public instructions page are deployed
- checkout/order shipping, coupon, and payment metadata release is deployed
- checkout UI refresh is deployed

## Critical variables by feature

### App and database

- `APP_ENV`
- `APP_DEBUG`
- `APP_URL`
- `APP_KEY`
- `DB_CONNECTION`
- `DB_URL` or `DB_HOST` / `DB_PORT` / `DB_DATABASE` / `DB_USERNAME` / `DB_PASSWORD`

### Payments

- `STRIPE_KEY`
- `STRIPE_SECRET`
- `PAYPAL_CLIENT_ID`
- `PAYPAL_CLIENT_SECRET`
- `PAYPAL_MODE`

### Social auth

- `GOOGLE_CLIENT_ID`
- `GOOGLE_CLIENT_SECRET`
- `GOOGLE_REDIRECT_URI`
- `FACEBOOK_CLIENT_ID`
- `FACEBOOK_CLIENT_SECRET`
- `FACEBOOK_REDIRECT_URI`

### Mobile/API behavior

- `APP_URL`
- any mobile deep-link fallback URLs if configured in app clients

## Mobile-specific notes

The canonical mobile contract is:

- `api/mobile/v1`

Mobile auth currently supports:

- `POST /api/auth/social`
- browser-based mobile OAuth routes:
  - `/auth/mobile/{provider}/redirect`
  - `/auth/mobile/{provider}/callback`

Mobile locale is stateless:

- request header: `Accept-Language: es|en|fr`
- response header: `Content-Language`

Authenticated cart is shared between web and mobile through `cart_items`.

## Validation commands by environment

General backend:

```bash
php artisan route:list --path=api/mobile/v1
php artisan test --filter=MobileApiV1Test
php artisan test --filter=PublicCatalogApiTest
```

Payments:

```bash
php artisan mobile:checkout-sandbox-smoke
```

OAuth route presence:

```bash
php artisan route:list --path=auth/mobile
```

## Current production gaps to resolve

Before calling production fully finalized, these environment tasks must still be completed:

1. validate Google OAuth callback flow end to end
2. validate Facebook OAuth callback flow end to end and confirm Meta-side live-mode readiness
4. switch Stripe from test to live when business is ready
5. switch PayPal from sandbox to live when business is ready
6. run manual production checkout smoke for address selection, shipping update, and order detail metadata

## Related docs

- [../README.md](../README.md)
- [./PRODUCTION.md](./PRODUCTION.md)
- [./NEXT_STEPS.md](./NEXT_STEPS.md)
- [./QA_DATASET.md](./QA_DATASET.md)
