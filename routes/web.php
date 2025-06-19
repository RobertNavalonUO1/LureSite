<?php

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\DashboardController;
use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use App\Http\Controllers\SearchController;
use App\Http\Controllers\ProductController;
use App\Http\Controllers\AddProdukController;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Support\Facades\Auth;

/**
 * Compartir datos globales con Inertia
 */
Inertia::share([
    'cartItems' => fn() => session()->has('cart') ? array_values(session('cart')) : [],
    'cartCount' => fn() => session()->has('cart') ? array_sum(array_column(session('cart'), 'quantity')) : 0,
    'total'     => fn() => session()->has('cart') ? collect(session('cart'))->sum(fn($item) => $item['price'] * $item['quantity']) : 0,
]);

/**
 * Rutas públicas
 */

// Página de inicio
Route::get('/', function () {
    $cartItems = session()->get('cart', []);
    $cartCount = array_sum(array_column($cartItems, 'quantity'));

    return Inertia::render('Home', [
        'categories' => Category::all()->map(fn($category) => [
            'id'          => $category->id,
            'name'        => $category->name,
            'slug'        => $category->slug,
            'description' => $category->description,
        ]),
        'products' => Product::with('category')->get()->map(fn($product) => [
            'id'        => $product->id,
            'name'      => $product->name,
            'price'     => $product->price,
            'stock'     => $product->stock,
            'image_url' => $product->image_url,
            'category'  => [
                'id'   => $product->category->id ?? null,
                'name' => $product->category->name ?? 'Sin categoría',
            ],
            'is_adult'  => $product->is_adult,
            'link'      => $product->link,
        ]),
        'auth'      => ['user' => Auth::user()],
        'cartCount' => $cartCount,
        'cartItems' => $cartItems,
    ]);
})->name('home');

// Otras rutas públicas (Detalles del producto, About, Contact, etc.)
Route::get('/product/{id}', function ($id) {
    $product = Product::findOrFail($id);
    return Inertia::render('ProductDetails', ['product' => $product]);
})->name('product.details');

Route::get('/about', fn() => Inertia::render('About'))->name('about');
Route::get('/contact', fn() => Inertia::render('Contact'))->name('contact');

Route::get('/search', [SearchController::class, 'search'])->name('search');

// Rutas para administración o manejo de productos temporales
Route::get('/products/add', [AddProdukController::class, 'create'])->name('products.create');
Route::post('/products/store', [AddProdukController::class, 'store'])->name('products.store');

Route::get('/select-products', [ProductController::class, 'showTemporaryProducts'])->name('products.select');
Route::post('/migrate-selected-products', [ProductController::class, 'migrateSelectedProducts'])->name('products.migrate');
Route::post('/add-temporary-product', [ProductController::class, 'storeTemporaryProduct'])->name('products.storeTemporary');

// Búsqueda de direcciones (pública)
Route::get('/addresses/search', [CheckoutController::class, 'getAddresses']);

/**
 * Rutas protegidas (requieren autenticación)
 */
Route::middleware(['auth'])->group(function () {
    // Dashboard y pedidos
    Route::get('/dashboard', [DashboardController::class, 'index'])->name('dashboard');
    Route::get('/orders', [DashboardController::class, 'index'])->name('orders.index');
    Route::get('/orders/shipped', [DashboardController::class, 'shipped'])->name('orders.shipped');

    // Checkout
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/checkout/stripe', [CheckoutController::class, 'stripeCheckout'])->name('checkout.stripe');
    Route::post('/checkout/paypal', [CheckoutController::class, 'paypalCheckout'])->name('checkout.paypal');
    Route::get('/checkout/success', [CheckoutController::class, 'success'])->name('checkout.success');
    Route::get('/checkout/cancel', [CheckoutController::class, 'cancel'])->name('checkout.cancel');
    Route::post('/addresses/store', [CheckoutController::class, 'storeAddress'])->name('addresses.store');

    // Perfil del usuario
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});

/**
 * Rutas del carrito
 */
Route::get('/cart', [CartController::class, 'index'])->name('cart.index');
Route::post('/cart/{productId}/add', [CartController::class, 'addToCart'])->name('cart.add');
Route::post('/cart/{productId}/remove', [CartController::class, 'removeFromCart']);
Route::post('/cart/{productId}/increment', [CartController::class, 'incrementQuantity']);
Route::post('/cart/{productId}/decrement', [CartController::class, 'decreaseQuantity']);

/**
 * Autenticación (Laravel Breeze, Jetstream, etc.)
 */
require __DIR__.'/auth.php';

// Ruta de prueba (opcional)
Route::get('/test', function () {
    return Inertia::render('ShippedOrders', [
        'message' => '¡Hola Inertia!'
    ]);
});
