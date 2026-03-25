<?php

namespace App\Support;

use App\Models\Order;

class OrderMailData
{
    public static function build(Order $order, array $overrides = []): array
    {
        $summaryStatus = $order->summaryStatus();
        $trackingUrl = $order->tracking_url ?: route('orders.show', $order);
        $trackingNumber = $order->tracking_number;
        $customerName = trim((string) $order->name) !== '' ? $order->name : $order->email;

        return array_merge([
            'appName' => config('app.name'),
            'mailTitle' => 'Pedido',
            'preheader' => 'Actualizacion de tu pedido.',
            'introText' => 'Tu pedido ha sido actualizado.',
            'customerName' => $customerName,
            'customerEmail' => $order->email,
            'orderNumber' => $order->id,
            'orderDate' => optional($order->created_at)->format('d/m/Y H:i'),
            'status' => $summaryStatus,
            'statusLabel' => OrderState::label($summaryStatus),
            'progressSteps' => self::progressSteps($summaryStatus),
            'trackingUrl' => $trackingUrl,
            'trackingLabel' => $trackingNumber ? 'Seguir envio' : 'Ver seguimiento del pedido',
            'trackingNumber' => $trackingNumber,
            'trackingCarrier' => $order->tracking_carrier,
            'estimatedDelivery' => $order->shipping_eta ?: 'Pendiente de confirmacion',
            'shippingMethod' => $order->shipping_label ?: ($order->shipping_method ?: 'Pendiente'),
            'shippingDescription' => $order->shipping_description,
            'shippingCost' => (float) ($order->shipping_cost ?? 0),
            'paymentMethod' => strtoupper((string) $order->payment_method),
            'couponCode' => $order->coupon_code,
            'discount' => (float) ($order->discount ?? 0),
            'total' => (float) $order->total,
            'address' => $order->address,
            'items' => $order->items->map(function ($item) {
                $name = $item->product->name ?? $item->name ?? ('Producto #'.$item->product_id);
                $unitPrice = (float) $item->price;
                $quantity = (int) $item->quantity;

                return [
                    'name' => $name,
                    'quantity' => $quantity,
                    'unit_price' => $unitPrice,
                    'subtotal' => round($unitPrice * $quantity, 2),
                    'image_url' => $item->product->image_url ?? null,
                ];
            })->all(),
            'supportEmail' => config('mail.support_address'),
        ], $overrides);
    }

    private static function progressSteps(string $status): array
    {
        $progression = [
            'pagado' => 1,
            'pendiente_envio' => 2,
            'enviado' => 3,
            'entregado' => 4,
            'confirmado' => 4,
        ];

        $currentStep = $progression[$status] ?? 1;

        return [
            ['label' => 'Pedido confirmado', 'state' => $currentStep >= 1 ? 'done' : 'pending'],
            ['label' => 'Preparando envio', 'state' => $currentStep >= 2 ? 'done' : 'pending'],
            ['label' => 'En camino', 'state' => $currentStep >= 3 ? 'done' : 'pending'],
            ['label' => 'Entregado', 'state' => $currentStep >= 4 ? 'done' : 'pending'],
        ];
    }
}