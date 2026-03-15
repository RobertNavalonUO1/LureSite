<?php

namespace App\Services;

use App\Models\Order;
use App\Support\OrderState;

class OrderStateSynchronizer
{
    public function sync(Order $order): Order
    {
        $order->loadMissing('items');

        $derivedStatus = OrderState::derivePersistentStatus($order->items, $order->status);

        if ($order->status !== $derivedStatus) {
            $order->forceFill([
                'status' => $derivedStatus,
            ])->save();
        }

        return $order->fresh(['items.product']);
    }
}