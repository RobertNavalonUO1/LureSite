<?php

namespace App\Http\Controllers;

use App\Models\Order;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    /**
     * Mostrar todos los pedidos del usuario autenticado.
     */
    public function index()
    {
        // Todos los pedidos del usuario autenticado
        $orders = \App\Models\Order::with(['items.product'])
            ->byUser(auth()->id())
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                $estimatedDelivery = $order->created_at
                    ? $order->created_at->copy()->addDays(5)->format('d/m/Y')
                    : null;

                return [
                    'id' => $order->id,
                    'date' => $order->created_at->format('d/m/Y H:i'),
                    'status' => $order->status,
                    'total' => $order->total,
                    'address' => $order->address,
                    'estimated_delivery' => $estimatedDelivery,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->product->name ?? $item->name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'image_url' => $item->product->image_url ?? null,
                            'product_id' => $item->product->id ?? null,
                            'product' => $item->product ? $item->product->toArray() : null,
                        ];
                    }),
                ];
            });

        return \Inertia\Inertia::render('Orders/Index', [
            'orders' => $orders,
        ]);
    }

    /**
     * Mostrar pedidos que han sido enviados, entregados o confirmados.
     */
    public function shipped()
    {
        $statusDetails = [
            'pagado' => ['label' => 'Pagado', 'progress' => 0],
            'pendiente_envio' => ['label' => 'Pendiente de envio', 'progress' => 1],
            'enviado' => ['label' => 'Enviado', 'progress' => 2],
            'entregado' => ['label' => 'Entregado', 'progress' => 3],
            'confirmado' => ['label' => 'Confirmado', 'progress' => 3],
            'devolucion_aprobada' => ['label' => 'Devolucion aprobada', 'progress' => 3],
        ];

        $orders = \App\Models\Order::with(['items.product'])
            ->byUser(auth()->id())
            ->shipped()
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) use ($statusDetails) {
                $detail = $statusDetails[$order->status] ?? [];
                $estimatedDelivery = $order->created_at
                    ? $order->created_at->copy()->addDays(5)->format('d/m/Y')
                    : null;

                return [
                    'id' => $order->id,
                    'date' => $order->created_at?->format('d/m/Y H:i'),
                    'status' => $order->status,
                    'status_label' => $detail['label'] ?? ucfirst(str_replace('_', ' ', $order->status)),
                    'total' => $order->total,
                    'address' => $order->address,
                    'estimated_delivery' => $estimatedDelivery,
                    'progress_step' => $detail['progress'] ?? 0,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->product->name ?? $item->name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'image_url' => $item->product->image_url ?? null,
                            'product_id' => $item->product->id ?? null,
                            'product' => $item->product ? $item->product->toArray() : null,
                        ];
                    })->values(),
                ];
            })
            ->values();

        return \Inertia\Inertia::render('ShippedOrders', [
            'orders' => $orders,
        ]);
    }

    /**
     * Mostrar pedidos pagados (puedes ajustar según tu lógica de negocio).
     */
    public function paid()
    {
        // Solo pedidos pagados y posteriores
        $orders = \App\Models\Order::with(['items.product'])
            ->byUser(auth()->id())
            ->paid()
            ->orderByDesc('created_at')
            ->get()
            ->map(function ($order) {
                return [
                    'id' => $order->id,
                    'date' => $order->created_at->format('d/m/Y H:i'),
                    'status' => $order->status,
                    'total' => $order->total,
                    'address' => $order->address,
                    'items' => $order->items->map(function ($item) {
                        return [
                            'id' => $item->id,
                            'name' => $item->product->name ?? $item->name,
                            'quantity' => $item->quantity,
                            'price' => $item->price,
                            'image_url' => $item->product->image_url ?? null,
                            'product_id' => $item->product->id ?? null,
                            'product' => $item->product ? $item->product->toArray() : null,
                        ];
                    }),
                ];
            });

        return \Inertia\Inertia::render('Orders/Paid', [
            'orders' => $orders,
        ]);
    }

    /**
     * Mostrar pantalla de confirmacion de cancelacion.
     */
    public function cancelPrompt($orderId)
    {
        $order = Order::with('items.product')
            ->where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$order->canBeCancelled()) {
            return redirect()->route('orders.show', $orderId)
                ->with('error', 'Este pedido no puede cancelarse en este momento.');
        }

        return Inertia::render('Orders/CancelConfirm', [
            'order' => [
                'id' => $order->id,
                'date' => $order->created_at?->format('d/m/Y H:i'),
                'status' => $order->status,
                'total' => $order->total,
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->product->name ?? $item->name,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                    ];
                })->values(),
            ],
        ]);
    }

    /**
     * Confirmar que el pedido fue recibido por el cliente.
     */
    public function confirm($orderId)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if ($order->status === 'entregado') {
            $order->status = 'confirmado';
            $order->save();

            return back()->with('success', 'Has confirmado la entrega del pedido.');
        }

        return back()->with('error', 'Este pedido no puede ser confirmado todavía.');
    }

    /**
     * Panel de administración: mostrar todos los pedidos.
     */
    public function adminIndex()
    {
        $orders = Order::with('items.product')
            ->orderByDesc('created_at')
            ->get()
            ->map(fn($order) => [
                'id' => $order->id,
                'user' => $order->name,
                'email' => $order->email,
                'total' => number_format($order->total, 2),
                'status' => $order->status,
                'date' => $order->created_at->format('Y-m-d'),
                'address' => $order->address,
                'items' => $order->items->map(fn($item) => [
                    'product' => $item->product->name ?? 'Eliminado',
                    'quantity' => $item->quantity,
                    'price' => $item->price,
                ]),
            ]);

        return Inertia::render('AdminOrders', ['orders' => $orders]);
    }

    /**
     * Marcar un pedido como enviado (admin).
     */
    public function markAsShipped(Order $order)
    {
        if (in_array($order->status, ['confirmado', 'pagado', 'pendiente_envio'])) {
            $order->status = 'enviado';
            $order->save();

            return back()->with('success', 'Pedido marcado como enviado.');
        }

        return back()->with('error', 'No se puede marcar como enviado en este estado.');
    }
public function cancelled()
{
    $orders = \App\Models\Order::with(['items.product'])
        ->byUser(auth()->id())
        ->whereIn('status', ['cancelacion_pendiente', 'cancelado', 'devolucion_aprobada', 'reembolsado'])
        ->orderByDesc('created_at')
        ->get()
        ->map(function ($order) {
            return [
                'id' => $order->id,
                'date' => $order->created_at->format('d/m/Y H:i'),
                'status' => $order->status,
                'total' => $order->total,
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->product->name ?? $item->name,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'image_url' => $item->product->image_url ?? null,
                        'product_id' => $item->product->id ?? null,
                        'product' => $item->product ? $item->product->toArray() : null,
                    ];
                }),
            ];
        });

    return \Inertia\Inertia::render('Orders/CancelledRefundedOrders', [
        'orders' => $orders,
    ]);
}

    /**
     * Marcar un pedido como entregado (admin).
     */
    public function markAsDelivered(Order $order)
    {
        if ($order->status === 'enviado') {
            $order->status = 'entregado';
            $order->save();

            return back()->with('success', 'Pedido marcado como entregado.');
        }

        return back()->with('error', 'No se puede marcar como entregado en este estado.');
    }

    /**
     * Formatear y mapear un pedido.
     */
    private function transform(Order $order)
    {
        return [
            'id' => $order->id,
            'date' => $order->created_at->format('Y-m-d'),
            'total' => number_format($order->total, 2),
            'status' => $order->status,
            'address' => $order->address,
            'items' => $order->items->map(fn($item) => [
                'id' => $item->product->id ?? null,
                'name' => $item->product->name ?? 'Producto eliminado',
                'image' => $item->product->image ?? null,
                'quantity' => $item->quantity,
                'price' => $item->price,
            ]),
        ];
    }
    public function show($orderId)
    {
        $order = \App\Models\Order::with('items.product')->findOrFail($orderId);

        return \Inertia\Inertia::render('Orders/Show', [
            'order' => [
                'id' => $order->id,
                'date' => $order->created_at->format('d/m/Y H:i'),
                'status' => $order->status,
                'total' => $order->total,
                'can_cancel' => $order->canBeCancelled(),
                'can_refund' => $order->isRefundable(),
                'items' => $order->items->map(function ($item) {
                    return [
                        'id' => $item->id,
                        'name' => $item->product->name ?? $item->name,
                        'quantity' => $item->quantity,
                        'price' => $item->price,
                        'image_url' => $item->product->image_url ?? null,
                        'product_id' => $item->product->id ?? null,
                        'product' => $item->product ? $item->product->toArray() : null,
                    ];
                }),
            ],
        ]);
    }

    /**
     * Cancelar pedido por usuario autenticado.
     */
    public function cancel(Request $request, $orderId)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$order->canBeCancelled()) {
            return back()->with('error', 'Este pedido no puede cancelarse en este estado.');
        }

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $order->status = 'cancelacion_pendiente';
        $order->cancellation_reason = $validated['reason'] ?? 'Solicitud de cancelacion por el usuario';
        $order->cancelled_by = 'user';
        $order->cancelled_at = null;
        $order->save();

        return redirect()
            ->route('orders.cancelled')
            ->with('success', 'Solicitud de cancelacion registrada. Revisaremos el pedido y confirmaremos en un plazo estimado de 24-48 horas.');
    }

    /**
     * Registrar la solicitud de reembolso por parte del usuario.
     */
    public function refund(Request $request, $orderId)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$order->isRefundable()) {
            return back()->with('error', 'El pedido aun no es elegible para reembolso.');
        }

        $order->status = 'reembolsado';
        $order->save();

        return redirect()
            ->route('orders.cancelled')
            ->with('success', 'Solicitud de reembolso recibida. Procesaremos la devolucion en las proximas 24-48 horas.');
    }

    /**
     * Cancelar pedido por administrador.
     */
    public function adminCancel(Request $request, $orderId)
    {
        $order = Order::findOrFail($orderId);

        if ($order->isShipped() || $order->status === 'cancelado') {
            return back()->with('error', 'No se puede cancelar un pedido ya enviado o cancelado.');
        }

        $order->status = 'cancelado';
        $order->cancellation_reason = $request->input('reason') ?: 'Cancelado por administrador';
        $order->cancelled_by = 'admin';
        $order->cancelled_at = now();
        $order->save();

        // Opcional: devolución de dinero

        return back()->with('success', 'Pedido cancelado por el administrador.');
    }
}








