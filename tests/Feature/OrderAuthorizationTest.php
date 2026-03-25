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

    public function test_user_can_view_shipping_coupon_and_payment_metadata_on_order_detail(): void
    {
        $user = User::factory()->create();

        $order = Order::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'total' => 149.99,
            'status' => 'pagado',
            'address' => 'Calle Falsa 123',
            'shipping_method' => 'express',
            'shipping_label' => 'Envío exprés',
            'shipping_description' => 'Entrega prioritaria en 48h',
            'shipping_eta' => '1-2 días hábiles',
            'shipping_cost' => 9.99,
            'coupon_code' => 'WELCOME10',
            'discount' => 10.00,
            'payment_method' => 'paypal',
            'transaction_id' => 'txn_test_owner',
        ]);

        $this->actingAs($user)
            ->get("/orders/{$order->id}")
            ->assertOk()
            ->assertSee('Env\u00edo expr\u00e9s', false)
            ->assertSee('&quot;coupon_code&quot;:&quot;WELCOME10&quot;', false)
            ->assertSee('&quot;payment_method&quot;:&quot;paypal&quot;', false);
    }
}
