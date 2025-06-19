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
            // Asignar entre 1 y 3 productos a cada orden
            $product_ids = $products->random(rand(1, 3));

            foreach ($product_ids as $product_id) {
                DB::table('order_items')->insert([
                    'order_id' => $order_id,
                    'product_id' => $product_id,
                    'quantity' => rand(1, 5),
                    'price' => DB::table('products')->where('id', $product_id)->value('price'),
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);
            }
        }
    }
}
