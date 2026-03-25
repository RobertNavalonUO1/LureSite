# Next Steps

Last updated: 2026-03-25

This is the short operational priority list for Limoneo.

## Closed recently

These items are no longer the main blocker:

- `api/mobile/v1/products` fixed in production
- mobile catalog sorting by rating fixed for Postgres
- absolute product image URLs fixed in backend payloads
- mobile checkout sandbox smoke verified on production
- mobile browser OAuth routes deployed
- Google and Facebook mobile OAuth redirects verified on production
- Facebook data deletion public page deployed on production
- checkout/order metadata persistence deployed on production
- checkout address-book and shipping-total refresh deployed on production
- order tracking persistence and shipment update email deployed on production
- Zoho SMTP verified live on production
- backend tests for catalog, cart, checkout quote, addresses, order ownership, cancellation, refunds, and admin flows passing locally

## Immediate priorities

### 1. Audit and align the Android app against the real backend

Minimum Android handoff requirements:

1. confirm the app uses only `api/mobile/v1`, `POST /api/auth/social`, and browser OAuth routes under `/auth/mobile/*`
2. confirm users created on Android can log in on web immediately, and users created on web can log in on Android immediately
3. confirm the app uses the shared profile shape returned by register, login, social login, and `GET /api/mobile/v1/me`
4. confirm guest cart merge, hosted checkout, deep links, and post-payment order refresh match the backend contract
5. confirm order detail rendering matches current backend fields and note that mobile tracking CTA needs backend exposure before Android can show it

Primary docs to follow:

- `docs/MOBILE_API_ANDROID_SPEC.md`
- `docs/ANDROID_WEB_SYNC_MATRIX.md`
- `docs/ANDROID_AGENT_SYNC_PROMPT.md`

### 2. Validate OAuth end to end in production

Still required:

- verify Google login from redirect to callback with a real production account
- verify Facebook login from redirect to callback with a real production account
- confirm Facebook Meta app live-mode or app-review state for non-test users

Reason:

- redirects are now live, but provider login is not considered closed until the full callback flow is validated

### 3. Run real checkout smoke against production

Minimum web smoke:

1. login to a production-safe account
2. open checkout
3. select another saved address
4. confirm shipping selection updates the visible total
5. apply and remove a coupon
6. launch Stripe test and PayPal sandbox
7. confirm the created order shows shipping, coupon, discount, and payment metadata

### 4. Run real Android smoke against production

Minimum smoke:

1. load home
2. load product list
3. open product detail
4. login/register
5. Google social login
6. cart sync
7. checkout quote
8. payment launch
9. deep-link return
10. order refresh
11. logout

### 5. Run shipped-order smoke against production

Minimum web/admin smoke:

1. ship a production-safe order from admin with `tracking_url`
2. confirm shipment email arrives
3. confirm the external tracking link opens correctly
4. confirm web order detail reflects the saved tracking state

### 6. Decide when to switch payments to live

Current production state:

- Stripe: test
- PayPal: sandbox

Do not switch to live until:

- device smoke is green
- order creation is verified against real production flows
- cancellation/refund expectations are signed off

### 7. Build proper staging parity

Still useful:

- public `staging.limoneo.com`
- separate secrets
- separate database branch or staging database
- same mobile contract as production

### 8. Keep docs and Android handoff aligned

Any backend change that touches:

- catalog payload
- image URLs
- auth flow
- transactional emails
- checkout UI behavior
- checkout return
- orders or addresses
- order tracking payloads

must be reflected in:

- `README.md`
- `docs/PRODUCTION.md`
- `docs/ENVIRONMENTS.md`
- `docs/GUIDE_NEXT_AGENT.md`
- `docs/MOBILE_API_ANDROID_SPEC.md`
- `docs/ANDROID_WEB_SYNC_MATRIX.md`
- `docs/ANDROID_AGENT_SYNC_PROMPT.md`

## Do not reopen as main workstreams unless a regression appears

- legacy `MobileApiController` contract
- old product route forensic work
- the 2026-03-14 web route remediation as a live task

Those are now historical references and live under `docs/legacy`.
