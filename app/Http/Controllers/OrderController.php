<?php

namespace App\Http\Controllers;

use App\Models\Order;
use App\Models\OrderItem;
use App\Services\OrderLineStateService;
use App\Support\OrderState;
use DomainException;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Inertia\Inertia;

class OrderController extends Controller
{
    public function index()
    {
        return $this->renderOrdersIndex('all');
    }

    public function shipped()
    {
        return $this->renderOrdersIndex('shipped');
    }

    public function paid()
    {
        return $this->renderOrdersIndex('paid');
    }

    public function cancelled()
    {
        return $this->renderOrdersIndex('cancelled');
    }

    public function cancelPrompt($orderId)
    {
        return redirect()
            ->route('orders.show', $orderId)
            ->with('info', 'La cancelacion ahora se gestiona desde el detalle del pedido por linea o de forma agrupada.');
    }

    public function confirm($orderId, OrderLineStateService $lineStateService)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        try {
            $lineStateService->confirmDeliveredItems($order);
            return back()->with('success', 'Has confirmado la entrega del pedido.');
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }
    }

    public function show($orderId)
    {
        $order = Order::with('items.product')
            ->where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        return Inertia::render('Orders/Show', [
            'order' => $this->mapOrderListItem($order),
        ]);
    }

    public function cancel(Request $request, $orderId, OrderLineStateService $lineStateService)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $affectedItems = $lineStateService->cancelOrder(
                order: $order,
                reason: $validated['reason'] ?? null,
                actor: 'user',
            );
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('orders.cancelled')
            ->with('success', "Solicitud de cancelacion registrada para {$affectedItems} linea(s). Revisaremos el pedido y confirmaremos en un plazo estimado de 24-48 horas.");
    }

    public function cancelItem(Request $request, $orderId, $itemId, OrderLineStateService $lineStateService)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $item = $this->findOwnedOrderItem($orderId, $itemId);

        try {
            $lineStateService->cancelItem($item, $validated['reason'] ?? null, 'user');
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'La linea del pedido se ha marcado para cancelacion.');
    }

    public function refund($orderId, OrderLineStateService $lineStateService, Request $request)
    {
        $order = Order::where('id', $orderId)
            ->where('user_id', Auth::id())
            ->firstOrFail();

        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        try {
            $affectedItems = $lineStateService->requestRefundForOrder($order, $validated['reason'] ?? null);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return redirect()
            ->route('orders.cancelled')
            ->with('success', "Solicitud de devolucion registrada para {$affectedItems} linea(s). Revisaremos el caso antes de emitir el reembolso.");
    }

    public function refundItem(Request $request, $orderId, $itemId, OrderLineStateService $lineStateService)
    {
        $validated = $request->validate([
            'reason' => ['nullable', 'string', 'max:500'],
        ]);

        $item = $this->findOwnedOrderItem($orderId, $itemId);

        try {
            $lineStateService->requestRefund($item, $validated['reason'] ?? null);
        } catch (DomainException $exception) {
            return back()->with('error', $exception->getMessage());
        }

        return back()->with('success', 'La devolucion de la linea se ha solicitado correctamente.');
    }

    private function renderOrdersIndex(string $activeFilter)
    {
        $mappedOrders = Order::with(['items.product'])
            ->byUser(Auth::id())
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order) => $this->mapOrderListItem($order))
            ->values();

        $filters = collect([
            ['key' => 'all', 'label' => 'Todos', 'href' => route('orders.index')],
            ['key' => 'paid', 'label' => 'Activos', 'href' => route('orders.paid')],
            ['key' => 'shipped', 'label' => 'En seguimiento', 'href' => route('orders.shipped')],
            ['key' => 'cancelled', 'label' => 'Cancelados y reembolsos', 'href' => route('orders.cancelled')],
        ])->map(function (array $filter) use ($mappedOrders) {
            $filter['count'] = $mappedOrders->filter(
                fn (array $order) => $this->matchesFilter($order, $filter['key'])
            )->count();

            return $filter;
        })->values();

        return Inertia::render('Orders/Index', [
            'orders' => $mappedOrders->filter(fn (array $order) => $this->matchesFilter($order, $activeFilter))->values(),
            'filters' => $filters,
            'activeFilter' => $activeFilter,
        ]);
    }

    private function mapOrderListItem(Order $order): array
    {
        $summary = $order->statusSummary();
        $items = $order->items->map(fn ($item) => $this->mapOrderItem($item))->values();
        $activeTotal = $items->whereIn('status', OrderState::ACTIVE_ITEM_STATUSES)->sum('subtotal');
        $affectedTotal = $items->whereNotIn('status', OrderState::ACTIVE_ITEM_STATUSES)->sum('subtotal');

        return [
            'id' => $order->id,
            'date' => $order->created_at?->format('d/m/Y H:i'),
            'status' => $order->status,
            'status_label' => OrderState::label($order->status),
            'summary_status' => $summary['summary_status'],
            'summary_status_label' => OrderState::label($summary['summary_status']),
            'total' => (float) $order->total,
            'active_total' => round((float) $activeTotal, 2),
            'affected_total' => round((float) $affectedTotal, 2),
            'address' => $order->address,
            'shipping_method' => $order->shipping_method,
            'shipping_label' => $order->shipping_label,
            'shipping_cost' => (float) ($order->shipping_cost ?? 0),
            'tracking_carrier' => $order->tracking_carrier,
            'tracking_number' => $order->tracking_number,
            'tracking_url' => $order->tracking_url,
            'coupon_code' => $order->coupon_code,
            'discount' => (float) ($order->discount ?? 0),
            'payment_method' => $order->payment_method,
            'transaction_id' => $order->transaction_id,
            'estimated_delivery' => $this->estimatedDelivery($order),
            'can_cancel' => $summary['can_cancel_order'],
            'can_refund' => $summary['can_refund_order'],
            'line_counts' => $summary['counts'],
            'items' => $items,
        ];
    }

    private function mapOrderItem($item): array
    {
        $status = $item->status ?? 'pendiente_pago';

        return [
            'id' => $item->id,
            'name' => $item->product->name ?? $item->name,
            'quantity' => $item->quantity,
            'price' => $item->price,
            'subtotal' => round((float) $item->price * (int) $item->quantity, 2),
            'status' => $status,
            'status_label' => OrderState::label($status),
            'can_cancel' => $item->canBeCancelled(),
            'can_refund' => $item->canRequestRefund(),
            'cancellation_reason' => $item->cancellation_reason,
            'cancelled_by' => $item->cancelled_by,
            'cancelled_at' => $item->cancelled_at?->format('d/m/Y H:i'),
            'return_reason' => $item->return_reason,
            'refund_reference_id' => $item->refund_reference_id,
            'refunded_at' => $item->refunded_at?->format('d/m/Y H:i'),
            'refund_error' => $item->refund_error,
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

    private function matchesFilter(array $order, string $filter): bool
    {
        if ($filter === 'all') {
            return true;
        }

        $itemStatuses = collect($order['items'])->pluck('status');

        return match ($filter) {
            'paid' => $itemStatuses->contains(fn (string $status) => in_array($status, [
                'pagado',
                'pendiente_envio',
                'enviado',
                'entregado',
                'confirmado',
            ], true)),
            'shipped' => $itemStatuses->contains(fn (string $status) => in_array($status, ['enviado', 'entregado', 'confirmado'], true)),
            'cancelled' => $itemStatuses->contains(fn (string $status) => OrderState::isCancellationRelated($status) || OrderState::isRefundRelated($status))
                || OrderState::isCancellationRelated($order['summary_status'])
                || OrderState::isRefundRelated($order['summary_status']),
            default => true,
        };
    }

    private function findOwnedOrderItem(int|string $orderId, int|string $itemId): OrderItem
    {
        return OrderItem::query()
            ->where('id', $itemId)
            ->where('order_id', $orderId)
            ->whereHas('order', fn ($query) => $query->where('user_id', Auth::id()))
            ->firstOrFail();
    }
}
