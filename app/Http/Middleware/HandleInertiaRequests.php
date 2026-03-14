<?php

namespace App\Http\Middleware;

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
