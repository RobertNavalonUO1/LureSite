<?php

namespace App\Http\Controllers\Api\MobileV1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\Mobile\MobileOrderPresenter;
use App\Services\OrderLineStateService;
use Illuminate\Http\Request;

class OrdersController extends Controller
{
    use RespondsWithApi;

    public function __construct(
        private readonly MobileOrderPresenter $presenter,
    ) {
    }

    public function index(Request $request)
    {
        $request->validate([
            'filter' => ['nullable', 'in:all,paid,shipped,cancelled'],
        ]);

        $filter = $request->string('filter')->toString() ?: 'all';

        $orders = Order::query()
            ->with(['items.product'])
            ->where('user_id', $request->user()->id)
            ->orderByDesc('created_at')
            ->get()
            ->map(fn (Order $order) => $this->presenter->order($order))
            ->filter(function (array $order) use ($filter) {
                if ($filter === 'all') {
                    return true;
                }

                $statuses = collect($order['items'])->pluck('status');

                return match ($filter) {
                    'paid' => $statuses->contains(fn ($status) => in_array($status, ['pagado', 'pendiente_envio', 'enviado', 'entregado', 'confirmado'], true)),
                    'shipped' => $statuses->contains(fn ($status) => in_array($status, ['enviado', 'entregado', 'confirmado'], true)),
                    'cancelled' => $statuses->contains(fn ($status) => str_contains($status, 'cancel') || str_contains($status, 'devolucion') || $status === 'reembolsado'),
                    default => true,
                };
            })
            ->values()
            ->all();

        return $this->success($orders, ['filter' => $filter]);
    }

    public function show(Request $request, Order $order)
    {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 404);
        $order->loadMissing(['items.product']);

        return $this->success($this->presenter->order($order));
    }

    public function cancel(Request $request, Order $order, OrderLineStateService $lineStateService)
    {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 404);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $lineStateService->cancelOrder($order->loadMissing('items'), $data['reason'] ?? null, 'user');

        return $this->success([], ['message' => 'Cancellation requested.']);
    }

    public function refund(Request $request, Order $order, OrderLineStateService $lineStateService)
    {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 404);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);

        $lineStateService->requestRefundForOrder($order->loadMissing('items'), $data['reason'] ?? null);

        return $this->success([], ['message' => 'Refund requested.']);
    }

    public function cancelItem(Request $request, Order $order, int $itemId, OrderLineStateService $lineStateService)
    {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 404);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $item = $this->ownedItem($request, $order->id, $itemId);

        $lineStateService->cancelItem($item, $data['reason'] ?? null, 'user');

        return $this->success([], ['message' => 'Line cancellation requested.']);
    }

    public function refundItem(Request $request, Order $order, int $itemId, OrderLineStateService $lineStateService)
    {
        abort_unless((int) $order->user_id === (int) $request->user()->id, 404);
        $data = $request->validate(['reason' => ['nullable', 'string', 'max:500']]);
        $item = $this->ownedItem($request, $order->id, $itemId);

        $lineStateService->requestRefund($item, $data['reason'] ?? null);

        return $this->success([], ['message' => 'Line refund requested.']);
    }

    private function ownedItem(Request $request, int $orderId, int $itemId): OrderItem
    {
        return OrderItem::query()
            ->where('id', $itemId)
            ->where('order_id', $orderId)
            ->whereHas('order', fn ($query) => $query->where('user_id', $request->user()->id))
            ->firstOrFail();
    }
}
