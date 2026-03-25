# Guide For The Next Agent

Last updated: 2026-03-25

This is the practical handoff for whoever continues Limoneo after this point.

## What is already done

### Backend and API

- canonical mobile API exists under `api/mobile/v1`
- mobile and web share the same `users` table and `ProfileService::serializeUser()` shape
- mobile register/login/social auth all create or reuse the same account records used by the web app
- mobile auth tokens are Sanctum personal access tokens; web login keeps the same identity in session
- authenticated cart is shared between web and mobile through `cart_items`
- mobile locale is stateless through `Accept-Language`
- mobile catalog product sorting is fixed for Postgres
- product payloads now return correct `image_url_full`
- mobile browser OAuth routes are deployed:
  - `/auth/mobile/{provider}/redirect`
  - `/auth/mobile/{provider}/callback`
- Facebook data deletion callback now exists for app-review compliance:
  - `POST /auth/facebook/data-deletion`
  - `GET /auth/facebook/data-deletion/{confirmationCode}`
- allowed mobile auth callbacks are:
  - `limoneo://auth/complete`
  - `https://limoneo.com/app/auth/complete`
- profile email changes now clear `email_verified_at` and resend verification mail

### Orders and payments

- checkout session creation works for Stripe and PayPal sandbox
- production smoke command creates real Stripe test and PayPal sandbox sessions
- order creation now persists shipping, coupon, discount, and payment metadata
- order detail pages now expose shipping method, shipping cost, coupon code, discount, and payment method
- the checkout page now reuses the profile address-book UX and updates shipping totals immediately in the UI
- admin orders now support external tracking persistence and shipment update email sending
- the mobile order payload still needs an explicit backend extension if Android must show external tracking CTA data
- local tests cover:
  - mobile auth
  - cart replace/add/update/delete
  - checkout quote
  - addresses CRUD
  - order ownership
  - line-level cancellation
  - line-level refund
  - admin refund workflow

### Production

- production backend hotfix deployed on 2026-03-17
- checkout and order release deployed on 2026-03-23
- `https://limoneo.com/api/mobile/v1/products` now returns `200`
- `https://limoneo.com/api/mobile/v1/products/{id}` returns `200`
- `https://limoneo.com/auth/mobile/google/redirect` returns `302`
- `https://limoneo.com/auth/mobile/facebook/redirect` returns `302`
- `https://limoneo.com/facebook/data-deletion` returns `200`
- Zoho SMTP is configured on the live server for transactional mail

## What is still open

### Operational gaps

These are the real blockers still open:

1. Google login still needs end-to-end production validation.
2. Facebook login still needs end-to-end production validation, and Meta-side live-mode restrictions may still apply.
3. Payments are still not live.
4. Web checkout manual smoke has not yet been executed on production after the 2026-03-23 checkout refresh.
5. Android end-to-end device smoke has not been completed.

6. A real manual production smoke for shipped-order email plus external tracking link is still worth doing from the admin UI.
7. The real Android project itself has not yet been audited against the latest docs, so any claim of parity is still premature.

### Important nuance

The mobile OAuth routes are deployed and now generate real provider redirects on production, but that is still weaker evidence than a full login callback executed successfully.

For Facebook specifically, keep the distinction clear between server credentials being present and the Meta app actually being usable for real users.

## Files changed in the 2026-03-17 backend hotfix

Code deployed to production:

- `app/Http/Controllers/Api/MobileV1/CatalogController.php`
- `app/Http/Controllers/Auth/SocialAuthController.php`
- `app/Http/Controllers/SearchController.php`
- `app/Models/Product.php`
- `app/Services/Mobile/MobileCatalogPresenter.php`
- `app/Services/Mobile/MobileCheckoutService.php`
- `routes/web.php`

Local test updates also made:

- `tests/Feature/MobileApiV1Test.php`
- `tests/Feature/OrderLineItemWorkflowTest.php`
- `tests/Feature/AdminDashboardMetricsTest.php`

## Files changed in the 2026-03-23 checkout and order release

Code deployed to production:

- `app/Http/Controllers/CheckoutController.php`
- `app/Http/Controllers/OrderController.php`
- `app/Models/Order.php`
- `database/migrations/2026_04_12_000000_add_shipping_coupon_fields_to_orders_table.php`
- `resources/js/Pages/Orders/Show.jsx`
- `resources/js/Pages/Profile/components/AddressCard.jsx`
- `resources/js/Pages/Shop/Checkout.jsx`
- `resources/js/Pages/Static/FacebookDataDeletion.jsx`

Backup created:

- `/var/www/limoneo/backup-20260323-000542-checkout-order-social`

## Commands that matter now

### Local regression

```bash
php artisan test tests/Feature/MobileApiV1Test.php tests/Feature/PublicCatalogApiTest.php tests/Feature/OrderAuthorizationTest.php tests/Feature/OrderLineItemWorkflowTest.php tests/Feature/AddressManagementTest.php
php artisan test tests/Feature/AdminRestWorkflowTest.php tests/Feature/AdminDashboardMetricsTest.php tests/Feature/RouteSecurityTest.php tests/Feature/OrderAuthorizationTest.php tests/Feature/AddressManagementTest.php tests/Feature/PublicCatalogApiTest.php
```

### Production validation

```bash
php artisan route:list --path=api/mobile/v1
php artisan route:list --path=auth/mobile
php artisan route:list --path=auth/facebook/data-deletion
php artisan route:list --path=checkout
php artisan mobile:checkout-sandbox-smoke
curl -I "https://limoneo.com/api/mobile/v1/products?sort=rating"
curl -I https://limoneo.com/api/mobile/v1/products/1
curl -I https://limoneo.com/auth/mobile/google/redirect
curl -I https://limoneo.com/auth/mobile/facebook/redirect
curl -I https://limoneo.com/facebook/data-deletion
```

Mail and tracking validation:

```bash
php artisan route:list --path=admin/orders
php artisan migrate:status | grep add_tracking_fields_to_orders_table
```

Android continuation validation:

```bash
php artisan route:list --path=api/mobile/v1
php artisan route:list --path=auth/mobile
php artisan test --filter=MobileApiV1Test
```

## Rules for the next intervention

1. Do not treat `/api/mobile/*` as the canonical contract.
2. Do not rely on `git pull` directly inside `/var/www/limoneo/current`.
3. Back up the production files you touch before patching them.
4. After any backend deploy, rebuild Laravel caches.
5. If you change auth, checkout, orders, or catalog payloads, update the docs in the same pass.
6. Never store the real Zoho app password in tracked files; keep it only in the live `.env` and local ignored `.env.production`.
7. Do not tell the Android team that tracking is available in mobile order payloads until the backend actually exposes `tracking_carrier`, `tracking_number`, and `tracking_url` there.

## Where historical context lives now

Old forensic and remediation docs were moved to:

- `legacy/DEPLOYMENT_SESSION_2026-02-21.md`
- `legacy/WEB_ROUTES_FORENSIC_AUDIT.md`
- `legacy/WEB_ROUTES_REMEDIATION_2026-03-14.md`

Use them only for background, not as the current operational source of truth.
