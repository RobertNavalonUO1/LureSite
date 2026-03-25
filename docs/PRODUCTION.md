# Production Runbook

Last updated: 2026-03-25

This is the operational source of truth for Limoneo production.

## Current production snapshot

Host:

- domain: `https://limoneo.com`
- server: `limoneo-prod-1`
- IPv4: `46.224.207.157`
- app path: `/var/www/limoneo/current`

Database:

- provider: Neon Postgres
- SSL required

Payments:

- Stripe: test
- PayPal: sandbox

Transactional email:

- Zoho SMTP is configured on production as of 2026-03-25
- app password is stored only in the live server `.env` and local ignored `.env.production`
- never commit the real SMTP secret to tracked docs or example env files

OAuth:

- mobile browser OAuth routes are deployed and return provider redirects
- allowed mobile auth callbacks are `limoneo://auth/complete` and `https://limoneo.com/app/auth/complete`
- Facebook data deletion endpoints are deployed
- end-to-end provider login still needs manual validation on production

Mobile/API:

- canonical mobile API: `api/mobile/v1`
- web and mobile users share the same backend identity store and profile serializer
- product list endpoint fixed on 2026-03-17
- mobile checkout sandbox smoke passes on production
- checkout/order metadata and checkout UI refresh deployed on 2026-03-23
- admin tracking persistence and shipment update email deployed on 2026-03-25

## Verified on 2026-03-23

The following checks were executed successfully:

- `php artisan migrate --force`
  - applied `2026_04_12_000000_add_shipping_coupon_fields_to_orders_table`
- `php -l app/Http/Controllers/Api/MobileV1/CatalogController.php`
- `php -l app/Http/Controllers/Auth/SocialAuthController.php`
- `php -l app/Http/Controllers/CheckoutController.php`
- `php -l app/Http/Controllers/OrderController.php`
- `php -l app/Models/Order.php`
- `php -l app/Models/Product.php`
- `https://limoneo.com/api/mobile/v1/home` -> `200`
- `https://limoneo.com/api/mobile/v1/products?sort=rating` -> `200`
- `https://limoneo.com/auth/mobile/google/redirect` -> `302`
- `https://limoneo.com/auth/mobile/facebook/redirect` -> `302`
- `https://limoneo.com/facebook/data-deletion` -> `200`
- `php artisan route:list --path=auth/mobile`
- `php artisan route:list --path=auth/facebook/data-deletion`
- `php artisan route:list --path=checkout`

Important note:

- provider redirects are now generated on production for both Google and Facebook
- this confirms server-side provider credentials are present, but it does not replace a real end-to-end login validation
- Facebook may still require Meta-side live-mode or app-review confirmation for real users

## Recent backend hotfix deployed on 2026-03-17

Production received these backend changes:

- fixed Postgres ambiguity in mobile catalog sorting by rating
- fixed `image_url_full` so absolute image URLs are no longer broken
- deployed mobile browser OAuth routes for Google/Facebook callback flow
- aligned mobile catalog/search/checkpoint code paths with the current product rating alias

Backups created during this hotfix:

- `/var/www/limoneo/backup-20260317-201738-hotfix`
- `/var/www/limoneo/backup-20260317-201919-hotfix`

Previous major backup already present:

- `/var/www/limoneo/backup-20260315-205913`

## Recent checkout and order release deployed on 2026-03-23

Production received these backend and storefront changes:

- added order columns for `shipping_method`, shipping labels/descriptions, `shipping_cost`, `coupon_id`, `coupon_code`, and `discount`
- persisted shipping, coupon, discount, and payment metadata when checkout creates an order
- exposed shipping, coupon, and payment metadata on order detail views
- refreshed the checkout page to reuse the profile address-book flow
- updated checkout shipping selection so the selected method and total react immediately in the UI
- deployed the public Facebook data deletion instructions page

Backup created during this release:

- `/var/www/limoneo/backup-20260323-000542-checkout-order-social`

## Standard deployment procedure

The server is not operated as a clean git checkout. Do not rely on `git pull` inside `/var/www/limoneo/current`.

Use this sequence instead:

1. validate locally
2. back up the exact production files or the whole current tree
3. upload the changed release files
4. rebuild Laravel caches
5. verify the public routes that matter

If email settings change, also:

6. back up the live `.env`
7. update only the required `MAIL_*` variables on the server
8. rebuild Laravel caches
9. send one controlled test email before closing the intervention

Minimal post-upload commands:

```bash
cd /var/www/limoneo/current
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

When PHP code changes are significant, also validate syntax on the server:

```bash
php -l app/Http/Controllers/Api/MobileV1/CatalogController.php
php -l app/Http/Controllers/Auth/SocialAuthController.php
php -l app/Models/Product.php
```

## Required post-deploy checks

Run these after every backend release:

```bash
curl -I https://limoneo.com
curl -I https://limoneo.com/api/mobile/v1/home
curl -I "https://limoneo.com/api/mobile/v1/products?sort=rating"
curl -I https://limoneo.com/api/mobile/v1/products/1
php artisan route:list --path=api/mobile/v1
```

When payment code changes or secrets change:

```bash
php artisan mobile:checkout-sandbox-smoke
```

When mail settings change:

```bash
php artisan route:list --path=admin/orders
php artisan tinker --execute="Illuminate\\Support\\Facades\\Mail::raw('SMTP smoke', function (\$message) { \$message->to('limoneo@limoneo.com')->subject('SMTP smoke'); });"
```

When social auth changes:

```bash
curl -I https://limoneo.com/auth/mobile/google/redirect
curl -I https://limoneo.com/auth/mobile/facebook/redirect
curl -I https://limoneo.com/facebook/data-deletion
```

When preparing Android continuation work, also verify the contract docs are still aligned:

```bash
php artisan route:list --path=api/mobile/v1
php artisan route:list --path=auth/mobile
php artisan test --filter=MobileApiV1Test
```

When checkout or order persistence changes:

```bash
php artisan route:list --path=checkout
curl -I https://limoneo.com
```

## What is still not complete in production

These items are not code blockers anymore, but they are still operational blockers:

1. Google OAuth must still be validated end to end against the live domain.
2. Facebook OAuth must still be validated end to end, and Meta-side live-mode restrictions may still apply.
3. Stripe is still using test keys.
4. PayPal is still using sandbox mode.
5. Web checkout manual smoke for address selection, shipping update, and order metadata should still be run on production.
6. Android device smoke still needs to be run against the live server.
7. Google and Facebook mobile callback success paths still need to be validated with a real device/app build.

## Recent mail and tracking release deployed on 2026-03-25

Production received these changes:

- order tracking fields are now persisted on orders
- admin can save external carrier, tracking number, and tracking URL
- marking an order as shipped now sends a shipment update email with external tracking
- customer order views now expose the external tracking CTA when present
- Zoho SMTP was configured on the live server
- this tracking data is currently documented for web/admin flows; Android should not surface a tracking CTA until the mobile order payload exposes those fields

Important security note:

- the real Zoho app password must remain only in server-side secrets storage and local ignored files
- `.env.production.example` must keep placeholders only

Because of that, production is functional for web/mobile backend flows and sandbox payments, but not yet fully closed for real provider login and live payments.

## Rollback

If a hotfix must be reverted quickly:

1. restore the backed-up files from the latest backup directory
2. run:

```bash
cd /var/www/limoneo/current
php artisan optimize:clear
php artisan config:cache
php artisan route:cache
php artisan view:cache
```

3. re-check the public endpoints

## Related docs

- [../README.md](../README.md)
- [./ENVIRONMENTS.md](./ENVIRONMENTS.md)
- [./NEXT_STEPS.md](./NEXT_STEPS.md)
- [./GUIDE_NEXT_AGENT.md](./GUIDE_NEXT_AGENT.md)
- [./legacy/DEPLOYMENT_SESSION_2026-02-21.md](./legacy/DEPLOYMENT_SESSION_2026-02-21.md)
