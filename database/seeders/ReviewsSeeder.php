<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\Review;
use App\Models\User;
use Illuminate\Database\Seeder;

class ReviewsSeeder extends Seeder
{
    public function run(): void
    {
        if (Review::query()->exists()) {
            return;
        }

        if (! class_exists(\Faker\Factory::class)) {
            return;
        }

        $faker = \Faker\Factory::create('es_ES');
        $userIds = User::query()->pluck('id');

        if ($userIds->isEmpty()) {
            return;
        }

        Product::query()
            ->select(['id'])
            ->chunk(100, function ($products) use ($faker, $userIds) {
                foreach ($products as $product) {
                    $reviewCount = rand(0, 6);

                    for ($i = 0; $i < $reviewCount; $i++) {
                        $userId = $faker->boolean(80) ? $userIds->random() : null;

                        Review::create([
                            'product_id' => $product->id,
                            'user_id' => $userId,
                            'author' => $userId ? null : $faker->name(),
                            'rating' => $faker->numberBetween(1, 5),
                            'comment' => $faker->sentences(rand(1, 3), true),
                        ]);
                    }
                }
            });
    }
}
