<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderAuthorizationTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_cannot_view_another_users_order(): void
    {
        $owner = User::factory()->create();
        $intruder = User::factory()->create();

        $order = Order::create([
            'user_id' => $owner->id,
            'name' => $owner->name,
            'email' => $owner->email,
            'total' => 149.99,
            'status' => 'pagado',
            'address' => 'Calle Falsa 123',
            'payment_method' => 'stripe',
            'transaction_id' => 'txn_test_owner',
        ]);

        $this->actingAs($intruder)
            ->get("/orders/{$order->id}")
            ->assertNotFound();
    }
}
