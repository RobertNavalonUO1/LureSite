<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        $orders = Order::where('user_id', Auth::id())
            ->with('items.product')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Orders/Index', [
            'orders' => $orders->map(fn($order) => $this->transform($order)),
        ]);
    }

    public function shipped()
    {
        $orders = Order::where('user_id', Auth::id())
            ->whereIn('status', ['enviado', 'entregado', 'confirmado'])
            ->with('items.product')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('Orders/Shipped', [
            'orders' => $orders->map(fn($order) => $this->transform($order)),
        ]);
    }

    public function confirm($orderId)
    {
        $order = Order::where('id', $orderId)->where('user_id', Auth::id())->firstOrFail();

        if ($order->status === 'entregado') {
            $order->status = 'confirmado';
            $order->save();
            return back()->with('success', 'Has confirmado la entrega del pedido.');
        }

        return back()->with('error', 'Este pedido no puede ser confirmado todavía.');
    }

    // 🔒 ADMIN
    public function adminIndex()
    {
        $orders = Order::with('items')
            ->orderByDesc('created_at')
            ->get();

        return Inertia::render('AdminOrders', [
            'orders' => $orders->map(fn($order) => [
                'id' => $order->id,
                'user' => $order->name,
                'email' => $order->email,
                'total' => number_format($order->total, 2),
                'status' => $order->status,
                'date' => $order->created_at->format('Y-m-d'),
                'address' => $order->address,
            ]),
        ]);
    }

    public function markAsShipped(Order $order)
    {
        $order->status = 'enviado';
        $order->save();
        return back()->with('success', 'Pedido marcado como enviado.');
    }

    public function markAsDelivered(Order $order)
    {
        $order->status = 'entregado';
        $order->save();
        return back()->with('success', 'Pedido marcado como entregado.');
    }

    private function transform($order)
    {
        return [
            'id' => $order->id,
            'date' => $order->created_at->format('Y-m-d'),
            'total' => number_format($order->total, 2),
            'status' => $order->status,
            'address' => $order->address,
            'items' => $order->items->map(fn($item) => [
                'id' => $item->product->id,
                'name' => $item->product->name,
                'image' => $item->product->image,
                'quantity' => $item->quantity,
                'price' => $item->price,
            ]),
        ];
    }
}
