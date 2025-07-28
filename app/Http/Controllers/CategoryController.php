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
            'category' => $category,
            'products' => $category->products,
            'auth' => [
                'user' => auth()->user()
            ],
        ]);
    }
}
