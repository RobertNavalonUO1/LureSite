# Environments

Last updated: 2026-03-25

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

Current production status on 2026-03-25:

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
- Zoho SMTP is configured live on production for transactional mail
- admin order tracking and shipment update email are deployed

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

### Transactional email

- `MAIL_MAILER`
- `MAIL_HOST`
- `MAIL_PORT`
- `MAIL_SCHEME`
- `MAIL_USERNAME`
- `MAIL_PASSWORD`
- `MAIL_FROM_ADDRESS`
- `MAIL_FROM_NAME`
- `MAIL_SUPPORT_ADDRESS`
- `MAIL_ORDERS_ADDRESS`
- `MAIL_HELP_ADDRESS`
- `MAIL_EHLO_DOMAIN`

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

Identity rules shared by web and mobile:

- web and mobile use the same `users` table
- mobile register, mobile login, mobile social auth, and web social auth all converge on the same backend user records
- mobile auth returns the same serialized user shape as `GET /api/mobile/v1/me`
- social auth marks `email_verified_at` when the provider returns a valid email
- if the user changes email from profile, `email_verified_at` is reset and a verification mail is resent

Mobile locale is stateless:

- request header: `Accept-Language: es|en|fr`
- response header: `Content-Language`

Authenticated cart is shared between web and mobile through `cart_items`.

Android callback values that must stay aligned with the app clients:

- auth success callback: `limoneo://auth/complete`
- auth https fallback: `https://limoneo.com/app/auth/complete`
- checkout success callback: `limoneo://checkout/complete`
- checkout https fallback: `https://limoneo.com/app/checkout/complete`

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

1. audit the real Android project against the canonical backend contract
2. validate Google OAuth callback flow end to end
3. validate Facebook OAuth callback flow end to end and confirm Meta-side live-mode readiness
4. switch Stripe from test to live when business is ready
5. switch PayPal from sandbox to live when business is ready
6. run manual production checkout smoke for address selection, shipping update, and order detail metadata
7. run manual production shipped-order smoke for external tracking email/link behavior

Mail secret rule:

- keep the real Zoho app password only in the live server `.env` and local ignored `.env.production`
- do not place the real SMTP secret in tracked docs or example env files

## Related docs

- [../README.md](../README.md)
- [./PRODUCTION.md](./PRODUCTION.md)
- [./NEXT_STEPS.md](./NEXT_STEPS.md)
- [./QA_DATASET.md](./QA_DATASET.md)
