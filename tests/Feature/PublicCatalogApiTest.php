<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicCatalogApiTest extends TestCase
{
    use RefreshDatabase;

    public function test_new_arrivals_endpoint_returns_only_flagged_products_with_complete_payload(): void
    {
        $category = Category::create([
            'name' => 'Accesorios',
            'slug' => 'accesorios',
            'description' => 'Categoria de accesorios',
        ]);

        $included = Product::create([
            'name' => 'Bolso urbano',
            'description' => 'Bolso compacto para uso diario.',
            'price' => 49.90,
            'image_url' => '/images/bolso.jpg',
            'stock' => 8,
            'category_id' => $category->id,
            'is_new_arrival' => true,
            'discount' => 15,
        ]);

        Product::create([
            'name' => 'Producto antiguo',
            'description' => 'No debe aparecer.',
            'price' => 10,
            'image_url' => '/images/old.jpg',
            'stock' => 5,
            'category_id' => $category->id,
            'is_new_arrival' => false,
        ]);

        $this->getJson('/api/new-arrivals')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $included->id)
            ->assertJsonPath('0.badge', 'Nuevo')
            ->assertJsonPath('0.category.name', 'Accesorios')
            ->assertJsonPath('0.old_price', 58.71)
            ->assertJsonPath('0.link', route('product.details', $included->id));
    }

    public function test_seasonal_endpoint_returns_only_seasonal_products(): void
    {
        $category = Category::create([
            'name' => 'Hogar',
            'slug' => 'hogar',
            'description' => 'Categoria hogar',
        ]);

        $included = Product::create([
            'name' => 'Lampara ambiental',
            'description' => 'Luz calida para ambientes.',
            'price' => 79.00,
            'image_url' => '/images/lamp.jpg',
            'stock' => 4,
            'category_id' => $category->id,
            'is_seasonal' => true,
        ]);

        Product::create([
            'name' => 'Producto base',
            'description' => 'No debe aparecer.',
            'price' => 12,
            'image_url' => '/images/base.jpg',
            'stock' => 3,
            'category_id' => $category->id,
            'is_seasonal' => false,
        ]);

        $this->getJson('/api/seasonal-products')
            ->assertOk()
            ->assertJsonCount(1)
            ->assertJsonPath('0.id', $included->id)
            ->assertJsonPath('0.badge', 'Temporada actual')
            ->assertJsonPath('0.season', 'Temporada actual');
    }

    public function test_deals_endpoint_exposes_pricing_fields_used_by_frontend(): void
    {
        $category = Category::create([
            'name' => 'Tecnologia',
            'slug' => 'tecnologia',
            'description' => 'Categoria tecnologia',
        ]);

        $product = Product::create([
            'name' => 'Auriculares ANC',
            'description' => 'Cancelacion de ruido y autonomia extendida.',
            'price' => 120.00,
            'image_url' => '/images/headphones.jpg',
            'stock' => 11,
            'category_id' => $category->id,
            'is_featured' => true,
            'discount' => 20,
        ]);

        $this->getJson('/api/deals-today')
            ->assertOk()
            ->assertJsonPath('0.id', $product->id)
            ->assertJsonPath('0.price', 120)
            ->assertJsonPath('0.old_price', 150)
            ->assertJsonPath('0.category.name', 'Tecnologia')
            ->assertJsonPath('0.badge', 'Oferta del dia');
    }
}