<?php

namespace Tests\Feature;

use App\Mail\OrderShipmentUpdateMail;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderRefundService;
use App\Services\RefundResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
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

    public function test_admin_can_save_tracking_and_mark_order_as_shipped(): void
    {
        Mail::fake();

        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();
        $category = Category::create([
            'name' => 'Test',
            'slug' => 'test',
            'description' => 'Categoria de tracking',
        ]);
        $product = Product::create([
            'name' => 'Producto tracking',
            'description' => 'Producto para probar tracking.',
            'price' => 39.90,
            'stock' => 5,
            'category_id' => $category->id,
        ]);

        $order = Order::create([
            'user_id' => $customer->id,
            'name' => $customer->name,
            'email' => $customer->email,
            'total' => 39.90,
            'status' => 'pagado',
            'address' => 'Calle Tracking 12',
            'payment_method' => 'stripe',
            'transaction_id' => 'txn_tracking_flow',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 39.90,
            'status' => 'pagado',
        ]);

        $this->actingAs($admin)
            ->patch("/admin/orders/{$order->id}/ship", [
                'tracking_carrier' => 'Correos Express',
                'tracking_number' => 'CX-99881',
                'tracking_url' => 'https://tracking.example.test/CX-99881',
            ])
            ->assertRedirect();

        $order->refresh();

        $this->assertSame('enviado', $order->status);
        $this->assertSame('Correos Express', $order->tracking_carrier);
        $this->assertSame('CX-99881', $order->tracking_number);
        $this->assertSame('https://tracking.example.test/CX-99881', $order->tracking_url);

        Mail::assertSent(OrderShipmentUpdateMail::class, function (OrderShipmentUpdateMail $mail) use ($customer, $order) {
            return $mail->hasTo($customer->email) && $mail->order->is($order);
        });
    }
}