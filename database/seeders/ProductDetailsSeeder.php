<?php

namespace Database\Seeders;

use App\Models\Product;
use App\Models\ProductDetail;
use Illuminate\Database\Seeder;

class ProductDetailsSeeder extends Seeder
{
    public function run(): void
    {
        if (ProductDetail::query()->exists()) {
            return;
        }

        $faker = \Faker\Factory::create('es_ES');

        Product::query()
            ->select(['id', 'name'])
            ->chunk(200, function ($products) use ($faker) {
                foreach ($products as $product) {
                    ProductDetail::create([
                        'product_id' => $product->id,
                        'description' => $faker->paragraphs(3, true),
                        'specifications' => implode("\n", [
                            'Marca: ' . $faker->company(),
                            'Modelo: ' . strtoupper($faker->bothify('??-###')),
                            'Garantía: ' . $faker->numberBetween(6, 36) . ' meses',
                            'Color: ' . $faker->safeColorName(),
                        ]),
                    ]);
                }
            });
    }
}
