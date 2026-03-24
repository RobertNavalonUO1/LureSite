# Limoneo Mobile API Android Spec

Last updated: 2026-03-17

## 1. Purpose

This document defines the canonical mobile API contract required for an Android app to reproduce the real Limoneo ecommerce behavior.

It is intentionally based on the current Laravel web application as the source of truth. The existing `MobileApiController` is considered legacy and partial. It is documented here only to explain what must not become the new contract.

This document is both the canonical contract and the implementation reference as of 2026-03-17. Public mobile API routes live in `api/mobile/v1`.

## 2. Source of truth and explicit exclusions

Backend sources of truth already present in the repo:

- Mobile API implementation:
  - `App\Http\Controllers\Api\MobileV1\AuthController`
  - `App\Http\Controllers\Api\MobileV1\CatalogController`
  - `App\Http\Controllers\Api\MobileV1\CartController`
  - `App\Http\Controllers\Api\MobileV1\CheckoutController`
  - `App\Http\Controllers\Api\MobileV1\AddressController`
  - `App\Http\Controllers\Api\MobileV1\OrdersController`
  - `App\Http\Middleware\SetApiLocale`
  - `App\Services\ShoppingCartService`
  - `App\Services\Mobile\MobileCheckoutService`
  - `App\Services\Mobile\MobileOrderPresenter`
  - `App\Services\Mobile\MobileCartPresenter`

- Catalog and special collections:
  - `App\Http\Controllers\ProductController`
  - `App\Http\Controllers\SearchController`
  - `App\Http\Controllers\CategoryController`
  - `App\Support\CatalogDataLocalizer`
  - `App\Services\CampaignBannerResolver`
- Profile and addresses:
  - `App\Http\Controllers\ProfileController`
  - `App\Http\Controllers\AddressController`
  - `App\Services\ProfileService`
  - `App\Http\Requests\ProfileUpdateRequest`
  - `App\Http\Requests\StoreAddressRequest`
- Checkout and payments:
  - `App\Http\Controllers\CheckoutController`
- Orders, cancellations, refunds:
  - `App\Http\Controllers\OrderController`
  - `App\Services\OrderLineStateService`
  - `App\Services\OrderRefundService`
  - `App\Support\OrderState`
- Auth:
  - `App\Http\Controllers\Api\SocialAuthController`
  - `App\Http\Controllers\Auth\SocialAuthController`
  - Sanctum token model from Laravel

Explicitly out of scope for mobile v1:

- Admin
- Scrapers and import tools
- Logs and operational dashboards
- Any HTML or Inertia page contract

## 3. Canonical and legacy API status in the current repo

Current canonical status:

- `api/mobile/v1` is implemented and routable in the backend.
- `POST /api/auth/social` remains the reusable social auth exception outside the prefix.
- Browser-based mobile OAuth support also exists through:
  - `GET /auth/mobile/{provider}/redirect`
  - `GET /auth/mobile/{provider}/callback`
- The old `/api/mobile/*` routes still exist, but they are legacy partial endpoints and must not be used as the Android source of truth.

The following routes exist today, but they are not the target contract:

| Current route | Status | Why it is not the target |
| --- | --- | --- |
| `POST /api/mobile/register` | Legacy partial | Returns raw token/user shape, no normalized envelope |
| `POST /api/mobile/login` | Legacy partial | Same issue as above |
| `GET /api/mobile/products` | Legacy partial | Returns raw products, not localized or curated for mobile |
| `GET /api/mobile/categories` | Legacy partial | Returns raw categories only |
| `GET /api/mobile/me` | Legacy partial | Returns raw user model, not profile contract |
| `GET /api/mobile/orders` | Legacy partial | Returns raw orders, not the real mapped order UI contract |
| `GET /api/mobile/addresses` | Legacy partial | Uses the wrong address shape |
| `POST /api/mobile/addresses` | Legacy partial | Uses a single `address` string, not structured fields |
| `POST /api/mobile/place-order` | Legacy partial | Creates `confirmado` orders without verified payment |

Rule: do not extend `MobileApiController` as the basis of the new mobile API if it conflicts with the web application behavior.

## 4. Global contract

### 4.1 Base path

- Canonical mobile API prefix: `api/mobile/v1`
- Existing exception kept as reusable: `POST /api/auth/social`
- Supported browser-based mobile OAuth routes:
  - `GET /auth/mobile/{provider}/redirect`
  - `GET /auth/mobile/{provider}/callback`

### 4.2 Transport and headers

Required headers for JSON endpoints:

```http
Accept: application/json
Content-Type: application/json
```

Authenticated routes:

```http
Authorization: Bearer <sanctum_token>
```

Locale:

```http
Accept-Language: es
Accept-Language: en
Accept-Language: fr
```

Rules:

- Mobile locale is stateless.
- The API must not rely on session or cookie locale for app requests.
- Unsupported or missing locale falls back to `es`.
- The API should return `Content-Language` with the resolved locale.

### 4.3 Currency, dates, identifiers

- Visible currency for mobile v1: `EUR`
- Monetary values: decimal numbers with two decimals
- Dates: ISO 8601 strings
- Primary IDs: integers unless explicitly documented otherwise

### 4.4 Success envelope

Success responses use:

```json
{
  "data": {},
  "meta": {}
}
```

Notes:

- `meta` may be an empty object.
- Creation endpoints may still use `201`, but keep the same envelope.
- Mutation endpoints should prefer returning the updated resource in `data` plus a human message in `meta.message`.

### 4.5 Validation and error envelopes

Validation errors use HTTP `422`:

```json
{
  "message": "Validation failed.",
  "errors": {
    "field_name": [
      "Readable message"
    ]
  }
}
```

Business or authorization errors use HTTP `4xx`:

```json
{
  "message": "Readable message",
  "code": "machine_readable_code"
}
```

Recommended machine codes:

- `unauthenticated`
- `forbidden`
- `not_found`
- `validation_error`
- `cart_empty`
- `product_unavailable`
- `product_out_of_stock`
- `invalid_coupon`
- `coupon_not_applicable`
- `shipping_method_unavailable`
- `address_not_owned`
- `payment_provider_not_supported`
- `payment_verification_failed`
- `order_action_not_allowed`

### 4.6 Pagination meta

Paginated list endpoints use:

```json
{
  "data": [],
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 12,
      "total": 120,
      "last_page": 10,
      "from": 1,
      "to": 12
    }
  }
}
```

## 5. Shared resource shapes

### 5.1 UserProfile

Source of truth:

- `ProfileService::serializeUser()`
- `HandleInertiaRequests`
- `ProfileUpdateRequest`

```json
{
  "id": 15,
  "name": "Tomas",
  "lastname": "Lopez",
  "email": "tomas@example.com",
  "phone": "+34123456789",
  "avatar": "https://limoneo.com/storage/avatars/15.png",
  "photo_url": "https://graph.example/avatar.jpg",
  "default_address_id": 81,
  "email_verified_at": "2026-03-14T10:12:30Z"
}
```

### 5.2 Address

Source of truth:

- `ProfileService::serializeAddress()`
- `StoreAddressRequest`

```json
{
  "id": 81,
  "street": "Calle Mayor 10",
  "city": "Madrid",
  "province": "Madrid",
  "zip_code": "28001",
  "country": "Spain",
  "is_default": true,
  "created_at": "2026-03-10T10:00:00Z",
  "updated_at": "2026-03-10T10:00:00Z"
}
```

### 5.3 BannerItem

Source of truth:

- `CampaignBannerResolver`

```json
{
  "id": 9,
  "title": "Spring setup",
  "subtitle": "Selected products with live stock",
  "image": "storage/banners/spring.jpg",
  "link": "/superdeal",
  "cta_label": "Explore",
  "campaign": "spring",
  "placement": "hero"
}
```

### 5.4 CategorySummary

Source of truth:

- `CatalogDataLocalizer::categoryPayload()`

```json
{
  "id": 7,
  "name": "Home",
  "slug": "home",
  "description": "Category description"
}
```

### 5.5 ProductCard

Source of truth:

- `CatalogDataLocalizer::productPayload()`
- `ProductController::specialProductPayload()`
- `SearchController`

```json
{
  "id": 101,
  "name": "Lemon Lamp",
  "price": 29.99,
  "original_price": 39.99,
  "discount": 25,
  "currency": "EUR",
  "stock": 14,
  "image_url": "products/lemon-lamp.jpg",
  "image_url_full": "https://limoneo.com/storage/products/lemon-lamp.jpg",
  "short_description": "Compact desk lamp with lemon finish.",
  "badge": "Envio rapido",
  "average_rating": 4.6,
  "reviews_count": 12,
  "delivery_estimate": "Entrega estimada en 24-48 h",
  "flags": {
    "featured": true,
    "superdeal": false,
    "fast_shipping": true,
    "new_arrival": false,
    "seasonal": false
  },
  "category": {
    "id": 7,
    "name": "Home",
    "slug": "home"
  }
}
```

Notes:

- `original_price` is nullable.
- `discount` is an integer percentage.
- `currency` is always `EUR` in v1.

### 5.6 ReviewSummary

Source of truth:

- `Review` model

```json
{
  "id": 301,
  "author": "Ana",
  "rating": 5,
  "comment": "Great quality.",
  "created_at": "2026-03-12T08:20:00Z"
}
```

### 5.7 ProductDetail

Source of truth:

- `ProductController::show()`
- `Product` + `ProductDetail` + `ProductImage` + `Review`

```json
{
  "id": 101,
  "name": "Lemon Lamp",
  "price": 29.99,
  "original_price": 39.99,
  "discount": 25,
  "currency": "EUR",
  "stock": 14,
  "image_url": "products/lemon-lamp.jpg",
  "image_url_full": "https://limoneo.com/storage/products/lemon-lamp.jpg",
  "description": "Full product description",
  "details": {
    "specifications": "Material: metal"
  },
  "gallery": [
    "https://limoneo.com/storage/products/lemon-lamp.jpg",
    "https://limoneo.com/storage/products/lemon-lamp-2.jpg"
  ],
  "average_rating": 4.6,
  "reviews_count": 12,
  "reviews": [
    {
      "id": 301,
      "author": "Ana",
      "rating": 5,
      "comment": "Great quality.",
      "created_at": "2026-03-12T08:20:00Z"
    }
  ],
  "flags": {
    "featured": true,
    "superdeal": false,
    "fast_shipping": true,
    "new_arrival": false,
    "seasonal": false
  },
  "category": {
    "id": 7,
    "name": "Home",
    "slug": "home"
  },
  "related_products": []
}
```

### 5.8 CartLine

For v1, the cart supports one line per product. `id` is therefore the same as `product_id`.

```json
{
  "id": 101,
  "product_id": 101,
  "quantity": 2,
  "unit_price": 29.99,
  "subtotal": 59.98,
  "product": {
    "id": 101,
    "name": "Lemon Lamp",
    "price": 29.99,
    "original_price": 39.99,
    "discount": 25,
    "currency": "EUR",
    "stock": 14,
    "image_url": "products/lemon-lamp.jpg",
    "image_url_full": "https://limoneo.com/storage/products/lemon-lamp.jpg",
    "short_description": "Compact desk lamp with lemon finish.",
    "badge": "Envio rapido",
    "average_rating": 4.6,
    "reviews_count": 12,
    "delivery_estimate": "Entrega estimada en 24-48 h",
    "flags": {
      "featured": true,
      "superdeal": false,
      "fast_shipping": true,
      "new_arrival": false,
      "seasonal": false
    },
    "category": {
      "id": 7,
      "name": "Home",
      "slug": "home"
    }
  }
}
```

### 5.9 ShippingOption

Source of truth:

- `CheckoutController::shippingBlueprint()`

```json
{
  "value": "standard",
  "label": "Envio estandar",
  "description": "Gratis en pedidos superiores a 50 EUR",
  "eta": "3-5 dias habiles",
  "cost": 4.99,
  "badge": "Popular"
}
```

### 5.10 CartSummary / CheckoutQuote

The same shape is returned by `GET /cart`, `PUT /cart`, and all checkout quote endpoints.

```json
{
  "currency": "EUR",
  "items_count": 2,
  "subtotal": 59.98,
  "discount": 5.00,
  "shipping": 4.99,
  "total": 59.97,
  "coupon": {
    "code": "WELCOME10",
    "label": "WELCOME10",
    "amount": 5.00
  },
  "shipping_method": {
    "value": "standard",
    "label": "Envio estandar",
    "description": "Gratis en pedidos superiores a 50 EUR",
    "eta": "3-5 dias habiles",
    "cost": 4.99,
    "badge": "Popular"
  },
  "shipping_options": [],
  "items": [],
  "warnings": []
}
```

### 5.11 PaymentSession

```json
{
  "checkout_context_id": "chk_ctx_01JXYZ123",
  "provider": "stripe",
  "method": "browser_redirect",
  "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_123",
  "expires_at": "2026-03-15T18:00:00Z"
}
```

### 5.12 OrderItem

Source of truth:

- `OrderController::mapOrderItem()`

```json
{
  "id": 501,
  "name": "Lemon Lamp",
  "quantity": 1,
  "price": 29.99,
  "subtotal": 29.99,
  "status": "pagado",
  "status_label": "Pagado",
  "can_cancel": true,
  "can_refund": false,
  "cancellation_reason": null,
  "cancelled_by": null,
  "cancelled_at": null,
  "return_reason": null,
  "refund_reference_id": null,
  "refunded_at": null,
  "refund_error": null,
  "image_url": "products/lemon-lamp.jpg",
  "product_id": 101
}
```

### 5.13 OrderSummary

Source of truth:

- `OrderController::mapOrderListItem()`
- `OrderState`

```json
{
  "id": 901,
  "date": "2026-03-15T10:30:00Z",
  "status": "pagado",
  "status_label": "Pagado",
  "summary_status": "pagado",
  "summary_status_label": "Pagado",
  "total": 59.97,
  "active_total": 59.97,
  "affected_total": 0.00,
  "address": "Calle Mayor 10, Madrid, Madrid, 28001, Spain",
  "estimated_delivery": "2026-03-20",
  "can_cancel": true,
  "can_refund": false,
  "line_counts": {
    "total": 2,
    "active": 2,
    "cancellation_requested": 0,
    "cancelled": 0,
    "refund_requested": 0,
    "refund_approved": 0,
    "refund_rejected": 0,
    "refunded": 0,
    "cancelable": 2,
    "refundable": 0,
    "affected": 0
  },
  "items": []
}
```

## 6. Endpoint catalog

Each endpoint below includes:

- purpose
- auth requirement
- request
- response
- expected errors
- source of truth

### 6.1 Existing reusable endpoint

#### POST `/api/auth/social`

- Status: existing reusable route, but mobile response must be normalized to the envelope used below
- Purpose: exchange provider access token for a Sanctum token
- Auth: no

Request:

```json
{
  "provider": "google",
  "access_token": "provider_access_token",
  "device_name": "android"
}
```

Response:

```json
{
  "data": {
    "token": "1|sanctum-token",
    "user": {
      "id": 15,
      "name": "Tomas",
      "lastname": null,
      "email": "tomas@example.com",
      "phone": null,
      "avatar": "https://limoneo.com/storage/avatars/15.png",
      "photo_url": "https://graph.example/avatar.jpg",
      "default_address_id": null,
      "email_verified_at": null
    }
  },
  "meta": {
    "provider": "google"
  }
}
```

Errors:

- `401 invalid_social_token`
- `422 provider_email_missing`
- `404 not_found` for unsupported provider

Source of truth:

- `App\Http\Controllers\Api\SocialAuthController`
- `User` model fields

### 6.2 Auth endpoints

#### POST `/api/mobile/v1/auth/register`

- Purpose: create a local account and return a Sanctum token
- Auth: no

Request:

```json
{
  "name": "Tomas",
  "lastname": "Lopez",
  "email": "tomas@example.com",
  "password": "secret123",
  "password_confirmation": "secret123",
  "device_name": "android"
}
```

Response:

```json
{
  "data": {
    "token": "1|sanctum-token",
    "user": {}
  },
  "meta": {
    "message": "Account created."
  }
}
```

Errors:

- `422 validation_error`
- `409 email_taken`

Source of truth:

- `User`
- Current `MobileApiController::register()` only for minimum field set; new endpoint must use normalized envelope and full profile shape

#### POST `/api/mobile/v1/auth/login`

- Purpose: authenticate email/password and return a Sanctum token
- Auth: no

Request:

```json
{
  "email": "tomas@example.com",
  "password": "secret123",
  "device_name": "android"
}
```

Response:

```json
{
  "data": {
    "token": "1|sanctum-token",
    "user": {}
  },
  "meta": {
    "message": "Login successful."
  }
}
```

Errors:

- `401 invalid_credentials`
- `422 validation_error`

Source of truth:

- Current `MobileApiController::login()` for credential check only
- `ProfileService::serializeUser()` for user payload

#### POST `/api/mobile/v1/auth/logout`

- Purpose: revoke the current Sanctum token only
- Auth: yes

Request:

```json
{}
```

Response:

```json
{
  "data": null,
  "meta": {
    "message": "Session closed."
  }
}
```

Errors:

- `401 unauthenticated`

Source of truth:

- Sanctum current access token revocation

#### GET `/api/mobile/v1/me`

- Purpose: fetch the authenticated profile
- Auth: yes

Response:

```json
{
  "data": {
    "id": 15,
    "name": "Tomas",
    "lastname": "Lopez",
    "email": "tomas@example.com",
    "phone": "+34123456789",
    "avatar": "https://limoneo.com/storage/avatars/15.png",
    "photo_url": "https://graph.example/avatar.jpg",
    "default_address_id": 81,
    "email_verified_at": "2026-03-14T10:12:30Z"
  },
  "meta": {}
}
```

Errors:

- `401 unauthenticated`

Source of truth:

- `ProfileService::serializeUser()`

#### PATCH `/api/mobile/v1/me`

- Purpose: update profile fields
- Auth: yes

Request:

```json
{
  "name": "Tomas",
  "lastname": "Lopez",
  "email": "tomas@example.com",
  "phone": "+34123456789",
  "avatar": "avatars/custom.png",
  "default_address_id": 81
}
```

Response:

```json
{
  "data": {
    "id": 15,
    "name": "Tomas",
    "lastname": "Lopez",
    "email": "tomas@example.com",
    "phone": "+34123456789",
    "avatar": "https://limoneo.com/storage/avatars/15.png",
    "photo_url": null,
    "default_address_id": 81,
    "email_verified_at": "2026-03-14T10:12:30Z"
  },
  "meta": {
    "message": "Profile updated."
  }
}
```

Errors:

- `401 unauthenticated`
- `422 validation_error`

Source of truth:

- `ProfileUpdateRequest`
- `ProfileService::updateProfile()`

### 6.3 Home, search, catalog, product detail

#### GET `/api/mobile/v1/home`

- Purpose: provide a mobile-friendly home payload without sending the entire catalog
- Auth: no

Response:

```json
{
  "data": {
    "campaign": {
      "campaign": "spring",
      "mode": "auto",
      "auto_campaign": "spring",
      "banners": {
        "hero": [],
        "showcase": [],
        "sidebar": [],
        "general": []
      }
    },
    "categories": [],
    "sections": [
      {
        "key": "featured",
        "title": "Featured",
        "collection": "featured",
        "items": []
      },
      {
        "key": "deals-today",
        "title": "Deals today",
        "collection": "deals-today",
        "items": []
      },
      {
        "key": "new-arrivals",
        "title": "New arrivals",
        "collection": "new-arrivals",
        "items": []
      },
      {
        "key": "fast-shipping",
        "title": "Fast shipping",
        "collection": "fast-shipping",
        "items": []
      }
    ]
  },
  "meta": {}
}
```

Errors:

- standard `500` only

Source of truth:

- Home route in `routes/web.php`
- `CampaignBannerResolver`
- `ProductController` special collection methods

Implementation note:

- This is a new mobile aggregation endpoint.
- Do not return the full `Product::all()` collection used by the current web home route.

#### GET `/api/mobile/v1/search/suggestions`

- Purpose: lightweight search suggestions for typeahead
- Auth: no

Request query params:

- `query` required, min 2
- `limit` optional, 1..10

Response:

```json
{
  "data": [
    {
      "id": 101,
      "name": "Lemon Lamp",
      "price": 29.99,
      "image_url_full": "https://limoneo.com/storage/products/lemon-lamp.jpg",
      "category": "Home"
    }
  ],
  "meta": {
    "query": "lem"
  }
}
```

Errors:

- `422 validation_error`

Source of truth:

- `SearchController::suggest()`

Implementation note:

- Existing controller already returns JSON. Normalize it to the mobile envelope.

#### GET `/api/mobile/v1/products`

- Purpose: paginated product list for search and category-driven browsing
- Auth: no

Request query params:

- `query` optional, min 2
- `category_slug` optional
- `min_price` optional
- `max_price` optional
- `sort` optional: `relevance|price_asc|price_desc|recent|rating`
- `page` optional
- `per_page` optional, default 12, max 48

Response:

```json
{
  "data": [],
  "meta": {
    "filters": {
      "query": "lamp",
      "category_slug": "home",
      "min_price": null,
      "max_price": null,
      "sort": "relevance"
    },
    "pagination": {
      "current_page": 1,
      "per_page": 12,
      "total": 2,
      "last_page": 1,
      "from": 1,
      "to": 2
    }
  }
}
```

Errors:

- `422 validation_error`

Source of truth:

- `SearchController::search()`
- `CatalogDataLocalizer::productPayload()`

#### GET `/api/mobile/v1/products/{id}`

- Purpose: full product detail for mobile PDP
- Auth: no

Response:

```json
{
  "data": {
    "id": 101,
    "name": "Lemon Lamp",
    "price": 29.99,
    "original_price": 39.99,
    "discount": 25,
    "currency": "EUR",
    "stock": 14,
    "image_url": "products/lemon-lamp.jpg",
    "image_url_full": "https://limoneo.com/storage/products/lemon-lamp.jpg",
    "description": "Full product description",
    "details": {
      "specifications": "Material: metal"
    },
    "gallery": [],
    "average_rating": 4.6,
    "reviews_count": 12,
    "reviews": [],
    "flags": {
      "featured": true,
      "superdeal": false,
      "fast_shipping": true,
      "new_arrival": false,
      "seasonal": false
    },
    "category": {
      "id": 7,
      "name": "Home",
      "slug": "home"
    },
    "related_products": []
  },
  "meta": {}
}
```

Errors:

- `404 not_found`

Source of truth:

- `ProductController::show()`
- `Review` model

#### GET `/api/mobile/v1/categories`

- Purpose: list categories for navigation and filtering
- Auth: no

Response:

```json
{
  "data": [],
  "meta": {}
}
```

Errors:

- standard `500` only

Source of truth:

- `CategoryController`
- `CatalogDataLocalizer::categoryPayload()`

#### GET `/api/mobile/v1/categories/{slug}`

- Purpose: fetch one category and its paginated products
- Auth: no

Request query params:

- `page` optional
- `per_page` optional, default 12, max 48
- `sort` optional: `relevance|price_asc|price_desc|recent|rating`

Response:

```json
{
  "data": {
    "category": {
      "id": 7,
      "name": "Home",
      "slug": "home",
      "description": "Category description"
    },
    "products": []
  },
  "meta": {
    "pagination": {
      "current_page": 1,
      "per_page": 12,
      "total": 24,
      "last_page": 2,
      "from": 1,
      "to": 12
    }
  }
}
```

Errors:

- `404 not_found`
- `422 validation_error`

Source of truth:

- `CategoryController::showBySlug()`

Implementation note:

- Current web page returns unpaginated products. Mobile v1 should paginate.

#### GET `/api/mobile/v1/special/{collection}`

- Purpose: expose special storefront collections in a unified contract
- Auth: no

Supported `collection` values:

- `deals-today`
- `superdeals`
- `new-arrivals`
- `seasonal-products`
- `fast-shipping`

Request query params:

- `page` optional
- `per_page` optional, default 12, max 48

Response:

```json
{
  "data": [],
  "meta": {
    "collection": "fast-shipping",
    "pagination": {
      "current_page": 1,
      "per_page": 12,
      "total": 12,
      "last_page": 1,
      "from": 1,
      "to": 12
    }
  }
}
```

Errors:

- `404 not_found`
- `422 validation_error`

Source of truth:

- `ProductController::dealsToday()`
- `ProductController::superdeals()`
- `ProductController::newArrivals()`
- `ProductController::seasonalProducts()`
- `ProductController::fastShipping()`

### 6.4 Cart

Mobile cart policy:

- Before login: cart is local to the app.
- After login: the app uses the server cart through these endpoints.
- On first authenticated sync, the app sends its local snapshot. The server merges it with the authenticated cart.

Exact merge policy for `PUT /cart`:

1. Merge by `product_id`.
2. If the same product exists in both client and server snapshots, sum quantities.
3. Clamp quantity to available stock.
4. Drop products that no longer exist.
5. Return warnings in `warnings` for dropped or clamped lines.

#### GET `/api/mobile/v1/cart`

- Purpose: fetch the authenticated cart
- Auth: yes

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 2,
    "subtotal": 59.98,
    "discount": 0.00,
    "shipping": 0.00,
    "total": 59.98,
    "coupon": null,
    "shipping_method": null,
    "shipping_options": [],
    "items": [],
    "warnings": []
  },
  "meta": {}
}
```

Errors:

- `401 unauthenticated`

Source of truth:

- `ShoppingCartService`
- `CartItem`
- `CartController` web facade over the same shared cart service

Implementation status:

- Authenticated cart persistence is implemented through `cart_items`.
- Web and mobile both read through `ShoppingCartService`.
- Guest web cart still uses session, while authenticated users can share cart state between web and app.

#### PUT `/api/mobile/v1/cart`

- Purpose: replace or merge the authenticated cart from a full client snapshot
- Auth: yes

Request:

```json
{
  "items": [
    {
      "product_id": 101,
      "quantity": 2
    },
    {
      "product_id": 205,
      "quantity": 1
    }
  ]
}
```

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 3,
    "subtotal": 89.97,
    "discount": 0.00,
    "shipping": 0.00,
    "total": 89.97,
    "coupon": null,
    "shipping_method": null,
    "shipping_options": [],
    "items": [],
    "warnings": [
      {
        "code": "quantity_clamped",
        "message": "Quantity for product 205 was reduced to available stock.",
        "product_id": 205
      }
    ]
  },
  "meta": {
    "merge_strategy": "sum_by_product"
  }
}
```

Errors:

- `401 unauthenticated`
- `422 validation_error`
- `409 product_out_of_stock`

#### POST `/api/mobile/v1/cart/items`

- Purpose: add one product or increment an existing line
- Auth: yes

Request:

```json
{
  "product_id": 101,
  "quantity": 1
}
```

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 2,
    "subtotal": 59.98,
    "discount": 0.00,
    "shipping": 0.00,
    "total": 59.98,
    "coupon": null,
    "shipping_method": null,
    "shipping_options": [],
    "items": [],
    "warnings": []
  },
  "meta": {
    "message": "Product added."
  }
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`
- `409 product_out_of_stock`

Source of truth:

- `CartController::addToCart()`

#### PATCH `/api/mobile/v1/cart/items/{lineId}`

- Purpose: set the quantity of one cart line
- Auth: yes

Request:

```json
{
  "quantity": 3
}
```

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 3,
    "subtotal": 89.97,
    "discount": 0.00,
    "shipping": 0.00,
    "total": 89.97,
    "coupon": null,
    "shipping_method": null,
    "shipping_options": [],
    "items": [],
    "warnings": []
  },
  "meta": {
    "message": "Cart updated."
  }
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`
- `422 validation_error`
- `409 product_out_of_stock`

Implementation note:

- This endpoint sets the final quantity directly instead of exposing mobile increment and decrement routes.

#### DELETE `/api/mobile/v1/cart/items/{lineId}`

- Purpose: remove one line from the cart
- Auth: yes

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 1,
    "subtotal": 29.99,
    "discount": 0.00,
    "shipping": 0.00,
    "total": 29.99,
    "coupon": null,
    "shipping_method": null,
    "shipping_options": [],
    "items": [],
    "warnings": []
  },
  "meta": {
    "message": "Line removed."
  }
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`

Source of truth:

- `CartController::removeFromCart()`

### 6.5 Addresses

#### GET `/api/mobile/v1/addresses`

- Purpose: fetch the authenticated address book
- Auth: yes

Response:

```json
{
  "data": [],
  "meta": {
    "default_address_id": 81
  }
}
```

Errors:

- `401 unauthenticated`

Source of truth:

- `ProfileService`
- `AddressController`

#### POST `/api/mobile/v1/addresses`

- Purpose: create a structured address
- Auth: yes

Request:

```json
{
  "street": "Calle Mayor 10",
  "city": "Madrid",
  "province": "Madrid",
  "zip_code": "28001",
  "country": "Spain",
  "make_default": true
}
```

Response:

```json
{
  "data": {
    "id": 81,
    "street": "Calle Mayor 10",
    "city": "Madrid",
    "province": "Madrid",
    "zip_code": "28001",
    "country": "Spain",
    "is_default": true,
    "created_at": "2026-03-10T10:00:00Z",
    "updated_at": "2026-03-10T10:00:00Z"
  },
  "meta": {
    "message": "Address created.",
    "default_address_id": 81
  }
}
```

Errors:

- `401 unauthenticated`
- `422 validation_error`

Source of truth:

- `StoreAddressRequest`
- `AddressController::store()`

#### PATCH `/api/mobile/v1/addresses/{id}`

- Purpose: update an address
- Auth: yes

Request:

```json
{
  "street": "Calle Mayor 12",
  "city": "Madrid",
  "province": "Madrid",
  "zip_code": "28001",
  "country": "Spain",
  "make_default": false
}
```

Response:

```json
{
  "data": {
    "id": 81,
    "street": "Calle Mayor 12",
    "city": "Madrid",
    "province": "Madrid",
    "zip_code": "28001",
    "country": "Spain",
    "is_default": true,
    "created_at": "2026-03-10T10:00:00Z",
    "updated_at": "2026-03-15T10:00:00Z"
  },
  "meta": {
    "message": "Address updated.",
    "default_address_id": 81
  }
}
```

Errors:

- `401 unauthenticated`
- `403 address_not_owned`
- `422 validation_error`

Source of truth:

- `UpdateAddressRequest`
- `AddressController::update()`

#### PATCH `/api/mobile/v1/addresses/{id}/default`

- Purpose: mark one address as default
- Auth: yes

Response:

```json
{
  "data": {
    "id": 81,
    "street": "Calle Mayor 12",
    "city": "Madrid",
    "province": "Madrid",
    "zip_code": "28001",
    "country": "Spain",
    "is_default": true,
    "created_at": "2026-03-10T10:00:00Z",
    "updated_at": "2026-03-15T10:00:00Z"
  },
  "meta": {
    "message": "Default address updated.",
    "default_address_id": 81
  }
}
```

Errors:

- `401 unauthenticated`
- `403 address_not_owned`

Source of truth:

- `AddressController::makeDefault()`

#### DELETE `/api/mobile/v1/addresses/{id}`

- Purpose: delete one address
- Auth: yes

Response:

```json
{
  "data": null,
  "meta": {
    "message": "Address deleted.",
    "default_address_id": 82
  }
}
```

Errors:

- `401 unauthenticated`
- `403 address_not_owned`
- `422 validation_error`

Source of truth:

- `AddressController::destroy()`
- `ProfileService::deleteAddress()`

### 6.6 Checkout and payments

Checkout policy for mobile v1:

- Auth is required.
- Guest checkout is not part of the contract.
- The app never creates a final order on its own.
- The backend verifies the payment provider callback before persisting the order.

All checkout quote endpoints below use the same normalized request body and return the same `CartSummary / CheckoutQuote` shape.

Base request shape:

```json
{
  "cart": {
    "items": [
      {
        "product_id": 101,
        "quantity": 2
      }
    ]
  },
  "address_id": 81,
  "coupon_code": "WELCOME10",
  "shipping_method": "standard"
}
```

#### POST `/api/mobile/v1/checkout/quote`

- Purpose: validate the cart snapshot, address, coupon, and shipping choice, then return a final quote
- Auth: yes

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 2,
    "subtotal": 59.98,
    "discount": 5.00,
    "shipping": 4.99,
    "total": 59.97,
    "coupon": {
      "code": "WELCOME10",
      "label": "WELCOME10",
      "amount": 5.00
    },
    "shipping_method": {
      "value": "standard",
      "label": "Envio estandar",
      "description": "Gratis en pedidos superiores a 50 EUR",
      "eta": "3-5 dias habiles",
      "cost": 4.99,
      "badge": "Popular"
    },
    "shipping_options": [],
    "items": [],
    "warnings": []
  },
  "meta": {}
}
```

Errors:

- `401 unauthenticated`
- `422 validation_error`
- `409 cart_empty`
- `409 invalid_coupon`
- `409 coupon_not_applicable`
- `409 shipping_method_unavailable`
- `403 address_not_owned`

Source of truth:

- `CheckoutController::calculateTotals()`
- `CheckoutController::resolveUserAddress()`
- `Coupon`

Implementation note:

- `CheckoutController` currently keeps quoting logic in private methods. Mobile v1 should extract that logic into a reusable checkout service.

#### POST `/api/mobile/v1/checkout/coupon`

- Purpose: apply or remove a coupon and return a full fresh quote
- Auth: yes

Request:

```json
{
  "cart": {
    "items": [
      {
        "product_id": 101,
        "quantity": 2
      }
    ]
  },
  "address_id": 81,
  "coupon_code": "WELCOME10",
  "shipping_method": "standard"
}
```

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 2,
    "subtotal": 59.98,
    "discount": 5.00,
    "shipping": 4.99,
    "total": 59.97,
    "coupon": {
      "code": "WELCOME10",
      "label": "WELCOME10",
      "amount": 5.00
    },
    "shipping_method": {
      "value": "standard",
      "label": "Envio estandar",
      "description": "Gratis en pedidos superiores a 50 EUR",
      "eta": "3-5 dias habiles",
      "cost": 4.99,
      "badge": "Popular"
    },
    "shipping_options": [],
    "items": [],
    "warnings": []
  },
  "meta": {
    "message": "Coupon applied."
  }
}
```

Errors:

- same as `POST /api/mobile/v1/checkout/quote`

Source of truth:

- `CheckoutController::applyCoupon()`

#### POST `/api/mobile/v1/checkout/shipping`

- Purpose: apply a shipping option and return a full fresh quote
- Auth: yes

Request:

```json
{
  "cart": {
    "items": [
      {
        "product_id": 101,
        "quantity": 2
      }
    ]
  },
  "address_id": 81,
  "coupon_code": "WELCOME10",
  "shipping_method": "express"
}
```

Response:

```json
{
  "data": {
    "currency": "EUR",
    "items_count": 2,
    "subtotal": 59.98,
    "discount": 5.00,
    "shipping": 9.99,
    "total": 64.97,
    "coupon": {
      "code": "WELCOME10",
      "label": "WELCOME10",
      "amount": 5.00
    },
    "shipping_method": {
      "value": "express",
      "label": "Envio expres",
      "description": "Entrega prioritaria en 48h",
      "eta": "1-2 dias habiles",
      "cost": 9.99,
      "badge": "Mas rapido"
    },
    "shipping_options": [],
    "items": [],
    "warnings": []
  },
  "meta": {
    "message": "Shipping updated."
  }
}
```

Errors:

- same as `POST /api/mobile/v1/checkout/quote`

Source of truth:

- `CheckoutController::updateShipping()`

#### POST `/api/mobile/v1/checkout/payments/{provider}/session`

- Purpose: create a provider payment session and return the hosted checkout URL
- Auth: yes

Supported `provider` values:

- `stripe`
- `paypal`

Request:

```json
{
  "cart": {
    "items": [
      {
        "product_id": 101,
        "quantity": 2
      }
    ]
  },
  "address_id": 81,
  "coupon_code": "WELCOME10",
  "shipping_method": "standard",
  "mobile_return": {
    "success_url": "limoneo://checkout/complete",
    "cancel_url": "limoneo://checkout/complete",
    "fallback_success_url": "https://limoneo.com/app/checkout/complete",
    "fallback_cancel_url": "https://limoneo.com/app/checkout/complete"
  }
}
```

Response:

```json
{
  "data": {
    "payment_session": {
      "checkout_context_id": "chk_ctx_01JXYZ123",
      "provider": "stripe",
      "method": "browser_redirect",
      "checkout_url": "https://checkout.stripe.com/c/pay/cs_test_123",
      "expires_at": "2026-03-15T18:00:00Z"
    },
    "quote": {
      "currency": "EUR",
      "items_count": 2,
      "subtotal": 59.98,
      "discount": 5.00,
      "shipping": 4.99,
      "total": 59.97,
      "coupon": {
        "code": "WELCOME10",
        "label": "WELCOME10",
        "amount": 5.00
      },
      "shipping_method": {
        "value": "standard",
        "label": "Envio estandar",
        "description": "Gratis en pedidos superiores a 50 EUR",
        "eta": "3-5 dias habiles",
        "cost": 4.99,
        "badge": "Popular"
      },
      "shipping_options": [],
      "items": [],
      "warnings": []
    }
  },
  "meta": {
    "message": "Payment session created."
  }
}
```

Errors:

- same as `POST /api/mobile/v1/checkout/quote`
- `409 payment_provider_not_supported`

Source of truth:

- `CheckoutController::stripeCheckout()`
- `CheckoutController::paypalCheckout()`
- `CheckoutController::success()`

Implementation rule:

- The backend must not trust the app to report payment completion.
- The provider return URL must hit the backend first.
- The backend verifies the provider callback, creates the order, and only then redirects to the mobile deep link or universal link.

#### Internal provider callbacks required by the backend

These routes are not consumed directly by the app, but they are required to complete the mobile payment flow:

- `GET /api/mobile/v1/checkout/payments/stripe/return`
- `GET /api/mobile/v1/checkout/payments/paypal/return`
- `GET /api/mobile/v1/checkout/payments/{provider}/cancel`

Exact redirect rules after verification:

- Success redirect:
  - `limoneo://checkout/complete?status=success&order_id={order_id}&provider={provider}`
- Cancel redirect:
  - `limoneo://checkout/complete?status=cancel&provider={provider}`
- Error redirect:
  - `limoneo://checkout/complete?status=error&provider={provider}&code={error_code}`

Fallback universal links:

- `https://limoneo.com/app/checkout/complete?status=success&order_id={order_id}&provider={provider}`
- `https://limoneo.com/app/checkout/complete?status=cancel&provider={provider}`
- `https://limoneo.com/app/checkout/complete?status=error&provider={provider}&code={error_code}`

### 6.7 Orders

#### GET `/api/mobile/v1/orders`

- Purpose: fetch the authenticated order history
- Auth: yes

Request query params:

- `filter` optional: `all|paid|shipped|cancelled`

Response:

```json
{
  "data": [],
  "meta": {
    "filter": "all"
  }
}
```

Errors:

- `401 unauthenticated`

Source of truth:

- `OrderController::index()`
- `OrderController::paid()`
- `OrderController::shipped()`
- `OrderController::cancelled()`

Implementation note:

- Reuse the existing order mapping logic. Do not return raw Eloquent orders.

#### GET `/api/mobile/v1/orders/{id}`

- Purpose: fetch a single owned order with all mapped line state information
- Auth: yes

Response:

```json
{
  "data": {
    "id": 901,
    "date": "2026-03-15T10:30:00Z",
    "status": "pagado",
    "status_label": "Pagado",
    "summary_status": "pagado",
    "summary_status_label": "Pagado",
    "total": 59.97,
    "active_total": 59.97,
    "affected_total": 0.00,
    "address": "Calle Mayor 10, Madrid, Madrid, 28001, Spain",
    "estimated_delivery": "2026-03-20",
    "can_cancel": true,
    "can_refund": false,
    "line_counts": {
      "total": 2,
      "active": 2,
      "cancellation_requested": 0,
      "cancelled": 0,
      "refund_requested": 0,
      "refund_approved": 0,
      "refund_rejected": 0,
      "refunded": 0,
      "cancelable": 2,
      "refundable": 0,
      "affected": 0
    },
    "items": []
  },
  "meta": {}
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`

Source of truth:

- `OrderController::show()`

#### POST `/api/mobile/v1/orders/{id}/cancel`

- Purpose: request order-level cancellation for all eligible lines
- Auth: yes

Request:

```json
{
  "reason": "Created by mistake"
}
```

Response:

```json
{
  "data": {},
  "meta": {
    "message": "Cancellation requested."
  }
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`
- `409 order_action_not_allowed`

Source of truth:

- `OrderController::cancel()`
- `OrderLineStateService::cancelOrder()`

#### POST `/api/mobile/v1/orders/{id}/refund`

- Purpose: request order-level refund for all eligible lines
- Auth: yes

Request:

```json
{
  "reason": "Item arrived damaged"
}
```

Response:

```json
{
  "data": {},
  "meta": {
    "message": "Refund requested."
  }
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`
- `409 order_action_not_allowed`

Source of truth:

- `OrderController::refund()`
- `OrderLineStateService::requestRefundForOrder()`

#### POST `/api/mobile/v1/orders/{id}/items/{itemId}/cancel`

- Purpose: request cancellation for one eligible line
- Auth: yes

Request:

```json
{
  "reason": "Created by mistake"
}
```

Response:

```json
{
  "data": {},
  "meta": {
    "message": "Line cancellation requested."
  }
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`
- `409 order_action_not_allowed`

Source of truth:

- `OrderController::cancelItem()`
- `OrderLineStateService::cancelItem()`

#### POST `/api/mobile/v1/orders/{id}/items/{itemId}/refund`

- Purpose: request refund for one eligible line
- Auth: yes

Request:

```json
{
  "reason": "Item arrived damaged"
}
```

Response:

```json
{
  "data": {},
  "meta": {
    "message": "Line refund requested."
  }
}
```

Errors:

- `401 unauthenticated`
- `404 not_found`
- `409 order_action_not_allowed`

Source of truth:

- `OrderController::refundItem()`
- `OrderLineStateService::requestRefund()`

## 7. Required backend behavior notes

### 7.1 Locale behavior

- Mobile requests must be locale-aware through `Accept-Language`.
- Mobile API must not depend on `POST /locale`.
- Reuse backend translation files and category localization helpers.

### 7.2 Cart behavior

- The dedicated cart abstraction already exists through `ShoppingCartService` and `cart_items`.
- Guest web cart still uses session.
- Authenticated cart behavior supports:
  - read and write authenticated cart state
  - merge local mobile snapshot after login
  - validate product existence and stock
  - expose a quote-ready summary

### 7.3 Checkout behavior

- Reuse current Stripe and PayPal provider logic.
- Keep quote and shipping logic centralized in the shared mobile checkout service instead of duplicating controller-only behavior.
- Keep `address_id` ownership validation.
- Persist the final order only after provider verification.

### 7.4 Orders and state machine

- Mobile must use the same status semantics as the current web order area:
  - `pagado`
  - `pendiente_envio`
  - `enviado`
  - `entregado`
  - `confirmado`
  - `cancelacion_pendiente`
  - `cancelado`
  - `devolucion_solicitada`
  - `devolucion_aprobada`
  - `devolucion_rechazada`
  - `reembolsado`
  - `parcialmente_cancelado`
  - `parcialmente_reembolsado`
- Do not invent simplified mobile-only statuses.

## 8. QA checklist for contract compliance

The implementation of this API should be considered aligned only if:

1. Mobile auth returns the same user shape across register, login, social login, and `GET /me`.
2. Address payloads match the structured web contract exactly.
3. Product list and product detail use localized category names and `EUR`.
4. Order endpoints expose the same line state semantics as the current web UI.
5. Mobile API does not recreate the old `placeOrder` shortcut.
6. Payment success always flows through backend verification before order creation.
7. The authenticated cart can be shared between web and app.
8. The deep link flow after hosted payment is deterministic and provider-agnostic.

## 9. Validation already available in the repo

- Route verification:
  - `php artisan route:list --path=api/mobile/v1`
- Feature test:
  - `php artisan test --filter=MobileApiV1Test`
- Sandbox smoke command:
  - `php artisan mobile:checkout-sandbox-smoke`
  - requires configured `STRIPE_*` and/or `PAYPAL_*`
