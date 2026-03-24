<?php

namespace App\Http\Controllers\Admin;

use App\Http\Controllers\Controller;
use App\Models\Category;
use App\Models\Product;
use App\Models\TemporaryProduct;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class ProductController extends Controller
{
    private const COMMERCIAL_STATES = [
        'base' => [],
        'featured' => ['is_featured'],
        'superdeal' => ['is_superdeal'],
        'fast_shipping' => ['is_fast_shipping'],
        'new_arrival' => ['is_new_arrival'],
        'seasonal' => ['is_seasonal'],
    ];

    public function index(Request $request): Response
    {
        $filters = $this->validatedFilters($request);

        return Inertia::render('Admin/ProductManager', [
            'initialProducts' => $this->productsPayload($filters),
            'initialStats' => $this->statsPayload(),
            'filters' => $filters,
            'categories' => Category::orderBy('name')->get(['id', 'name']),
            'commercialStates' => $this->commercialStateOptions(),
        ]);
    }

    public function list(Request $request): JsonResponse
    {
        $filters = $this->validatedFilters($request);

        return response()->json([
            'products' => $this->productsPayload($filters),
            'stats' => $this->statsPayload(),
            'filters' => $filters,
        ]);
    }

    public function store(Request $request): JsonResponse
    {
        $validated = $this->validatedProductPayload($request);

        $product = Product::create($this->mapProductAttributes($validated));
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Producto creado correctamente.',
            'product' => $this->productPayload($product),
            'stats' => $this->statsPayload(),
        ], 201);
    }

    public function update(Request $request, Product $product): JsonResponse
    {
        $validated = $this->validatedProductPayload($request, true);

        $product->fill($this->mapProductAttributes($validated, $product));
        $product->save();
        $product->load('category');

        return response()->json([
            'success' => true,
            'message' => 'Producto actualizado correctamente.',
            'product' => $this->productPayload($product),
            'stats' => $this->statsPayload(),
        ]);
    }

    public function destroy(Product $product): JsonResponse
    {
        $product->delete();

        return response()->json([
            'success' => true,
            'message' => 'Producto eliminado correctamente.',
            'stats' => $this->statsPayload(),
        ]);
    }

    public function bulkUpdate(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:products,id'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'commercial_state' => ['nullable', Rule::in(array_keys(self::COMMERCIAL_STATES))],
            'price_action' => ['nullable', Rule::in(['set', 'delta_fixed', 'delta_percent'])],
            'price_value' => ['nullable', 'numeric'],
        ]);

        $hasCategory = array_key_exists('category_id', $validated) && $validated['category_id'];
        $hasState = array_key_exists('commercial_state', $validated) && $validated['commercial_state'];
        $hasPrice = !empty($validated['price_action']) && array_key_exists('price_value', $validated);

        if (!$hasCategory && !$hasState && !$hasPrice) {
            return response()->json([
                'success' => false,
                'message' => 'Selecciona al menos un cambio masivo para aplicar.',
            ], 422);
        }

        $products = Product::whereIn('id', $validated['ids'])->get();

        foreach ($products as $product) {
            if ($hasCategory) {
                $product->category_id = $validated['category_id'];
            }

            if ($hasState) {
                $this->applyCommercialStateToModel($product, $validated['commercial_state']);
            }

            if ($hasPrice) {
                $product->price = $this->calculateBulkPrice(
                    (float) $product->price,
                    $validated['price_action'],
                    (float) $validated['price_value']
                );
            }

            $product->save();
        }

        return response()->json([
            'success' => true,
            'message' => 'Actualización masiva aplicada correctamente.',
            'stats' => $this->statsPayload(),
        ]);
    }

    public function bulkDestroy(Request $request): JsonResponse
    {
        $validated = $request->validate([
            'ids' => ['required', 'array', 'min:1'],
            'ids.*' => ['integer', 'exists:products,id'],
        ]);

        Product::whereIn('id', $validated['ids'])->delete();

        return response()->json([
            'success' => true,
            'message' => 'Productos eliminados correctamente.',
            'stats' => $this->statsPayload(),
        ]);
    }

    private function validatedFilters(Request $request): array
    {
        $validated = $request->validate([
            'search' => ['nullable', 'string', 'max:120'],
            'category_id' => ['nullable', 'integer', 'exists:categories,id'],
            'price_min' => ['nullable', 'numeric', 'min:0'],
            'price_max' => ['nullable', 'numeric', 'min:0'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:5', 'max:50'],
        ]);

        return [
            'search' => trim((string) ($validated['search'] ?? '')),
            'category_id' => isset($validated['category_id']) ? (int) $validated['category_id'] : null,
            'price_min' => isset($validated['price_min']) ? (float) $validated['price_min'] : null,
            'price_max' => isset($validated['price_max']) ? (float) $validated['price_max'] : null,
            'page' => isset($validated['page']) ? (int) $validated['page'] : 1,
            'per_page' => isset($validated['per_page']) ? (int) $validated['per_page'] : 10,
        ];
    }

    private function validatedProductPayload(Request $request, bool $partial = false): array
    {
        $required = $partial ? 'sometimes' : 'required';

        return $request->validate([
            'name' => [$required, 'string', 'max:255'],
            'description' => ['nullable', 'string'],
            'price' => [$required, 'numeric', 'min:0'],
            'image_url' => ['nullable', 'url', 'max:2048'],
            'stock' => [$required, 'integer', 'min:0'],
            'category_id' => [$required, 'integer', 'exists:categories,id'],
            'is_adult' => ['nullable', 'boolean'],
            'link' => ['nullable', 'url', 'max:2048'],
            'discount' => ['nullable', 'integer', 'min:0', 'max:100'],
            'commercial_state' => ['nullable', Rule::in(array_keys(self::COMMERCIAL_STATES))],
        ]);
    }

    private function productsPayload(array $filters): array
    {
        $paginator = $this->buildProductsQuery($filters)
            ->paginate($filters['per_page'], ['*'], 'page', $filters['page'])
            ->withQueryString();

        return [
            'data' => $paginator->getCollection()->map(fn (Product $product) => $this->productPayload($product))->values(),
            'meta' => [
                'current_page' => $paginator->currentPage(),
                'last_page' => $paginator->lastPage(),
                'per_page' => $paginator->perPage(),
                'total' => $paginator->total(),
                'from' => $paginator->firstItem(),
                'to' => $paginator->lastItem(),
            ],
        ];
    }

    private function buildProductsQuery(array $filters)
    {
        return Product::query()
            ->with('category')
            ->when($filters['search'], function ($query, $search) {
                $query->where(function ($innerQuery) use ($search) {
                    $innerQuery->where('products.name', 'like', '%' . $search . '%')
                        ->orWhere('products.description', 'like', '%' . $search . '%')
                        ->orWhereHas('category', fn ($categoryQuery) => $categoryQuery->where('name', 'like', '%' . $search . '%'));
                });
            })
            ->when($filters['category_id'], fn ($query, $categoryId) => $query->where('category_id', $categoryId))
            ->when($filters['price_min'] !== null, fn ($query) => $query->where('price', '>=', $filters['price_min']))
            ->when($filters['price_max'] !== null, fn ($query) => $query->where('price', '<=', $filters['price_max']))
            ->orderByDesc('created_at');
    }

    private function productPayload(Product $product): array
    {
        return [
            'id' => $product->id,
            'name' => $product->name,
            'description' => $product->description,
            'price' => round((float) $product->price, 2),
            'image_url' => $product->image_url,
            'stock' => (int) $product->stock,
            'link' => $product->link,
            'is_adult' => (bool) $product->is_adult,
            'discount' => (int) ($product->discount ?? 0),
            'commercial_state' => $this->commercialStateForProduct($product),
            'category' => $product->category ? [
                'id' => $product->category->id,
                'name' => $product->category->name,
            ] : null,
            'created_at' => $product->created_at?->toIso8601String(),
        ];
    }

    private function statsPayload(): array
    {
        return [
            'active_products' => Product::count(),
            'temporary_products' => TemporaryProduct::count(),
            'categories' => Category::count(),
            'imported_links' => Product::whereNotNull('link')->where('link', '!=', '')->count() + TemporaryProduct::count(),
        ];
    }

    private function commercialStateOptions(): array
    {
        return [
            ['value' => 'base', 'label' => 'Base'],
            ['value' => 'featured', 'label' => 'Destacado'],
            ['value' => 'superdeal', 'label' => 'Superdeal'],
            ['value' => 'fast_shipping', 'label' => 'Envio rapido'],
            ['value' => 'new_arrival', 'label' => 'Nuevo'],
            ['value' => 'seasonal', 'label' => 'Estacional'],
        ];
    }

    private function commercialStateForProduct(Product $product): string
    {
        foreach (self::COMMERCIAL_STATES as $state => $flags) {
            if ($state === 'base') {
                continue;
            }

            foreach ($flags as $flag) {
                if ($product->{$flag}) {
                    return $state;
                }
            }
        }

        return 'base';
    }

    private function mapProductAttributes(array $validated, ?Product $existing = null): array
    {
        $attributes = [
            'name' => $validated['name'] ?? $existing?->name,
            'description' => $validated['description'] ?? $existing?->description,
            'price' => array_key_exists('price', $validated) ? round((float) $validated['price'], 2) : $existing?->price,
            'image_url' => $validated['image_url'] ?? $existing?->image_url,
            'stock' => array_key_exists('stock', $validated) ? (int) $validated['stock'] : $existing?->stock,
            'category_id' => $validated['category_id'] ?? $existing?->category_id,
            'is_adult' => array_key_exists('is_adult', $validated) ? (bool) $validated['is_adult'] : (bool) ($existing?->is_adult),
            'link' => $validated['link'] ?? $existing?->link,
            'discount' => array_key_exists('discount', $validated) ? (int) $validated['discount'] : (int) ($existing?->discount ?? 0),
        ];

        $state = $validated['commercial_state'] ?? $this->commercialStateForProduct($existing ?? new Product());
        $this->applyCommercialStateToArray($attributes, $state);

        return $attributes;
    }

    private function applyCommercialStateToArray(array &$attributes, string $state): void
    {
        foreach (['is_featured', 'is_superdeal', 'is_fast_shipping', 'is_new_arrival', 'is_seasonal'] as $flag) {
            $attributes[$flag] = false;
        }

        foreach (self::COMMERCIAL_STATES[$state] ?? [] as $flag) {
            $attributes[$flag] = true;
        }
    }

    private function applyCommercialStateToModel(Product $product, string $state): void
    {
        foreach (['is_featured', 'is_superdeal', 'is_fast_shipping', 'is_new_arrival', 'is_seasonal'] as $flag) {
            $product->{$flag} = false;
        }

        foreach (self::COMMERCIAL_STATES[$state] ?? [] as $flag) {
            $product->{$flag} = true;
        }
    }

    private function calculateBulkPrice(float $currentPrice, string $action, float $value): float
    {
        $nextPrice = match ($action) {
            'set' => $value,
            'delta_fixed' => $currentPrice + $value,
            'delta_percent' => $currentPrice * (1 + ($value / 100)),
            default => $currentPrice,
        };

        return round(max(0, $nextPrice), 2);
    }
}