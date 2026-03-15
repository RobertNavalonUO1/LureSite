<?php

namespace App\Services\Mobile;

use App\Models\Address;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\User;
use App\Services\ShoppingCartService;
use Illuminate\Support\Collection;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Str;
use PayPalCheckoutSdk\Core\LiveEnvironment;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCaptureRequest;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;
use Stripe\Checkout\Session as StripeSession;
use Stripe\Stripe;

class MobileCheckoutService
{
    public function __construct(
        private readonly ShoppingCartService $shoppingCartService,
        private readonly MobileCatalogPresenter $catalogPresenter,
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
                'currency' => 'USD',
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

        $contextId = 'chk_ctx_' . Str::lower(Str::random(20));
        $context = [
            'id' => $contextId,
            'provider' => $provider,
            'user_id' => $user->id,
            'address_id' => $addressId,
            'items' => $prepared['normalized_items'],
            'quote' => $prepared['quote'],
            'mobile_return' => $mobileReturn,
            'order_id' => null,
        ];

        $sessionPayload = $provider === 'stripe'
            ? $this->createStripeSession($context)
            : $this->createPaypalSession($context);

        Cache::put($this->cacheKey($contextId), array_merge($context, $sessionPayload['context']), now()->addMinutes(45));

        return [
            'payment_session' => $sessionPayload['payment_session'],
            'quote' => $prepared['quote'],
        ];
    }

    public function handleReturn(string $provider, string $contextId, array $query): array
    {
        $context = Cache::get($this->cacheKey($contextId));
        if (!$context) {
            throw new MobileApiException('Checkout context expired.', 'payment_verification_failed', 409);
        }

        $provider = strtolower(trim($provider));
        if ($provider !== ($context['provider'] ?? null)) {
            throw new MobileApiException('Checkout context provider mismatch.', 'payment_verification_failed', 409);
        }

        if (!empty($context['order_id'])) {
            return [
                'order' => Order::query()->findOrFail($context['order_id']),
                'return_url' => $this->successReturnUrl($context['mobile_return'] ?? [], $provider, (int) $context['order_id']),
            ];
        }

        $result = $provider === 'stripe'
            ? $this->verifyStripeReturn($query)
            : $this->verifyPaypalReturn($query);

        $order = $this->createPaidOrder(
            userId: (int) $context['user_id'],
            items: $context['items'],
            quote: $context['quote'],
            addressId: (int) $context['address_id'],
            provider: $provider,
            transactionId: $result['transaction_id'],
            paymentReferenceId: $result['payment_reference_id'],
        );

        $context['order_id'] = $order->id;
        Cache::put($this->cacheKey($contextId), $context, now()->addMinutes(30));

        return [
            'order' => $order,
            'return_url' => $this->successReturnUrl($context['mobile_return'] ?? [], $provider, $order->id),
        ];
    }

    public function cancelReturnUrl(string $provider, string $contextId): string
    {
        $context = Cache::get($this->cacheKey($contextId));
        $mobileReturn = is_array($context['mobile_return'] ?? null) ? $context['mobile_return'] : [];

        return $this->appendQuery($mobileReturn['cancel_url'] ?? 'limoneo://checkout/complete', [
            'status' => 'cancel',
            'provider' => $provider,
        ]);
    }

    private function hydrateLines(array $normalized): Collection
    {
        $products = Product::query()
            ->with(['category'])
            ->withAvg('reviews as average_rating', 'rating')
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
                'description' => 'Gratis en pedidos superiores a $50',
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

    private function createStripeSession(array $context): array
    {
        $secret = config('services.stripe.secret');
        if (!$secret) {
            throw new MobileApiException('Stripe is not configured.', 'payment_provider_not_supported', 409);
        }

        Stripe::setApiKey($secret);

        $successUrl = route('api.mobile.v1.checkout.payments.return', ['provider' => 'stripe'], true)
            . '?context=' . urlencode($context['id']) . '&session_id={CHECKOUT_SESSION_ID}';
        $cancelUrl = route('api.mobile.v1.checkout.payments.cancel', ['provider' => 'stripe'], true)
            . '?context=' . urlencode($context['id']);

        $session = StripeSession::create([
            'payment_method_types' => ['card'],
            'line_items' => [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => config('app.name', 'Limoneo'),
                        'description' => sprintf(
                            '%d item(s) - %s',
                            (int) $context['quote']['items_count'],
                            $context['quote']['shipping_method']['label'] ?? 'Shipping'
                        ),
                    ],
                    'unit_amount' => (int) round(((float) $context['quote']['total']) * 100),
                ],
                'quantity' => 1,
            ]],
            'mode' => 'payment',
            'success_url' => $successUrl,
            'cancel_url' => $cancelUrl,
            'customer_email' => User::query()->findOrFail($context['user_id'])->email,
            'metadata' => [
                'context_id' => $context['id'],
                'user_id' => $context['user_id'],
            ],
        ]);

        return [
            'payment_session' => [
                'checkout_context_id' => $context['id'],
                'provider' => 'stripe',
                'method' => 'browser_redirect',
                'checkout_url' => $session->url,
                'expires_at' => optional(now()->addMinutes(45))->toISOString(),
            ],
            'context' => [
                'stripe_session_id' => $session->id,
            ],
        ];
    }

    private function createPaypalSession(array $context): array
    {
        $request = new OrdersCreateRequest();
        $request->prefer('return=representation');
        $request->body = [
            'intent' => 'CAPTURE',
            'purchase_units' => [[
                'amount' => [
                    'currency_code' => 'USD',
                    'value' => number_format((float) $context['quote']['total'], 2, '.', ''),
                ],
            ]],
            'application_context' => [
                'return_url' => route('api.mobile.v1.checkout.payments.return', ['provider' => 'paypal'], true)
                    . '?context=' . urlencode($context['id']),
                'cancel_url' => route('api.mobile.v1.checkout.payments.cancel', ['provider' => 'paypal'], true)
                    . '?context=' . urlencode($context['id']),
            ],
        ];

        $response = $this->paypalClient()->execute($request);
        $approvalLink = collect($response->result->links)->firstWhere('rel', 'approve')->href ?? null;

        if (!$approvalLink) {
            throw new MobileApiException('PayPal approval URL was not returned.', 'payment_provider_not_supported', 409);
        }

        return [
            'payment_session' => [
                'checkout_context_id' => $context['id'],
                'provider' => 'paypal',
                'method' => 'browser_redirect',
                'checkout_url' => $approvalLink,
                'expires_at' => optional(now()->addMinutes(45))->toISOString(),
            ],
            'context' => [
                'paypal_order_id' => $response->result->id,
            ],
        ];
    }

    private function verifyStripeReturn(array $query): array
    {
        $secret = config('services.stripe.secret');
        if (!$secret) {
            throw new MobileApiException('Stripe is not configured.', 'payment_verification_failed', 409);
        }

        $sessionId = (string) ($query['session_id'] ?? '');
        if ($sessionId === '') {
            throw new MobileApiException('Stripe session missing.', 'payment_verification_failed', 409);
        }

        Stripe::setApiKey($secret);
        $session = StripeSession::retrieve($sessionId);

        if (($session->payment_status ?? null) !== 'paid') {
            throw new MobileApiException('Stripe payment was not completed.', 'payment_verification_failed', 409);
        }

        $paymentIntentId = is_string($session->payment_intent ?? null)
            ? $session->payment_intent
            : ($session->payment_intent->id ?? null);

        return [
            'transaction_id' => $sessionId,
            'payment_reference_id' => $paymentIntentId,
        ];
    }

    private function verifyPaypalReturn(array $query): array
    {
        $orderId = (string) ($query['token'] ?? '');
        if ($orderId === '') {
            throw new MobileApiException('PayPal order token missing.', 'payment_verification_failed', 409);
        }

        $request = new OrdersCaptureRequest($orderId);
        $request->prefer('return=representation');
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
        ];
    }

    private function createPaidOrder(
        int $userId,
        array $items,
        array $quote,
        int $addressId,
        string $provider,
        string $transactionId,
        ?string $paymentReferenceId
    ): Order {
        $user = User::query()->findOrFail($userId);
        $address = Address::query()->where('id', $addressId)->where('user_id', $userId)->firstOrFail();

        $order = new Order();
        $order->user_id = $userId;
        $order->name = trim(implode(' ', array_filter([$user->name, $user->lastname])));
        $order->email = $user->email;
        $order->address = implode(', ', [$address->street, $address->city, $address->province, $address->zip_code, $address->country]);
        $order->payment_method = $provider;
        $order->total = (float) $quote['total'];
        $order->transaction_id = $transactionId;
        $order->payment_reference_id = $paymentReferenceId;
        $order->status = 'pagado';
        $order->save();

        foreach ($items as $productId => $quantity) {
            $product = Product::query()->findOrFail($productId);
            OrderItem::create([
                'order_id' => $order->id,
                'product_id' => $productId,
                'quantity' => $quantity,
                'price' => $product->price,
                'status' => 'pagado',
            ]);
        }

        if (!empty($quote['coupon']['code'])) {
            Coupon::whereRaw('UPPER(code) = ?', [strtoupper($quote['coupon']['code'])])->increment('used_count');
        }

        $this->shoppingCartService->clearUserCart($user);

        return $order->fresh(['items.product']);
    }

    private function successReturnUrl(array $mobileReturn, string $provider, int $orderId): string
    {
        return $this->appendQuery($mobileReturn['success_url'] ?? 'limoneo://checkout/complete', [
            'status' => 'success',
            'order_id' => $orderId,
            'provider' => $provider,
        ]);
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

    private function cacheKey(string $contextId): string
    {
        return 'mobile_checkout:' . $contextId;
    }
}
