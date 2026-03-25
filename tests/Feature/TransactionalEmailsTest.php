<?php

namespace Tests\Feature;

use App\Mail\OrderConfirmationMail;
use App\Models\Category;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\TransactionalEmailService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Mail;
use Tests\TestCase;

class TransactionalEmailsTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_confirmation_email_is_sent_with_order_context(): void
    {
        Mail::fake();

        $user = User::factory()->create();
        $category = Category::create([
            'name' => 'Bolsos',
            'slug' => 'bolsos',
        ]);

        $product = Product::create([
            'name' => 'Bolso Terra',
            'description' => 'Bolso de prueba para correo transaccional.',
            'price' => 89.90,
            'stock' => 5,
            'category_id' => $category->id,
        ]);

        $order = Order::create([
            'user_id' => $user->id,
            'name' => $user->name,
            'email' => $user->email,
            'total' => 99.90,
            'status' => 'pagado',
            'address' => 'Calle Falsa 123, Barcelona',
            'shipping_method' => 'standard',
            'shipping_label' => 'Envio estandar',
            'shipping_description' => 'Entrega de 2 a 4 dias laborables',
            'shipping_eta' => '2-4 dias laborables',
            'shipping_cost' => 10.00,
            'payment_method' => 'stripe',
            'transaction_id' => 'txn_test_123',
        ]);

        OrderItem::create([
            'order_id' => $order->id,
            'product_id' => $product->id,
            'quantity' => 1,
            'price' => 89.90,
            'status' => 'pagado',
        ]);

        app(TransactionalEmailService::class)->sendOrderConfirmation($order);

        Mail::assertSent(OrderConfirmationMail::class, function (OrderConfirmationMail $mail) use ($order, $user) {
            return $mail->hasTo($user->email) && $mail->order->is($order);
        });
    }
}