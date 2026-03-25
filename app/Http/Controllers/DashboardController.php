<?php

namespace App\Http\Controllers;

use App\Support\ProfileAvatar;
use Illuminate\Http\Request;
use App\Models\Order;
use App\Services\ShoppingCartService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\DB;
use Inertia\Inertia;

class DashboardController extends Controller
{
    public function __construct(
        private readonly ShoppingCartService $shoppingCartService,
    ) {
    }

    /**
     * Muestra el dashboard del usuario con sus datos y carrito (pero sin lógica de pedidos).
     */
    public function index()
    {
        $user = Auth::user();
        $cart = $this->shoppingCartService->itemsForRequest(request());

        $statusCounts = Order::query()
            ->byUser($user->id)
            ->select('status', DB::raw('COUNT(*) as total'))
            ->groupBy('status')
            ->pluck('total', 'status');

        $ordersSummary = [
            'total' => $statusCounts->sum(),
            'inProgress' => $statusCounts->only(['pendiente_pago', 'pagado', 'pendiente_envio'])->sum(),
            'shipped' => $statusCounts->only(['enviado', 'entregado', 'confirmado'])->sum(),
            'cancelled' => $statusCounts->only(['cancelado', 'reembolsado'])->sum(),
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

        return Inertia::render('User/Dashboard', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'avatar' => ProfileAvatar::resolve($user->avatar, $user->id, $user->email, $user->photo_url),
                    'photo_url' => $user->photo_url,
                    'is_admin' => $user->is_admin ? true : false,
                ],
            ],
            'orders' => $orders,
            'ordersSummary' => $ordersSummary,
            'cartItems' => array_values($cart),
        ]);
    }
}
