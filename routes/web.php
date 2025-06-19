<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\{
    DashboardController,
    ProfileController,
    CartController,
    CheckoutController,
    SearchController,
    ProductController,
    AddProdukController
};
use Inertia\Inertia;
use App\Models\{Product, Category};
use Illuminate\Support\Facades\Auth;

// Datos globales para Inertia
Inertia::share([
    'cartItems' => fn() => session()->has('cart') ? array_values(session('cart')) : [],
    'cartCount' => fn() => session()->has('cart') ? array_sum(array_column(session('cart'), 'quantity')) : 0,
    'total'     => fn() => session()->has('cart') ? collect(session('cart'))->sum(fn($item) => $item['price'] * $item['quantity']) : 0,
]);

/**
 * 🌐 RUTAS PÚBLICAS
 */

// Página principal
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

// Detalles y páginas estáticas
Route::get('/product/{id}', fn($id) => Inertia::render('ProductDetails', ['product' => Product::findOrFail($id)]))->name('product.details');
Route::get('/about', fn() => Inertia::render('About'))->name('about');
Route::get('/contact', fn() => Inertia::render('Contact'))->name('contact');

// Búsqueda
Route::get('/search', [SearchController::class, 'search'])->name('search');

// Productos temporales (scraping o admin)
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

// Checkout (Invitado y Autenticado)
Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
Route::post('/checkout/guest-address', [CheckoutController::class, 'storeGuestAddress'])->name('checkout.guest_address');

// Direcciones públicas (auto-completar, etc.)
Route::get('/addresses/search', [CheckoutController::class, 'getAddresses']);

/**
 * 🔒 RUTAS PROTEGIDAS (requieren login)
 */
Route::middleware(['auth'])->group(function () {
    // Perfil y usuario
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/orders', [DashboardController::class, 'index'])->name('orders.index');
    Route::get('/orders/shipped', [DashboardController::class, 'shipped'])->name('orders.shipped');

    // Checkout pago (procesamiento)
    Route::post('/checkout/stripe', [CheckoutController::class, 'stripeCheckout'])->name('checkout.stripe');
    Route::post('/checkout/paypal', [CheckoutController::class, 'paypalCheckout'])->name('checkout.paypal');
    Route::get('/checkout/success', [CheckoutController::class, 'success'])->name('checkout.success');
    Route::get('/checkout/cancel', [CheckoutController::class, 'cancel'])->name('checkout.cancel');

    // Direcciones privadas
    Route::post('/addresses/store', [CheckoutController::class, 'storeAddress'])->name('addresses.store');

    // Perfil
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

// Autenticación (Laravel Breeze, Jetstream, etc.)
require __DIR__ . '/auth.php';

// Ruta de prueba
Route::get('/test', fn() => Inertia::render('ShippedOrders', ['message' => '¡Hola Inertia!']));
