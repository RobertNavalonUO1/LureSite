<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\TemporaryProduct;
use App\Models\Category;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;

class AddProdukController extends Controller
{
    // Muestra el formulario con los productos temporales
    public function create(): Response
    {
        $temporaryProducts = TemporaryProduct::all();
        $categories = Category::all(['id', 'name']);

        return Inertia::render('AddProduct', [
            'temporaryProducts' => $temporaryProducts,
            'categories' => $categories
        ]);
    }

    // Guarda el producto en la base de datos principal
    public function store(Request $request)
    {
        Log::info('Solicitud recibida en AddProdukController@store', ['data' => $request->all()]);

        $validated = $request->validate([
            'name' => 'required|string|max:255',
            'description' => 'nullable|string',
            'price' => 'required|numeric|min:0',
            'image_url' => 'nullable|url',
            'stock' => 'required|integer|min:0',
            'category_id' => 'required|exists:categories,id',
            'is_adult' => 'boolean',
            'link' => 'nullable|url',
        ]);

        $product = Product::create($validated);
        Log::info('Producto creado con éxito', ['product' => $product]);

        return redirect()->route('products.create')->with('success', 'Producto agregado correctamente.');
    }

    // Guarda un producto en la tabla temporal
    public function storeTemporaryProduct(Request $request)
    {
        $validated = $request->validate([
            'title' => 'required|string|max:500',
            'price' => 'required|numeric|min:0',
            'original_price' => 'nullable|numeric|min:0',
            'discount' => 'nullable|string|max:50',
            'sold_count' => 'nullable|string|max:100',
            'rating' => 'nullable|string|max:10',
            'image_url' => 'nullable|url|max:500',
            'product_url' => 'nullable|url',
        ]);

        $tempProduct = TemporaryProduct::create($validated);
        Log::info("Producto temporal agregado", ['product' => $tempProduct]);

        return redirect()->route('products.create')->with('success', 'Producto agregado temporalmente.');
    }

}
