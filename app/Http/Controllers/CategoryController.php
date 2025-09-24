<?php

namespace App\Http\Controllers;

use App\Models\Category;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function show($id)
    {
        $category = Category::with('products')->findOrFail($id);

        return Inertia::render('CategoryPage', [
            'category'   => $category,
            'products'   => $category->products,
            'categories' => Category::all(), // ✅ añadido
            'auth'       => [
                'user' => auth()->user(),
            ],
        ]);
    }

    public function showBySlug($slug)
    {
        $category = Category::where('slug', $slug)->firstOrFail();
        $products = $category->products()->with('category')->latest()->get()
    ->map(fn($product) => [
        'id' => $product->id,
        'name' => $product->name,
        'price' => $product->price,
        'stock' => $product->stock,
        'image_url' => $product->image_url,
        'category' => [
            'id' => $product->category->id ?? null,
            'name' => $product->category->name ?? 'Sin categoría',
        ],
        'is_adult' => $product->is_adult,
        'link' => $product->link,
    ]);


        $banners = [
            'category' => [], // Aquí puedes cargar banners específicos
            'default'  => [], // O banners generales
        ];

        return Inertia::render('CategoryPage', [
            'category'   => $category,
            'products'   => $products,
            'categories' => Category::all(), // ✅ añadido
            'banners'    => $banners,
            'auth'       => [
                'user' => auth()->user(),
            ],
        ]);
    }
}
