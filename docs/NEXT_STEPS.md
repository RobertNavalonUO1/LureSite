# Next Steps

Last updated: 2026-03-23

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
- backend tests for catalog, cart, checkout quote, addresses, order ownership, cancellation, refunds, and admin flows passing locally

## Immediate priorities

### 1. Validate OAuth end to end in production

Still required:

- verify Google login from redirect to callback with a real production account
- verify Facebook login from redirect to callback with a real production account
- confirm Facebook Meta app live-mode or app-review state for non-test users

Reason:

- redirects are now live, but provider login is not considered closed until the full callback flow is validated

### 2. Run real checkout smoke against production

Minimum web smoke:

1. login to a production-safe account
2. open checkout
3. select another saved address
4. confirm shipping selection updates the visible total
5. apply and remove a coupon
6. launch Stripe test and PayPal sandbox
7. confirm the created order shows shipping, coupon, discount, and payment metadata

### 3. Run real Android smoke against production

Minimum smoke:

1. load home
2. load product list
3. open product detail
4. login/register
5. cart sync
6. checkout quote
7. payment launch
8. deep-link return
9. order refresh
10. logout

### 4. Decide when to switch payments to live

Current production state:

- Stripe: test
- PayPal: sandbox

Do not switch to live until:

- device smoke is green
- order creation is verified against real production flows
- cancellation/refund expectations are signed off

### 5. Build proper staging parity

Still useful:

- public `staging.limoneo.com`
- separate secrets
- separate database branch or staging database
- same mobile contract as production

### 6. Keep docs and Android handoff aligned

Any backend change that touches:

- catalog payload
- image URLs
- auth flow
- checkout UI behavior
- checkout return
- orders or addresses

must be reflected in:

- `README.md`
- `docs/PRODUCTION.md`
- `docs/ENVIRONMENTS.md`
- `docs/GUIDE_NEXT_AGENT.md`
- `docs/MOBILE_API_ANDROID_SPEC.md`

## Do not reopen as main workstreams unless a regression appears

- legacy `MobileApiController` contract
- old product route forensic work
- the 2026-03-14 web route remediation as a live task

Those are now historical references and live under `docs/legacy`.
