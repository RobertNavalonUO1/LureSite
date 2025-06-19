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
    // Mostrar productos temporales y categorías
    public function showTemporaryProducts(): Response
    {
        $temporaryProducts = TemporaryProduct::all();
        $categories = Category::all(['id', 'name']);

        return Inertia::render('SelectProducts', [
            'temporaryProducts' => $temporaryProducts,
            'categories' => $categories
        ]);
    }

    // Guardar un producto en la tabla temporal
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

    // Migrar productos seleccionados a la tabla 'products'
    public function migrateSelectedProducts(Request $request)
    {
        Log::info("🔹 Recibiendo datos en migrateSelectedProducts:", $request->all());

        try {
            $validated = $request->validate([
                'selected_products' => 'required|array',
                'selected_products.*.id' => 'required|exists:temporary_products,id',
                'selected_products.*.stock' => 'required|integer|min:0',
                'selected_products.*.category_id' => 'required|exists:categories,id',
                'selected_products.*.is_adult' => 'boolean',
            ]);

            Log::info("🔹 Validación exitosa", ['data' => $validated]);
        } catch (\Illuminate\Validation\ValidationException $e) {
            Log::error("❌ Error de validación", ['errors' => $e->errors()]);
            return redirect()->route('products.select')->with('error', 'Error de validación: ' . json_encode($e->errors()));
        }

        DB::beginTransaction();
        try {
            foreach ($validated['selected_products'] as $productData) {
                $temp = TemporaryProduct::find($productData['id']);

                if (!$temp) {
                    Log::warning("⚠️ Producto temporal no encontrado", ['id' => $productData['id']]);
                    continue;
                }

                Log::info("🔹 Creando producto desde temporal", ['temp' => $temp]);

                $product = Product::create([
                    'name' => $temp->title,
                    'price' => $temp->price,
                    'image_url' => $temp->image_url,
                    'description' => "Descuento: {$temp->discount} | Vendidos: {$temp->sold_count} | Valoración: {$temp->rating}",
                    'stock' => $productData['stock'],
                    'category_id' => $productData['category_id'],
                    'is_adult' => $productData['is_adult'] ?? false,
                    'link' => $temp->product_url ?? '/product/' . str_replace(' ', '-', strtolower($temp->title))
                ]);

                Log::info("✅ Producto migrado con éxito", ['product' => $product]);

                $temp->delete();
                Log::info("🗑️ Producto temporal eliminado", ['id' => $temp->id]);
            }

            DB::commit();
            return redirect()->route('products.select')->with('success', 'Productos migrados con éxito.');
        } catch (\Exception $e) {
            DB::rollBack();
            Log::error("❌ Error al migrar productos: " . $e->getMessage());
            return redirect()->route('products.select')->with('error', 'Hubo un error al migrar los productos.');
        }
    }
}
