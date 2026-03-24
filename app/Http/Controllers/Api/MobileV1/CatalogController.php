<?php

namespace App\Http\Controllers\Api\MobileV1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Models\Category;
use App\Models\Product;
use App\Services\CampaignBannerResolver;
use App\Services\Mobile\MobileCatalogPresenter;
use Illuminate\Http\Request;
use Illuminate\Pagination\LengthAwarePaginator;

class CatalogController extends Controller
{
    use RespondsWithApi;

    public function __construct(
        private readonly MobileCatalogPresenter $presenter,
        private readonly CampaignBannerResolver $campaignBannerResolver,
    ) {
    }

    public function home()
    {
        $campaign = $this->campaignBannerResolver->resolve();
        $categories = Category::query()
            ->orderBy('name')
            ->get()
            ->map(fn ($category) => $this->presenter->category($category))
            ->values()
            ->all();

        $sections = [
            [
                'key' => 'featured',
                'title' => 'Featured',
                'collection' => 'featured',
                'items' => Product::query()->with('category')->featured()->latest()->take(8)->get()
                    ->map(fn ($product) => $this->presenter->productCard($product))
                    ->values()
                    ->all(),
            ],
            [
                'key' => 'deals-today',
                'title' => 'Deals today',
                'collection' => 'deals-today',
                'items' => Product::query()->with('category')->where(function ($query) {
                    $query->where('is_featured', true)->orWhere('discount', '>', 0);
                })->orderByDesc('discount')->latest()->take(8)->get()
                    ->map(fn ($product) => $this->presenter->productCard($product, ['badge' => 'Oferta del dia']))
                    ->values()
                    ->all(),
            ],
            [
                'key' => 'new-arrivals',
                'title' => 'New arrivals',
                'collection' => 'new-arrivals',
                'items' => Product::query()->with('category')->newArrival()->latest()->take(8)->get()
                    ->map(fn ($product) => $this->presenter->productCard($product, ['badge' => 'Nuevo']))
                    ->values()
                    ->all(),
            ],
            [
                'key' => 'fast-shipping',
                'title' => 'Fast shipping',
                'collection' => 'fast-shipping',
                'items' => Product::query()->with('category')->fastShipping()->latest()->take(8)->get()
                    ->map(fn ($product) => $this->presenter->productCard($product, ['badge' => 'Envio rapido']))
                    ->values()
                    ->all(),
            ],
        ];

        return $this->success([
            'campaign' => [
                'campaign' => $campaign['campaign'],
                'mode' => $campaign['mode'],
                'auto_campaign' => $campaign['auto_campaign'],
                'banners' => [
                    'hero' => collect($campaign['banners']['hero'] ?? [])->map(fn ($banner) => $this->presenter->banner($banner))->values()->all(),
                    'showcase' => collect($campaign['banners']['showcase'] ?? [])->map(fn ($banner) => $this->presenter->banner($banner))->values()->all(),
                    'sidebar' => collect($campaign['banners']['sidebar'] ?? [])->map(fn ($banner) => $this->presenter->banner($banner))->values()->all(),
                    'general' => collect($campaign['banners']['general'] ?? [])->map(fn ($banner) => $this->presenter->banner($banner))->values()->all(),
                ],
            ],
            'categories' => $categories,
            'sections' => $sections,
        ]);
    }

    public function suggestions(Request $request)
    {
        $data = $request->validate([
            'query' => ['required', 'string', 'min:2'],
            'limit' => ['nullable', 'integer', 'min:1', 'max:10'],
        ]);

        $term = trim($data['query']);
        $limit = $data['limit'] ?? 6;

        $products = Product::query()
            ->with('category:id,name,slug')
            ->where(function ($query) use ($term) {
                $like = "%{$term}%";
                $query->where('name', 'like', $like)
                    ->orWhere('description', 'like', $like)
                    ->orWhereHas('details', fn ($details) => $details->where('specifications', 'like', $like));
            })
            ->orderByDesc('created_at')
            ->limit($limit)
            ->get()
            ->map(fn ($product) => [
                'id' => $product->id,
                'name' => $product->name,
                'price' => (float) $product->price,
                'image_url_full' => $product->image_url_full ?? $product->image_url,
                'category' => $product->category ? $this->presenter->category($product->category)['name'] : null,
            ])
            ->values()
            ->all();

        return $this->success($products, ['query' => $term]);
    }

    public function products(Request $request)
    {
        $data = $request->validate([
            'query' => ['nullable', 'string', 'min:2'],
            'category_slug' => ['nullable', 'string', 'exists:categories,slug'],
            'min_price' => ['nullable', 'numeric', 'min:0'],
            'max_price' => ['nullable', 'numeric', 'gte:min_price'],
            'sort' => ['nullable', 'in:relevance,price_asc,price_desc,recent,rating'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $builder = Product::query()
            ->with(['category:id,name,slug'])
            ->withAvg('reviews as reviews_average_rating', 'rating')
            ->withCount('reviews');

        if (!empty($data['query'])) {
            $term = $data['query'];
            $builder->where(function ($query) use ($term) {
                $query->where('name', 'like', "%{$term}%")
                    ->orWhere('description', 'like', "%{$term}%")
                    ->orWhereHas('details', fn ($details) => $details->where('specifications', 'like', "%{$term}%"));
            });
        }

        if (!empty($data['category_slug'])) {
            $builder->whereHas('category', fn ($category) => $category->where('slug', $data['category_slug']));
        }

        if (isset($data['min_price'])) {
            $builder->where('price', '>=', $data['min_price']);
        }

        if (isset($data['max_price'])) {
            $builder->where('price', '<=', $data['max_price']);
        }

        match ($data['sort'] ?? 'relevance') {
            'price_asc' => $builder->orderBy('price'),
            'price_desc' => $builder->orderByDesc('price'),
            'recent' => $builder->latest('products.created_at'),
            'rating' => $builder->orderByDesc('reviews_average_rating')->orderByDesc('products.created_at'),
            default => $builder->orderByDesc('reviews_average_rating')->orderByDesc('products.created_at'),
        };

        $paginator = $builder->paginate($data['per_page'] ?? 12)->withQueryString();

        return $this->paginated(
            $paginator,
            collect($paginator->items())->map(fn ($product) => $this->presenter->productCard($product))->values()->all(),
            [
                'filters' => [
                    'query' => $data['query'] ?? null,
                    'category_slug' => $data['category_slug'] ?? null,
                    'min_price' => $data['min_price'] ?? null,
                    'max_price' => $data['max_price'] ?? null,
                    'sort' => $data['sort'] ?? 'relevance',
                ],
            ]
        );
    }

    public function show(int $id)
    {
        $product = Product::query()
            ->with(['category:id,name,slug', 'details', 'images', 'reviews'])
            ->withAvg('reviews as reviews_average_rating', 'rating')
            ->withCount('reviews')
            ->findOrFail($id);

        $reviews = $product->reviews
            ->map(fn ($review) => [
                'id' => $review->id,
                'author' => $review->author,
                'rating' => (int) $review->rating,
                'comment' => $review->comment,
                'created_at' => optional($review->created_at)?->toISOString(),
            ])
            ->values()
            ->all();

        $relatedProducts = $product->category
            ? $product->category->products()->where('id', '!=', $product->id)->with('category')->take(6)->get()
                ->map(fn ($related) => $this->presenter->productCard($related))
                ->values()
                ->all()
            : [];

        return $this->success($this->presenter->productDetail($product, $reviews, $relatedProducts));
    }

    public function categories()
    {
        $categories = Category::query()
            ->orderBy('name')
            ->get()
            ->map(fn ($category) => $this->presenter->category($category))
            ->values()
            ->all();

        return $this->success($categories);
    }

    public function category(string $slug, Request $request)
    {
        $request->validate([
            'sort' => ['nullable', 'in:relevance,price_asc,price_desc,recent,rating'],
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $category = Category::query()->where('slug', $slug)->firstOrFail();

        $builder = $category->products()
            ->with('category:id,name,slug')
            ->withAvg('reviews as reviews_average_rating', 'rating')
            ->withCount('reviews');

        match ($request->string('sort')->toString() ?: 'relevance') {
            'price_asc' => $builder->orderBy('price'),
            'price_desc' => $builder->orderByDesc('price'),
            'recent' => $builder->latest('products.created_at'),
            'rating' => $builder->orderByDesc('reviews_average_rating')->orderByDesc('products.created_at'),
            default => $builder->latest('products.created_at'),
        };

        $paginator = $builder->paginate($request->integer('per_page', 12))->withQueryString();

        return $this->paginated(
            $paginator,
            [
                'category' => $this->presenter->category($category),
                'products' => collect($paginator->items())->map(fn ($product) => $this->presenter->productCard($product))->values()->all(),
            ]
        );
    }

    public function special(string $collection, Request $request)
    {
        $request->validate([
            'page' => ['nullable', 'integer', 'min:1'],
            'per_page' => ['nullable', 'integer', 'min:1', 'max:48'],
        ]);

        $builder = Product::query()->with('category:id,name,slug');
        $badge = null;

        switch ($collection) {
            case 'deals-today':
                $builder->where(function ($query) {
                    $query->where('is_featured', true)->orWhere('discount', '>', 0);
                })->orderByDesc('discount')->latest();
                $badge = 'Oferta del dia';
                break;
            case 'superdeals':
                $builder->superdeal()->orderByDesc('discount')->latest();
                $badge = 'Super deal';
                break;
            case 'new-arrivals':
                $builder->newArrival()->latest();
                $badge = 'Nuevo';
                break;
            case 'seasonal-products':
                $builder->seasonal()->latest();
                $badge = 'Temporada actual';
                break;
            case 'fast-shipping':
                $builder->fastShipping()->latest();
                $badge = 'Envio rapido';
                break;
            default:
                return $this->error('Collection not found.', 'not_found', 404);
        }

        $paginator = $builder->paginate($request->integer('per_page', 12))->withQueryString();

        return $this->paginated(
            $paginator,
            collect($paginator->items())->map(fn ($product) => $this->presenter->productCard($product, ['badge' => $badge]))->values()->all(),
            ['collection' => $collection]
        );
    }
}
