<?php

namespace App\Services\Mobile;

use App\Models\Order;
use App\Support\OrderState;

class MobileOrderPresenter
{
    public function order(Order $order): array
    {
        $summary = $order->statusSummary();
        $items = $order->items->map(fn ($item) => $this->item($item))->values();
        $activeTotal = $items->whereIn('status', OrderState::ACTIVE_ITEM_STATUSES)->sum('subtotal');
        $affectedTotal = $items->whereNotIn('status', OrderState::ACTIVE_ITEM_STATUSES)->sum('subtotal');

        return [
            'id' => $order->id,
            'date' => optional($order->created_at)?->toISOString(),
            'status' => $order->status,
            'status_label' => OrderState::label($order->status),
            'summary_status' => $summary['summary_status'],
            'summary_status_label' => OrderState::label($summary['summary_status']),
            'total' => round((float) $order->total, 2),
            'active_total' => round((float) $activeTotal, 2),
            'affected_total' => round((float) $affectedTotal, 2),
            'address' => $order->address,
            'estimated_delivery' => $order->created_at?->copy()->addDays(5)->toDateString(),
            'can_cancel' => $summary['can_cancel_order'],
            'can_refund' => $summary['can_refund_order'],
            'line_counts' => $summary['counts'],
            'items' => $items,
        ];
    }

    public function item($item): array
    {
        $status = $item->status ?? 'pendiente_pago';

        return [
            'id' => $item->id,
            'name' => $item->product->name ?? $item->name,
            'quantity' => (int) $item->quantity,
            'price' => round((float) $item->price, 2),
            'subtotal' => round((float) $item->price * (int) $item->quantity, 2),
            'status' => $status,
            'status_label' => OrderState::label($status),
            'can_cancel' => $item->canBeCancelled(),
            'can_refund' => $item->canRequestRefund(),
            'cancellation_reason' => $item->cancellation_reason,
            'cancelled_by' => $item->cancelled_by,
            'cancelled_at' => optional($item->cancelled_at)?->toISOString(),
            'return_reason' => $item->return_reason,
            'refund_reference_id' => $item->refund_reference_id,
            'refunded_at' => optional($item->refunded_at)?->toISOString(),
            'refund_error' => $item->refund_error,
            'image_url' => $item->product->image_url ?? null,
            'product_id' => $item->product->id ?? null,
        ];
    }
}
