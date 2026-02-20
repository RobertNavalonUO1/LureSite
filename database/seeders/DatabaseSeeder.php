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
            CookiePreferencesSeeder::class,

            CategorySeeder::class,
            ProductsTableSeeder::class,
            ProductDetailsSeeder::class,
            ProductImagesSeeder::class,
            ReviewsSeeder::class,

            CouponsSeeder::class,
            SettingsSeeder::class,
            BannersSeeder::class,

            OrdersTableSeeder::class,
            OrderItemsTableSeeder::class,
            OrderSeeder::class,
        ];

        foreach ($seeders as $seeder) {
            try {
                $this->call($seeder);
            } catch (\Throwable $e) {
                $this->command?->error("Seeder fallido: $seeder. Error: " . $e->getMessage());
            }
        }
    }

}
