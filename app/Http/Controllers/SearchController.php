<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class SearchController extends Controller
{
    public function search(Request $request)
    {
        $query = $request->input('query');

        $products = Product::with('category')
            ->where('name', 'LIKE', "%{$query}%")
            ->get()
            ->map(fn($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => $product->price,
                'stock' => $product->stock,
                'image' => $product->image,
                'category' => [
                    'id' => $product->category->id ?? null,
                    'name' => $product->category->name ?? 'Sin categoría',
                ],
                'is_adult' => $product->is_adult,
                'link' => $product->link,
            ]);

        return Inertia::render('Home', [
            'products' => $products,
            'searchQuery' => $query
        ]);
    }
}
