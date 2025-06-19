<?php

namespace App\Http\Middleware;

use Illuminate\Http\Request;
use Inertia\Middleware;

class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        return array_merge(parent::share($request), [
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'default_address_id' => $request->user()->default_address_id,
                ] : null,
            ],
            'cartItems' => array_values($request->session()->get('cart', [])),
            'cartCount' => array_sum(array_column($request->session()->get('cart', []), 'quantity')),
            'total' => collect($request->session()->get('cart', []))->sum(function($item) {
                return $item['price'] * $item['quantity'];
            }),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }
}
