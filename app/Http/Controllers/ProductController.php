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
use App\Support\CatalogDataLocalizer;
use Illuminate\Support\Str;

class ProductController extends Controller
{
    public function showTemporaryProducts(): Response
    {
        $temporaryProducts = TemporaryProduct::all();
        $categories = Category::all(['id', 'name']);

        return Inertia::render('Admin/SelectProducts', [
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
        $product = Product::with(['category', 'images'])->findOrFail($id);

        // Construye el array de imágenes: principal + auxiliares
        $gallery = [];
        if ($product->image_url) {
            // Si la imagen principal es absoluta, úsala tal cual
            $gallery[] = $product->image_url;
        }
        foreach ($product->images as $img) {
            if ($img->image_url) {
                // Si la imagen es absoluta, úsala tal cual
                $gallery[] = $img->image_url;
            }
        }
        $gallery = array_unique($gallery);

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
                'discount' => $product->discount ?? '0%',
                'stock' => $product->stock,
                'sold_count' => 159,
                'rating' => 4.6,
                'image_url' => $product->image_url,
                'gallery' => $gallery,
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
        $catalogLocalizer = app(CatalogDataLocalizer::class);

        $products = Product::with('category')
            ->where(function ($query) {
                $query->where('is_featured', true)
                    ->orWhere('discount', '>', 0);
            })
            ->orderByDesc('discount')
            ->latest()
            ->take(24)
            ->get();

        return response()->json(
            $products->map(fn (Product $product) => $this->specialProductPayload(
                $product,
                $catalogLocalizer,
                'Oferta del dia',
                'Seleccion del dia con precio rebajado y disponibilidad confirmada en el catalogo.'
            ))
        );
    }

    public function newArrivals()
    {
        $catalogLocalizer = app(CatalogDataLocalizer::class);

        $products = Product::with('category')
            ->newArrival()
            ->latest()
            ->take(24)
            ->get();

        return response()->json(
            $products->map(fn (Product $product) => $this->specialProductPayload(
                $product,
                $catalogLocalizer,
                'Nuevo',
                'Recien incorporado al catalogo con stock operativo y ficha completa.'
            ))
        );
    }

    public function seasonalProducts()
    {
        $catalogLocalizer = app(CatalogDataLocalizer::class);

        $products = Product::with('category')
            ->seasonal()
            ->latest()
            ->take(24)
            ->get();

        return response()->json(
            $products->map(fn (Product $product) => $this->specialProductPayload(
                $product,
                $catalogLocalizer,
                'Temporada actual',
                'Producto activo en la seleccion de temporada con salida vigente en tienda.'
            ))
        );
    }

    public function superdeals()
    {
        $catalogLocalizer = app(CatalogDataLocalizer::class);

        $products = Product::with('category')
            ->superdeal()
            ->orderByDesc('discount')
            ->latest()
            ->get()
            ->map(fn (Product $product) => $this->specialProductPayload(
                $product,
                $catalogLocalizer,
                'Super deal',
                'Oferta priorizada por margen de ahorro real y disponibilidad inmediata.'
            ));

        return response()->json($products);
    }

    public function fastShipping()
    {
        $catalogLocalizer = app(CatalogDataLocalizer::class);

        $products = Product::with('category')
            ->fastShipping()
            ->latest()
            ->get()
            ->map(fn (Product $product) => $this->specialProductPayload(
                $product,
                $catalogLocalizer,
                'Envio rapido',
                'Preparado para salida agil con seguimiento y confirmacion de stock.'
            ));

        return response()->json($products);
    }

    public function fastShippingPage(): Response
    {
        $catalogLocalizer = app(CatalogDataLocalizer::class);

        $products = Product::with('category')
            ->fastShipping()
            ->latest()
            ->get()
            ->map(fn (Product $product) => $this->specialProductPayload(
                $product,
                $catalogLocalizer,
                'Envio rapido',
                'Preparado para salida agil con seguimiento y confirmacion de stock.'
            ));

        return Inertia::render('Special/FastShipping', [
            'products' => $products,
        ]);
    }

    private function specialProductPayload(
        Product $product,
        CatalogDataLocalizer $catalogLocalizer,
        string $badge,
        string $fallbackDescription
    ): array {
        $originalPrice = $this->deriveOriginalPrice($product);
        $description = $this->resolveShortDescription($product, $fallbackDescription);

        return $catalogLocalizer->productPayload($product, [
            'title' => $product->name,
            'description' => $description,
            'short_description' => $description,
            'image' => $product->image_url,
            'image_url' => $product->image_url,
            'old_price' => $originalPrice,
            'original_price' => $originalPrice,
            'discount' => (int) ($product->discount ?? 0),
            'link' => route('product.details', $product->id),
            'badge' => $badge,
            'is_new' => (bool) $product->is_new_arrival,
            'fast_shipping' => (bool) $product->is_fast_shipping,
            'season' => $product->is_seasonal ? 'Temporada actual' : null,
            'delivery_estimate' => $product->is_fast_shipping ? 'Entrega estimada en 24-48 h' : null,
        ]);
    }

    private function deriveOriginalPrice(Product $product): ?float
    {
        if (isset($product->original_price) && is_numeric($product->original_price)) {
            return (float) $product->original_price;
        }

        if ((int) $product->discount <= 0 || (float) $product->price <= 0) {
            return null;
        }

        return round((float) $product->price / (1 - ((int) $product->discount / 100)), 2);
    }

    private function resolveShortDescription(Product $product, string $fallback): string
    {
        $description = trim((string) $product->description);

        if ($description === '') {
            return $fallback;
        }

        return Str::limit(preg_replace('/\s+/', ' ', strip_tags($description)), 140, '...');
    }
}
