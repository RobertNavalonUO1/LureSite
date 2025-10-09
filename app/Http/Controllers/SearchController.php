<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $filters = $request->validate([
            'query'        => ['nullable', 'string', 'min:2'],
            'category'     => ['nullable', 'integer', 'exists:categories,id'],
            'min_price'    => ['nullable', 'numeric', 'min:0'],
            'max_price'    => ['nullable', 'numeric', 'gte:min_price'],
            'flags'        => ['nullable', 'array'],
            'flags.*'      => ['in:is_featured,is_superdeal,is_fast_shipping,is_new_arrival,is_seasonal'],
            'sort'         => ['nullable', 'in:relevance,price_asc,price_desc,recent,rating'],
            'page'         => ['nullable', 'integer', 'min:1'],
            'per_page'     => ['nullable', 'integer', 'min:6', 'max:48'],
        ]);

        $builder = Product::query()
            ->with(['category:id,name,slug', 'details:id,product_id,specifications'])
            ->withAvg('reviews as average_rating', 'rating');

        if ($term = $filters['query'] ?? null) {
            $builder->where(function ($query) use ($term) {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhereHas('details', fn ($details) =>
                        $details->where('specifications', 'like', "%{$term}%")
                    );
            });
        }

        if ($category = $filters['category'] ?? null) {
            $builder->where('category_id', $category);
        }

        if (isset($filters['min_price'])) {
            $builder->where('price', '>=', $filters['min_price']);
        }

        if (isset($filters['max_price'])) {
            $builder->where('price', '<=', $filters['max_price']);
        }

        foreach ($filters['flags'] ?? [] as $flag) {
            $builder->where($flag, true);
        }

        match ($filters['sort'] ?? 'relevance') {
            'price_asc'  => $builder->orderBy('price'),
            'price_desc' => $builder->orderByDesc('price'),
            'recent'     => $builder->latest(),
            'rating'     => $builder->orderByDesc('average_rating'),
            default      => $builder->orderByDesc('average_rating')->orderByDesc('created_at'),
        };

        $perPage = $filters['per_page'] ?? 12;

        $products = $builder->paginate($perPage)->withQueryString()->through(function ($product) {
            return [
                'id'             => $product->id,
                'name'           => $product->name,
                'price'          => $product->price,
                'discount'       => $product->discount,
                'stock'          => $product->stock,
                'image_url'      => $product->image_url,
                'image_url_full' => $product->image_url_full,
                'is_adult'       => $product->is_adult,
                'link'           => $product->link,
                'average_rating' => round($product->average_rating ?? 0, 1),
                'reviews_count'  => $product->reviews()->count(),
                'category'       => $product->category ? [
                    'id'   => $product->category->id,
                    'name' => $product->category->name,
                    'slug' => $product->category->slug,
                ] : null,
                'tags'           => [
                    'featured'     => $product->is_featured,
                    'superdeal'    => $product->is_superdeal,
                    'fastShipping' => $product->is_fast_shipping,
                    'newArrival'   => $product->is_new_arrival,
                    'seasonal'     => $product->is_seasonal,
                ],
                'details'        => $product->details ? [
                    'specifications' => $product->details->specifications,
                ] : null,
            ];
        });

        $recommended = collect();
        if (!($filters['query'] ?? null) && !($filters['category'] ?? null)) {
            $recommended = Product::query()
                ->with('category:id,name,slug')
                ->featured()
                ->latest()
                ->take(6)
                ->get()
                ->map(fn ($product) => [
                    'id'        => $product->id,
                    'name'      => $product->name,
                    'price'     => $product->price,
                    'image_url' => $product->image_url,
                ]);
        }

        return Inertia::render('Search/Results', [
            'products'       => $products,
            'filters'        => $filters,
            'categories'     => Category::select('id', 'name')->orderBy('name')->get(),
            'recommended'    => $recommended,
            'hasActiveQuery' => (bool) ($filters['query'] ?? null),
        ]);
    }
}
