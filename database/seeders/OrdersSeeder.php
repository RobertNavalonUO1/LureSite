<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\User;
use App\Models\Product;

class OrdersSeeder extends Seeder
{
    /**
     * Ejecuta la semilla para crear pedidos para el usuario con email n@n.com.
     */
    public function run()
    {
        // Buscar el usuario con email n@n.com
        $user = User::where('email', 'n@n.com')->first();

        if (!$user) {
            $this->command->info("Usuario con email n@n.com no encontrado. Por favor, crea el usuario primero.");
            return;
        }

        // Verificar que exista al menos un producto para asociar a los pedidos.
        $product = Product::first();
        if (!$product) {
            $product = Product::factory()->create([
                'name'      => 'Producto de Prueba',
                'price'     => 50.00,
                'stock'     => 10,
                'image_url' => 'https://via.placeholder.com/150',
            ]);
        }

        // Datos de ejemplo para crear pedidos
        $ordersData = [
            [
                'user_id'        => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'address'        => 'Calle Falsa 123',
                'payment_method' => 'shipped', // Este pedido se mostrará en ShippedOrders
                'total'          => 150.00,
                'transaction_id' => 'TXN-001',
            ],
            [
                'user_id'        => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'address'        => 'Calle Falsa 456',
                'payment_method' => 'shipped', // También se mostrará
                'total'          => 250.00,
                'transaction_id' => 'TXN-002',
            ],
            // Este pedido no se mostrará en ShippedOrders porque payment_method no es 'shipped'
            [
                'user_id'        => $user->id,
                'name'           => $user->name,
                'email'          => $user->email,
                'address'        => 'Calle Falsa 789',
                'payment_method' => 'paid',
                'total'          => 350.00,
                'transaction_id' => 'TXN-003',
            ],
        ];

        foreach ($ordersData as $orderData) {
            // Crear la orden
            $order = Order::create($orderData);

            // Crear dos ítems para cada orden
            OrderItem::create([
                'order_id'   => $order->id,
                'product_id' => $product->id,
                'quantity'   => 2,
                'price'      => $product->price,
            ]);

            OrderItem::create([
                'order_id'   => $order->id,
                'product_id' => $product->id,
                'quantity'   => 1,
                'price'      => $product->price,
            ]);
        }

        $this->command->info("Pedidos creados para el usuario con email n@n.com.");
    }
}
