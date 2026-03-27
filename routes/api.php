<?php

use App\Http\Controllers\Api\MobileApiController;
use App\Http\Controllers\Api\PaymentsWebhookController;
use App\Http\Controllers\Api\MobileV1\AddressController as MobileV1AddressController;
use App\Http\Controllers\Api\MobileV1\AuthController as MobileV1AuthController;
use App\Http\Controllers\Api\MobileV1\CartController as MobileV1CartController;
use App\Http\Controllers\Api\MobileV1\CatalogController as MobileV1CatalogController;
use App\Http\Controllers\Api\MobileV1\CheckoutController as MobileV1CheckoutController;
use App\Http\Controllers\Api\MobileV1\OrdersController as MobileV1OrdersController;
use App\Http\Controllers\Api\SocialAuthController;
use Illuminate\Support\Facades\Route;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/auth/social', [SocialAuthController::class, 'exchange']);
Route::post('/payments/webhooks/stripe', [PaymentsWebhookController::class, 'stripe'])->name('api.payments.webhooks.stripe');
Route::post('/payments/webhooks/paypal', [PaymentsWebhookController::class, 'paypal'])->name('api.payments.webhooks.paypal');

Route::post('/mobile/register', [MobileApiController::class, 'register']);
Route::post('/mobile/login', [MobileApiController::class, 'login']);

Route::get('/mobile/products', [MobileApiController::class, 'products']);
Route::get('/mobile/categories', [MobileApiController::class, 'categories']);

Route::middleware('auth:sanctum')->prefix('mobile')->group(function () {
    Route::post('/place-order', [MobileApiController::class, 'placeOrder']);
    Route::get('/orders', [MobileApiController::class, 'myOrders']);
    Route::post('/addresses', [MobileApiController::class, 'saveAddress']);
    Route::get('/addresses', [MobileApiController::class, 'getAddresses']);
    Route::get('/me', [MobileApiController::class, 'me']);
});

Route::prefix('mobile/v1')->middleware('api.locale')->name('api.mobile.v1.')->group(function () {
    Route::post('/auth/register', [MobileV1AuthController::class, 'register'])->name('auth.register');
    Route::post('/auth/login', [MobileV1AuthController::class, 'login'])->name('auth.login');

    Route::get('/home', [MobileV1CatalogController::class, 'home'])->name('home');
    Route::get('/search/suggestions', [MobileV1CatalogController::class, 'suggestions'])->name('search.suggestions');
    Route::get('/products', [MobileV1CatalogController::class, 'products'])->name('products.index');
    Route::get('/products/{id}', [MobileV1CatalogController::class, 'show'])->name('products.show');
    Route::get('/categories', [MobileV1CatalogController::class, 'categories'])->name('categories.index');
    Route::get('/categories/{slug}', [MobileV1CatalogController::class, 'category'])->name('categories.show');
    Route::get('/special/{collection}', [MobileV1CatalogController::class, 'special'])->name('special.show');

    Route::get('/checkout/payments/{provider}/return', [MobileV1CheckoutController::class, 'paymentReturn'])->name('checkout.payments.return');
    Route::get('/checkout/payments/{provider}/cancel', [MobileV1CheckoutController::class, 'paymentCancel'])->name('checkout.payments.cancel');

    Route::middleware('auth:sanctum')->group(function () {
        Route::post('/auth/logout', [MobileV1AuthController::class, 'logout'])->name('auth.logout');
        Route::get('/me', [MobileV1AuthController::class, 'me'])->name('me.show');
        Route::patch('/me', [MobileV1AuthController::class, 'update'])->name('me.update');

        Route::get('/cart', [MobileV1CartController::class, 'index'])->name('cart.show');
        Route::put('/cart', [MobileV1CartController::class, 'replace'])->name('cart.replace');
        Route::post('/cart/items', [MobileV1CartController::class, 'store'])->name('cart.items.store');
        Route::patch('/cart/items/{lineId}', [MobileV1CartController::class, 'update'])->name('cart.items.update');
        Route::delete('/cart/items/{lineId}', [MobileV1CartController::class, 'destroy'])->name('cart.items.destroy');

        Route::get('/addresses', [MobileV1AddressController::class, 'index'])->name('addresses.index');
        Route::post('/addresses', [MobileV1AddressController::class, 'store'])->name('addresses.store');
        Route::patch('/addresses/{address}', [MobileV1AddressController::class, 'update'])->name('addresses.update');
        Route::patch('/addresses/{address}/default', [MobileV1AddressController::class, 'makeDefault'])->name('addresses.default');
        Route::delete('/addresses/{address}', [MobileV1AddressController::class, 'destroy'])->name('addresses.destroy');

        Route::post('/checkout/quote', [MobileV1CheckoutController::class, 'quote'])->name('checkout.quote');
        Route::post('/checkout/coupon', [MobileV1CheckoutController::class, 'coupon'])->name('checkout.coupon');
        Route::post('/checkout/shipping', [MobileV1CheckoutController::class, 'shipping'])->name('checkout.shipping');
        Route::post('/checkout/payments/{provider}/session', [MobileV1CheckoutController::class, 'paymentSession'])->name('checkout.payments.session');
        Route::get('/checkout/payments/{contextId}/status', [MobileV1CheckoutController::class, 'paymentStatus'])->name('checkout.payments.status');

        Route::get('/orders', [MobileV1OrdersController::class, 'index'])->name('orders.index');
        Route::get('/orders/{order}', [MobileV1OrdersController::class, 'show'])->name('orders.show');
        Route::post('/orders/{order}/cancel', [MobileV1OrdersController::class, 'cancel'])->name('orders.cancel');
        Route::post('/orders/{order}/refund', [MobileV1OrdersController::class, 'refund'])->name('orders.refund');
        Route::post('/orders/{order}/items/{itemId}/cancel', [MobileV1OrdersController::class, 'cancelItem'])->name('orders.items.cancel');
        Route::post('/orders/{order}/items/{itemId}/refund', [MobileV1OrdersController::class, 'refundItem'])->name('orders.items.refund');
    });
});
