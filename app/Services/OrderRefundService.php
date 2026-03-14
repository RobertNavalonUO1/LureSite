<?php

namespace App\Services;

use App\Models\Order;
use Illuminate\Support\Facades\Log;
use PayPalCheckoutSdk\Core\LiveEnvironment;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersGetRequest;
use PayPalCheckoutSdk\Payments\CapturesRefundRequest;
use Stripe\Checkout\Session;
use Stripe\Refund;
use Stripe\Stripe;

class OrderRefundService
{
    public function refund(Order $order): RefundResult
    {
        if ($order->refund_reference_id && $order->refunded_at) {
            return new RefundResult(
                referenceId: $order->refund_reference_id,
                providerStatus: 'already_refunded',
                payload: [],
                alreadyProcessed: true,
            );
        }

        Log::info('refund.attempt.started', [
            'order_id' => $order->id,
            'payment_method' => $order->payment_method,
            'transaction_id' => $order->transaction_id,
            'payment_reference_id' => $order->payment_reference_id,
        ]);

        return match ($order->payment_method) {
            'stripe' => $this->refundStripeOrder($order),
            'paypal' => $this->refundPaypalOrder($order),
            default => throw new \RuntimeException('Proveedor de pago no soportado para reembolso.'),
        };
    }

    private function refundStripeOrder(Order $order): RefundResult
    {
        $secret = config('services.stripe.secret');
        if (!$secret) {
            throw new \RuntimeException('Stripe no está configurado para procesar reembolsos.');
        }

        Stripe::setApiKey($secret);

        $paymentIntentId = $order->payment_reference_id;

        if (!$paymentIntentId) {
            if (!$order->transaction_id) {
                throw new \RuntimeException('El pedido no tiene referencia de transacción Stripe.');
            }

            $session = Session::retrieve($order->transaction_id);
            $paymentIntentId = is_string($session->payment_intent ?? null)
                ? $session->payment_intent
                : ($session->payment_intent->id ?? null);
        }

        if (!$paymentIntentId) {
            throw new \RuntimeException('No se pudo resolver el payment intent de Stripe para este pedido.');
        }

        $refund = Refund::create([
            'payment_intent' => $paymentIntentId,
            'metadata' => [
                'order_id' => (string) $order->id,
                'transaction_id' => (string) ($order->transaction_id ?? ''),
            ],
        ], [
            'idempotency_key' => sprintf('order-refund-%s', $order->id),
        ]);

        Log::info('refund.attempt.succeeded', [
            'order_id' => $order->id,
            'payment_method' => 'stripe',
            'refund_reference_id' => $refund->id,
            'provider_status' => $refund->status ?? null,
        ]);

        return new RefundResult(
            referenceId: $refund->id,
            providerStatus: $refund->status ?? null,
            payload: $refund->toArray(),
        );
    }

    private function refundPaypalOrder(Order $order): RefundResult
    {
        $captureId = $order->payment_reference_id ?: $this->resolvePaypalCaptureId($order);

        if (!$captureId) {
            throw new \RuntimeException('No se pudo localizar la captura de PayPal para este pedido.');
        }

        $request = new CapturesRefundRequest($captureId);
        $request->body = [
            'amount' => [
                'value' => number_format((float) $order->total, 2, '.', ''),
                'currency_code' => 'USD',
            ],
        ];

        $response = $this->paypalClient()->execute($request);
        $result = $response->result;

        Log::info('refund.attempt.succeeded', [
            'order_id' => $order->id,
            'payment_method' => 'paypal',
            'refund_reference_id' => $result->id,
            'provider_status' => $result->status ?? null,
        ]);

        return new RefundResult(
            referenceId: $result->id,
            providerStatus: $result->status ?? null,
            payload: json_decode(json_encode($result), true) ?? [],
        );
    }

    private function resolvePaypalCaptureId(Order $order): ?string
    {
        if (!$order->transaction_id) {
            return null;
        }

        $response = $this->paypalClient()->execute(new OrdersGetRequest($order->transaction_id));
        $purchaseUnits = $response->result->purchase_units ?? [];

        foreach ($purchaseUnits as $purchaseUnit) {
            $captures = $purchaseUnit->payments->captures ?? [];

            foreach ($captures as $capture) {
                if (!empty($capture->id)) {
                    return $capture->id;
                }
            }
        }

        return null;
    }

    private function paypalClient(): PayPalHttpClient
    {
        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.client_secret');

        if (!$clientId || !$clientSecret) {
            throw new \RuntimeException('PayPal no está configurado para procesar reembolsos.');
        }

        $mode = config('services.paypal.mode');
        if (!in_array($mode, ['sandbox', 'live'], true)) {
            throw new \RuntimeException('PAYPAL_MODE debe ser "sandbox" o "live".');
        }

        $environment = $mode === 'live'
            ? new LiveEnvironment($clientId, $clientSecret)
            : new SandboxEnvironment($clientId, $clientSecret);

        return new PayPalHttpClient($environment);
    }
}