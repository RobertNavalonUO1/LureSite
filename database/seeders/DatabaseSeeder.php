<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database.
     */
public function run(): void
{
    $seeders = [
        UsersTableSeeder::class,
        AddressesTableSeeder::class,
        CategorySeeder::class,
        ProductsTableSeeder::class,
        OrdersTableSeeder::class,
        OrderItemsTableSeeder::class,
        OrderSeeder::class,
    ];
    foreach ($seeders as $seeder) {
        try {
            $this->call($seeder);
        } catch (\Throwable $e) {
            $this->command->error("Seeder fallido: $seeder. Error: " . $e->getMessage());
        }
    }
}

}
