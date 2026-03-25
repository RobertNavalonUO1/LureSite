<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AdminMiddlewareTest extends TestCase
{
    use RefreshDatabase;

    /** @test */
    public function admin_can_access_admin_routes()
    {
        $admin = User::factory()->create(['is_admin' => 1]);
        $response = $this->actingAs($admin)->get('/admin/debug');
        $response->assertStatus(200);
        $response->assertJson(['ok' => true]);
    }

    /** @test */
    public function non_admin_cannot_access_admin_routes()
    {
        $user = User::factory()->create(['is_admin' => 0]);
        $response = $this->actingAs($user)->get('/admin/debug');
        $response->assertStatus(403);
    }

    /** @test */
    public function guest_cannot_access_admin_routes()
    {
        $response = $this->get('/admin/debug');
        $response->assertRedirect('/login');
    }
}