<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemporaryProduct;
use App\Models\TemporaryProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Schema;

class TemporaryProductImportController extends Controller
{
    public function import(Request $request)
    {
        $payload = $request->validate([
            'products' => ['required', 'array', 'min:1'],
            'products.*.title' => ['required', 'string', 'max:500'],
            'products.*.price' => ['required', 'numeric', 'min:0'],
            'products.*.image_url' => ['required', 'string', 'max:1000'],
            'products.*.seo_title' => ['nullable', 'string', 'max:500'],
            'products.*.seo_description' => ['nullable', 'string', 'max:2000'],
            'products.*.images' => ['nullable', 'array'],
            'products.*.images.*' => ['string', 'max:1000'],
        ]);

        $created = 0;
        $warnings = [];

        $hasSeoTitle = Schema::hasColumn('temporary_products', 'seo_title');
        $hasSeoDescription = Schema::hasColumn('temporary_products', 'seo_description');
        $hasImageTable = Schema::hasTable('temporary_product_images');

        if (!$hasSeoTitle || !$hasSeoDescription) {
            $warnings[] = 'Las columnas SEO no estan disponibles en este entorno; se omitieron durante la importacion.';
        }

        if (!$hasImageTable) {
            $warnings[] = 'La tabla temporary_product_images no existe en este entorno; se omitieron las imagenes adicionales.';
        }

        try {
            DB::transaction(function () use ($payload, &$created, $hasSeoTitle, $hasSeoDescription, $hasImageTable) {
                foreach ($payload['products'] as $productData) {
                    $attributes = [
                        'title' => $productData['title'],
                        'price' => $productData['price'],
                        'image_url' => $productData['image_url'],
                    ];

                    if ($hasSeoTitle) {
                        $attributes['seo_title'] = $productData['seo_title'] ?? null;
                    }

                    if ($hasSeoDescription) {
                        $attributes['seo_description'] = $productData['seo_description'] ?? null;
                    }

                    $temp = TemporaryProduct::create($attributes);
                    $created++;

                    if (!$hasImageTable) {
                        continue;
                    }

                    $images = collect($productData['images'] ?? [])
                        ->filter(fn ($url) => is_string($url) && trim($url) !== '')
                        ->map(fn ($url) => trim($url))
                        ->unique()
                        ->values();

                    $position = 1;
                    foreach ($images as $url) {
                        TemporaryProductImage::create([
                            'temporary_product_id' => $temp->id,
                            'image_url' => $url,
                            'position' => $position,
                        ]);

                        $position++;
                    }
                }
            });

            return response()->json([
                'success' => true,
                'created' => $created,
                'warnings' => $warnings,
            ]);
        } catch (\Throwable $exception) {
            Log::error('Temporary product import failed', [
                'message' => $exception->getMessage(),
                'trace' => $exception->getTraceAsString(),
            ]);

            return response()->json([
                'success' => false,
                'message' => 'Fallo al guardar en temporary_products: ' . $exception->getMessage(),
            ], 500);
        }
    }
}
