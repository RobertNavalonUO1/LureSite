<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use App\Models\TemporaryProduct;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminProductManagerTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_admin_product_manager_api(): void
    {
        $this->get('/api/admin/products')->assertRedirect('/login');
        $this->post('/api/admin/products', [])->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_admin_product_manager_api(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $this->actingAs($user)->get('/api/admin/products')->assertStatus(403);
        $this->actingAs($user)->post('/api/admin/products', [])->assertStatus(403);
    }

    public function test_admin_can_list_products_and_receive_dashboard_stats(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $category = Category::create([
            'name' => 'Accesorios',
            'slug' => 'accesorios',
        ]);

        Product::create([
            'name' => 'Producto alfa',
            'description' => 'Catalogo principal',
            'price' => 19.95,
            'stock' => 8,
            'category_id' => $category->id,
            'link' => 'https://example.com/a',
        ]);

        TemporaryProduct::create([
            'title' => 'Temporal uno',
            'price' => 9.99,
            'image_url' => 'https://example.com/temp.jpg',
        ]);

        $this->actingAs($admin)
            ->getJson('/api/admin/products?search=alfa')
            ->assertOk()
            ->assertJsonPath('products.data.0.name', 'Producto alfa')
            ->assertJsonPath('stats.active_products', 1)
            ->assertJsonPath('stats.temporary_products', 1)
            ->assertJsonPath('stats.categories', 1)
            ->assertJsonPath('stats.imported_links', 2);
    }

    public function test_admin_can_create_update_and_delete_product_from_api(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $category = Category::create([
            'name' => 'Ropa',
            'slug' => 'ropa',
        ]);

        $createResponse = $this->actingAs($admin)->postJson('/api/admin/products', [
            'name' => 'Producto nuevo',
            'description' => 'Alta desde el panel',
            'price' => 24.5,
            'image_url' => 'https://example.com/image.jpg',
            'stock' => 15,
            'category_id' => $category->id,
            'is_adult' => false,
            'link' => 'https://example.com/producto-nuevo',
            'discount' => 10,
            'commercial_state' => 'featured',
        ])->assertCreated();

        $productId = $createResponse->json('product.id');

        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'name' => 'Producto nuevo',
            'is_featured' => true,
        ]);

        $this->actingAs($admin)->putJson("/api/admin/products/{$productId}", [
            'name' => 'Producto editado',
            'price' => 29.99,
            'stock' => 20,
            'category_id' => $category->id,
            'commercial_state' => 'seasonal',
        ])
            ->assertOk()
            ->assertJsonPath('product.name', 'Producto editado')
            ->assertJsonPath('product.commercial_state', 'seasonal');

        $this->assertDatabaseHas('products', [
            'id' => $productId,
            'name' => 'Producto editado',
            'is_featured' => false,
            'is_seasonal' => true,
        ]);

        $this->actingAs($admin)
            ->deleteJson("/api/admin/products/{$productId}")
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('products', [
            'id' => $productId,
        ]);
    }

    public function test_admin_can_apply_bulk_updates_and_bulk_delete(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $categoryA = Category::create([
            'name' => 'Categoria A',
            'slug' => 'categoria-a',
        ]);
        $categoryB = Category::create([
            'name' => 'Categoria B',
            'slug' => 'categoria-b',
        ]);

        $first = Product::create([
            'name' => 'Producto 1',
            'price' => 10,
            'stock' => 5,
            'category_id' => $categoryA->id,
        ]);
        $second = Product::create([
            'name' => 'Producto 2',
            'price' => 20,
            'stock' => 6,
            'category_id' => $categoryA->id,
        ]);

        $this->actingAs($admin)
            ->postJson('/api/admin/products/bulk-update', [
                'ids' => [$first->id, $second->id],
                'category_id' => $categoryB->id,
                'commercial_state' => 'superdeal',
                'price_action' => 'delta_percent',
                'price_value' => 10,
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseHas('products', [
            'id' => $first->id,
            'category_id' => $categoryB->id,
            'is_superdeal' => true,
            'price' => 11.00,
        ]);

        $this->assertDatabaseHas('products', [
            'id' => $second->id,
            'category_id' => $categoryB->id,
            'is_superdeal' => true,
            'price' => 22.00,
        ]);

        $this->actingAs($admin)
            ->postJson('/api/admin/products/bulk-delete', [
                'ids' => [$first->id, $second->id],
            ])
            ->assertOk()
            ->assertJsonPath('success', true);

        $this->assertDatabaseMissing('products', ['id' => $first->id]);
        $this->assertDatabaseMissing('products', ['id' => $second->id]);
    }
}