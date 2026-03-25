<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class RouteSecurityTest extends TestCase
{
    use RefreshDatabase;

    public function test_guest_cannot_access_internal_product_management_routes(): void
    {
        $protectedGetRoutes = [
            '/products/add',
            '/select-products',
            '/migrate-products',
        ];

        foreach ($protectedGetRoutes as $route) {
            $this->get($route)->assertRedirect('/login');
        }

        $this->post('/products/store', [])->assertRedirect('/login');
        $this->post('/migrate-selected-products', [])->assertRedirect('/login');
        $this->post('/add-temporary-product', [])->assertRedirect('/login');
        $this->post('/migrate-products/bulk', [])->assertRedirect('/login');
    }

    public function test_non_admin_cannot_access_internal_product_management_routes(): void
    {
        $user = User::factory()->create(['is_admin' => false]);

        $protectedRoutes = [
            ['GET', '/products/add'],
            ['GET', '/select-products'],
            ['GET', '/migrate-products'],
            ['POST', '/products/store'],
            ['POST', '/migrate-selected-products'],
            ['POST', '/add-temporary-product'],
            ['POST', '/migrate-products/bulk'],
        ];

        foreach ($protectedRoutes as [$method, $route]) {
            $this->actingAs($user)->{$method === 'GET' ? 'get' : 'post'}($route, [])->assertStatus(403);
        }
    }

    public function test_reviews_require_authentication_for_creation(): void
    {
        $this->post('/products/1/reviews', [
            'rating' => 5,
            'comment' => 'Excelente',
        ])->assertRedirect('/login');
    }
}
