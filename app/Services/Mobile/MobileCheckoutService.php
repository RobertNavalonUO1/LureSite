<?php

namespace App\Services\Mobile;

use App\Models\Address;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\PaymentAttempt;
use App\Models\Product;
use App\Models\User;
use App\Services\ShoppingCartService;
use App\Services\TransactionalEmailService;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use PayPalCheckoutSdk\Core\LiveEnvironment;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCaptureRequest;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;
use Stripe\Webhook as StripeWebhook;

class MobileCheckoutService
{
    public function __construct(
        private readonly ShoppingCartService $shoppingCartService,
        private readonly MobileCatalogPresenter $catalogPresenter,
        private readonly TransactionalEmailService $transactionalEmailService,
    ) {
    }

    public function quote(User $user, array $snapshot, int $addressId, ?string $couponCode, string $shippingMethod): array
    {
        $normalized = $this->shoppingCartService->normalizeSnapshot($snapshot);
        if ($normalized === []) {
            throw new MobileApiException('The cart is empty.', 'cart_empty', 409);
        }

        $address = $this->resolveAddress($user, $addressId);
        $lines = $this->hydrateLines($normalized);
        $subtotal = round($lines->sum('subtotal'), 2);
        $shippingOptions = $this->shippingOptionsForSubtotal($subtotal);

        if (!array_key_exists($shippingMethod, $shippingOptions)) {
            throw new MobileApiException('Shipping method unavailable.', 'shipping_method_unavailable', 409);
        }

        $coupon = $this->resolveCoupon($couponCode, $subtotal);
        $discount = $coupon ? round($coupon->discountAmount($subtotal), 2) : 0.0;
        $selectedShipping = $shippingOptions[$shippingMethod];
        $total = round(max($subtotal - $discount + $selectedShipping['cost'], 0), 2);

        return [
            'address' => [
                'id' => $address->id,
                'street' => $address->street,
                'city' => $address->city,
                'province' => $address->province,
                'zip_code' => $address->zip_code,
                'country' => $address->country,
            ],
            'quote' => [
                'currency' => 'EUR',
                'items_count' => $lines->sum('quantity'),
                'subtotal' => $subtotal,
                'discount' => $discount,
                'shipping' => $selectedShipping['cost'],
                'total' => $total,
                'coupon' => $coupon ? [
                    'code' => $coupon->code,
                    'label' => $coupon->description ?: $coupon->code,
                    'amount' => $discount,
                ] : null,
                'shipping_method' => $selectedShipping,
                'shipping_options' => array_values($shippingOptions),
                'items' => $lines->values()->all(),
                'warnings' => [],
            ],
            'normalized_items' => $normalized,
        ];
    }

    public function createPaymentSession(
        User $user,
        array $snapshot,
        int $addressId,
        ?string $couponCode,
        string $shippingMethod,
        string $provider,
        array $mobileReturn
    ): array {
        $prepared = $this->quote($user, $snapshot, $addressId, $couponCode, $shippingMethod);
        $provider = strtolower(trim($provider));

        if (!in_array($provider, ['stripe', 'paypal'], true)) {
            throw new MobileApiException('Payment provider not supported.', 'payment_provider_not_supported', 409);
        }

        $attempt = PaymentAttempt::create([
            'context_id' => 'chk_ctx_' . Str::lower(Str::random(24)),
            'user_id' => $user->id,
            'address_id' => $addressId,
            'provider' => $provider,
            'channel' => 'mobile',
            'status' => 'created',
            'currency' => 'EUR',
            'amount' => (float) $prepared['quote']['total'],
            'cart_snapshot' => $prepared['normalized_items'],
            'quote_snapshot' => $prepared['quote'],
            'mobile_return' => $mobileReturn,
            'expires_at' => now()->addMinutes(45),
        ]);

        try {
            $sessionPayload = $provider === 'stripe'
                ? $this->createStripeSession($attempt)
                : $this->createPaypalSession($attempt);

            $attempt->forceFill([
                'provider_checkout_id' => $sessionPayload['provider_checkout_id'],
                'checkout_url' => $sessionPayload['payment_session']['checkout_url'],
                'provider_payload' => $sessionPayload['provider_payload'] ?? null,
                'status' => 'pending_user_action',
            ])->save();
        } catch (\Throwable $exception) {
            $attempt->forceFill([
                'status' => 'failed',
                'error_code' => 'payment_session_creation_failed',
                'error_message' => $exception->getMessage(),
            ])->save();

            throw $exception;
        }

        return [
            'payment_session' => $sessionPayload['payment_session'],
            'quote' => $prepared['quote'],
        ];
    }

    public function handleReturn(string $provider, string $contextId, array $query): array
    {
        $attempt = PaymentAttempt::query()->where('context_id', $contextId)->first();
        if (!$attempt) {
            throw new MobileApiException('Checkout context expired.', 'payment_verification_failed', 409);
        }

        $provider = strtolower(trim($provider));
        if ($provider !== $attempt->provider) {
            throw new MobileApiException('Checkout context provider mismatch.', 'payment_verification_failed', 409);
        }

        $attempt->forceFill([
            'last_return_payload' => $query,
        ])->save();

        if ($attempt->order_id) {
            return [
                'order' => Order::query()->findOrFail($attempt->order_id)->loadMissing('items.product'),
                'return_url' => $this->successReturnUrl($attempt, (int) $attempt->order_id),
            ];
        }

        $verification = $provider === 'stripe'
            ? $this->verifyStripeReturn($attempt, $query)
            : $this->verifyPaypalReturn($attempt, $query);

        $attempt = $this->markAttemptPaid(
            $attempt,
            $verification['transaction_id'],
            $verification['payment_reference_id'] ?? null,
            $verification['provider_payment_status'] ?? 'paid',
            $verification['provider_payload'] ?? null,
        );

        $order = $this->finalizeAttempt($attempt);

        return [
            'order' => $order,
            'return_url' => $this->successReturnUrl($attempt->fresh(), $order->id),
        ];
    }

    public function paymentStatus(User $user, string $contextId): array
    {
        $attempt = PaymentAttempt::query()
            ->where('context_id', $contextId)
            ->where('user_id', $user->id)
            ->first();

        if (!$attempt) {
            throw new MobileApiException('Checkout context not found.', 'payment_verification_failed', 404);
        }

        if (!$attempt->order_id && in_array($attempt->status, ['paid', 'processing'], true)) {
            $this->finalizeAttempt($attempt);
            $attempt = $attempt->fresh();
        }

        return [
            'checkout_context_id' => $attempt->context_id,
            'provider' => $attempt->provider,
            'status' => $attempt->order_id ? 'succeeded' : $attempt->status,
            'order_id' => $attempt->order_id,
            'payment_reference_id' => $attempt->payment_reference_id,
            'provider_checkout_id' => $attempt->provider_checkout_id,
            'code' => $attempt->error_code,
            'message' => $attempt->error_message,
        ];
    }

    public function handleStripeWebhook(Request $request): void
    {
        $secret = config('services.stripe.webhook_secret');
        if (!is_string($secret) || trim($secret) === '') {
            throw new MobileApiException('Stripe webhook secret is missing.', 'payment_verification_failed', 500);
        }

        $event = StripeWebhook::constructEvent(
            $request->getContent(),
            (string) $request->header('Stripe-Signature', ''),
            $secret,
        );

        if (($event->type ?? null) === 'checkout.session.completed') {
            $session = $event->data->object;
            $contextId = (string) ($session->client_reference_id ?? $session->metadata->context_id ?? '');
            $attempt = $this->stripeAttemptFromIdentifiers($contextId, (string) ($session->id ?? ''));

            if (!$attempt) {
                Log::warning('payment.webhook.stripe.attempt_missing', [
                    'context_id' => $contextId,
                    'session_id' => $session->id ?? null,
                ]);

                return;
            }

            $attempt = $this->markAttemptPaid(
                $attempt,
                (string) ($session->id ?? $attempt->provider_checkout_id),
                is_string($session->payment_intent ?? null) ? $session->payment_intent : ($session->payment_intent->id ?? null),
                (string) ($session->payment_status ?? 'paid'),
                $session->toArray(),
                true,
            );

            $this->finalizeAttempt($attempt);
            return;
        }

        if (($event->type ?? null) === 'checkout.session.expired') {
            $session = $event->data->object;
            $attempt = PaymentAttempt::query()->where('provider_checkout_id', $session->id ?? null)->first();
            if ($attempt && !$attempt->order_id) {
                $attempt->forceFill([
                    'status' => 'expired',
                    'provider_payment_status' => $session->status ?? 'expired',
                    'provider_payload' => $session->toArray(),
                    'webhook_last_received_at' => now(),
                ])->save();
            }
        }
    }

    public function handlePaypalWebhook(Request $request): void
    {
        $payload = $request->json()->all();
        $this->verifyPaypalWebhook($request, $payload);

        $eventType = (string) ($payload['event_type'] ?? '');
        if (!in_array($eventType, ['CHECKOUT.ORDER.APPROVED', 'PAYMENT.CAPTURE.COMPLETED'], true)) {
            return;
        }

        $resource = $payload['resource'] ?? [];
        $orderId = (string) ($resource['id'] ?? data_get($resource, 'supplementary_data.related_ids.order_id', ''));
        $attempt = PaymentAttempt::query()
            ->where('provider', 'paypal')
            ->where('provider_checkout_id', $orderId)
            ->first();

        if (!$attempt) {
            Log::warning('payment.webhook.paypal.attempt_missing', [
                'order_id' => $orderId,
                'event_type' => $eventType,
            ]);

            return;
        }

        $verification = $eventType === 'CHECKOUT.ORDER.APPROVED'
            ? $this->capturePaypalOrderForAttempt($attempt, $orderId)
            : [
                'transaction_id' => $orderId,
                'payment_reference_id' => (string) ($resource['id'] ?? ''),
                'provider_payment_status' => (string) ($resource['status'] ?? 'COMPLETED'),
                'provider_payload' => $payload,
            ];

        $attempt = $this->markAttemptPaid(
            $attempt,
            $verification['transaction_id'],
            $verification['payment_reference_id'] ?? null,
            $verification['provider_payment_status'] ?? 'COMPLETED',
            $verification['provider_payload'] ?? $payload,
            true,
        );

        $this->finalizeAttempt($attempt);
    }

    public function cancelReturnUrl(string $provider, string $contextId): string
    {
        $attempt = PaymentAttempt::query()->where('context_id', $contextId)->first();
        $mobileReturn = is_array($attempt?->mobile_return) ? $attempt->mobile_return : [];

        if ($attempt && !$attempt->order_id) {
            $attempt->forceFill([
                'status' => 'cancelled',
                'error_code' => 'checkout_cancel',
                'error_message' => 'Payment flow cancelled by user.',
            ])->save();
        }

        return $this->appendQuery($mobileReturn['cancel_url'] ?? 'limoneo://checkout/complete', [
            'status' => 'cancel',
            'provider' => $provider,
            'checkout_context_id' => $contextId,
        ]);
    }

    private function hydrateLines(array $normalized): Collection
    {
        $products = Product::query()
            ->with(['category'])
            ->withAvg('reviews as reviews_average_rating', 'rating')
            ->withCount('reviews')
            ->whereIn('id', array_keys($normalized))
            ->get()
            ->keyBy('id');

        return collect($normalized)->map(function ($quantity, $productId) use ($products) {
            $product = $products->get($productId);
            if (!$product) {
                throw new MobileApiException("Product {$productId} not found.", 'product_unavailable', 404);
            }

            if ((int) $product->stock < (int) $quantity) {
                throw new MobileApiException("Product {$productId} is out of stock.", 'product_out_of_stock', 409);
            }

            return [
                'id' => $product->id,
                'product_id' => $product->id,
                'quantity' => (int) $quantity,
                'unit_price' => round((float) $product->price, 2),
                'subtotal' => round((float) $product->price * (int) $quantity, 2),
                'product' => $this->catalogPresenter->productCard($product),
            ];
        });
    }

    private function resolveAddress(User $user, int $addressId): Address
    {
        $address = Address::query()
            ->where('id', $addressId)
            ->where('user_id', $user->id)
            ->first();

        if (!$address) {
            throw new MobileApiException('Address does not belong to the authenticated user.', 'address_not_owned', 403);
        }

        return $address;
    }

    private function resolveCoupon(?string $couponCode, float $subtotal): ?Coupon
    {
        $couponCode = is_string($couponCode) ? strtoupper(trim($couponCode)) : '';
        if ($couponCode === '') {
            return null;
        }

        $coupon = Coupon::whereRaw('UPPER(code) = ?', [$couponCode])->first();
        if (!$coupon) {
            throw new MobileApiException('Invalid coupon.', 'invalid_coupon', 409);
        }

        if (!$coupon->canBeRedeemed($subtotal)) {
            throw new MobileApiException('Coupon is not applicable to this cart.', 'coupon_not_applicable', 409);
        }

        return $coupon;
    }

    private function shippingOptionsForSubtotal(float $subtotal): array
    {
        $blueprint = [
            'standard' => [
                'label' => 'Envio estandar',
                'description' => 'Gratis en pedidos superiores a 50 EUR',
                'eta' => '3-5 dias habiles',
                'cost' => 4.99,
                'free_over' => 50,
                'badge' => 'Popular',
            ],
            'express' => [
                'label' => 'Envio expres',
                'description' => 'Entrega prioritaria en 48h',
                'eta' => '1-2 dias habiles',
                'cost' => 9.99,
                'badge' => 'Mas rapido',
            ],
            'priority' => [
                'label' => 'Entrega al dia siguiente',
                'description' => 'Despacho en menos de 12h',
                'eta' => '24h garantizadas',
                'cost' => 14.99,
                'badge' => 'Premium',
            ],
        ];

        $options = [];
        foreach ($blueprint as $key => $option) {
            $cost = (!empty($option['free_over']) && $subtotal >= $option['free_over']) ? 0.0 : $option['cost'];
            $options[$key] = [
                'value' => $key,
                'label' => $option['label'],
                'description' => $option['description'],
                'eta' => $option['eta'],
                'cost' => round($cost, 2),
                'badge' => $option['badge'],
            ];
        }

        return $options;
    }

    private function createStripeSession(PaymentAttempt $attempt): array
    {
        $secret = config('services.stripe.secret');
        if (!$secret) {
            throw new MobileApiException('Stripe is not configured.', 'payment_provider_not_supported', 409);
        }

        Stripe::setApiKey($secret);
        $quote = is_array($attempt->quote_snapshot) ? $attempt->quote_snapshot : [];

        $successUrl = route('api.mobile.v1.checkout.payments.return', ['provider' => 'stripe'], true)
            . '?context=' . urlencode($attempt->context_id) . '&session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = route('api.mobile.v1.checkout.payments.cancel', ['provider' => 'stripe'], true)
            . '?context=' . urlencode($attempt->context_id);

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'eur',
                    'product_data' => [
                        'name' => config('app.name', 'Limoneo'),
                        'description' => sprintf(
                            '%d item(s) - %s',
                            (int) ($quote['items_count'] ?? 0),
                            $quote['shipping_method']['label'] ?? 'Shipping'
                        ),
                    ],
                    'unit_amount' => (int) round(((float) ($quote['total'] ?? 0)) * 100),
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'customer_email' => User::query()->findOrFail($attempt->user_id)->email,
            'client_reference_id' => $attempt->context_id,
            'metadata' => [
                'context_id' => $attempt->context_id,
                'user_id' => $attempt->user_id,
                'channel' => 'mobile',
            ],
        ], [
            'idempotency_key' => 'mobile-checkout-' . $attempt->context_id,
        ]);

        return [
            'payment_session' => [
                'checkout_context_id' => $attempt->context_id,
                'provider' => 'stripe',
                'method' => 'browser_redirect',
                'checkout_url' => $session->url,
                'expires_at' => optional(now()->addMinutes(45))->toISOString(),
            ],
            'provider_checkout_id' => $session->id,
            'provider_payload' => $session->toArray(),
        ];
    }

    private function createPaypalSession(PaymentAttempt $attempt): array
    {
        $quote = is_array($attempt->quote_snapshot) ? $attempt->quote_snapshot : [];
        $request = new OrdersCreateRequest();
        $request->prefer('return=representation');
        $request->headers['PayPal-Request-Id'] = 'mobile-checkout-' . $attempt->context_id;
        $request->body = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'custom_id' => $attempt->context_id,
                'invoice_id' => 'mobile-' . $attempt->context_id,
                'amount' => [
                    'currency_code' => 'EUR',
                    'value' => number_format((float) ($quote['total'] ?? 0), 2, '.', ''),
                ],
            ]],
            'application_context' => [
                'return_url' => route('api.mobile.v1.checkout.payments.return', ['provider' => 'paypal'], true)
                    . '?context=' . urlencode($attempt->context_id),
                'cancel_url' => route('api.mobile.v1.checkout.payments.cancel', ['provider' => 'paypal'], true)
                    . '?context=' . urlencode($attempt->context_id),
            ],
        ];

        $response = $this->paypalClient()->execute($request);
        $approvalLink = collect($response->result->links)->firstWhere('rel', 'approve')->href ?? null;

        if (!$approvalLink) {
            throw new MobileApiException('PayPal approval URL was not returned.', 'payment_provider_not_supported', 409);
        }

        return [
            'payment_session' => [
                'checkout_context_id' => $attempt->context_id,
                'provider' => 'paypal',
                'method' => 'browser_redirect',
                'checkout_url' => $approvalLink,
                'expires_at' => optional(now()->addMinutes(45))->toISOString(),
            ],
            'provider_checkout_id' => $response->result->id,
            'provider_payload' => json_decode(json_encode($response->result), true),
        ];
    }

    private function verifyStripeReturn(PaymentAttempt $attempt, array $query): array
    {
        $secret = config('services.stripe.secret');
        if (!$secret) {
            throw new MobileApiException('Stripe is not configured.', 'payment_verification_failed', 409);
        }

        $sessionId = (string) ($query['session_id'] ?? $attempt->provider_checkout_id ?? '');
        if ($sessionId === '') {
            throw new MobileApiException('Stripe session missing.', 'payment_verification_failed', 409);
        }

        if ($attempt->provider_checkout_id && $attempt->provider_checkout_id !== $sessionId) {
            throw new MobileApiException('Stripe session does not match checkout context.', 'payment_verification_failed', 409);
        }

        Stripe::setApiKey($secret);
        $session = StripeSession::retrieve($sessionId);
        $sessionContext = (string) ($session->client_reference_id ?? $session->metadata->context_id ?? '');

        if ($sessionContext !== '' && $sessionContext !== $attempt->context_id) {
            throw new MobileApiException('Stripe session context mismatch.', 'payment_verification_failed', 409);
        }

        if (($session->payment_status ?? null) !== 'paid') {
            throw new MobileApiException('Stripe payment was not completed.', 'payment_verification_failed', 409);
        }

        $paymentIntentId = is_string($session->payment_intent ?? null)
            ? $session->payment_intent
            : ($session->payment_intent->id ?? null);

        return [
            'transaction_id' => $sessionId,
            'payment_reference_id' => $paymentIntentId,
            'provider_payment_status' => (string) ($session->payment_status ?? 'paid'),
            'provider_payload' => $session->toArray(),
        ];
    }

    private function verifyPaypalReturn(PaymentAttempt $attempt, array $query): array
    {
        $orderId = (string) ($query['token'] ?? $attempt->provider_checkout_id ?? '');
        if ($orderId === '') {
            throw new MobileApiException('PayPal order token missing.', 'payment_verification_failed', 409);
        }

        if ($attempt->provider_checkout_id && $attempt->provider_checkout_id !== $orderId) {
            throw new MobileApiException('PayPal order does not match checkout context.', 'payment_verification_failed', 409);
        }

        return $this->capturePaypalOrderForAttempt($attempt, $orderId);
    }

    private function capturePaypalOrderForAttempt(PaymentAttempt $attempt, string $orderId): array
    {
        $request = new OrdersCaptureRequest($orderId);
        $request->prefer('return=representation');
        $request->headers['PayPal-Request-Id'] = 'mobile-capture-' . $attempt->context_id;
        $response = $this->paypalClient()->execute($request);

        if (($response->result->status ?? null) !== 'COMPLETED') {
            throw new MobileApiException('PayPal payment was not completed.', 'payment_verification_failed', 409);
        }

        $captureId = null;
        foreach ($response->result->purchase_units ?? [] as $purchaseUnit) {
            foreach ($purchaseUnit->payments->captures ?? [] as $capture) {
                if (!empty($capture->id)) {
                    $captureId = $capture->id;
                    break 2;
                }
            }
        }

        return [
            'transaction_id' => $orderId,
            'payment_reference_id' => $captureId,
            'provider_payment_status' => (string) ($response->result->status ?? 'COMPLETED'),
            'provider_payload' => json_decode(json_encode($response->result), true),
        ];
    }

    private function appendQuery(string $url, array $params): string
    {
        $separator = str_contains($url, '?') ? '&' : '?';

        return $url . $separator . http_build_query($params);
    }

    private function paypalClient(): PayPalHttpClient
    {
        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.client_secret');
        $mode = config('services.paypal.mode');

        if (!$clientId || !$clientSecret || !in_array($mode, ['sandbox', 'live'], true)) {
            throw new MobileApiException('PayPal is not configured.', 'payment_provider_not_supported', 409);
        }

        $environment = $mode === 'live'
            ? new LiveEnvironment($clientId, $clientSecret)
            : new SandboxEnvironment($clientId, $clientSecret);

        return new PayPalHttpClient($environment);
    }

    private function markAttemptPaid(
        PaymentAttempt $attempt,
        string $transactionId,
        ?string $paymentReferenceId,
        string $providerPaymentStatus,
        ?array $providerPayload,
        bool $fromWebhook = false,
    ): PaymentAttempt {
        $resolvedStatus = ($attempt->order_id || $attempt->status === 'succeeded')
            ? 'succeeded'
            : 'paid';

        $attempt->forceFill([
            'status' => $resolvedStatus,
            'provider_checkout_id' => $transactionId,
            'payment_reference_id' => $paymentReferenceId,
            'provider_payment_status' => $providerPaymentStatus,
            'provider_payload' => $providerPayload,
            'error_code' => null,
            'error_message' => null,
            'completed_at' => now(),
            'webhook_last_received_at' => $fromWebhook ? now() : $attempt->webhook_last_received_at,
        ])->save();

        return $attempt->fresh();
    }

    private function finalizeAttempt(PaymentAttempt $attempt): Order
    {
        return DB::transaction(function () use ($attempt) {
            $lockedAttempt = PaymentAttempt::query()->lockForUpdate()->findOrFail($attempt->id);
            if ($lockedAttempt->order_id) {
                return Order::query()->findOrFail($lockedAttempt->order_id)->loadMissing('items.product');
            }

            $existingOrder = Order::query()
                ->where('payment_method', $lockedAttempt->provider)
                ->where(function ($query) use ($lockedAttempt) {
                    $query->where('transaction_id', $lockedAttempt->provider_checkout_id);

                    if ($lockedAttempt->payment_reference_id) {
                        $query->orWhere('payment_reference_id', $lockedAttempt->payment_reference_id);
                    }
                })
                ->first();

            if ($existingOrder) {
                $lockedAttempt->forceFill([
                    'order_id' => $existingOrder->id,
                    'status' => 'succeeded',
                ])->save();

                return $existingOrder->loadMissing('items.product');
            }

            $user = User::query()->findOrFail($lockedAttempt->user_id);
            $address = Address::query()
                ->where('id', $lockedAttempt->address_id)
                ->where('user_id', $lockedAttempt->user_id)
                ->firstOrFail();
            $quote = is_array($lockedAttempt->quote_snapshot) ? $lockedAttempt->quote_snapshot : [];
            $quoteItems = $quote['items'] ?? [];

            $order = new Order();
            $order->user_id = $lockedAttempt->user_id;
            $order->name = trim(implode(' ', array_filter([$user->name, $user->lastname])));
            $order->email = $user->email;
            $order->address = implode(', ', [$address->street, $address->city, $address->province, $address->zip_code, $address->country]);
            $order->shipping_method = $quote['shipping_method']['value'] ?? null;
            $order->shipping_label = $quote['shipping_method']['label'] ?? null;
            $order->shipping_description = $quote['shipping_method']['description'] ?? null;
            $order->shipping_eta = $quote['shipping_method']['eta'] ?? null;
            $order->shipping_cost = (float) ($quote['shipping'] ?? 0);
            $order->coupon_code = $quote['coupon']['code'] ?? null;
            $order->discount = (float) ($quote['discount'] ?? 0);
            $order->payment_method = $lockedAttempt->provider;
            $order->total = (float) ($quote['total'] ?? $lockedAttempt->amount);
            $order->transaction_id = $lockedAttempt->provider_checkout_id;
            $order->payment_reference_id = $lockedAttempt->payment_reference_id;
            $order->status = 'pagado';
            $order->save();

            if ($quoteItems === []) {
                foreach ($lockedAttempt->cart_snapshot ?? [] as $productId => $quantity) {
                    $product = Product::query()->findOrFail($productId);
                    $quoteItems[] = [
                        'product_id' => $productId,
                        'quantity' => $quantity,
                        'unit_price' => round((float) $product->price, 2),
                    ];
                }
            }

            foreach ($quoteItems as $line) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $line['product_id'],
                    'quantity' => $line['quantity'],
                    'price' => $line['unit_price'],
                    'status' => 'pagado',
                ]);
            }

            if (!empty($quote['coupon']['code'])) {
                Coupon::whereRaw('UPPER(code) = ?', [strtoupper($quote['coupon']['code'])])->increment('used_count');
            }

            $lockedAttempt->forceFill([
                'order_id' => $order->id,
                'status' => 'succeeded',
                'completed_at' => now(),
            ])->save();

            $this->shoppingCartService->clearUserCart($user);
            $this->transactionalEmailService->sendOrderConfirmation($order->fresh(['items.product']));

            Log::info('payment.attempt.finalized', [
                'context_id' => $lockedAttempt->context_id,
                'provider' => $lockedAttempt->provider,
                'order_id' => $order->id,
                'transaction_id' => $lockedAttempt->provider_checkout_id,
                'payment_reference_id' => $lockedAttempt->payment_reference_id,
            ]);

            return $order->fresh(['items.product']);
        });
    }

    private function successReturnUrl(PaymentAttempt $attempt, int $orderId): string
    {
        $mobileReturn = is_array($attempt->mobile_return) ? $attempt->mobile_return : [];

        return $this->appendQuery($mobileReturn['success_url'] ?? 'limoneo://checkout/complete', [
            'status' => 'success',
            'order_id' => $orderId,
            'provider' => $attempt->provider,
            'checkout_context_id' => $attempt->context_id,
        ]);
    }

    private function stripeAttemptFromIdentifiers(string $contextId, string $sessionId): ?PaymentAttempt
    {
        return PaymentAttempt::query()
            ->where('provider', 'stripe')
            ->where(function ($query) use ($contextId, $sessionId) {
                if ($contextId !== '') {
                    $query->where('context_id', $contextId);
                }

                if ($sessionId !== '') {
                    $query->orWhere('provider_checkout_id', $sessionId);
                }
            })
            ->first();
    }

    private function verifyPaypalWebhook(Request $request, array $payload): void
    {
        $webhookId = config('services.paypal.webhook_id');
        if (!is_string($webhookId) || trim($webhookId) === '') {
            throw new MobileApiException('PayPal webhook id is missing.', 'payment_verification_failed', 500);
        }

        $baseUrl = config('services.paypal.mode') === 'live'
            ? 'https://api-m.paypal.com'
            : 'https://api-m.sandbox.paypal.com';

        $tokenResponse = Http::asForm()
            ->withBasicAuth((string) config('services.paypal.client_id'), (string) config('services.paypal.client_secret'))
            ->post($baseUrl . '/v1/oauth2/token', [
                'grant_type' => 'client_credentials',
            ]);

        if (!$tokenResponse->successful()) {
            throw new MobileApiException('PayPal webhook verification failed.', 'payment_verification_failed', 500);
        }

        $verification = Http::withToken((string) $tokenResponse->json('access_token'))
            ->post($baseUrl . '/v1/notifications/verify-webhook-signature', [
                'auth_algo' => $request->header('paypal-auth-algo'),
                'cert_url' => $request->header('paypal-cert-url'),
                'transmission_id' => $request->header('paypal-transmission-id'),
                'transmission_sig' => $request->header('paypal-transmission-sig'),
                'transmission_time' => $request->header('paypal-transmission-time'),
                'webhook_id' => $webhookId,
                'webhook_event' => $payload,
            ]);

        if (($verification->json('verification_status') ?? '') !== 'SUCCESS') {
            throw new MobileApiException('PayPal webhook signature is invalid.', 'payment_verification_failed', 400);
        }
    }
}