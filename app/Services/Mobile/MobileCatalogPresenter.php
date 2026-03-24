<?php

namespace App\Services\Mobile;

use App\Models\Product;
use App\Support\CatalogDataLocalizer;
use Illuminate\Support\Str;

class MobileCatalogPresenter
{
    public function __construct(
        private readonly CatalogDataLocalizer $catalogDataLocalizer,
    ) {
    }

    public function category($category): array
    {
        return $this->catalogDataLocalizer->categoryPayload($category);
    }

    public function banner(array $banner): array
    {
        return [
            'id' => $banner['id'] ?? null,
            'title' => $banner['title'] ?? null,
            'subtitle' => $banner['subtitle'] ?? null,
            'image' => $banner['image'] ?? null,
            'link' => $banner['link'] ?? null,
            'cta_label' => $banner['cta_label'] ?? null,
            'campaign' => $banner['campaign'] ?? null,
            'placement' => $banner['placement'] ?? null,
        ];
    }

    public function productCard(Product $product, array $overrides = []): array
    {
        $base = $this->catalogDataLocalizer->productPayload($product);
        $description = trim((string) ($product->description ?? ''));
        $averageRating = $product->reviews_average_rating ?? $product->average_rating ?? $product->averageRating ?? null;
        $reviewsCount = $product->reviews_count ?? null;

        if ($reviewsCount === null && $product->relationLoaded('reviews')) {
            $reviewsCount = $product->reviews->count();
        }

        return array_merge([
            'id' => $product->id,
            'name' => $product->name,
            'price' => (float) $product->price,
            'original_price' => $this->originalPrice($product),
            'discount' => (int) ($product->discount ?? 0),
            'currency' => 'EUR',
            'stock' => (int) $product->stock,
            'image_url' => $base['image_url'] ?? $product->image_url,
            'image_url_full' => $product->image_url_full ?? null,
            'short_description' => $description !== '' ? Str::limit(preg_replace('/\s+/', ' ', strip_tags($description)), 140, '...') : null,
            'badge' => null,
            'average_rating' => $averageRating !== null ? round((float) $averageRating, 1) : null,
            'reviews_count' => $reviewsCount !== null ? (int) $reviewsCount : null,
            'delivery_estimate' => $product->is_fast_shipping ? 'Entrega estimada en 24-48 h' : null,
            'flags' => [
                'featured' => (bool) $product->is_featured,
                'superdeal' => (bool) $product->is_superdeal,
                'fast_shipping' => (bool) $product->is_fast_shipping,
                'new_arrival' => (bool) $product->is_new_arrival,
                'seasonal' => (bool) $product->is_seasonal,
            ],
            'category' => $base['category'] ?? null,
        ], $overrides);
    }

    public function productDetail(Product $product, array $reviews = [], array $relatedProducts = []): array
    {
        $gallery = [];

        if ($product->image_url) {
            $gallery[] = $product->image_url_full ?? $product->image_url;
        }

        if ($product->relationLoaded('images')) {
            foreach ($product->images as $image) {
                if (!empty($image->image_url)) {
                    $gallery[] = $image->image_url;
                }
            }
        }

        $gallery = array_values(array_unique($gallery));

        return array_merge($this->productCard($product), [
            'description' => $product->description,
            'details' => $product->details ? [
                'specifications' => $product->details->specifications,
            ] : null,
            'gallery' => $gallery,
            'reviews' => $reviews,
            'related_products' => $relatedProducts,
        ]);
    }

    private function originalPrice(Product $product): ?float
    {
        if (isset($product->original_price) && is_numeric($product->original_price)) {
            return round((float) $product->original_price, 2);
        }

        $discount = (int) ($product->discount ?? 0);
        if ($discount <= 0 || (float) $product->price <= 0 || $discount >= 100) {
            return null;
        }

        return round((float) $product->price / (1 - ($discount / 100)), 2);
    }
}
