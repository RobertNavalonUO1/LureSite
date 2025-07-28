<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Muestra el dashboard del usuario con sus datos y carrito (pero sin lógica de pedidos).
     */
    public function index()
    {
        $user = Auth::user();

        $cart = session()->get('cart', []);

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar ?? '/default-avatar.png',
                ]
            ],
            'orders' => [], // ← opcional: puedes quitarlo si Dashboard.jsx ya no lo necesita
            'cartItems' => array_values($cart),
        ]);
    }
}
