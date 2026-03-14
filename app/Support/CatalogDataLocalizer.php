<?php

namespace App\Support;

use Illuminate\Support\Facades\Lang;
use Illuminate\Support\Str;

class CatalogDataLocalizer
{
    public function localizeCategoryName(?string $name, ?string $slug = null): string
    {
        $fallback = $name ?: (string) __('catalog.categories.sin-categoria');
        $resolvedSlug = $slug ?: Str::slug($fallback);
        $key = "catalog.categories.{$resolvedSlug}";

        return Lang::has($key) ? (string) __($key) : $fallback;
    }

    public function categoryPayload($category): array
    {
        return [
            'id' => $category->id,
            'name' => $this->localizeCategoryName($category->name, $category->slug),
            'slug' => $category->slug,
            'description' => $category->description,
        ];
    }

    public function productPayload($product, array $overrides = []): array
    {
        return array_merge([
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'stock' => $product->stock,
            'image_url' => $product->image_url,
            'image_url_full' => $product->image_url_full ?? null,
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $this->localizeCategoryName($product->category->name, $product->category->slug),
                'slug' => $product->category->slug,
            ] : null,
            'is_adult' => $product->is_adult,
            'link' => $product->link,
        ], $overrides);
    }
}