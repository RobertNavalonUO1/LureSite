<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class DashboardController extends Controller
{
    /**
     * Muestra el dashboard del usuario con todos sus pedidos.
     */
    public function index()
    {
        $user = Auth::user();

        // Obtener pedidos del usuario ordenados por fecha descendente
        $orders = Order::where('user_id', $user->id)
            ->with('items.product')
            ->orderBy('created_at', 'desc')
            ->get()
            ->map(function ($order) {
                return [
                    'id'     => $order->id,
                    'date'   => $order->created_at->format('Y-m-d'),
                    'total'  => number_format($order->total, 2),
                    // En este caso usamos el campo payment_method como indicador de estado
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

        // Obtener carrito desde la sesión (si lo necesitas)
        $cart = session()->get('cart', []);

        return Inertia::render('Dashboard', [
            'auth'      => ['user' => $user],
            'orders'    => $orders,
            'cartItems' => array_values($cart),
        ]);
    }

    /**
     * Muestra solo los pedidos enviados (donde payment_method es 'shipped').
     */
    public function shipped()
    {
        $user = Auth::user();

        // Obtener pedidos del usuario ordenados por fecha descendente
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

        // Filtrar pedidos donde payment_method es 'shipped'
        $shippedOrders = $orders->filter(function ($order) {
            return $order['status'] === 'shipped';
        })->values(); // Reindexamos el array

        return Inertia::render('ShippedOrders', [
            'orders' => $shippedOrders,
        ]);
    }
}
