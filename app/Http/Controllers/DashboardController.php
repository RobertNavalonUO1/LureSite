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
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id'     => $order->id,
                    'date'   => $order->created_at->format('Y-m-d'),
                    'total'  => number_format($order->total, 2),
                    'status' => $order->status,
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
     * Muestra solo los pedidos enviados o entregados.
     */
    public function shipped()
    {
        $user = Auth::user();

        $orders = Order::where('user_id', $user->id)
            ->whereIn('status', ['enviado', 'entregado', 'confirmado'])
            ->with('items.product')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id'     => $order->id,
                    'date'   => $order->created_at->format('Y-m-d'),
                    'total'  => number_format($order->total, 2),
                    'status' => $order->status,
                    'estimated_delivery' => $order->created_at->addDays(3)->format('Y-m-d'),
                    'address' => $order->address,
                    'items'  => $order->items->map(function ($item) {
                        return [
                            'id'       => $item->product->id,
                            'name'     => $item->product->name,
                            'quantity' => $item->quantity,
                            'price'    => $item->price,
                        ];
                    }),
                ];
            });

        return Inertia::render('ShippedOrders', [
            'orders' => $orders,
        ]);
    }

    /**
     * Panel admin: lista de pedidos con gestión de estado.
     */
    public function adminOrders()
    {
        $orders = Order::with('items')
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id'     => $order->id,
                    'user'   => $order->name,
                    'email'  => $order->email,
                    'total'  => number_format($order->total, 2),
                    'status' => $order->status,
                    'date'   => $order->created_at->format('Y-m-d'),
                    'address'=> $order->address,
                ];
            });

        return Inertia::render('AdminOrders', [
            'orders' => $orders,
        ]);
    }

    /**
     * Admin: marcar un pedido como enviado.
     */
    public function markAsShipped(Order $order)
    {
        $order->status = 'enviado';
        $order->save();

        return back()->with('success', 'Pedido marcado como enviado.');
    }

    /**
     * Admin: marcar un pedido como entregado.
     */
    public function markAsDelivered(Order $order)
    {
        $order->status = 'entregado';
        $order->save();

        return back()->with('success', 'Pedido marcado como entregado.');
    }

    /**
     * Usuario: confirmar que recibió el pedido.
     */
    public function confirmOrder($orderId)
    {
        $order = Order::where('id', $orderId)->where('user_id', Auth::id())->firstOrFail();

        if ($order->status === 'entregado') {
            $order->status = 'confirmado';
            $order->save();
            return back()->with('success', 'Has confirmado la entrega del pedido.');
        }

        return back()->with('error', 'Este pedido no puede ser confirmado todavía.');
    }
}
