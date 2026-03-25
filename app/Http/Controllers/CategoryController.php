<?php

namespace App\Http\Controllers;

use App\Models\Category;
use App\Support\CatalogDataLocalizer;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CategoryController extends Controller
{
    public function show($id)
    {
        $catalogLocalizer = app(CatalogDataLocalizer::class);
        $category = Category::with('products')->findOrFail($id);

        return Inertia::render('Shop/CategoryPage', [
            'category'   => $catalogLocalizer->categoryPayload($category),
            'products'   => $category->products->load('category')->map(fn ($product) => $catalogLocalizer->productPayload($product)),
            'categories' => Category::all()->map(fn ($item) => $catalogLocalizer->categoryPayload($item)),
            'auth'       => [
                'user' => auth()->user(),
            ],
        ]);
    }

    public function showBySlug($slug)
    {
        $catalogLocalizer = app(CatalogDataLocalizer::class);
        $category = Category::where('slug', $slug)->firstOrFail();
        $products = $category->products()->with('category')->latest()->get()
            ->map(fn ($product) => $catalogLocalizer->productPayload($product));


        $banners = [
            'category' => [], // Aquí puedes cargar banners específicos
            'default'  => [], // O banners generales
        ];

        return Inertia::render('Shop/CategoryPage', [
            'category'   => $catalogLocalizer->categoryPayload($category),
            'products'   => $products,
            'categories' => Category::all()->map(fn ($item) => $catalogLocalizer->categoryPayload($item)),
            'banners'    => $banners,
            'auth'       => [
                'user' => auth()->user(),
            ],
        ]);
    }
}
