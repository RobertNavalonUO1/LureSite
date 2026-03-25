<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrdersTableSeeder extends Seeder
{
    public function run(): void
    {
        if (! class_exists(\Faker\Factory::class)) {
            return;
        }

        $faker = \Faker\Factory::create('es_ES');
        $users = DB::table('users')->pluck('id');

        if ($users->isEmpty()) {
            return;
        }
        $paymentMethods = ['Tarjeta de crédito', 'PayPal', 'Transferencia bancaria', 'Bizum', 'Contra reembolso'];
        foreach ($users as $user_id) {
            $user = DB::table('users')->where('id', $user_id)->first();
            $numOrders = rand(3, 6);
            for ($i = 0; $i < $numOrders; $i++) {
                $maxRetries = 5;
                $success = false;
                while (!$success && $maxRetries > 0) {
                    $createdAt = $faker->dateTimeBetween('-2 years', 'now')->format('Y-m-d H:i:s');
                    try {
                        DB::table('orders')->insert([
                            'user_id' => $user_id,
                            'name' => $user->name,
                            'email' => $user->email,
                            'address' => $faker->streetAddress . ', ' . $faker->city . ', ' . $faker->state . ', España',
                            'payment_method' => $faker->randomElement($paymentMethods),
                            'total' => $faker->randomFloat(2, 20, 2000),
                            'transaction_id' => Str::uuid(),
                            'created_at' => $createdAt,
                            'updated_at' => now()->format('Y-m-d H:i:s'),
                        ]);
                        $success = true;
                    } catch (\Illuminate\Database\QueryException $e) {
                        if (str_contains($e->getMessage(), 'Incorrect datetime value')) {
                            $maxRetries--;
                            continue;
                        } else {
                            throw $e;
                        }
                    }
                }
            }
        }
    }
}
