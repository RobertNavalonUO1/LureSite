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
Route::get('/api/deals-today', [ProductController::class, 'dealsToday']);
Route::get('/api/superdeals', [ProductController::class, 'superdeals']);
Route::get('/api/fast-shipping', [ProductController::class, 'fastShipping']);

/*
|--------------------------------------------------------------------------
| AutenticaciÃ³n con Firebase
|--------------------------------------------------------------------------
*/
Route::middleware(['web'])->group(function () {
    Route::post('/auth/firebase', [FirebaseLoginController::class, 'handle'])->name('auth.firebase');
});

/*
|--------------------------------------------------------------------------
| PÃ¡ginas PÃºblicas
|--------------------------------------------------------------------------
*/
Route::get('/', function () {
    Log::info('ðŸ” Entrando a la raÃ­z /', [
        'auth_user'   => Auth::user(),
        'auth_check'  => Auth::check(),
        'session_id'  => Session::getId(),
        'session_data'=> Session::all(),
    ]);

    $cartItems = session()->get('cart', []);
    $cartCount = array_sum(array_column($cartItems, 'quantity'));

    return Inertia::render('Home', [
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
        'cartCount' => $cartCount,
        'cartItems' => $cartItems,
    ]);
})->name('home');


Route::get('/about', fn () => Inertia::render('About'))->name('about');
Route::get('/contact', fn () => Inertia::render('Contact'))->name('contact');
Route::post('/contact', [ContactController::class, 'send']);
Route::get('/faq', fn () => Inertia::render('Faq'))->name('faq');
Route::get('/terms', fn () => Inertia::render('Terms'))->name('terms');
Route::get('/privacy', fn () => Inertia::render('Privacy'))->name('privacy');
Route::get('/agregador-enlaces', fn () => Inertia::render('AgregadorEnlaces'));
Route::get('/deals/today', fn () => Inertia::render('DealsToday'))->name('deals.today');
Route::get('/superdeal', fn () => Inertia::render('SuperDeal'))->name('superdeal');
Route::get('/new-arrivals', fn () => Inertia::render('NewArrivals'))->name('new.arrivals');
Route::get('/seasonal', fn () => Inertia::render('SeasonalProducts'))->name('seasonal');

Route::get('/fast-shipping', fn () => Inertia::render('FastShipping', [
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
    Route::post('/{productId}/remove', [CartController::class, 'removeFromCart']);
    Route::post('/{productId}/increment', [CartController::class, 'incrementQuantity']);
    Route::post('/{productId}/decrement', [CartController::class, 'decreaseQuantity']);
    Route::get('/summary', [CartController::class, 'summary'])->name('cart.summary');
});

Route::prefix('checkout')->group(function () {
    Route::get('/', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/guest-address', [CheckoutController::class, 'storeGuestAddress'])->name('checkout.guest_address');
    Route::get('/addresses/search', [CheckoutController::class, 'getAddresses']);
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
    Route::post('/addresses/store', [CheckoutController::class, 'storeAddress'])->name('addresses.store');

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
        Route::get('/coupons', [AdminController::class, 'coupons'])->name('coupons.index');
        Route::get('/coupons/create', [AdminController::class, 'coupons'])->name('coupons.create');
        Route::post('/coupons', [AdminController::class, 'storeCoupon'])->name('coupons.store');
        Route::post('/coupons/{coupon}/delete', [AdminController::class, 'deleteCoupon'])->name('coupons.delete');
        Route::post('/coupons/{coupon}/update', [AdminController::class, 'updateCoupon'])->name('coupons.update');

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
Route::get('/test', fn () => Inertia::render('ShippedOrders', ['message' => 'Â¡Hola Inertia!']));

Route::post('/run-script', [PythonScriptController::class, 'run'])->name('run.script');
