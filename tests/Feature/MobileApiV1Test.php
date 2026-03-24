<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Category;
use App\Models\Coupon;
use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Sanctum\Sanctum;
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
}
