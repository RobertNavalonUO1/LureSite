<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderItem;
use App\Support\OrderState;
use DomainException;

class OrderLineStateService
{
    public function __construct(
        private readonly OrderStateSynchronizer $synchronizer,
    ) {
    }

    public function cancelItem(OrderItem $item, ?string $reason = null, string $actor = 'user'): OrderItem
    {
        if (!$item->canBeCancelled()) {
            throw new DomainException('La linea seleccionada ya no puede cancelarse.');
        }

        $item->forceFill([
            'status' => $actor === 'admin' ? 'cancelado' : 'cancelacion_pendiente',
            'cancellation_reason' => $reason ?: ($actor === 'admin'
                ? 'Cancelacion aplicada por administracion.'
                : 'Solicitud de cancelacion enviada por el usuario.'),
            'cancelled_by' => $actor,
            'cancelled_at' => $actor === 'admin' ? now() : null,
        ])->save();

        $this->syncOrder($item->order);

        return $item->fresh();
    }

    public function cancelOrder(Order $order, ?string $reason = null, string $actor = 'user'): int
    {
        $order->loadMissing('items');
        if ($order->items->isEmpty()) {
            if (!in_array($order->status, OrderState::CANCELLABLE_ITEM_STATUSES, true)) {
                throw new DomainException('No hay lineas elegibles para cancelar en este pedido.');
            }

            $order->forceFill([
                'status' => $actor === 'admin' ? 'cancelado' : 'cancelacion_pendiente',
                'cancellation_reason' => $reason ?: ($actor === 'admin'
                    ? 'Cancelacion aplicada por administracion.'
                    : 'Solicitud de cancelacion enviada por el usuario.'),
                'cancelled_by' => $actor,
                'cancelled_at' => $actor === 'admin' ? now() : null,
            ])->save();

            return 1;
        }

        $count = 0;

        foreach ($order->items as $item) {
            if (!$item->canBeCancelled()) {
                continue;
            }

            $count++;
            $item->forceFill([
                'status' => $actor === 'admin' ? 'cancelado' : 'cancelacion_pendiente',
                'cancellation_reason' => $reason ?: ($actor === 'admin'
                    ? 'Cancelacion aplicada por administracion.'
                    : 'Solicitud de cancelacion enviada por el usuario.'),
                'cancelled_by' => $actor,
                'cancelled_at' => $actor === 'admin' ? now() : null,
            ])->save();
        }

        if ($count === 0) {
            throw new DomainException('No hay lineas elegibles para cancelar en este pedido.');
        }

        $this->syncOrder($order);

        return $count;
    }

    public function requestRefund(OrderItem $item, ?string $reason = null): OrderItem
    {
        if (!$item->canRequestRefund()) {
            throw new DomainException('La linea seleccionada aun no es elegible para devolucion.');
        }

        $item->forceFill([
            'status' => 'devolucion_solicitada',
            'return_reason' => $reason ?: 'Solicitud de devolucion enviada por el usuario.',
        ])->save();

        $this->syncOrder($item->order);

        return $item->fresh();
    }

    public function requestRefundForOrder(Order $order, ?string $reason = null): int
    {
        $order->loadMissing('items');
        if ($order->items->isEmpty()) {
            if (!in_array($order->status, OrderState::REFUNDABLE_ITEM_STATUSES, true)) {
                throw new DomainException('No hay lineas elegibles para devolucion en este pedido.');
            }

            $order->forceFill([
                'status' => 'devolucion_solicitada',
                'refund_error' => null,
            ])->save();

            return 1;
        }

        $count = 0;

        foreach ($order->items as $item) {
            if (!$item->canRequestRefund()) {
                continue;
            }

            $count++;
            $item->forceFill([
                'status' => 'devolucion_solicitada',
                'return_reason' => $reason ?: 'Solicitud de devolucion enviada por el usuario.',
            ])->save();
        }

        if ($count === 0) {
            throw new DomainException('No hay lineas elegibles para devolucion en este pedido.');
        }

        $this->syncOrder($order);

        return $count;
    }

    public function approveRefund(OrderItem $item): OrderItem
    {
        if ($item->status !== 'devolucion_solicitada') {
            throw new DomainException('Solo se pueden aprobar devoluciones pendientes.');
        }

        $item->forceFill([
            'status' => 'devolucion_aprobada',
            'refund_error' => null,
        ])->save();

        $this->syncOrder($item->order);

        return $item->fresh();
    }

    public function approveRefundForOrder(Order $order): int
    {
        $order->loadMissing('items');
        if ($order->items->isEmpty()) {
            if ($order->status !== 'devolucion_solicitada') {
                throw new DomainException('No hay devoluciones pendientes en este pedido.');
            }

            $order->forceFill([
                'status' => 'devolucion_aprobada',
                'refund_error' => null,
            ])->save();

            return 1;
        }

        return $this->transitionOrderItems($order, ['devolucion_solicitada'], 'devolucion_aprobada');
    }

    public function rejectRefund(OrderItem $item, ?string $reason = null): OrderItem
    {
        if ($item->status !== 'devolucion_solicitada') {
            throw new DomainException('Solo se pueden rechazar devoluciones pendientes.');
        }

        $item->forceFill([
            'status' => 'devolucion_rechazada',
            'refund_error' => $reason ?: 'La devolucion fue rechazada por administracion.',
        ])->save();

        $this->syncOrder($item->order);

        return $item->fresh();
    }

    public function rejectRefundForOrder(Order $order, ?string $reason = null): int
    {
        $order->loadMissing('items');
        if ($order->items->isEmpty()) {
            if ($order->status !== 'devolucion_solicitada') {
                throw new DomainException('No hay devoluciones pendientes en este pedido.');
            }

            $order->forceFill([
                'status' => 'devolucion_rechazada',
                'refund_error' => $reason ?: 'La devolucion fue rechazada por administracion.',
            ])->save();

            return 1;
        }

        $count = 0;

        foreach ($order->items as $item) {
            if ($item->status !== 'devolucion_solicitada') {
                continue;
            }

            $count++;
            $item->forceFill([
                'status' => 'devolucion_rechazada',
                'refund_error' => $reason ?: 'La devolucion fue rechazada por administracion.',
            ])->save();
        }

        if ($count === 0) {
            throw new DomainException('No hay devoluciones pendientes en este pedido.');
        }

        $this->syncOrder($order);

        return $count;
    }

    public function markOrderShipped(Order $order): int
    {
        return $this->transitionOrderItems($order, ['pagado', 'pendiente_envio'], 'enviado');
    }

    public function markOrderDelivered(Order $order): int
    {
        return $this->transitionOrderItems($order, ['enviado'], 'entregado');
    }

    public function confirmDeliveredItems(Order $order): int
    {
        return $this->transitionOrderItems($order, ['entregado'], 'confirmado');
    }

    private function transitionOrderItems(Order $order, array $fromStatuses, string $toStatus): int
    {
        $order->loadMissing('items');
        if ($order->items->isEmpty()) {
            if (!in_array($order->status, $fromStatuses, true)) {
                throw new DomainException('No hay lineas elegibles para esta transicion.');
            }

            $order->forceFill([
                'status' => $toStatus,
            ])->save();

            return 1;
        }

        $count = 0;

        foreach ($order->items as $item) {
            if (!in_array($item->status, $fromStatuses, true)) {
                continue;
            }

            $count++;
            $item->forceFill([
                'status' => $toStatus,
            ])->save();
        }

        if ($count === 0) {
            throw new DomainException('No hay lineas elegibles para esta transicion.');
        }

        $this->syncOrder($order);

        return $count;
    }

    private function syncOrder(Order $order): void
    {
        $this->synchronizer->sync($order);
    }
}
