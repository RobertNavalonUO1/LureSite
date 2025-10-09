<?php
namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use App\Models\ProductImage;
use App\Models\TemporaryProduct;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;

class ProductMigrationController extends Controller
{
    public function index()
    {
        $temporaryProducts = TemporaryProduct::with('images')->get();

        $existingProducts = Product::with('images')
            ->latest()
            ->get()
            ->map(function (Product $product) {
                return [
                    'id' => $product->id,
                    'name' => $product->name,
                    'price' => $product->price,
                    'image_url' => $product->image_url,
                    'link' => $product->link,
                    'images' => $product->images
                        ->map(fn (ProductImage $image) => [
                            'id' => $image->id,
                            'image_url' => $image->image_url,
                            'position' => $image->position,
                        ])
                        ->values(),
                ];
            });

        $categories = Category::all();

        $defaultCategory = Category::firstOrCreate(
            ['name' => 'General'],
            ['slug' => 'general', 'is_active' => true]
        );

        return inertia('MigrateProducts', [
            'temporaryProducts' => $temporaryProducts,
            'existingProducts' => $existingProducts,
            'categories' => $categories,
            'defaultStock' => 10,
            'defaultCategory' => $defaultCategory->id,
        ]);
    }

    public function migrate(Request $request, $id)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'stock' => 'required|integer|min:0',
            'name' => 'sometimes|string|max:255',
            'image_url' => 'nullable|string|max:2048',
        ]);

        try {
            $temp = TemporaryProduct::with('images')->findOrFail($id);

            DB::transaction(function () use ($validated, $temp) {
                $imageOverride = array_key_exists('image_url', $validated) ? trim((string) $validated['image_url']) : null;

                $this->persistProductWithImages($temp, [
                    'name' => $validated['name'] ?? $temp->title,
                    'description' => $temp->title,
                    'price' => $temp->price,
                    'image_url' => $imageOverride !== null && $imageOverride !== '' ? $imageOverride : $temp->image_url,
                    'stock' => $validated['stock'],
                    'category_id' => $validated['category_id'],
                    'is_adult' => false,
                    'link' => $temp->link ?? $temp->image_url,
                ]);
            });

            return response()->json([
                'success' => true,
                'message' => 'Producto migrado con exito.',
                'remaining' => TemporaryProduct::count(),
            ]);
        } catch (\Exception $e) {
            Log::error("Error migrating product {$id}: " . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error al migrar producto: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function bulkMigrate(Request $request)
    {
        $validated = $request->validate([
            'category_id' => 'required|exists:categories,id',
            'stock' => 'required|integer|min:0',
            'primary_images' => 'nullable|array',
            'primary_images.*' => 'nullable|string|max:2048',
        ]);

        $temporaryProducts = TemporaryProduct::with('images')->get();
        $totalProducts = $temporaryProducts->count();

        if ($totalProducts === 0) {
            return response()->json([
                'success' => false,
                'message' => 'No hay productos para migrar',
            ], 400);
        }

        $primaryOverrides = [];
        if (isset($validated['primary_images']) && is_array($validated['primary_images'])) {
            foreach ($validated['primary_images'] as $key => $value) {
                $trimmed = trim((string) $value);
                if ($trimmed === '') {
                    continue;
                }
                $primaryOverrides[$key] = $trimmed;
            }
        }

        DB::beginTransaction();

        try {
            $migratedCount = 0;
            $errors = [];

            foreach ($temporaryProducts as $temp) {
                try {
                    $override = $primaryOverrides[$temp->id] ?? null;
                    $imageUrl = $override !== null && $override !== '' ? $override : $temp->image_url;

                    $this->persistProductWithImages($temp, [
                        'name' => $temp->title,
                        'description' => $temp->title,
                        'price' => $temp->price,
                        'image_url' => $imageUrl,
                        'stock' => $validated['stock'],
                        'category_id' => $validated['category_id'],
                        'is_adult' => false,
                        'link' => $temp->link ?? $temp->image_url,
                    ]);

                    $migratedCount++;
                } catch (\Exception $e) {
                    $errors[] = "Producto ID {$temp->id}: " . $e->getMessage();
                    Log::error("Error migrating product {$temp->id}: " . $e->getMessage());
                }
            }

            if (!empty($errors) && $migratedCount === 0) {
                DB::rollBack();

                return response()->json([
                    'success' => false,
                    'message' => 'Error al migrar todos los productos',
                    'errors' => $errors,
                ], 500);
            }

            DB::commit();

            $message = $migratedCount === $totalProducts
                ? "Todos los productos ({$migratedCount}) migrados con exito."
                : "{$migratedCount} de {$totalProducts} productos migrados con exito.";

            if (!empty($errors)) {
                $message .= ' Algunos productos no se pudieron migrar.';
            }

            return response()->json([
                'success' => true,
                'message' => $message,
                'migrated_count' => $migratedCount,
                'errors' => $errors,
            ]);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error('Error en migracion masiva: ' . $e->getMessage());

            return response()->json([
                'success' => false,
                'message' => 'Error critico al migrar productos: ' . $e->getMessage(),
            ], 500);
        }
    }

    public function updateProduct(Request $request, Product $product)
    {
        $data = $request->validate([
            'name' => 'required|string|max:255',
            'image_url' => 'nullable|string|max:2048',
        ]);

        $product->name = trim($data['name']);

        if (array_key_exists('image_url', $data)) {
            $imageUrl = trim((string) $data['image_url']);
            $product->image_url = $imageUrl !== '' ? $imageUrl : null;
        }

        $product->save();
        $product->load('images');

        return response()->json([
            'success' => true,
            'message' => 'Producto actualizado con exito.',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'image_url' => $product->image_url,
                'link' => $product->link,
                'images' => $product->images
                    ->map(fn (ProductImage $image) => [
                        'id' => $image->id,
                        'image_url' => $image->image_url,
                        'position' => $image->position,
                    ])
                    ->values(),
            ],
        ]);
    }

    public function addImages(Request $request, Product $product)
    {
        $data = $request->validate([
            'images' => 'required|array|min:1',
            'images.*' => 'required|string|max:2048',
        ]);

        $existingUrls = ProductImage::where('product_id', $product->id)
            ->pluck('image_url')
            ->map(fn ($url) => trim((string) $url))
            ->filter()
            ->values()
            ->all();

        $seen = array_fill_keys($existingUrls, true);

        $position = ProductImage::where('product_id', $product->id)->max('position');
        $position = is_numeric($position) ? (int) $position : -1;

        foreach ($data['images'] as $rawUrl) {
            $url = trim((string) $rawUrl);
            if ($url === '' || isset($seen[$url])) {
                continue;
            }

            $position++;

            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $url,
                'position' => $position,
            ]);

            $seen[$url] = true;
        }

        $product->load('images');

        return response()->json([
            'success' => true,
            'message' => 'Imagenes agregadas con exito.',
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'image_url' => $product->image_url,
                'link' => $product->link,
                'images' => $product->images
                    ->map(fn (ProductImage $image) => [
                        'id' => $image->id,
                        'image_url' => $image->image_url,
                        'position' => $image->position,
                    ])
                    ->values(),
            ],
        ]);
    }

    protected function persistProductWithImages(TemporaryProduct $temp, array $attributes): Product
    {
        $temp->loadMissing('images');

        $orderedImages = $temp->images
            ->sortBy(function ($image) {
                return $image->position ?? PHP_INT_MAX;
            })
            ->values();

        $primaryImageUrl = isset($attributes['image_url']) && trim((string) $attributes['image_url']) !== ''
            ? trim((string) $attributes['image_url'])
            : null;

        if (!$primaryImageUrl && $orderedImages->isNotEmpty()) {
            $primaryImageUrl = $orderedImages->first()->image_url;
        }

        $attributes['image_url'] = $primaryImageUrl;

        $product = Product::create($attributes);

        $this->copyImagesToProduct($product, $primaryImageUrl, $orderedImages);

        $temp->delete();

        return $product;
    }

    protected function copyImagesToProduct(Product $product, ?string $primaryImageUrl, $temporaryImages): void
    {
        $position = 0;
        $seen = [];

        $primary = trim((string) $primaryImageUrl);
        if ($primary !== '') {
            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $primary,
                'position' => $position++,
            ]);

            $seen[$primary] = true;
        }

        foreach ($temporaryImages as $image) {
            $url = trim((string) $image->image_url);

            if ($url === '' || isset($seen[$url])) {
                continue;
            }

            ProductImage::create([
                'product_id' => $product->id,
                'image_url' => $url,
                'position' => $position++,
            ]);

            $seen[$url] = true;
        }
    }
}