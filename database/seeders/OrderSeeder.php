<?php

namespace Database\Seeders;
use Illuminate\Database\Seeder;
use App\Models\Order;
use Illuminate\Support\Str;

class OrderSeeder extends Seeder
{
    public function run()
    {
        if (Order::query()->exists()) {
            return;
        }

        $statuses = [
            'pendiente_pago',
            'pagado',
            'pendiente_envio',
            'enviado',
            'entregado',
            'confirmado',
            'cancelacion_pendiente',
            'cancelado',
            'reembolsado',
            'fallido',
            'devolucion_solicitada',
            'devolucion_aprobada',
            'devolucion_rechazada',
        ];

        $paymentMethods = ['Stripe', 'PayPal', 'Transferencia'];

        $userIds = \App\Models\User::query()->pluck('id');

        foreach ($statuses as $status) {
            foreach (range(1, 15) as $i) {
                $userId = $userIds->isNotEmpty() ? $userIds->random() : null;

                $order = Order::create([
                    'user_id' => $userId,
                    'name' => fake('es_ES')->name(),
                    'email' => fake('es_ES')->email(),
                    'address' => fake('es_ES')->address(),
                    'payment_method' => $paymentMethods[array_rand($paymentMethods)],
                    'total' => fake()->randomFloat(2, 5, 2000),
                    'transaction_id' => Str::uuid(),
                    'status' => $status,
                    'created_at' => now()->subDays(rand(1, 30)),
                    'updated_at' => now(),
                ]);

                if ($status === 'cancelado') {
                    $order->update([
                        'cancellation_reason' => fake('es_ES')->sentence(),
                        'cancelled_by' => fake()->randomElement(['user', 'admin']),
                        'cancelled_at' => now()->subDays(rand(0, 30)),
                    ]);
                }
            }
        }
    }
}
