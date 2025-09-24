<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Product;
use App\Models\TemporaryProduct;
use Inertia\Inertia;
use Inertia\Response;
use Illuminate\Support\Facades\Log;
use App\Models\Category;
use Illuminate\Support\Facades\DB;

class ProductController extends Controller
{
    public function showTemporaryProducts(): Response
    {
        $temporaryProducts = TemporaryProduct::all();
        $categories = Category::all(['id', 'name']);

        return Inertia::render('SelectProducts', [
            'temporaryProducts' => $temporaryProducts,
            'categories' => $categories,
            'migratedProducts' => session('migratedProducts') ?? [],
            'error' => session('error'),
        ]);
    }

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

        return redirect()->route('products.select')->with('success', 'Producto agregado temporalmente.');
    }

    public function migrateSelectedProducts(Request $request)
    {
        Log::info("🔹 Recibiendo datos en migrateSelectedProducts:", $request->all());

        try {
            $validated = $request->validate([
                'selected_products' => 'required|array',
                'selected_products.*.id' => 'required|exists:temporary_products,id',
                'selected_products.*.name' => 'required|string|max:255',
                'selected_products.*.description' => 'nullable|string',
                'selected_products.*.price' => 'required|numeric',
                'selected_products.*.image_url' => 'nullable|string|max:255',
                'selected_products.*.stock' => 'required|integer|min:0',
                'selected_products.*.category_id' => 'required|exists:categories,id',
                'selected_products.*.is_adult' => 'boolean',
                'selected_products.*.link' => 'nullable|string|max:255',
            ]);

            Log::info("🔹 Validación exitosa", ['data' => $validated]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error("❌ Error de validación", ['errors' => $e->errors()]);
            return redirect()->route('products.select')
                ->with('error', 'Error de validación: ' . json_encode($e->errors()));
        }

        $migratedProducts = [];

        DB::beginTransaction();
        try {
            foreach ($validated['selected_products'] as $productData) {
                $temp = TemporaryProduct::find($productData['id']);

                if (!$temp) {
                    Log::warning("⚠️ Producto temporal no encontrado", ['id' => $productData['id']]);
                    continue;
                }

                $product = Product::create([
                    'name' => $productData['name'],
                    'description' => $productData['description'] ?? '',
                    'price' => $productData['price'],
                    'image_url' => $productData['image_url'] ?? '',
                    'stock' => $productData['stock'],
                    'category_id' => $productData['category_id'],
                    'is_adult' => $productData['is_adult'],
                    'link' => $productData['link'] ?? null,
                ]);

                Log::info("✅ Producto migrado", ['product' => $product]);

                $migratedProducts[] = $product->name;

                $temp->delete();
                Log::info("🗑️ Producto temporal eliminado", ['id' => $temp->id]);
            }

            DB::commit();

            return redirect()->route('products.select')
                ->with('migratedProducts', $migratedProducts);
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Error al migrar productos: " . $e->getMessage());

            return redirect()->route('products.select')
                ->with('error', 'Hubo un error al migrar los productos.');
        }
    }

    public function show($id)
    {
        $product = Product::with('category')->findOrFail($id);

        $relatedProducts = [];

        if ($product->category) {
            $relatedProducts = $product->category
                ->products()
                ->where('id', '!=', $product->id)
                ->take(10)
                ->get(['id', 'name', 'price', 'image_url']);
        }

        return Inertia::render('ProductPageLayout', [
            'product' => [
                'id' => $product->id,
                'name' => $product->name,
                'description' => $product->description,
                'price' => $product->price,
                'original_price' => $product->original_price ?? ($product->price * 1.3),
                'discount' => '30%',
                'stock' => $product->stock,
                'sold_count' => 159,
                'rating' => 4.6,
                'image_url' => $product->image_url,
                'gallery' => [
                    $product->image_url,
                    $product->image_url,
                    $product->image_url
                ],
                'colors' => ['Verde', 'Azul', 'Rosa', 'Negro'],
                'sizes' => ['A3', 'A4', 'A5'],
                'category' => [
                    'id' => optional($product->category)->id,
                    'name' => optional($product->category)->name,
                ],
            ],
            'relatedProducts' => $relatedProducts,
        ]);
    }

    public function dealsToday()
    {
        // Ejemplo: productos con descuento o destacados
        $deals = \App\Models\Product::where('is_featured', true)
            ->orWhere('discount', '>', 0)
            ->orderByDesc('discount')
            ->take(10)
            ->get(['id', 'name as title', 'description', 'image_url as image', 'discount', 'slug']);

        // Puedes mapear el formato aquí si lo necesitas
        $deals = $deals->map(function($deal) {
            return [
                'id' => $deal->id,
                'title' => $deal->title,
                'description' => $deal->description,
                'image' => $deal->image,
                'link' => route('product.details', $deal->id),
                'discount' => $deal->discount ? $deal->discount . '% OFF' : 'Oferta',
            ];
        });

        return response()->json($deals);
    }

    public function superdeals()
    {
        // Asegúrate de traer todos los campos necesarios para el frontend
        $products = \App\Models\Product::where('is_superdeal', true)
            ->orderByDesc('discount')
            ->get()
            ->map(function($p) {
                return [
                    'id' => $p->id,
                    'title' => $p->name,
                    'name' => $p->name,
                    'description' => $p->description,
                    'image' => $p->image_url,
                    'image_url' => $p->image_url,
                    'price' => $p->price,
                    'old_price' => $p->discount > 0 ? round($p->price / (1 - $p->discount / 100), 2) : null,
                    'discount' => $p->discount,
                    'link' => route('product.details', $p->id),
                    'stock' => $p->stock,
                    'category_id' => $p->category_id,
                ];
            });

        return response()->json($products);
    }

    public function fastShipping()
    {
        $products = \App\Models\Product::where('is_fast_shipping', true)
            ->orderByDesc('created_at')
            ->get()
            ->map(function($p) {
                return [
                    'id' => $p->id,
                    'name' => $p->name,
                    'description' => $p->description,
                    'image_url' => $p->image_url,
                    'price' => $p->price,
                    'discount' => $p->discount,
                    'stock' => $p->stock,
                    'category_id' => $p->category_id,
                    'image_url_full' => $p->image_url_full,
                ];
            });

        return response()->json($products);
    }
}
