<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Order;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run()
    {
        $statuses = [
            'pendiente_envio',
            'pagado',
            'enviado',
            'entregado',
            'confirmado',
            'cancelado',
            'reembolso_pendiente'
        ];

        $paymentMethods = ['Stripe', 'PayPal', 'Transferencia'];

        foreach ($statuses as $status) {
            foreach (range(1, 15) as $i) {
                Order::create([
                    'user_id' => rand(1, 5),
                    'name' => fake('es_ES')->name(),
                    'email' => fake('es_ES')->email(),
                    'address' => fake('es_ES')->address(),
                    'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                    'total' => fake()->randomFloat(2, 20, 500),
                    'transaction_id' => Str::uuid(),
                    'status' => $status,
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
