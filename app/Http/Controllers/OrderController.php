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
        $orders = Order::with(['items.product'])
            ->byUser(Auth::id())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order) => $this->mapOrderListItem($order));

        return Inertia::render('Orders/Index', [
            'orders' => $orders,
        ]);
    }

    public function shipped()
    {
        $statusDetails = [
            'enviado' => ['label' => 'Enviado', 'progress' => 2],
            'entregado' => ['label' => 'Entregado', 'progress' => 3],
            'confirmado' => ['label' => 'Confirmado', 'progress' => 3],
        ];

        $orders = Order::with(['items.product'])
            ->byUser(Auth::id())
            ->shipped()
            ->orderByDesc('created_at')
            ->get()
            ->map(function (Order $order) use ($statusDetails) {
                $detail = $statusDetails[$order->status] ?? [];

                return [
                    'id' => $order->id,
                    'date' => $order->created_at?->format('d/m/Y H:i'),
                    'status' => $order->status,
                    'status_label' => $detail['label'] ?? ucfirst(str_replace('_', ' ', $order->status)),
                    'total' => $order->total,
                    'address' => $order->address,
                    'estimated_delivery' => $this->estimatedDelivery($order),
                    'progress_step' => $detail['progress'] ?? 0,
                    'items' => $order->items->map(fn ($item) => $this->mapOrderItem($item))->values(),
                ];
            })
            ->values();

        return Inertia::render('Orders/ShippedOrders', [
            'orders' => $orders,
        ]);
    }

    public function paid()
    {
        $orders = Order::with(['items.product'])
            ->byUser(Auth::id())
            ->paid()
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order) => $this->mapOrderListItem($order));

        return Inertia::render('Orders/Paid', [
            'orders' => $orders,
        ]);
    }

    public function cancelled()
    {
        $orders = Order::with(['items.product'])
            ->byUser(Auth::id())
            ->whereIn('status', ['cancelacion_pendiente', 'cancelado', 'devolucion_solicitada', 'devolucion_aprobada', 'devolucion_rechazada', 'reembolsado'])
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order) => $this->mapOrderListItem($order));

        return Inertia::render('Orders/CancelledRefundedOrders', [
            'orders' => $orders,
        ]);
    }

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
                'items' => $order->items->map(fn ($item) => $this->mapOrderItem($item))->values(),
            ],
        ]);
    }

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

    public function show($orderId)
    {
        $order = Order::with('items.product')
            ->where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return Inertia::render('Orders/Show', [
            'order' => [
                'id' => $order->id,
                'date' => $order->created_at->format('d/m/Y H:i'),
                'status' => $order->status,
                'total' => $order->total,
                'address' => $order->address,
                'can_cancel' => $order->canBeCancelled(),
                'can_refund' => $order->isRefundable(),
                'items' => $order->items->map(fn ($item) => $this->mapOrderItem($item))->values(),
            ],
        ]);
    }

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

    public function refund($orderId)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        if (!$order->isRefundable()) {
            return back()->with('error', 'El pedido aun no es elegible para devolución.');
        }

        $order->status = 'devolucion_solicitada';
        $order->save();

        return redirect()
            ->route('orders.cancelled')
            ->with('success', 'Solicitud de devolución registrada. Revisaremos el caso antes de emitir el reembolso.');
    }

    private function mapOrderListItem(Order $order): array
    {
        return [
            'id' => $order->id,
            'date' => $order->created_at?->format('d/m/Y H:i'),
            'status' => $order->status,
            'total' => $order->total,
            'address' => $order->address,
            'estimated_delivery' => $this->estimatedDelivery($order),
            'items' => $order->items->map(fn ($item) => $this->mapOrderItem($item))->values(),
        ];
    }

    private function mapOrderItem($item): array
    {
        return [
            'id' => $item->id,
            'name' => $item->product->name ?? $item->name,
            'quantity' => $item->quantity,
            'price' => $item->price,
            'image_url' => $item->product->image_url ?? null,
            'product_id' => $item->product->id ?? null,
            'product' => $item->product ? [
                'id' => $item->product->id,
                'name' => $item->product->name,
                'image_url' => $item->product->image_url,
                'price' => $item->product->price,
                'stock' => $item->product->stock,
                'category_id' => $item->product->category_id,
            ] : null,
        ];
    }

    private function estimatedDelivery(Order $order): ?string
    {
        return $order->created_at
            ? $order->created_at->copy()->addDays(5)->format('d/m/Y')
            : null;
    }
}
