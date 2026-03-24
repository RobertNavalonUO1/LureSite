<?php

namespace Tests\Feature;

use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\OrderRefundService;
use App\Services\RefundResult;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Mockery;
use Tests\TestCase;

class OrderLineItemWorkflowTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_cancel_a_single_line_and_order_becomes_partially_cancelled_in_ui(): void
    {
        $user = User::factory()->create();
        [$order, $items] = $this->createOrderWithItems($user, 'pagado', ['pagado', 'pagado']);

        $response = $this->actingAs($user)->post(route('orders.items.cancel', [$order->id, $items[0]->id]));

        $response->assertRedirect();

        $this->assertDatabaseHas('order_items', [
            'id' => $items[0]->id,
            'status' => 'cancelacion_pendiente',
        ]);

        $this->assertDatabaseHas('order_items', [
            'id' => $items[1]->id,
            'status' => 'pagado',
        ]);

        $order->refresh();
        $this->assertSame('pagado', $order->status);

        $this->actingAs($user)
            ->get(route('orders.show', $order->id))
            ->assertOk()
            ->assertSee('&quot;summary_status&quot;:&quot;parcialmente_cancelado&quot;', false);
    }

    public function test_cancelled_orders_view_includes_mixed_orders_with_line_level_cancellations(): void
    {
        $user = User::factory()->create();
        [$order, $items] = $this->createOrderWithItems($user, 'pagado', ['pagado', 'pagado', 'pagado']);

        $this->actingAs($user)->post(route('orders.items.cancel', [$order->id, $items[1]->id]));

        $this->actingAs($user)
            ->get(route('orders.cancelled'))
            ->assertOk()
            ->assertSee('&quot;summary_status&quot;:&quot;parcialmente_cancelado&quot;', false)
            ->assertSee('&quot;id&quot;:' . $order->id, false);
    }

    public function test_admin_can_refund_a_single_line_and_order_becomes_partially_refunded(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);
        $customer = User::factory()->create();
        [$order, $items] = $this->createOrderWithItems($customer, 'confirmado', ['confirmado', 'confirmado']);

        $this->actingAs($customer)->post(route('orders.items.refund', [$order->id, $items[0]->id]));

        $refundService = Mockery::mock(OrderRefundService::class);
        $refundService->shouldReceive('refundItem')
            ->once()
            ->andReturn(new RefundResult(
                referenceId: 'refund_line_1',
                providerStatus: 'succeeded',
                payload: ['id' => 'refund_line_1'],
            ));
        $this->app->instance(OrderRefundService::class, $refundService);

        $this->actingAs($admin)->patch(route('admin.orders.items.return.approve', [$order->id, $items[0]->id]));
        $this->actingAs($admin)->patch(route('admin.orders.items.refund.process', [$order->id, $items[0]->id]));

        $this->assertDatabaseHas('order_items', [
            'id' => $items[0]->id,
            'status' => 'reembolsado',
            'refund_reference_id' => 'refund_line_1',
        ]);

        $this->assertDatabaseHas('order_items', [
            'id' => $items[1]->id,
            'status' => 'confirmado',
        ]);

        $order->refresh();
        $this->assertSame('confirmado', $order->status);

        $this->actingAs($customer)
            ->get(route('orders.show', $order->id))
            ->assertOk()
            ->assertSee('&quot;summary_status&quot;:&quot;parcialmente_reembolsado&quot;', false);
    }

    protected function tearDown(): void
    {
        Mockery::close();

        parent::tearDown();
    }

    private function createOrderWithItems(User $user, string $orderStatus, array $itemStatuses): array
    {
        $category = Category::query()->create([
            'name' => 'Categoria Test',
            'description' => 'Categoria para pruebas.',
            'slug' => 'categoria-test',
        ]);

        $order = Order::query()->create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'total' => count($itemStatuses) * 25,
            'status' => $orderStatus,
            'address' => 'Calle QA 1',
            'payment_method' => 'stripe',
            'transaction_id' => 'txn_' . uniqid(),
            'payment_reference_id' => 'pi_' . uniqid(),
        ]);

        $items = collect($itemStatuses)->values()->map(function (string $status, int $index) use ($order, $category) {
            $product = Product::query()->create([
                'name' => 'Producto Test ' . $index,
                'description' => 'Producto de prueba',
                'price' => 25,
                'image_url' => '/images/logo.png',
                'stock' => 25,
                'category_id' => $category->id,
                'link' => '/product/test-' . $index,
            ]);

            return OrderItem::query()->create([
                'order_id' => $order->id,
                'product_id' => $product->id,
                'quantity' => 1,
                'price' => 25,
                'status' => $status,
            ]);
        });

        return [$order->fresh('items.product'), $items];
    }
}
