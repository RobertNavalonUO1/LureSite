<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Muestra el dashboard del usuario con todos sus pedidos y carrito.
     */
    public function index()
    {
        $user = Auth::user();

        $orders = Order::where('user_id', $user->id)
            ->with('items.product')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id'     => $order->id,
                    'date'   => $order->created_at->format('Y-m-d'),
                    'total'  => number_format($order->total, 2),
                    'status' => $order->payment_method,
                    'items'  => $order->items->map(function ($item) {
                        return [
                            'id'       => $item->product->id,
                            'name'     => $item->product->name,
                            'image'    => $item->product->image,
                            'quantity' => $item->quantity,
                            'price'    => $item->price,
                        ];
                    }),
                ];
            });

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
            'orders' => $orders,
            'cartItems' => array_values($cart),
        ]);
    }

    /**
     * Muestra solo los pedidos enviados (payment_method = 'shipped').
     */
    public function shipped()
    {
        $user = Auth::user();

        $orders = Order::where('user_id', $user->id)
            ->with('items.product')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id'     => $order->id,
                    'date'   => $order->created_at->format('Y-m-d'),
                    'total'  => number_format($order->total, 2),
                    'status' => $order->payment_method,
                    'items'  => $order->items->map(function ($item) {
                        return [
                            'id'       => $item->product->id,
                            'name'     => $item->product->name,
                            'image'    => $item->product->image,
                            'quantity' => $item->quantity,
                            'price'    => $item->price,
                        ];
                    }),
                ];
            });

        $shippedOrders = $orders->filter(fn($o) => $o['status'] === 'shipped')->values();

        return Inertia::render('ShippedOrders', [
            'orders' => $shippedOrders,
        ]);
    }
}
