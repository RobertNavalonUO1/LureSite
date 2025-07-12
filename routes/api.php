<?php

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Route;
use App\Http\Controllers\Api\MobileApiController;

/*
|--------------------------------------------------------------------------
| API Routes
|--------------------------------------------------------------------------
*/

Route::post('/mobile/register', [MobileApiController::class, 'register']);
Route::post('/mobile/login', [MobileApiController::class, 'login']);

Route::middleware('auth:sanctum')->prefix('mobile')->group(function () {
    Route::get('/products', [MobileApiController::class, 'products']);
    Route::get('/categories', [MobileApiController::class, 'categories']);
    Route::post('/place-order', [MobileApiController::class, 'placeOrder']);
    Route::get('/orders', [MobileApiController::class, 'myOrders']);
    Route::post('/addresses', [MobileApiController::class, 'saveAddress']);
    Route::get('/addresses', [MobileApiController::class, 'getAddresses']);
    Route::get('/me', [MobileApiController::class, 'me']);
});
