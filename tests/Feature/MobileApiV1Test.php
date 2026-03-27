<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\PaymentAttempt;
use App\Models\Order;
use App\Models\Review;
use App\Models\User;
use App\Mail\OrderConfirmationMail;
use App\Services\Mobile\MobileCheckoutService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Laravel\Sanctum\Sanctum;
use Mockery;
use Tests\TestCase;

class MobileApiV1Test extends TestCase
{
    use RefreshDatabase;

    public function test_mobile_register_returns_envelope_token_and_merges_guest_cart(): void
    {
        $category = $this->createCategory();
        $product = $this->createProduct($category, [
            'name' => 'Travel Bottle',
            'price' => 15.00,
            'stock' => 12,
        ]);

        $response = $this->postJson('/api/mobile/v1/auth/register', [
            'name' => 'Mobile',
            'lastname' => 'User',
            'email' => 'mobile@example.test',
            'password' => 'secret123',
            'password_confirmation' => 'secret123',
            'device_name' => 'pixel-android',
            'cart' => [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 2,
                    ],
                ],
            ],
        ]);

        $response
            ->assertCreated()
            ->assertJsonPath('data.user.email', 'mobile@example.test')
            ->assertJsonPath('meta.message', 'Account created.')
            ->assertJsonPath('meta.merge_warnings', []);

        $this->assertNotEmpty($response->json('data.token'));
        $this->assertDatabaseHas('users', [
            'email' => 'mobile@example.test',
        ]);
        $this->assertDatabaseHas('cart_items', [
            'product_id' => $product->id,
            'quantity' => 2,
        ]);
    }

    public function test_mobile_me_uses_accept_language_header_and_returns_content_language(): void
    {
        $user = User::factory()->create([
            'name' => 'Locale User',
            'email' => 'locale@example.test',
        ]);

        Sanctum::actingAs($user);

        $this->withHeaders([
            'Accept-Language' => 'fr-FR,fr;q=0.9,en;q=0.8',
        ])->getJson('/api/mobile/v1/me')
            ->assertOk()
            ->assertHeader('Content-Language', 'fr')
            ->assertJsonPath('data.email', 'locale@example.test');
    }

    public function test_mobile_addresses_crud_and_default_switch_work(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $created = $this->postJson('/api/mobile/v1/addresses', [
            'street' => 'Main Street 1',
            'city' => 'Madrid',
            'province' => 'Madrid',
            'zip_code' => '28001',
            'country' => 'Spain',
            'make_default' => true,
        ]);

        $created
            ->assertCreated()
            ->assertJsonPath('data.street', 'Main Street 1')
            ->assertJsonPath('meta.default_address_id', 1);

        $second = $this->postJson('/api/mobile/v1/addresses', [
            'street' => 'Second Street 2',
            'city' => 'Barcelona',
            'province' => 'Barcelona',
            'zip_code' => '08001',
            'country' => 'Spain',
        ]);

        $secondId = $second->json('data.id');

        $this->getJson('/api/mobile/v1/addresses')
            ->assertOk()
            ->assertJsonCount(2, 'data')
            ->assertJsonPath('meta.default_address_id', 1);

        $this->patchJson("/api/mobile/v1/addresses/{$secondId}", [
            'street' => 'Updated Street 9',
            'city' => 'Barcelona',
            'province' => 'Barcelona',
            'zip_code' => '08001',
            'country' => 'Spain',
            'make_default' => true,
        ])
            ->assertOk()
            ->assertJsonPath('data.street', 'Updated Street 9')
            ->assertJsonPath('meta.default_address_id', $secondId);

        $this->patchJson("/api/mobile/v1/addresses/{$created->json('data.id')}/default")
            ->assertOk()
            ->assertJsonPath('meta.default_address_id', $created->json('data.id'));

        $this->deleteJson("/api/mobile/v1/addresses/{$secondId}")
            ->assertOk()
            ->assertJsonPath('meta.message', 'Address deleted.');

        $this->assertDatabaseMissing('addresses', [
            'id' => $secondId,
        ]);
    }

    public function test_mobile_cart_replace_add_update_and_delete_work(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $category = $this->createCategory();
        $productA = $this->createProduct($category, [
            'name' => 'Bottle',
            'price' => 10.00,
            'stock' => 20,
        ]);
        $productB = $this->createProduct($category, [
            'name' => 'Cap',
            'price' => 5.00,
            'stock' => 20,
        ]);

        $this->putJson('/api/mobile/v1/cart', [
            'items' => [
                ['product_id' => $productA->id, 'quantity' => 2],
            ],
        ])
            ->assertOk()
            ->assertJsonPath('data.items_count', 2)
            ->assertJsonPath('data.total', 20)
            ->assertJsonPath('meta.merge_strategy', 'sum_by_product');

        $this->postJson('/api/mobile/v1/cart/items', [
            'product_id' => $productB->id,
            'quantity' => 3,
        ])
            ->assertOk()
            ->assertJsonPath('data.items_count', 5)
            ->assertJsonPath('data.total', 35);

        $this->patchJson("/api/mobile/v1/cart/items/{$productA->id}", [
            'quantity' => 4,
        ])
            ->assertOk()
            ->assertJsonPath('data.items_count', 7)
            ->assertJsonPath('data.total', 55);

        $this->deleteJson("/api/mobile/v1/cart/items/{$productB->id}")
            ->assertOk()
            ->assertJsonPath('data.items_count', 4)
            ->assertJsonPath('data.total', 40);

        $this->assertDatabaseHas('cart_items', [
            'user_id' => $user->id,
            'product_id' => $productA->id,
            'quantity' => 4,
        ]);
        $this->assertDatabaseMissing('cart_items', [
            'user_id' => $user->id,
            'product_id' => $productB->id,
        ]);
    }

    public function test_mobile_checkout_quote_returns_expected_totals(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $category = $this->createCategory([
            'slug' => 'wellness',
        ]);
        $product = $this->createProduct($category, [
            'name' => 'Wellness Kit',
            'price' => 20.00,
            'stock' => 10,
            'is_fast_shipping' => true,
        ]);
        $address = $this->createAddress($user);

        Coupon::create([
            'code' => 'SAVE10',
            'description' => 'Ten percent off',
            'discount' => 10,
            'type' => 'percent',
            'min_subtotal' => 0,
            'is_active' => true,
            'used_count' => 0,
        ]);

        $this->postJson('/api/mobile/v1/checkout/quote', [
            'cart' => [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 2,
                    ],
                ],
            ],
            'address_id' => $address->id,
            'coupon_code' => 'SAVE10',
            'shipping_method' => 'standard',
        ])
            ->assertOk()
            ->assertJsonPath('data.currency', 'EUR')
            ->assertJsonPath('data.items_count', 2)
            ->assertJsonPath('data.subtotal', 40)
            ->assertJsonPath('data.discount', 4)
            ->assertJsonPath('data.shipping', 4.99)
            ->assertJsonPath('data.total', 40.99)
            ->assertJsonPath('data.coupon.code', 'SAVE10')
            ->assertJsonPath('data.shipping_method.value', 'standard')
            ->assertJsonCount(3, 'data.shipping_options');
    }

    public function test_mobile_checkout_payment_session_accepts_app_deep_links(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $category = $this->createCategory([
            'slug' => 'mobile-payments',
        ]);
        $product = $this->createProduct($category, [
            'name' => 'Checkout Test Product',
            'price' => 24.99,
            'stock' => 10,
        ]);
        $address = $this->createAddress($user);

        $service = Mockery::mock(MobileCheckoutService::class);
        $service->shouldReceive('createPaymentSession')
            ->once()
            ->withArgs(function (
                User $resolvedUser,
                array $items,
                int $resolvedAddressId,
                ?string $couponCode,
                string $shippingMethod,
                string $provider,
                array $mobileReturn
            ) use ($user, $product, $address) {
                return $resolvedUser->is($user)
                    && $items === [[
                        'product_id' => $product->id,
                        'quantity' => 1,
                    ]]
                    && $resolvedAddressId === $address->id
                    && $couponCode === null
                    && $shippingMethod === 'standard'
                    && $provider === 'stripe'
                    && $mobileReturn['success_url'] === 'limoneo://checkout/complete'
                    && $mobileReturn['cancel_url'] === 'limoneo://checkout/cancel'
                    && $mobileReturn['fallback_success_url'] === 'https://limoneo.com/app/checkout/complete'
                    && $mobileReturn['fallback_cancel_url'] === 'https://limoneo.com/app/checkout/cancel';
            })
            ->andReturn([
                'payment_session' => [
                    'provider' => 'stripe',
                    'checkout_url' => 'https://checkout.example.test/session/abc123',
                    'checkout_context_id' => 'ctx_123',
                    'expires_at' => '2026-03-26T12:00:00+00:00',
                ],
                'quote' => [
                    'currency' => 'EUR',
                    'items_count' => 1,
                    'subtotal' => 24.99,
                    'discount' => 0,
                    'shipping' => 4.99,
                    'total' => 29.98,
                ],
            ]);
        $this->app->instance(MobileCheckoutService::class, $service);

        $this->postJson('/api/mobile/v1/checkout/payments/stripe/session', [
            'cart' => [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 1,
                    ],
                ],
            ],
            'address_id' => $address->id,
            'shipping_method' => 'standard',
            'mobile_return' => [
                'success_url' => 'limoneo://checkout/complete',
                'cancel_url' => 'limoneo://checkout/cancel',
                'fallback_success_url' => 'https://limoneo.com/app/checkout/complete',
                'fallback_cancel_url' => 'https://limoneo.com/app/checkout/cancel',
            ],
        ])
            ->assertCreated()
            ->assertJsonPath('data.payment_session.provider', 'stripe')
            ->assertJsonPath('data.payment_session.checkout_context_id', 'ctx_123')
            ->assertJsonPath('meta.message', 'Payment session created.');
    }

    public function test_mobile_checkout_payment_session_rejects_invalid_mobile_return_urls(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $category = $this->createCategory([
            'slug' => 'mobile-payments-invalid',
        ]);
        $product = $this->createProduct($category, [
            'name' => 'Broken Checkout Product',
            'price' => 19.99,
            'stock' => 10,
        ]);
        $address = $this->createAddress($user);

        $this->postJson('/api/mobile/v1/checkout/payments/paypal/session', [
            'cart' => [
                'items' => [
                    [
                        'product_id' => $product->id,
                        'quantity' => 1,
                    ],
                ],
            ],
            'address_id' => $address->id,
            'shipping_method' => 'standard',
            'mobile_return' => [
                'success_url' => 'checkout/complete',
                'cancel_url' => 'not a url',
                'fallback_success_url' => 'https://limoneo.com/app/checkout/complete',
                'fallback_cancel_url' => 'https://limoneo.com/app/checkout/cancel',
            ],
        ])
            ->assertUnprocessable()
            ->assertJsonValidationErrors([
                'mobile_return.success_url',
                'mobile_return.cancel_url',
            ]);
    }

    public function test_mobile_checkout_payment_status_returns_succeeded_order_for_owner(): void
    {
        $user = User::factory()->create();
        Sanctum::actingAs($user);

        $address = $this->createAddress($user);
        $order = Order::create([
            'user_id' => $user->id,
            'name' => 'Mobile User',
            'email' => $user->email,
            'total' => 29.98,
            'status' => 'pagado',
            'address' => 'Market Street 10, Valencia, Valencia, 46001, Spain',
            'payment_method' => 'stripe',
            'transaction_id' => 'cs_test_status',
            'payment_reference_id' => 'pi_test_status',
        ]);

        $attempt = PaymentAttempt::create([
            'context_id' => 'chk_ctx_status_123',
            'user_id' => $user->id,
            'address_id' => $address->id,
            'order_id' => $order->id,
            'provider' => 'stripe',
            'channel' => 'mobile',
            'status' => 'succeeded',
            'currency' => 'EUR',
            'amount' => 29.98,
            'cart_snapshot' => [1 => 1],
            'quote_snapshot' => ['total' => 29.98],
            'mobile_return' => ['success_url' => 'limoneo://checkout/complete'],
            'provider_checkout_id' => 'cs_test_status',
            'payment_reference_id' => 'pi_test_status',
        ]);

        $this->getJson("/api/mobile/v1/checkout/payments/{$attempt->context_id}/status")
            ->assertOk()
            ->assertJsonPath('data.checkout_context_id', 'chk_ctx_status_123')
            ->assertJsonPath('data.status', 'succeeded')
            ->assertJsonPath('data.order_id', $order->id)
            ->assertJsonPath('data.provider', 'stripe');
    }

    public function test_mobile_checkout_return_redirects_existing_order_without_creating_duplicate_order(): void
    {
        $user = User::factory()->create();
        $address = $this->createAddress($user);
        $order = Order::create([
            'user_id' => $user->id,
            'name' => 'Mobile User',
            'email' => $user->email,
            'total' => 29.98,
            'status' => 'pagado',
            'address' => 'Market Street 10, Valencia, Valencia, 46001, Spain',
            'payment_method' => 'stripe',
            'transaction_id' => 'cs_test_return',
            'payment_reference_id' => 'pi_test_return',
        ]);

        PaymentAttempt::create([
            'context_id' => 'chk_ctx_return_123',
            'user_id' => $user->id,
            'address_id' => $address->id,
            'order_id' => $order->id,
            'provider' => 'stripe',
            'channel' => 'mobile',
            'status' => 'succeeded',
            'currency' => 'EUR',
            'amount' => 29.98,
            'cart_snapshot' => [1 => 1],
            'quote_snapshot' => ['total' => 29.98],
            'mobile_return' => ['success_url' => 'limoneo://checkout/complete'],
            'provider_checkout_id' => 'cs_test_return',
            'payment_reference_id' => 'pi_test_return',
        ]);

        $response = $this->get('/api/mobile/v1/checkout/payments/stripe/return?context=chk_ctx_return_123&session_id=cs_test_return');

        $response->assertRedirect('limoneo://checkout/complete?status=success&order_id=' . $order->id . '&provider=stripe&checkout_context_id=chk_ctx_return_123');
        $this->assertDatabaseCount('orders', 1);
    }

    public function test_stripe_webhook_finalizes_payment_attempt_only_once(): void
    {
        Mail::fake();
        config()->set('services.stripe.webhook_secret', 'whsec_test_mobile');

        $user = User::factory()->create();
        $category = $this->createCategory(['slug' => 'webhook-checkout']);
        $product = $this->createProduct($category, [
            'name' => 'Webhook Product',
            'price' => 24.99,
            'stock' => 10,
        ]);
        $address = $this->createAddress($user);

        PaymentAttempt::create([
            'context_id' => 'chk_ctx_webhook_123',
            'user_id' => $user->id,
            'address_id' => $address->id,
            'provider' => 'stripe',
            'channel' => 'mobile',
            'status' => 'pending_user_action',
            'currency' => 'EUR',
            'amount' => 29.98,
            'cart_snapshot' => [$product->id => 1],
            'quote_snapshot' => [
                'currency' => 'EUR',
                'items_count' => 1,
                'subtotal' => 24.99,
                'discount' => 0.0,
                'shipping' => 4.99,
                'total' => 29.98,
                'coupon' => null,
                'shipping_method' => [
                    'value' => 'standard',
                    'label' => 'Envio estandar',
                    'description' => 'Gratis en pedidos superiores a 50 EUR',
                    'eta' => '3-5 dias habiles',
                    'cost' => 4.99,
                    'badge' => 'Popular',
                ],
                'items' => [[
                    'product_id' => $product->id,
                    'quantity' => 1,
                    'unit_price' => 24.99,
                ]],
                'warnings' => [],
            ],
            'mobile_return' => ['success_url' => 'limoneo://checkout/complete'],
            'provider_checkout_id' => 'cs_test_webhook',
        ]);

        $payload = [
            'id' => 'evt_test_webhook',
            'type' => 'checkout.session.completed',
            'data' => [
                'object' => [
                    'id' => 'cs_test_webhook',
                    'object' => 'checkout.session',
                    'payment_status' => 'paid',
                    'client_reference_id' => 'chk_ctx_webhook_123',
                    'payment_intent' => 'pi_test_webhook',
                    'metadata' => [
                        'context_id' => 'chk_ctx_webhook_123',
                    ],
                ],
            ],
        ];

        $this->postStripeWebhook($payload, 'whsec_test_mobile')->assertOk();
        $this->postStripeWebhook($payload, 'whsec_test_mobile')->assertOk();

        $order = Order::query()->firstOrFail();

        $this->assertDatabaseCount('orders', 1);
        $this->assertDatabaseHas('orders', [
            'payment_method' => 'stripe',
            'transaction_id' => 'cs_test_webhook',
            'payment_reference_id' => 'pi_test_webhook',
        ]);
        $this->assertDatabaseHas('payment_attempts', [
            'context_id' => 'chk_ctx_webhook_123',
            'status' => 'succeeded',
            'order_id' => $order->id,
        ]);
        Mail::assertSent(OrderConfirmationMail::class, 1);
    }

    public function test_mobile_products_supports_rating_sort_when_products_table_has_average_rating_column(): void
    {
        $category = $this->createCategory([
            'slug' => 'featured-accessories',
        ]);

        $higherRated = $this->createProduct($category, [
            'name' => 'Higher Rated',
            'average_rating' => 1.2,
            'created_at' => now()->subDay(),
        ]);
        $lowerRated = $this->createProduct($category, [
            'name' => 'Lower Rated',
            'average_rating' => 4.8,
            'created_at' => now(),
            'image_url' => 'https://cdn.example.test/lower-rated.png',
        ]);

        Review::create([
            'product_id' => $higherRated->id,
            'author' => 'Alice',
            'rating' => 5,
            'comment' => 'Great',
        ]);
        Review::create([
            'product_id' => $higherRated->id,
            'author' => 'Bob',
            'rating' => 4,
            'comment' => 'Solid',
        ]);
        Review::create([
            'product_id' => $lowerRated->id,
            'author' => 'Charlie',
            'rating' => 2,
            'comment' => 'Okay',
        ]);

        $this->getJson('/api/mobile/v1/products?sort=rating')
            ->assertOk()
            ->assertJsonPath('data.0.id', $higherRated->id)
            ->assertJsonPath('data.0.average_rating', 4.5)
            ->assertJsonPath('data.0.reviews_count', 2)
            ->assertJsonPath('data.1.id', $lowerRated->id)
            ->assertJsonPath('data.1.image_url_full', 'https://cdn.example.test/lower-rated.png')
            ->assertJsonPath('data.1.average_rating', 2)
            ->assertJsonPath('meta.filters.sort', 'rating');
    }

    private function createCategory(array $overrides = []): Category
    {
        return Category::create(array_merge([
            'name' => 'Accessories',
            'slug' => 'accessories',
            'description' => 'Accessories category',
        ], $overrides));
    }

    private function createProduct(Category $category, array $overrides = []): Product
    {
        $product = new Product();
        $product->forceFill(array_merge([
            'name' => 'Sample Product',
            'description' => 'Sample product description',
            'price' => 12.50,
            'image_url' => '/images/sample.jpg',
            'stock' => 5,
            'category_id' => $category->id,
            'is_adult' => false,
            'link' => null,
            'is_featured' => false,
            'is_superdeal' => false,
            'is_fast_shipping' => false,
            'is_new_arrival' => false,
            'is_seasonal' => false,
            'discount' => 0,
            'average_rating' => 0,
        ], $overrides));
        $product->save();

        return $product->fresh();
    }

    private function createAddress(User $user, array $overrides = []): Address
    {
        $address = Address::create(array_merge([
            'user_id' => $user->id,
            'street' => 'Market Street 10',
            'city' => 'Valencia',
            'province' => 'Valencia',
            'zip_code' => '46001',
            'country' => 'Spain',
        ], $overrides));

        $user->forceFill([
            'default_address_id' => $address->id,
        ])->save();

        return $address;
    }

    private function postStripeWebhook(array $payload, string $secret)
    {
        $rawPayload = json_encode($payload, JSON_THROW_ON_ERROR);
        $timestamp = time();
        $signature = hash_hmac('sha256', $timestamp . '.' . $rawPayload, $secret);

        return $this->call(
            'POST',
            '/api/payments/webhooks/stripe',
            [],
            [],
            [],
            [
                'CONTENT_TYPE' => 'application/json',
                'HTTP_Stripe-Signature' => 't=' . $timestamp . ',v1=' . $signature,
            ],
            $rawPayload,
        );
    }
}
