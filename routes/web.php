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
    Auth\SocialAuthController,
    LocaleController,
    AdminController,
    CategoryController,
    ReviewController
};
use App\Services\CampaignBannerResolver;
use App\Support\CatalogDataLocalizer;
use App\Http\Controllers\Admin\TemporaryProductImportController;

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
Route::get('/api/search/suggestions', [SearchController::class, 'suggest'])->name('search.suggestions');
Route::get('/api/deals-today', [ProductController::class, 'dealsToday']);
Route::get('/api/superdeals', [ProductController::class, 'superdeals']);
Route::get('/api/fast-shipping', [ProductController::class, 'fastShipping']);
Route::get('/api/new-arrivals', [ProductController::class, 'newArrivals']);
Route::get('/api/seasonal-products', [ProductController::class, 'seasonalProducts']);

Route::post('/locale', [LocaleController::class, 'update'])->name('locale.update');

/*
|--------------------------------------------------------------------------
| AutenticaciÃ³n Social (Socialite)
|--------------------------------------------------------------------------
*/
Route::get('/auth/{provider}/redirect', [SocialAuthController::class, 'redirect'])->name('auth.social.redirect');
Route::get('/auth/{provider}/callback', [SocialAuthController::class, 'callback'])->name('auth.social.callback');

// (Firebase debug route removed)

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
    $catalogLocalizer = app(CatalogDataLocalizer::class);

    return Inertia::render('Shop/Home', [
        'categories' => Category::all()->map(fn($c) => $catalogLocalizer->categoryPayload($c)),
        'products' => Product::with('category')->get()->map(fn($p) => $catalogLocalizer->productPayload($p)),
        'auth' => ['user' => Auth::user()],
        'campaign' => $campaignData,
        'cartCount' => $cartCount,
        'cartItems' => $cartItems,
    ]);
})->name('home');


Route::get('/about', fn () => Inertia::render('Static/About'))->name('about');
Route::get('/contact', fn () => Inertia::render('Static/Contact'))->name('contact');
Route::post('/contact', [ContactController::class, 'send'])->middleware('throttle:5,1')->name('contact.send');
Route::get('/faq', fn () => Inertia::render('Static/Faq'))->name('faq');
Route::get('/terms', fn () => Inertia::render('Static/Terms'))->name('terms');
Route::get('/privacy', fn () => Inertia::render('Static/Privacy'))->name('privacy');
Route::get('/cookies', fn () => Inertia::render('Static/Cookies'))->name('cookies');
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/agregador-enlaces', fn () => Inertia::render('Tools/LinkAggregator'));
    Route::get('/link-aggregator', fn () => Inertia::render('Tools/LinkAggregator'));
});
Route::get('/deals/today', fn () => Inertia::render('Special/DealsToday'))->name('deals.today');
Route::get('/superdeal', fn () => Inertia::render('Special/SuperDeal'))->name('superdeal');
Route::get('/new-arrivals', fn () => Inertia::render('Special/NewArrivals'))->name('new.arrivals');
Route::get('/seasonal', fn () => Inertia::render('Special/SeasonalProducts'))->name('seasonal');

Route::get('/fast-shipping', [ProductController::class, 'fastShippingPage'])->name('fast.shipping');

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

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/products/add', [AddProdukController::class, 'create'])->name('products.create');
    Route::post('/products/store', [AddProdukController::class, 'store'])->name('products.store');
    Route::get('/select-products', [ProductController::class, 'showTemporaryProducts'])->name('products.select');
    Route::post('/migrate-selected-products', [ProductController::class, 'migrateSelectedProducts'])->name('products.migrate');
    Route::post('/add-temporary-product', [ProductController::class, 'storeTemporaryProduct'])->name('products.storeTemporary');

    Route::prefix('migrate-products')->group(function () {
        Route::get('/', [ProductMigrationController::class, 'index'])->name('migrate.products');
        Route::post('/{id}', [ProductMigrationController::class, 'migrate'])->name('migrate.product');
        Route::post('/bulk', [ProductMigrationController::class, 'bulkMigrate'])->name('bulk.migrate.products');
        Route::patch('/product/{product}', [ProductMigrationController::class, 'updateProduct'])->name('migrate.product.update');
        Route::post('/product/{product}/images', [ProductMigrationController::class, 'addImages'])->name('migrate.product.addImages');
    });

    Route::post('/bulk-migrate-products', [ProductMigrationController::class, 'bulkMigrate'])->name('bulk.migrate.products.legacy');
});

// Reviews
Route::get('/products/{product}/reviews', [ReviewController::class, 'index']);
Route::post('/products/{product}/reviews', [ReviewController::class, 'store'])->middleware('auth');

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
        Route::post('/', [AddressController::class, 'store'])->name('store');
        Route::patch('/{address}', [AddressController::class, 'update'])->name('update');
        Route::patch('/{address}/default', [AddressController::class, 'makeDefault'])->name('default');
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
        Route::patch('/orders/{order}/cancel', [AdminController::class, 'cancelOrder'])->name('orders.cancel');
        Route::patch('/orders/{order}/ship', [AdminController::class, 'markAsShipped'])->name('orders.shipped');
        Route::patch('/orders/{order}/deliver', [AdminController::class, 'markAsDelivered'])->name('orders.delivered');
        Route::patch('/orders/{order}/approve-return', [AdminController::class, 'approveReturn'])->name('orders.return.approve');
        Route::patch('/orders/{order}/reject-return', [AdminController::class, 'rejectReturn'])->name('orders.return.reject');
        Route::patch('/orders/{order}/refund', [AdminController::class, 'processRefund'])->name('orders.refund.process');

        // Usuarios
        Route::get('/users', [AdminController::class, 'users'])->name('users.index');
        Route::patch('/users/{user}/toggle-admin', [AdminController::class, 'toggleAdmin'])->name('users.toggle');

        // Productos (listado + alta rÃ¡pida)
        Route::get('/products', [AdminController::class, 'products'])->name('products.index');
        Route::get('/products/create', [AddProdukController::class, 'create'])->name('products.create');
        Route::post('/products', [AddProdukController::class, 'store'])->name('products.store');
        Route::delete('/products/{product}', [AdminController::class, 'deleteProduct'])->name('products.delete');

        // CategorÃ­as
        Route::get('/categories', [AdminController::class, 'categories'])->name('categories.index');
        Route::delete('/categories/{category}', [AdminController::class, 'deleteCategory'])->name('categories.delete');
        Route::post('/categories/store', [AdminController::class, 'storeCategory'])->name('categories.store');

        // Banners
        Route::get('/banners', [AdminController::class, 'banners'])->name('banners.index');
        Route::delete('/banners/{banner}', [AdminController::class, 'deleteBanner'])->name('banners.delete');
        Route::post('/banners/store', [AdminController::class, 'storeBanner'])->name('banners.store');

        // Reviews
        Route::get('/reviews', [AdminController::class, 'reviews'])->name('reviews.index');
        Route::delete('/reviews/{review}', [AdminController::class, 'deleteReview'])->name('reviews.delete');

        // ImportaciÃ³n a temporales (scrapers)
        Route::post('/temporary-products/import', [TemporaryProductImportController::class, 'import'])
            ->name('temporary-products.import');

        // Logs & mÃ©tricas
        Route::get('/logs', [AdminController::class, 'logs'])->name('logs.index');
        Route::get('/stats', [AdminController::class, 'stats'])->name('stats.index');

        // Cupones (lista + alias "create" para el dashboard)
        Route::get('/coupons', [CouponController::class, 'index'])->name('coupons.index');
        Route::get('/coupons/create', [CouponController::class, 'index'])->name('coupons.create');
        Route::post('/coupons/store', [CouponController::class, 'store'])->name('coupons.store');
        Route::delete('/coupons/{coupon}', [CouponController::class, 'destroy'])->name('coupons.delete');
        Route::patch('/coupons/{coupon}', [CouponController::class, 'update'])->name('coupons.update');

        // ConfiguraciÃ³n
        Route::get('/settings', [AdminController::class, 'settings'])->name('settings.index');
        Route::post('/settings/update', [AdminController::class, 'updateSettings'])->name('settings.update');

        // Debug
        Route::get('/debug', fn () => response()->json([
            'ok'       => true,
            'user'     => Auth::user(),
            'is_admin' => Auth::user()?->is_admin,
            'message'  => '¡Tienes acceso como admin!',
        ]))->name('debug');
    });

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/api/scripts', fn () => response()->json(
        collect(File::files(base_path('python_scripts')))
            ->filter(fn ($file) => $file->getExtension() === 'py')
            ->map(fn ($file) => $file->getFilename())
            ->values()
    ));

    Route::post('/run-script', [PythonScriptController::class, 'run'])->name('run.script');
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
if (app()->environment('local')) {
    Route::get('/test', fn () => Inertia::render('Orders/ShippedOrders', ['message' => 'Hola Inertia!']));
}





