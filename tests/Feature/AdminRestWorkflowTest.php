<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\User;
use App\Services\OrderRefundService;
use App\Services\RefundResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery\MockInterface;
use Tests\TestCase;

class AdminRestWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_admin_can_delete_a_category_using_delete_route(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $category = Category::create([
            'name' => 'Temporal',
            'slug' => 'temporal',
            'description' => 'Categoria temporal',
        ]);

        $this->actingAs($admin)
            ->delete("/admin/categories/{$category->id}")
            ->assertRedirect();

        $this->assertDatabaseMissing('categories', [
            'id' => $category->id,
        ]);
    }

    public function test_admin_can_approve_and_refund_a_return_request(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();

        $order = Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 89.50,
            'status' => 'devolucion_solicitada',
            'address' => 'Calle Luna 12',
            'payment_method' => 'stripe',
            'transaction_id' => 'txn_return_flow',
            'payment_reference_id' => 'pi_return_flow',
        ]);

        $this->mock(OrderRefundService::class, function (MockInterface $mock) use ($order) {
            $mock->shouldReceive('refund')
                ->once()
                ->withArgs(fn (Order $refundedOrder) => $refundedOrder->is($order))
                ->andReturn(new RefundResult('re_12345', 'succeeded'));
        });

        $this->actingAs($admin)
            ->patch("/admin/orders/{$order->id}/approve-return")
            ->assertRedirect();

        $this->assertSame('devolucion_aprobada', $order->fresh()->status);

        $this->actingAs($admin)
            ->patch("/admin/orders/{$order->id}/refund")
            ->assertRedirect();

        $order->refresh();

        $this->assertSame('reembolsado', $order->status);
        $this->assertSame('admin', $order->cancelled_by);
        $this->assertNotNull($order->cancelled_at);
        $this->assertNotNull($order->refunded_at);
        $this->assertSame('re_12345', $order->refund_reference_id);
        $this->assertNull($order->refund_error);
    }

    public function test_admin_can_reject_a_return_request(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();

        $order = Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 45.00,
            'status' => 'devolucion_solicitada',
            'address' => 'Avenida Sol 8',
            'payment_method' => 'paypal',
            'transaction_id' => 'txn_reject_return',
        ]);

        $this->actingAs($admin)
            ->patch("/admin/orders/{$order->id}/reject-return")
            ->assertRedirect();

        $this->assertSame('devolucion_rechazada', $order->fresh()->status);
    }

    public function test_admin_keeps_order_approved_when_provider_refund_fails(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();

        $order = Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 67.30,
            'status' => 'devolucion_aprobada',
            'address' => 'Paseo Mar 4',
            'payment_method' => 'paypal',
            'transaction_id' => 'ORDER-PAYPAL-1',
            'payment_reference_id' => 'CAPTURE-PAYPAL-1',
        ]);

        $this->mock(OrderRefundService::class, function (MockInterface $mock) use ($order) {
            $mock->shouldReceive('refund')
                ->once()
                ->withArgs(fn (Order $refundedOrder) => $refundedOrder->is($order))
                ->andThrow(new \RuntimeException('Proveedor temporalmente no disponible.'));
        });

        $this->actingAs($admin)
            ->patch("/admin/orders/{$order->id}/refund")
            ->assertRedirect()
            ->assertSessionHas('error');

        $order->refresh();

        $this->assertSame('devolucion_aprobada', $order->status);
        $this->assertNull($order->refund_reference_id);
        $this->assertNull($order->refunded_at);
        $this->assertSame('Proveedor temporalmente no disponible.', $order->refund_error);
    }

    public function test_admin_does_not_call_provider_twice_when_refund_is_already_registered(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();

        $order = Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 23.10,
            'status' => 'devolucion_aprobada',
            'address' => 'Calle Norte 11',
            'payment_method' => 'stripe',
            'transaction_id' => 'txn-repeat-refund',
            'payment_reference_id' => 'pi-repeat-refund',
            'refund_reference_id' => 're_existing_123',
            'refunded_at' => now(),
        ]);

        $this->mock(OrderRefundService::class, function (MockInterface $mock) {
            $mock->shouldNotReceive('refund');
        });

        $this->actingAs($admin)
            ->patch("/admin/orders/{$order->id}/refund")
            ->assertRedirect()
            ->assertSessionHas('success');

        $order->refresh();

        $this->assertSame('reembolsado', $order->status);
        $this->assertSame('re_existing_123', $order->refund_reference_id);
        $this->assertNotNull($order->cancelled_at);
        $this->assertSame('admin', $order->cancelled_by);
    }
}