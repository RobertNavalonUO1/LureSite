<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\TemporaryProduct;
use App\Models\TemporaryProductImage;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\DB;

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

        DB::transaction(function () use ($payload, &$created) {
            foreach ($payload['products'] as $productData) {
                $temp = TemporaryProduct::create([
                    'title' => $productData['title'],
                    'seo_title' => $productData['seo_title'] ?? null,
                    'seo_description' => $productData['seo_description'] ?? null,
                    'price' => $productData['price'],
                    'image_url' => $productData['image_url'],
                ]);

                $created++;

                $images = $productData['images'] ?? [];
                $position = 1;
                foreach ($images as $url) {
                    if (!$url) {
                        continue;
                    }

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
        ]);
    }
}
