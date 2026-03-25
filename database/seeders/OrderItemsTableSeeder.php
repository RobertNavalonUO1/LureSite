<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class OrderItemsTableSeeder extends Seeder
{
    public function run(): void
    {
        $orders = DB::table('orders')->pluck('id');
        $products = DB::table('products')->pluck('id');
        foreach ($orders as $order_id) {
            $product_ids = $products->random(rand(2, 6));
            foreach ($product_ids as $product_id) {
                DB::table('order_items')->insert([
                    'order_id' => $order_id,
                    'product_id' => $product_id,
                    'quantity' => rand(1, 8),
                    'price' => DB::table('products')->where('id', $product_id)->value('price'),
                    'status' => DB::table('orders')->where('id', $order_id)->value('status') ?? 'pendiente_pago',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
