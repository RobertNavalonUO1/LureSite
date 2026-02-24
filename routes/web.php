<?php

use Illuminate\Support\Facades\Route;
use Illuminate\Support\Facades\{Auth, File, Log, Session};
use Inertia\Inertia;
use App\Models\{Product, Category};
use App\Http\Controllers\{
    DashboardController,
    ProfileController,
    CartController,
    CheckoutController,
    CouponController,
    AddressController,
    SearchController,
    ProductController,
    AddProdukController,
    AvatarController,
    PythonScriptController,
    ProductMigrationController,
    ContactController,
    OrderController,
    Auth\FirebaseLoginController,
    AdminController,
    CategoryController,
    ReviewController
};
use App\Services\CampaignBannerResolver;

/*
|--------------------------------------------------------------------------
| Landing-only mode (production)
|--------------------------------------------------------------------------
|
| If LANDING_ONLY=true (and APP_ENV=production), the app exposes only a
| single Inertia page: Landing/Universe.
|
| This keeps the full site code intact; disabling the flag restores all
| routes.
|
*/
if (app()->environment('production') && config('landing.only')) {
    Route::get('/{any?}', fn () => Inertia::render('Landing/Universe'))
        ->where('any', '.*')
        ->name('landing.universe');

    return;
}

/*
|--------------------------------------------------------------------------
| API (PÃºblicas)
|--------------------------------------------------------------------------
*/
Route::get('/banners', [\App\Http\Controllers\Api\BannerController::class, 'index']);
Route::get('/api/scripts', fn () => response()->json(
    collect(File::files(base_path('python_scripts')))
        ->filter(fn($file) => $file->getExtension() === 'py')
        ->map(fn($file) => $file->getFilename())
        ->values()
));
Route::get('/api/search/suggestions', [SearchController::class, 'suggest'])->name('search.suggestions');
Route::get('/api/deals-today', [ProductController::class, 'dealsToday']);
Route::get('/api/superdeals', [ProductController::class, 'superdeals']);
Route::get('/api/fast-shipping', [ProductController::class, 'fastShipping']);

/*
|--------------------------------------------------------------------------
| AutenticaciÃ³n con Firebase
|--------------------------------------------------------------------------
*/
Route::middleware(['web'])->group(function () {
    // Exempt Firebase login from CSRF to avoid 419 for SPA posts
    Route::post('/auth/firebase', [FirebaseLoginController::class, 'handle'])
        ->withoutMiddleware([\Illuminate\Foundation\Http\Middleware\VerifyCsrfToken::class])
        ->name('auth.firebase');
});

/*
|--------------------------------------------------------------------------
| Debug (solo local)
|--------------------------------------------------------------------------
*/
Route::get('/debug/firebase-ssl', function () {
    abort_unless(app()->environment('local'), 404);

    $url = 'https://www.googleapis.com/robot/v1/metadata/x509/securetoken@system.gserviceaccount.com';

    $result = [
        'app_env' => app()->environment(),
        'php_sapi' => PHP_SAPI,
        'php_version' => PHP_VERSION,
        'php_ini_loaded_file' => php_ini_loaded_file(),
        'curl.cainfo' => ini_get('curl.cainfo'),
        'openssl.cafile' => ini_get('openssl.cafile'),
        'env_FIREBASE_CA_BUNDLE' => env('FIREBASE_CA_BUNDLE'),
        'env_FIREBASE_HTTP_VERIFY' => env('FIREBASE_HTTP_VERIFY'),
        'test_url' => $url,
    ];

    if (!function_exists('curl_init')) {
        $result['curl'] = ['available' => false];
        return response()->json($result, 500);
    }

    $ch = curl_init($url);
    curl_setopt($ch, CURLOPT_RETURNTRANSFER, true);
    curl_setopt($ch, CURLOPT_TIMEOUT, 20);

    $body = curl_exec($ch);
    $errno = curl_errno($ch);
    $error = curl_error($ch);
    $httpCode = curl_getinfo($ch, CURLINFO_HTTP_CODE);

    $result['curl'] = [
        'available' => true,
        'http_code' => $httpCode,
        'errno' => $errno,
        'error' => $error,
        'bytes' => is_string($body) ? strlen($body) : null,
    ];

    return response()->json($result, $errno === 0 ? 200 : 500);
});

/*
|--------------------------------------------------------------------------
| PÃ¡ginas PÃºblicas
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    if (app()->environment('local')) {
        Log::debug('Entering /', [
            'auth_check' => Auth::check(),
            'user_id' => Auth::id(),
            'session_id' => Session::getId(),
        ]);
    }

    $cartItems = session()->get('cart', []);
    $cartCount = array_sum(array_column($cartItems, 'quantity'));

    $campaignData = app(CampaignBannerResolver::class)->resolve();

    return Inertia::render('Shop/Home', [
        'categories' => Category::all()->map(fn($c) => [
            'id' => $c->id, 'name' => $c->name, 'slug' => $c->slug, 'description' => $c->description,
        ]),
        'products' => Product::with('category')->get()->map(fn($p) => [
            'id' => $p->id,
            'name' => $p->name,
            'price' => $p->price,
            'stock' => $p->stock,
            'image_url' => $p->image_url,
            'category' => [
                'id' => $p->category->id ?? null,
                'name' => $p->category->name ?? 'Sin categorÃ­a',
            ],
            'is_adult' => $p->is_adult,
            'link' => $p->link,
        ]),
        'auth' => ['user' => Auth::user()],
        'campaign' => $campaignData,
        'cartCount' => $cartCount,
        'cartItems' => $cartItems,
    ]);
})->name('home');


Route::get('/about', fn () => Inertia::render('Static/About'))->name('about');
Route::get('/contact', fn () => Inertia::render('Static/Contact'))->name('contact');
Route::post('/contact', [ContactController::class, 'send']);
Route::get('/faq', fn () => Inertia::render('Static/Faq'))->name('faq');
Route::get('/terms', fn () => Inertia::render('Static/Terms'))->name('terms');
Route::get('/privacy', fn () => Inertia::render('Static/Privacy'))->name('privacy');
Route::get('/agregador-enlaces', fn () => Inertia::render('Tools/LinkAggregator'));
Route::get('/link-aggregator', fn () => Inertia::render('Tools/LinkAggregator'));
Route::get('/deals/today', fn () => Inertia::render('Special/DealsToday'))->name('deals.today');
Route::get('/superdeal', fn () => Inertia::render('Special/SuperDeal'))->name('superdeal');
Route::get('/new-arrivals', fn () => Inertia::render('Special/NewArrivals'))->name('new.arrivals');
Route::get('/seasonal', fn () => Inertia::render('Special/SeasonalProducts'))->name('seasonal');

Route::get('/fast-shipping', fn () => Inertia::render('Special/FastShipping', [
    'products' => Product::where('is_fast_shipping', true)->latest()->get(),
]))->name('fast.shipping');

Route::get('/search', [SearchController::class, 'search'])->name('search');

/*
|--------------------------------------------------------------------------
| Productos y CategorÃ­as
|--------------------------------------------------------------------------
*/
Route::get('/product/{id}', fn ($id) => Inertia::render('Layouts/ProductPageLayout', [
    'product'  => Product::with(['category', 'details', 'reviews'])->findOrFail($id),
    'products' => Product::with('category')->get(),
]))->name('product.details');

Route::get('/category/{id}', [CategoryController::class, 'show'])->name('category.show');
Route::get('/categoria/{slug}', [CategoryController::class, 'showBySlug'])->name('category.slug');

Route::get('/products/add', [AddProdukController::class, 'create'])->name('products.create');
Route::post('/products/store', [AddProdukController::class, 'store'])->name('products.store');
Route::get('/select-products', [ProductController::class, 'showTemporaryProducts'])->name('products.select');
Route::post('/migrate-selected-products', [ProductController::class, 'migrateSelectedProducts'])->name('products.migrate');
Route::post('/add-temporary-product', [ProductController::class, 'storeTemporaryProduct'])->name('products.storeTemporary');

// MigraciÃ³n de productos
Route::prefix('migrate-products')->group(function () {
    Route::get('/', [ProductMigrationController::class, 'index'])->name('migrate.products');
    Route::post('/{id}', [ProductMigrationController::class, 'migrate'])->name('migrate.product');
    Route::post('/bulk', [ProductMigrationController::class, 'bulkMigrate'])->name('bulk.migrate.products');
    Route::patch('/product/{product}', [ProductMigrationController::class, 'updateProduct'])->name('migrate.product.update');
    Route::post('/product/{product}/images', [ProductMigrationController::class, 'addImages'])->name('migrate.product.addImages');
});
Route::post('/bulk-migrate-products', [ProductMigrationController::class, 'bulkMigrate'])->name('bulk.migrate.products.legacy');

// Reviews
Route::get('/products/{product}/reviews', [ReviewController::class, 'index']);
Route::post('/products/{product}/reviews', [ReviewController::class, 'store']);

/*
|--------------------------------------------------------------------------
| Carrito y Checkout
|--------------------------------------------------------------------------
*/
Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index'])->name('cart.index');
    Route::post('/{productId}/add', [CartController::class, 'addToCart'])->name('cart.add');
    Route::post('/{productId}/remove', [CartController::class, 'removeFromCart'])->name('cart.remove');
    Route::post('/{productId}/increment', [CartController::class, 'incrementQuantity'])->name('cart.increment');
    Route::post('/{productId}/decrement', [CartController::class, 'decreaseQuantity'])->name('cart.decrement');
    Route::get('/summary', [CartController::class, 'summary'])->name('cart.summary');
});

Route::prefix('checkout')->group(function () {
    Route::get('/', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/guest-address', [CheckoutController::class, 'storeGuestAddress'])->name('checkout.guest_address');
    Route::post('/coupon', [CheckoutController::class, 'applyCoupon'])->name('checkout.coupon');
    Route::post('/shipping', [CheckoutController::class, 'updateShipping'])->name('checkout.shipping');
});

/*
|--------------------------------------------------------------------------
| Inertia Shared Data
|--------------------------------------------------------------------------
*/
Inertia::share([
    'cartItems' => fn() => session('cart', []),
    'cartCount' => fn() => array_sum(array_column(session('cart', []), 'quantity')),
    'total'     => fn() => collect(session('cart', []))->sum(fn($i) => $i['price'] * $i['quantity']),
    'csrfToken' => fn() => csrf_token(),
]);

/*
|--------------------------------------------------------------------------
| Rutas con AutenticaciÃ³n
|--------------------------------------------------------------------------
*/
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // Pedidos
    Route::prefix('orders')->group(function () {
        Route::get('/', [OrderController::class, 'index'])->name('orders.index');
        Route::get('/shipped', [OrderController::class, 'shipped'])->name('orders.shipped');
        Route::get('/paid', [OrderController::class, 'paid'])->name('orders.paid');
        Route::get('/cancelled', [OrderController::class, 'cancelled'])->name('orders.cancelled');
        Route::get('/{order}/cancel', [OrderController::class, 'cancelPrompt'])->name('orders.cancel.prompt');
        Route::post('/{order}/confirm', [OrderController::class, 'confirm'])->name('orders.confirm');
        Route::post('/{order}/cancel', [OrderController::class, 'cancel'])->name('orders.cancel');
        Route::post('/{order}/refund', [OrderController::class, 'refund'])->name('orders.refund');
        Route::get('/{order}', [OrderController::class, 'show'])->name('orders.show');
    });

    // Pagos
    Route::prefix('checkout')->group(function () {
        Route::post('/stripe', [CheckoutController::class, 'stripeCheckout'])->name('checkout.stripe');
        Route::post('/paypal', [CheckoutController::class, 'paypalCheckout'])->name('checkout.paypal');
        Route::get('/success', [CheckoutController::class, 'success'])->name('checkout.success');
        Route::get('/cancel', [CheckoutController::class, 'cancel'])->name('checkout.cancel');
    });

    // Perfil
    Route::prefix('profile')->group(function () {
        Route::get('/', [ProfileController::class, 'edit'])->name('profile.edit');
        Route::patch('/', [ProfileController::class, 'update'])->name('profile.update');
        Route::delete('/', [ProfileController::class, 'destroy'])->name('profile.destroy');
    });
    Route::prefix('addresses')->name('addresses.')->group(function () {
        Route::post('/store', [AddressController::class, 'store'])->name('store');
        Route::put('/{address}', [AddressController::class, 'update'])->name('update');
        Route::put('/{address}/default', [AddressController::class, 'makeDefault'])->name('default');
        Route::delete('/{address}', [AddressController::class, 'destroy'])->name('destroy');
    });

    // Avatar
    Route::post('/api/avatar-upload', [AvatarController::class, 'store']);
});

/*
|--------------------------------------------------------------------------
| Admin
|--------------------------------------------------------------------------
*/
Route::middleware(['auth', 'admin'])
    ->prefix('admin')
    ->name('admin.')
    ->group(function () {
        Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');

        // Pedidos
        Route::get('/orders', [AdminController::class, 'orders'])->name('orders.index');
        Route::post('/orders/{order}/cancel', [AdminController::class, 'cancelOrder'])->name('orders.cancel');
        Route::post('/orders/{order}/mark-shipped', [AdminController::class, 'markAsShipped'])->name('orders.shipped');
        Route::post('/orders/{order}/mark-delivered', [AdminController::class, 'markAsDelivered'])->name('orders.delivered');

        // Usuarios
        Route::get('/users', [AdminController::class, 'users'])->name('users.index');
        Route::post('/users/{user}/toggle-admin', [AdminController::class, 'toggleAdmin'])->name('users.toggle');

        // Productos (listado + alta rÃ¡pida)
        Route::get('/products', [AdminController::class, 'products'])->name('products.index');
        Route::get('/products/create', [AddProdukController::class, 'create'])->name('products.create');
        Route::post('/products', [AddProdukController::class, 'store'])->name('products.store');
        Route::post('/products/{product}/delete', [AdminController::class, 'deleteProduct'])->name('products.delete');

        // CategorÃ­as
        Route::get('/categories', [AdminController::class, 'categories'])->name('categories.index');
        Route::post('/categories/{category}/delete', [AdminController::class, 'deleteCategory'])->name('categories.delete');
        Route::post('/categories/store', [AdminController::class, 'storeCategory'])->name('categories.store');

        // Banners
        Route::get('/banners', [AdminController::class, 'banners'])->name('banners.index');
        Route::post('/banners/{banner}/delete', [AdminController::class, 'deleteBanner'])->name('banners.delete');
        Route::post('/banners/store', [AdminController::class, 'storeBanner'])->name('banners.store');

        // Reviews
        Route::get('/reviews', [AdminController::class, 'reviews'])->name('reviews.index');
        Route::post('/reviews/{review}/delete', [AdminController::class, 'deleteReview'])->name('reviews.delete');

        // Logs & mÃ©tricas
        Route::get('/logs', [AdminController::class, 'logs'])->name('logs.index');
        Route::get('/stats', [AdminController::class, 'stats'])->name('stats.index');

        // Cupones (lista + alias â€œcreateâ€ para el dashboard)
        Route::get('/coupons', [CouponController::class, 'index'])->name('coupons.index');
        Route::get('/coupons/create', [CouponController::class, 'index'])->name('coupons.create');
        Route::post('/coupons/store', [CouponController::class, 'store'])->name('coupons.store');
        Route::post('/coupons/{coupon}/delete', [CouponController::class, 'destroy'])->name('coupons.delete');
        Route::post('/coupons/{coupon}/update', [CouponController::class, 'update'])->name('coupons.update');

        // ConfiguraciÃ³n
        Route::get('/settings', [AdminController::class, 'settings'])->name('settings.index');
        Route::post('/settings/update', [AdminController::class, 'updateSettings'])->name('settings.update');

        // Debug
        Route::get('/debug', fn () => response()->json([
            'ok'       => true,
            'user'     => Auth::user(),
            'is_admin' => Auth::user()?->is_admin,
            'message'  => 'Â¡Tienes acceso como admin!',
        ]))->name('debug');
    });

/*
|--------------------------------------------------------------------------
| Auth Scaffolding (Laravel Breeze / Jetstream)
|--------------------------------------------------------------------------
*/
require __DIR__ . '/auth.php';

/*
|--------------------------------------------------------------------------
| Test Routes (solo desarrollo)
|--------------------------------------------------------------------------
*/
Route::get('/test', fn () => Inertia::render('Orders/ShippedOrders', ['message' => 'Â¡Hola Inertia!']));

Route::post('/run-script', [PythonScriptController::class, 'run'])->name('run.script');




