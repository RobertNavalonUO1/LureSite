<?php

use Illuminate\Support\Facades\Route;
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
    Auth\FirebaseLoginController
};
use Inertia\Inertia;
use App\Models\{Product, Category};
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Facades\Session;
Route::get('/banners', [\App\Http\Controllers\Api\BannerController::class, 'index']);

// Firebase Auth
Route::middleware(['web'])->group(function () {
    Route::post('/auth/firebase', [FirebaseLoginController::class, 'handle'])->name('auth.firebase');
});

// Contacto
Route::get('/contact', fn () => inertia('Contact'))->name('contact');
Route::post('/contact', [ContactController::class, 'send']);

// Página de inicio
Route::get('/', function () {
    Log::info('🔍 Entrando a la raíz /', [
        'auth_user' => Auth::user(),
        'auth_check' => Auth::check(),
        'session_id' => Session::getId(),
        'session_data' => Session::all(),
    ]);

    $cartItems = session()->get('cart', []);
    $cartCount = array_sum(array_column($cartItems, 'quantity'));

    return Inertia::render('Home', [
        'categories' => Category::all()->map(fn($category) => [
            'id' => $category->id,
            'name' => $category->name,
            'slug' => $category->slug,
            'description' => $category->description,
        ]),
        'products' => Product::with('category')->get()->map(fn($product) => [
            'id' => $product->id,
            'name' => $product->name,
            'price' => $product->price,
            'stock' => $product->stock,
            'image_url' => $product->image_url,
            'category' => [
                'id' => $product->category->id ?? null,
                'name' => $product->category->name ?? 'Sin categoría',
            ],
            'is_adult' => $product->is_adult,
            'link' => $product->link,
        ]),
        'auth' => ['user' => Auth::user()],
        'cartCount' => $cartCount,
        'cartItems' => $cartItems,
    ]);
})->name('home');

// API scripts
Route::get('/api/scripts', function () {
    $scripts = collect(File::files(base_path('python_scripts')))
        ->filter(fn($file) => $file->getExtension() === 'py')
        ->map(fn($file) => $file->getFilename())
        ->values();

    return response()->json($scripts);
});
use App\Http\Controllers\CategoryController;

Route::get('/category/{id}', [CategoryController::class, 'show'])->name('category.show');

// Migración de productos
Route::get('/migrate-products', [ProductMigrationController::class, 'index'])->name('migrate.products');
Route::post('/migrate-products/{id}', [ProductMigrationController::class, 'migrate'])->name('migrate.product');
Route::post('/bulk-migrate-products', [ProductMigrationController::class, 'bulkMigrate'])->name('bulk.migrate.products');

// Rutas públicas
Route::get('/agregador-enlaces', fn() => Inertia::render('AgregadorEnlaces'));
Route::post('/run-script', [PythonScriptController::class, 'run']);
Route::get('/deals/today', fn () => Inertia::render('DealsToday'))->name('deals.today');
Route::get('/superdeal', fn () => Inertia::render('SuperDeal'))->name('superdeal');
Route::get('/fast-shipping', fn () => Inertia::render('FastShipping'))->name('fast.shipping');
Route::get('/new-arrivals', fn () => Inertia::render('NewArrivals'))->name('new.arrivals');
Route::get('/seasonal', fn () => Inertia::render('SeasonalProducts'))->name('seasonal');

// Admin (Pedidos)
Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin/orders', [OrderController::class, 'adminIndex'])->name('admin.orders');
    Route::post('/admin/orders/{order}/mark-shipped', [OrderController::class, 'markAsShipped']);
    Route::post('/admin/orders/{order}/mark-delivered', [OrderController::class, 'markAsDelivered']);
    Route::get('/orders/cancelled', [OrderController::class, 'cancelled'])->name('orders.cancelled');

});

// Datos compartidos para todas las vistas Inertia
Inertia::share([
    'cartItems' => fn() => session()->has('cart') ? array_values(session('cart')) : [],
    'cartCount' => fn() => session()->has('cart') ? array_sum(array_column(session('cart'), 'quantity')) : 0,
    'total'     => fn() => session()->has('cart') ? collect(session('cart'))->sum(fn($item) => $item['price'] * $item['quantity']) : 0,
]);

// Avatar
Route::post('/api/avatar-upload', [AvatarController::class, 'store'])->middleware('auth');

// Productos
Route::get('/product/{id}', fn($id) => Inertia::render('Layouts/ProductPageLayout', [
    'product' => \App\Models\Product::with('category')->findOrFail($id)
]))->name('product.details');

Route::get('/about', fn () => Inertia::render('About'))->name('about');
Route::get('/search', [SearchController::class, 'search'])->name('search');
Route::get('/products/add', [AddProdukController::class, 'create'])->name('products.create');
Route::post('/products/store', [AddProdukController::class, 'store'])->name('products.store');
Route::get('/select-products', [ProductController::class, 'showTemporaryProducts'])->name('products.select');
Route::post('/migrate-selected-products', [ProductController::class, 'migrateSelectedProducts'])->name('products.migrate');
Route::post('/add-temporary-product', [ProductController::class, 'storeTemporaryProduct'])->name('products.storeTemporary');

// Carrito
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/{productId}/add', [CartController::class, 'addToCart'])->name('cart.add');
Route::post('/cart/{productId}/remove', [CartController::class, 'removeFromCart']);
Route::post('/cart/{productId}/increment', [CartController::class, 'incrementQuantity']);
Route::post('/cart/{productId}/decrement', [CartController::class, 'decreaseQuantity']);

// Checkout
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
Route::post('/checkout/guest-address', [CheckoutController::class, 'storeGuestAddress'])->name('checkout.guest_address');
Route::get('/addresses/search', [CheckoutController::class, 'getAddresses']);

// Autenticación requerida
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');

    // 🧾 Pedidos del usuario (ahora gestionados por OrderController)
    Route::get('/orders', [OrderController::class, 'index'])->name('orders.index');
    Route::get('/orders/shipped', [OrderController::class, 'shipped'])->name('orders.shipped');
    Route::get('/orders/paid', [OrderController::class, 'paid'])->name('orders.paid'); // Puedes crear este método
    Route::post('/orders/{order}/confirm', [OrderController::class, 'confirm'])->name('orders.confirm');

    // Pagos
    Route::post('/checkout/stripe', [CheckoutController::class, 'stripeCheckout'])->name('checkout.stripe');
    Route::post('/checkout/paypal', [CheckoutController::class, 'paypalCheckout'])->name('checkout.paypal');
    Route::get('/checkout/success', [CheckoutController::class, 'success'])->name('checkout.success');
    Route::get('/checkout/cancel', [CheckoutController::class, 'cancel'])->name('checkout.cancel');

    // Perfil
    Route::post('/addresses/store', [CheckoutController::class, 'storeAddress'])->name('addresses.store');
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

require __DIR__ . '/auth.php';

// Test
Route::get('/test', fn () => Inertia::render('ShippedOrders', ['message' => '¡Hola Inertia!']));
Route::get('/faq', fn () => Inertia::render('Faq'))->name('faq');
Route::get('/terms', fn () => Inertia::render('Terms'))->name('terms');
Route::get('/privacy', fn () => Inertia::render('Privacy'))->name('privacy');
