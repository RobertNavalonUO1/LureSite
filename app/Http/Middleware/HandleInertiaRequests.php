<?php

namespace App\Http\Middleware;

use App\Services\ShoppingCartService;
use App\Support\ProfileAvatar;
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
        $shoppingCartService = app(ShoppingCartService::class);
        $cartItems = array_values($shoppingCartService->itemsForRequest($request));

        return array_merge(parent::share($request), [
            'locale' => app()->getLocale(),
            'locales' => ['es', 'en', 'fr'],
            'auth' => [
                'user' => $request->user() ? [
                    'id' => $request->user()->id,
                    'name' => $request->user()->name,
                    'email' => $request->user()->email,
                    'avatar' => ProfileAvatar::resolve(
                        $request->user()->avatar,
                        $request->user()->id,
                        $request->user()->email,
                        $request->user()->photo_url
                    ),
                    'photo_url' => $request->user()->photo_url,
                    'default_address_id' => $request->user()->default_address_id,
                    'is_admin' => (bool) $request->user()->is_admin,
                ] : null,
            ],
            'cartItems' => $cartItems,
            'cartCount' => array_sum(array_column($cartItems, 'quantity')),
            'total' => collect($cartItems)->sum(function ($item) {
                return $item['price'] * $item['quantity'];
            }),
            'flash' => [
                'success' => $request->session()->get('success'),
                'error' => $request->session()->get('error'),
            ],
        ]);
    }
}
