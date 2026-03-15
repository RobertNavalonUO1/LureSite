# Limoneo Android Base Prompt

Last updated: 2026-03-15

Use the prompt below as the canonical copy-paste prompt to generate the Android app base for Limoneo.

Important:

- This prompt assumes the Laravel web application is the business source of truth.
- If the coding agent has access to this repo, it must follow `docs/MOBILE_API_ANDROID_SPEC.md` exactly.
- If the target environment does not expose the mobile API yet, the generated Android project must still be compile-ready by using fake repositories and mock data behind the same interfaces.

## Copy-paste prompt

```text
Build the Android base application for my ecommerce project Limoneo.

You are generating Android code only. Do not generate backend code. Do not invent admin features. Do not simplify business rules to make implementation easier.

Core business context:
- The real backend is Laravel 11.
- The web application is the source of truth for catalog, checkout, orders, profile, addresses, and payment flow.
- There is an older partial mobile API in the backend, but it is legacy and must not define the new Android architecture.
- The canonical mobile API contract is documented in `docs/MOBILE_API_ANDROID_SPEC.md`.
- The canonical mobile API is already implemented locally under `api/mobile/v1`, plus `POST /api/auth/social` for social auth.
- If you have repo access, follow that spec exactly.
- If the target environment does not expose the API yet, generate the Android app contract-first with fake repositories and mock DTO payloads that match the spec.

Product goals for Android v1:
- customer-facing ecommerce app only
- splash
- login
- register
- social login integrated in v1
- home
- categories
- search
- product list
- product detail
- cart
- checkout
- address book
- orders list
- order detail
- profile
- language settings

Non-negotiable business rules:
- No admin area.
- No guest checkout.
- Before login, the cart is local on device.
- After login, the cart is synced with the server contract from the mobile API spec.
- The app must never mark an order as successful on the client.
- Payments are hosted externally by Stripe or PayPal and launched from the app via Custom Tabs or external provider app.
- The backend verifies the payment provider callback first, creates the order, and then redirects back into the app.
- Do not use WebView as the primary payment approach.
- Supported locales are only `es`, `en`, and `fr`.
- Currency visible in v1 is `USD`.

Technical stack:
- Kotlin
- Jetpack Compose
- Material 3
- Navigation Compose
- MVVM
- Repository pattern
- Hilt for dependency injection
- Retrofit + OkHttp
- Kotlinx Serialization
- Coroutines + Flow
- DataStore for auth/session/preferences
- Room for local guest cart persistence
- Coil for images
- JUnit and basic ViewModel tests

Project shape:
- Use a single Android app module `:app` for this base version.
- Organize code by package boundaries, not Gradle feature modules.
- Use package name `com.limoneo.android`.
- Create these packages:
  - `core.common`
  - `core.model`
  - `core.network`
  - `core.datastore`
  - `core.database`
  - `core.designsystem`
  - `core.navigation`
  - `core.testing`
  - `feature.auth`
  - `feature.home`
  - `feature.catalog`
  - `feature.product`
  - `feature.cart`
  - `feature.checkout`
  - `feature.orders`
  - `feature.profile`

Architecture requirements:
- Separate DTOs from domain models.
- Create repository interfaces and two implementations where relevant:
  - remote implementation
  - fake/mock implementation
- The app must compile and run with fake data even if the backend endpoints do not exist yet.
- Wire the app through repository interfaces so switching from fake to remote is trivial.
- Add a simple environment toggle, for example `BuildConfig.USE_MOCKS`, that chooses fake repositories in debug by default.
- Use `StateFlow` for UI state in ViewModels.
- Use one-directional UI state updates.
- Avoid global mutable singletons for business state.

Networking requirements:
- Create a generic `ApiEnvelope<T>` matching the mobile API spec.
- Create `ApiErrorResponse` and typed error mapping.
- Add an auth interceptor that injects `Authorization: Bearer <token>` when present.
- Add a locale interceptor that injects `Accept-Language` from app settings.
- Expect `Content-Language` in responses and keep app locale state aligned with the resolved backend locale.
- Add a logging interceptor only in debug builds.
- Create Retrofit services for:
  - auth
  - catalog
  - cart
  - checkout
  - orders
  - profile

Persistence requirements:
- Persist auth token and current locale in DataStore.
- Persist guest cart in Room.
- On login, expose a `syncGuestCart()` flow in the cart repository that sends the local cart to the server cart API and then clears the guest cart storage on success.

Navigation requirements:
- Create a root nav graph with:
  - splash
  - auth graph
  - main graph
- Main graph tabs or top-level destinations:
  - Home
  - Search/Catalog
  - Cart
  - Orders
  - Profile
- Product detail must be reachable from home, catalog, search, cart-related flows, and orders.
- Add deep link handling for:
  - `limoneo://checkout/complete?status={status}&order_id={orderId}&provider={provider}&code={code}`
  - `https://limoneo.com/app/checkout/complete?status={status}&order_id={orderId}&provider={provider}&code={code}`

Feature requirements by package:

1. `feature.auth`
- Login screen
- Register screen
- Social login entry points for Google and Facebook
- Session restoration on app launch
- AuthViewModel and session state holder

2. `feature.home`
- Home screen using the `home` API contract from the spec
- Campaign banners
- Category shortcuts
- Product rails for featured and special collections
- Loading, empty, and error states

3. `feature.catalog`
- Search screen
- Product list screen
- Category-driven browsing
- Filter/sort state matching the spec:
  - query
  - category_slug
  - min_price
  - max_price
  - sort
- Debounced search suggestions

4. `feature.product`
- Product detail screen
- Gallery pager
- Pricing block
- Description/specifications
- Reviews preview
- Related products
- Add to cart action

5. `feature.cart`
- Cart screen
- Cart item row
- Quantity updates
- Remove line
- Derived totals
- Guest cart vs authenticated cart logic hidden behind repository

6. `feature.checkout`
- Address selection
- Shipping option selection
- Coupon apply/remove
- Quote summary
- Payment provider chooser
- Payment launcher that opens Custom Tabs or external app from `checkout_url`
- Deep link result handler that refreshes the order state from backend after return

7. `feature.orders`
- Orders list
- Order detail
- Filter state: all, paid, shipped, cancelled
- Line item states matching backend names from the spec
- Request cancel and request refund actions where allowed

8. `feature.profile`
- Profile screen
- Edit profile form
- Address book CRUD
- Language selector
- Logout

UI and design requirements:
- Make the UI mobile-first, clean, and intentional.
- Do not generate generic desktop-style layouts.
- Use Material 3 tokens with a custom Limoneo theme.
- Add loading placeholders or skeletons where useful.
- All visible text must come from Android string resources.
- Provide `values/strings.xml`, `values-es/strings.xml`, `values-en/strings.xml`, and `values-fr/strings.xml`.
- Do not hardcode user-facing strings in composables or viewmodels.

Modeling requirements:
- Create DTOs that mirror the mobile API spec:
  - `UserProfileDto`
  - `AddressDto`
  - `BannerItemDto`
  - `CategoryDto`
  - `ProductCardDto`
  - `ProductDetailDto`
  - `CartLineDto`
  - `CartSummaryDto`
  - `ShippingOptionDto`
  - `PaymentSessionDto`
  - `OrderItemDto`
  - `OrderSummaryDto`
- Create separate domain models with similar names but without the `Dto` suffix.
- Add mappers between DTOs and domain models.

Repository contract requirements:
- Create these repository interfaces:
  - `AuthRepository`
  - `CatalogRepository`
  - `CartRepository`
  - `CheckoutRepository`
  - `OrdersRepository`
  - `ProfileRepository`
- Create remote and fake implementations where it makes sense.
- Fake implementations must use mock payloads that follow `docs/MOBILE_API_ANDROID_SPEC.md`.

Checkout and payment flow requirements:
- The checkout repository must expose:
  - quote checkout
  - apply coupon
  - update shipping
  - create payment session
- The payment launcher must only use the `checkout_url` returned by backend.
- After deep link return, the app must:
  - inspect `status`
  - if success and `order_id` exists, navigate to order detail and refresh it from backend
  - if cancel, show a non-destructive cancellation message and return to checkout or cart
  - if error, show a backend-driven payment error state
- The app must not fake a successful purchase locally.

Testing requirements:
- Add basic unit tests for:
  - auth session restoration
  - cart merge logic around guest vs authenticated state
  - checkout result parsing from deep link
  - order action availability mapping
- Add at least one test for repository error mapping.

Implementation defaults:
- Use current stable library versions available in your environment.
- Prefer compile-ready code over pseudo-code.
- Prefer concise but real placeholder UI over unfinished stubs.
- If a remote endpoint is not yet implemented, keep the remote service interface and use the fake repository by default.
- If a detail is ambiguous, prefer `docs/MOBILE_API_ANDROID_SPEC.md` over your own assumptions.

Expected output:
- Generate the project as path-by-path code blocks.
- Include Gradle setup, manifest, navigation, theme, models, repositories, network layer, datastore layer, Room entities/dao for guest cart, screens, viewmodels, previews, and tests.
- End with a short README section explaining:
  - how fake vs remote mode is selected
  - where the API contract is expected
  - how the payment deep link flow works
```

## Intended result

If the prompt is followed correctly, the generated Android base should:

- compile with fake data first
- be ready to switch to the real API contract later
- avoid inventing a fake mobile checkout logic
- preserve the same order and address semantics as the Laravel web app
- keep payment completion under backend control
