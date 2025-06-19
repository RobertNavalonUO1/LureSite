<?php

use App\Http\Controllers\ProfileController;
use App\Http\Controllers\CartController;
use App\Http\Controllers\CheckoutController;
use Illuminate\Support\Facades\Route;
use Inertia\Inertia;
use App\Models\Product;
use App\Models\Category;
use Illuminate\Support\Facades\Auth;

// Página de inicio
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

// Rutas del carrito
Route::prefix('cart')->group(function () {
    Route::get('/', [CartController::class, 'index'])->name('cart.index');
    Route::post('{productId}/add', [CartController::class, 'addToCart'])->name('cart.add');
    Route::post('{productId}/increment', [CartController::class, 'incrementQuantity']);
    Route::post('{productId}/decrement', [CartController::class, 'decrementQuantity']);
    Route::post('{productId}/remove', [CartController::class, 'removeFromCart']);
});

// Rutas del checkout (Protegidas con middleware de autenticación)
Route::middleware(['auth'])->group(function () {
    Route::get('/checkout', [CheckoutController::class, 'index'])->name('checkout');
    Route::post('/checkout/confirm', [CheckoutController::class, 'confirmOrder'])->name('checkout.confirm');
});

// Ruta de detalles del producto
Route::get('/product/{id}', function ($id) {
    $product = Product::findOrFail($id);
    return Inertia::render('ProductDetails', ['product' => $product]);
})->name('product.details');

// Otras rutas estáticas
Route::get('/about', fn() => Inertia::render('About'))->name('about');
Route::get('/contact', fn() => Inertia::render('Contact'))->name('contact');

// Dashboard y autenticación
Route::middleware(['auth', 'verified'])->get('/dashboard', fn() => Inertia::render('Dashboard'))->name('dashboard');

Route::middleware('auth')->group(function () {
    Route::get('/profile', [ProfileController::class, 'edit'])->name('profile.edit');
    Route::patch('/profile', [ProfileController::class, 'update'])->name('profile.update');
    Route::delete('/profile', [ProfileController::class, 'destroy'])->name('profile.destroy');
});
Route::get('/addresses/search', [CheckoutController::class, 'getAddresses']);
// Autenticación (Laravel Breeze o Jetstream)
require __DIR__.'/auth.php';
