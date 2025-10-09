<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
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

        $statusCounts = Order::query()
            ->byUser($user->id)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $ordersSummary = [
            'total' => $statusCounts->sum(),
            'inProgress' => $statusCounts->only(['pendiente_pago', 'pagado', 'pendiente_envio'])->sum(),
            'shipped' => $statusCounts->only(['enviado', 'entregado', 'confirmado'])->sum(),
            'cancelled' => $statusCounts->only(['cancelacion_pendiente', 'cancelado', 'reembolsado'])->sum(),
        ];

        $orders = Order::with(['items.product'])
            ->byUser($user->id)
            ->latest()
            ->take(5)
            ->get()
            ->map(function (Order $order) {
                return [
                    'id' => $order->id,
                    'status' => $order->status,
                    'date' => $order->created_at?->format('d/m/Y H:i'),
                    'total' => (float) $order->total,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->product->name ?? $item->name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                        ];
                    })->values(),
                ];
            })
            ->values()
            ->all();

        return Inertia::render('Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => $user->avatar ?? '/default-avatar.png',
                    'is_admin' => $user->is_admin ? true : false,
                ],
            ],
            'orders' => $orders,
            'ordersSummary' => $ordersSummary,
            'cartItems' => array_values($cart),
        ]);
    }
}
