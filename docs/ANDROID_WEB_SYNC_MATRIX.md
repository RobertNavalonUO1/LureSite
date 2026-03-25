# Android vs Web Sync Matrix

Last updated: 2026-03-25

Purpose:

- compare the Android app against the real Laravel web/backend state
- separate what is already implemented in backend from what still has to be closed in Android
- give the Android Studio agent a concrete execution checklist with priorities

Important scope note:

- this matrix is based on the real backend in this repo
- the Android Studio project is not present in this workspace, so every Android-side status is marked as `audit required` unless already proven elsewhere by your Android agent
- the canonical backend base path is `api/mobile/v1`, plus `POST /api/auth/social` for social auth

## Sync verdict

Current verdict:

- backend contract: implemented for core Android flow, with one known follow-up for tracking exposure in mobile order payloads
- Android implementation: not yet verified from this repo
- total Android <-> web sync: not yet proven

Meaning:

- do not ask the Android agent to invent backend
- do ask the Android agent to audit endpoint usage, DTO parity, deep links, session handling, and end-to-end behavior

## Status legend

- `backend ready`: implemented and routable in Laravel
- `backend follow-up required`: backend exists, but one specific field/extension is still missing for full parity
- `android audit required`: cannot be confirmed from this repo
- `android must align`: backend exists, Android must adapt to it
- `qa required`: backend exists but total sync still needs runtime validation

## Matrix

| Area | Screen / Feature | Backend endpoint(s) | Backend status | What Android must do | Priority | Final sync status |
| --- | --- | --- | --- | --- | --- | --- |
| App shell | Splash + session restore | `POST /api/mobile/v1/auth/login`, `GET /api/mobile/v1/me`, `POST /api/mobile/v1/auth/logout` | backend ready | Restore token from DataStore, validate session with `/me`, clear local state cleanly on logout, handle 401 by forcing signed-out state | P0 | android audit required |
| Auth | Register | `POST /api/mobile/v1/auth/register` | backend ready | Send `name`, `lastname`, `email`, `password`, `password_confirmation`, `device_name`, optional guest `cart.items`; parse `{ data.token, data.user, meta.merge_warnings }` | P0 | android must align |
| Auth | Login | `POST /api/mobile/v1/auth/login` | backend ready | Send `email`, `password`, `device_name`, optional guest `cart.items`; persist token; consume merge warnings; refresh remote cart after login | P0 | android must align |
| Auth | Logout | `POST /api/mobile/v1/auth/logout` | backend ready | Delete token locally only after server logout succeeds or after safe fallback on 401/expired token; clear profile and remote cart caches | P1 | android audit required |
| Auth | Social login | `POST /api/auth/social` | backend ready | Use this exact endpoint for social auth; do not route social login through legacy mobile endpoints | P0 | android must align |
| Auth | Browser OAuth callback | `GET /auth/mobile/{provider}/redirect`, `GET /auth/mobile/{provider}/callback` | backend ready | Support Google and Facebook browser OAuth using only allowed callbacks `limoneo://auth/complete` and `https://limoneo.com/app/auth/complete`; parse `status`, `provider`, `token`, and `code` from the callback URL | P0 | qa required |
| Locale | App language sync | all mobile endpoints with `Accept-Language` and `Content-Language` | backend ready | Inject `Accept-Language: es|en|fr`, read `Content-Language`, keep app locale state aligned, never depend on cookies/session locale | P0 | android must align |
| Home | Home feed | `GET /api/mobile/v1/home` | backend ready | Render campaign banners, category shortcuts, and section rails from real payload; do not hardcode home sections | P1 | android audit required |
| Catalog | Search suggestions | `GET /api/mobile/v1/search/suggestions?query=&limit=` | backend ready | Debounce queries, require min 2 chars, map suggestion shape exactly, handle empty/error states | P1 | android must align |
| Catalog | Product list | `GET /api/mobile/v1/products` | backend ready | Support filters `query`, `category_slug`, `min_price`, `max_price`, `sort`, `page`, `per_page`; map paginated envelope correctly | P0 | android must align |
| Catalog | Category list | `GET /api/mobile/v1/categories` | backend ready | Use backend categories as source of truth for catalog entry points and filters | P1 | android audit required |
| Catalog | Category detail / browse | `GET /api/mobile/v1/categories/{slug}` | backend ready | Support backend sorting and paginated product payload under category context | P1 | android must align |
| Catalog | Special collections | `GET /api/mobile/v1/special/{collection}` | backend ready | Support exactly `deals-today`, `superdeals`, `new-arrivals`, `seasonal-products`, `fast-shipping`; do not invent collection keys | P1 | android must align |
| Product | Product detail | `GET /api/mobile/v1/products/{id}` | backend ready | Map full product detail payload, related products, reviews preview, pricing, specs, gallery; keep DTO names aligned with backend JSON | P0 | android must align |
| Cart | Guest cart local persistence | no backend until auth sync | backend ready for later merge | Keep Room as guest source before login; preserve cart across app relaunch; expose snapshot in backend-compatible shape | P0 | android audit required |
| Cart | Authenticated cart read | `GET /api/mobile/v1/cart` | backend ready | Replace any fake remote read path with real endpoint; map `warnings`, `items_count`, totals, and item product cards | P0 | android must align |
| Cart | Guest -> auth merge | `PUT /api/mobile/v1/cart` | backend ready | Send full snapshot after login, consume `meta.merge_strategy` and `data.warnings`, clear guest cart only on success | P0 | android must align |
| Cart | Add line | `POST /api/mobile/v1/cart/items` | backend ready | Use `product_id` and `quantity`; refresh UI from server response instead of optimistic-only client math | P0 | android must align |
| Cart | Update line | `PATCH /api/mobile/v1/cart/items/{lineId}` | backend ready | Use server totals after quantity change; handle stock or validation errors from backend | P0 | android must align |
| Cart | Remove line | `DELETE /api/mobile/v1/cart/items/{lineId}` | backend ready | Refresh server cart after deletion; keep logout/login transitions consistent | P1 | android audit required |
| Profile | Current user | `GET /api/mobile/v1/me` | backend ready | Treat `/me` as profile/session source of truth after launch, login and profile save | P1 | android must align |
| Profile | Update profile | `PATCH /api/mobile/v1/me` | backend ready | Align edit profile form fields and validation errors to backend request rules | P1 | android must align |
| Addresses | List addresses | `GET /api/mobile/v1/addresses` | backend ready | Map address list and `meta.default_address_id`; never use legacy single-string address model | P0 | android must align |
| Addresses | Create address | `POST /api/mobile/v1/addresses` | backend ready | Send structured address fields `street`, `city`, `province`, `zip_code`, `country`, optional `make_default`; consume returned default id | P0 | android must align |
| Addresses | Update address | `PATCH /api/mobile/v1/addresses/{address}` | backend ready | Keep edit form fully structured and server-driven; do not collapse to one freeform address string | P0 | android must align |
| Addresses | Make default | `PATCH /api/mobile/v1/addresses/{address}/default` | backend ready | Update local selected/default address immediately from server response | P1 | android must align |
| Addresses | Delete address | `DELETE /api/mobile/v1/addresses/{address}` | backend ready | Handle default address changes after delete using returned `meta.default_address_id` | P1 | android must align |
| Checkout | Quote totals | `POST /api/mobile/v1/checkout/quote` | backend ready | Send `cart.items`, `address_id`, optional `coupon_code`, `shipping_method`; use backend totals as source of truth | P0 | android must align |
| Checkout | Coupon apply | `POST /api/mobile/v1/checkout/coupon` | backend ready | Recalculate summary through backend; surface business errors such as invalid or not applicable coupon | P0 | android must align |
| Checkout | Shipping selection | `POST /api/mobile/v1/checkout/shipping` | backend ready | Use only backend shipping options and values; do not hardcode totals | P0 | android must align |
| Checkout | Payment session creation | `POST /api/mobile/v1/checkout/payments/{provider}/session` | backend ready | Support `provider = stripe|paypal`; send `mobile_return.success_url`, `cancel_url`, optional fallback URLs; launch returned `checkout_url` only | P0 | android must align |
| Checkout | Payment return deep link | Backend redirect flow via `GET /api/mobile/v1/checkout/payments/{provider}/return` and `/cancel` | backend ready | Register and parse `limoneo://checkout/complete?...` and fallback `https://limoneo.com/app/checkout/complete?...`; never mark order successful locally | P0 | android must align |
| Checkout | Post-payment order refresh | `GET /api/mobile/v1/orders/{order}` | backend ready | After successful deep link return, refresh order detail from backend; if order is not immediately available, retry or poll briefly | P0 | qa required |
| Orders | Orders list | `GET /api/mobile/v1/orders?filter=` | backend ready | Support backend filters `all`, `paid`, `shipped`, `cancelled`; reflect summary status from payload, not from client guesses | P1 | android must align |
| Orders | Order detail | `GET /api/mobile/v1/orders/{order}` | backend ready | Map `summary_status`, `can_cancel`, `can_refund`, `line_counts`, per-line state fields, reasons and refund metadata; do not assume tracking fields are present yet | P0 | android must align |
| Orders | External tracking CTA | `GET /api/mobile/v1/orders/{order}` | backend follow-up required | Do not ship Android UI for external shipment tracking until backend exposes `tracking_carrier`, `tracking_number`, and `tracking_url` in the mobile order payload | P1 | backend follow-up required |
| Orders | Order cancel | `POST /api/mobile/v1/orders/{order}/cancel` | backend ready | Show action only when backend flags allow it; send optional `reason`; refresh order after mutation | P1 | android must align |
| Orders | Order refund request | `POST /api/mobile/v1/orders/{order}/refund` | backend ready | Use backend action, do not fabricate refund completion in client; refresh order detail after request | P1 | android must align |
| Orders | Line cancel | `POST /api/mobile/v1/orders/{order}/items/{itemId}/cancel` | backend ready | If UI exposes line-level actions, tie them to backend `can_cancel` flags and refresh detail afterwards | P1 | android must align |
| Orders | Line refund request | `POST /api/mobile/v1/orders/{order}/items/{itemId}/refund` | backend ready | If UI exposes line-level actions, tie them to backend `can_refund` flags and render pending/error/refunded states correctly | P1 | android must align |
| Errors | Validation and business errors | all mobile endpoints | backend ready | Standardize mapping for `422 { message, errors }` and business/auth `4xx { message, code }`; ensure UI messages and retries are consistent | P0 | android must align |
| Session | Expired token handling | all protected mobile endpoints | backend ready | Intercept 401, clear session predictably, preserve guest cart, redirect to auth without corrupting app state | P0 | android audit required |
| QA | Build verification | Android project only | not auditable from this repo | Run `assembleDebug` or equivalent and ensure clean navigation through auth, home, cart, checkout, orders, profile | P0 | android audit required |
| QA | End-to-end payment flow | Android + backend sandbox | backend ready | Validate real Stripe test and PayPal sandbox from app to provider to deep link return to order detail | P0 | qa required |
| QA | Regression tests | Android project only | not auditable from this repo | Add tests for session restore, error mapping, guest cart merge, logout/login refresh, deep link parsing, post-payment order refresh | P1 | android audit required |

## Critical gaps to close first

These are the minimum items required before you can honestly say Android is synced with the web:

1. confirm Android uses only `api/mobile/v1`, `POST /api/auth/social`, and `/auth/mobile/{provider}/*`
2. confirm Android account creation and login reuse the same users as the web app
3. confirm all DTOs match the real backend envelope and field names
4. close guest cart merge and authenticated cart refresh
5. close hosted checkout + deep link + post-payment order refresh
6. close orders detail and order actions against backend flags
7. close structured address CRUD and profile update
8. run Android build and real end-to-end QA

## Exact instructions for the Android Studio agent

Use this matrix as an execution checklist.

Required working rules:

- do not build alternate backend contracts
- do not use legacy `/api/mobile/*` endpoints in normal flow
- do not treat payment success as a local client decision
- do not use a flat single-string address model
- do not hardcode language behavior outside `es`, `en`, `fr`
- do not claim mobile tracking parity until the mobile order payload actually exposes tracking fields

Execution order:

1. audit every remote call currently used by Android
2. map each call to one row in this matrix
3. mark each row as:
   - implemented and verified
   - implemented but mismatched
   - missing
4. fix P0 rows first
5. rerun the matrix after each batch until all P0 rows are verified

## Evidence behind this matrix

Backend evidence used here:

- `php artisan route:list --path=api/mobile/v1` shows 34 real routes
- `php artisan route:list --path=auth/mobile`
- `tests/Feature/MobileApiV1Test.php`
- `tests/Feature/OrderLineItemWorkflowTest.php`
- `app/Http/Controllers/Api/SocialAuthController.php`
- `app/Http/Controllers/Auth/SocialAuthController.php`
- `app/Http/Controllers/Api/MobileV1/*`
- `app/Services/Mobile/MobileCheckoutService.php`
- `app/Services/Mobile/MobileOrderPresenter.php`
- `app/Http/Middleware/SetApiLocale.php`

## Repo note

Use this matrix together with `docs/MOBILE_API_ANDROID_SPEC.md` and `docs/ANDROID_AGENT_SYNC_PROMPT.md`. If one of them changes, update the other two in the same pass.
