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
    ProductMigrationController
};
use Inertia\Inertia;
use App\Models\{Product, Category};
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\File;
use Illuminate\Support\Facades\Gate;
use Illuminate\Http\Request;

// 🔐 Firebase login
use App\Http\Controllers\Auth\FirebaseLoginController;
use App\Http\Controllers\Auth\AuthenticatedSessionController;

Route::post('/logout', [AuthenticatedSessionController::class, 'destroy'])
    ->middleware('auth')
    ->name('logout');
Route::middleware(['web'])->group(function () {
    Route::post('/auth/firebase', [FirebaseLoginController::class, 'handle'])->name('auth.firebase');
});

// ✅ NUEVO: ruta para completar datos faltantes después de login con Firebase
Route::middleware(['auth'])->group(function () {
    Route::get('/complete-profile', function () {
        return Inertia::render('CompleteProfile', [
            'user' => Auth::user(),
        ]);
    });

    Route::post('/complete-profile', function (Request $request) {
        $request->validate([
            'lastname' => 'required|string|max:255',
            'phone' => 'required|string|max:20',
            'address' => 'nullable|string|max:255',
        ]);

        $user = Auth::user();
        $user->update([
            'lastname' => $request->lastname,
            'phone' => $request->phone,
        ]);

        // Puedes guardar la dirección en otra tabla si corresponde
        return redirect('/dashboard');
    });
});

// === SCRIPTS & MIGRACIÓN ===
Route::get('/api/scripts', function () {
    $scripts = collect(File::files(base_path('python_scripts')))
        ->filter(fn($file) => $file->getExtension() === 'py')
        ->map(fn($file) => $file->getFilename())
        ->values();

    return response()->json($scripts);
});

Route::get('/migrate-products', [ProductMigrationController::class, 'index'])->name('migrate.products');
Route::post('/migrate-products/{id}', [ProductMigrationController::class, 'migrate'])->name('migrate.product');
Route::post('/bulk-migrate-products', [ProductMigrationController::class, 'bulkMigrate'])->name('bulk.migrate.products');

Route::get('/agregador-enlaces', fn() => Inertia::render('AgregadorEnlaces'));
Route::post('/run-script', [PythonScriptController::class, 'run']);

// === LANDING PAGES ===
Route::get('/deals/today', fn () => Inertia::render('DealsToday'))->name('deals.today');
Route::get('/superdeal', fn () => Inertia::render('SuperDeal'))->name('superdeal');
Route::get('/fast-shipping', fn () => Inertia::render('FastShipping'))->name('fast.shipping');
Route::get('/new-arrivals', fn () => Inertia::render('NewArrivals'))->name('new.arrivals');
Route::get('/seasonal', fn () => Inertia::render('SeasonalProducts'))->name('seasonal');

Route::middleware(['auth', 'admin'])->group(function () {
    Route::get('/admin/orders', [DashboardController::class, 'adminOrders'])->name('admin.orders');
    Route::post('/admin/orders/{order}/mark-shipped', [DashboardController::class, 'markAsShipped']);
    Route::post('/admin/orders/{order}/mark-delivered', [DashboardController::class, 'markAsDelivered']);
});

Inertia::share([
    'cartItems' => fn() => session()->has('cart') ? array_values(session('cart')) : [],
    'cartCount' => fn() => session()->has('cart') ? array_sum(array_column(session('cart'), 'quantity')) : 0,
    'total'     => fn() => session()->has('cart') ? collect(session('cart'))->sum(fn($item) => $item['price'] * $item['quantity']) : 0,
]);

Route::post('/api/avatar-upload', [AvatarController::class, 'store'])->middleware('auth');

// === HOME ===
Route::get('/', function () {
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

Route::get('/product/{id}', fn($id) => Inertia::render('Layouts/ProductPageLayout', [
    'product' => \App\Models\Product::with('category')->findOrFail($id)
]))->name('product.details');

Route::get('/about', fn() => Inertia::render('About'))->name('about');
Route::get('/contact', fn() => Inertia::render('Contact'))->name('contact');
Route::get('/search', [SearchController::class, 'search'])->name('search');

// === PRODUCTOS ===
Route::get('/products/add', [AddProdukController::class, 'create'])->name('products.create');
Route::post('/products/store', [AddProdukController::class, 'store'])->name('products.store');
Route::get('/select-products', [ProductController::class, 'showTemporaryProducts'])->name('products.select');
Route::post('/migrate-selected-products', [ProductController::class, 'migrateSelectedProducts'])->name('products.migrate');
Route::post('/add-temporary-product', [ProductController::class, 'storeTemporaryProduct'])->name('products.storeTemporary');

// === CARRITO ===
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/{productId}/add', [CartController::class, 'addToCart'])->name('cart.add');
Route::post('/cart/{productId}/remove', [CartController::class, 'removeFromCart']);
Route::post('/cart/{productId}/increment', [CartController::class, 'incrementQuantity']);
Route::post('/cart/{productId}/decrement', [CartController::class, 'decreaseQuantity']);

// === CHECKOUT ===
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
Route::post('/checkout/guest-address', [CheckoutController::class, 'storeGuestAddress'])->name('checkout.guest_address');
Route::get('/addresses/search', [CheckoutController::class, 'getAddresses']);

// === USUARIO AUTENTICADO ===
Route::middleware(['auth'])->group(function () {
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/orders', [DashboardController::class, 'index'])->name('orders.index');
    Route::get('/orders/shipped', [DashboardController::class, 'shipped'])->name('orders.shipped');

    Route::post('/checkout/stripe', [CheckoutController::class, 'stripeCheckout'])->name('checkout.stripe');
    Route::post('/checkout/paypal', [CheckoutController::class, 'paypalCheckout'])->name('checkout.paypal');
    Route::get('/checkout/success', [CheckoutController::class, 'success'])->name('checkout.success');
    Route::get('/checkout/cancel', [CheckoutController::class, 'cancel'])->name('checkout.cancel');

    Route::post('/addresses/store', [CheckoutController::class, 'storeAddress'])->name('addresses.store');

    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// === RUTAS ADICIONALES ===
require __DIR__ . '/auth.php';
Route::get('/test', fn() => Inertia::render('ShippedOrders', ['message' => '¡Hola Inertia!']));
