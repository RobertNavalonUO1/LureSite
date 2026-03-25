<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductImage;
use Illuminate\Database\Seeder;

class ProductImagesSeeder extends Seeder
{
    public function run(): void
    {
        if (ProductImage::query()->exists()) {
            return;
        }

        $gallery = [
            '/images/autumn-photo-01.jpg',
            '/images/autumn-photo-02.jpg',
            '/images/autumn-photo-03.jpg',
            '/images/autumn-photo-04.jpg',
            '/images/autumn-photo-05.jpg',
            '/images/autumn-photo-06.jpg',
            '/images/autumn-photo-07.jpg',
            '/images/autumn-photo-08.jpg',
            '/images/autumn-photo-09.jpg',
            '/images/autumn-photo-10.jpg',
            '/images/autumn-market-1.jpg',
            '/images/autumn-market-2.jpg',
            '/images/autumn-market-3.jpg',
        ];

        Product::query()
            ->select(['id'])
            ->chunk(200, function ($products) use ($gallery) {
                foreach ($products as $product) {
                    $count = rand(2, 5);
                    $choices = collect($gallery)->shuffle()->take($count)->values();

                    foreach ($choices as $index => $url) {
                        ProductImage::create([
                            'product_id' => $product->id,
                            'image_url' => $url,
                            'position' => $index + 1,
                        ]);
                    }
                }
            });
    }
}
