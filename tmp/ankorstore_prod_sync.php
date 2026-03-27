<?php

require __DIR__ . '/../../vendor/autoload.php';

$app = require __DIR__ . '/../../bootstrap/app.php';
$kernel = $app->make(Illuminate\Contracts\Console\Kernel::class);
$kernel->bootstrap();

use App\Models\Category;
use App\Models\Product;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Str;

$mode = $argv[1] ?? null;

if ($mode === null) {
    fwrite(STDERR, "Mode is required.\n");
    exit(1);
}

switch ($mode) {
    case 'inspect':
        $payload = [
            'total_products' => Product::count(),
            'ankorstore_products' => Product::query()
                ->where('link', 'like', 'https://es.ankorstore.com/brand/%')
                ->count(),
            'categories' => Category::query()
                ->whereIn('id', [5, 7, 10, 12, 13, 14])
                ->orderBy('id')
                ->get(['id', 'name'])
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                ])
                ->values()
                ->all(),
            'all_categories' => Category::query()
                ->orderBy('id')
                ->get(['id', 'name', 'slug'])
                ->map(fn (Category $category) => [
                    'id' => $category->id,
                    'name' => $category->name,
                    'slug' => $category->slug,
                ])
                ->values()
                ->all(),
        ];

        echo json_encode($payload, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), PHP_EOL;
        break;

    case 'backup':
        $outputPath = $argv[2] ?? null;
        if (!$outputPath) {
            fwrite(STDERR, "Backup output path is required.\n");
            exit(1);
        }

        $products = Product::query()
            ->with(['images:id,product_id,image_url,position'])
            ->where('link', 'like', 'https://es.ankorstore.com/brand/%')
            ->orderBy('id')
            ->get()
            ->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'description' => $product->description,
                    'price' => $product->price,
                    'category_id' => $product->category_id,
                    'stock' => $product->stock,
                    'image_url' => $product->image_url,
                    'link' => $product->link,
                    'is_adult' => $product->is_adult,
                    'average_rating' => $product->average_rating,
                    'is_featured' => $product->is_featured,
                    'is_superdeal' => $product->is_superdeal,
                    'is_fast_shipping' => $product->is_fast_shipping,
                    'is_new_arrival' => $product->is_new_arrival,
                    'is_seasonal' => $product->is_seasonal,
                    'discount' => $product->discount,
                    'images' => $product->images->map(fn ($image) => [
                        'id' => $image->id,
                        'image_url' => $image->image_url,
                        'position' => $image->position,
                    ])->values()->all(),
                ];
            })
            ->values()
            ->all();

        file_put_contents($outputPath, json_encode($products, JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT));

        echo json_encode([
            'backup_path' => $outputPath,
            'products_backed_up' => count($products),
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), PHP_EOL;
        break;

    case 'import':
        $inputPath = $argv[2] ?? null;
        if (!$inputPath || !is_file($inputPath)) {
            fwrite(STDERR, "Import input file is required.\n");
            exit(1);
        }

        $rows = json_decode(file_get_contents($inputPath), true, 512, JSON_THROW_ON_ERROR);
        $imported = 0;
        $updated = 0;
        $imageRows = 0;

        DB::transaction(function () use ($rows, &$imported, &$updated, &$imageRows) {
            foreach ($rows as $row) {
                $categoryId = null;
                $categoryName = trim((string) ($row['category_name'] ?? ''));

                if ($categoryName !== '') {
                    $categorySlug = trim((string) ($row['category_slug'] ?? Str::slug($categoryName)));

                    $category = Category::query()->firstOrCreate(
                        ['slug' => $categorySlug],
                        ['name' => $categoryName]
                    );

                    if ($category->name !== $categoryName) {
                        $category->name = $categoryName;
                        $category->save();
                    }

                    $categoryId = $category->id;
                } elseif (!empty($row['category_id'])) {
                    $categoryId = $row['category_id'];
                }

                $product = Product::query()->firstOrNew([
                    'link' => $row['link'],
                ]);

                $exists = $product->exists;

                $product->name = $row['name'] ?? 'Producto Ankorestore';
                $product->description = $row['description'] ?? '';
                $product->price = $row['price'] ?? 0;
                $product->image_url = $row['image_url'] ?? null;
                $product->stock = $row['stock'] ?? 0;
                $product->category_id = $categoryId;
                $product->is_adult = $row['is_adult'] ?? false;
                $product->link = $row['link'];
                $product->average_rating = $row['average_rating'] ?? 0;
                $product->is_featured = $row['is_featured'] ?? false;
                $product->is_superdeal = $row['is_superdeal'] ?? false;
                $product->is_fast_shipping = $row['is_fast_shipping'] ?? false;
                $product->is_new_arrival = $row['is_new_arrival'] ?? false;
                $product->is_seasonal = $row['is_seasonal'] ?? false;
                $product->discount = $row['discount'] ?? 0;
                $product->save();

                $product->images()->delete();

                foreach (($row['images'] ?? []) as $image) {
                    $product->images()->create([
                        'image_url' => $image['image_url'] ?? '',
                        'position' => $image['position'] ?? 0,
                    ]);
                    $imageRows++;
                }

                if ($exists) {
                    $updated++;
                } else {
                    $imported++;
                }
            }
        });

        echo json_encode([
            'selected' => count($rows),
            'imported' => $imported,
            'updated' => $updated,
            'image_rows' => $imageRows,
            'final_ankorstore_products' => Product::query()
                ->where('link', 'like', 'https://es.ankorstore.com/brand/%')
                ->count(),
            'final_total_products' => Product::count(),
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), PHP_EOL;
        break;

    case 'verify':
        $byCategory = Product::query()
            ->selectRaw('categories.id as category_id, categories.name as category_name, count(products.id) as total')
            ->join('categories', 'categories.id', '=', 'products.category_id')
            ->where('products.link', 'like', 'https://es.ankorstore.com/brand/%')
            ->groupBy('categories.id', 'categories.name')
            ->orderBy('categories.id')
            ->get()
            ->map(fn ($row) => [
                'category_id' => (int) $row->category_id,
                'category_name' => $row->category_name,
                'total' => (int) $row->total,
            ])
            ->values()
            ->all();

        echo json_encode([
            'ankorstore_products' => Product::query()
                ->where('link', 'like', 'https://es.ankorstore.com/brand/%')
                ->count(),
            'total_products' => Product::count(),
            'by_category' => $byCategory,
        ], JSON_UNESCAPED_UNICODE | JSON_PRETTY_PRINT), PHP_EOL;
        break;

    default:
        fwrite(STDERR, "Unsupported mode: {$mode}\n");
        exit(1);
}
