<?php

use Illuminate\Http\Request;


/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MobileApiController;

Route::post('/mobile/register', [MobileApiController::class, 'register']);
Route::post('/mobile/login', [MobileApiController::class, 'login']);

// 👇 Rutas públicas (sin token)
Route::get('/mobile/products', [MobileApiController::class, 'products']);
Route::get('/mobile/categories', [MobileApiController::class, 'categories']);

// 👇 Rutas protegidas (requieren token válido)
Route::middleware('auth:sanctum')->prefix('mobile')->group(function () {
    Route::post('/place-order', [MobileApiController::class, 'placeOrder']);
    Route::get('/orders', [MobileApiController::class, 'myOrders']);
    Route::post('/addresses', [MobileApiController::class, 'saveAddress']);
    Route::get('/addresses', [MobileApiController::class, 'getAddresses']);
    Route::get('/me', [MobileApiController::class, 'me']);
});
