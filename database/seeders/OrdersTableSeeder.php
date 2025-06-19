<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

class OrdersTableSeeder extends Seeder
{
    public function run(): void
    {
        $users = DB::table('users')->pluck('id');

        foreach ($users as $user_id) {
            DB::table('orders')->insert([
                'user_id' => $user_id,
                'name' => DB::table('users')->where('id', $user_id)->value('name'),
                'email' => DB::table('users')->where('id', $user_id)->value('email'),
                'address' => 'Calle Falsa 123, Madrid, España',
                'payment_method' => 'Tarjeta de crédito',
                'total' => rand(50, 500), // Monto aleatorio
                'transaction_id' => Str::uuid(),
                'created_at' => now(),
                'updated_at' => now(),
            ]);
        }
    }
}
