<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Services\ShoppingCartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use PayPalCheckoutSdk\Core\LiveEnvironment;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCaptureRequest;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class CheckoutController extends Controller
{
    public function __construct(
        private readonly ShoppingCartService $shoppingCartService,
    ) {
    }

    public function index(Request $request)
    {
        $cart = array_values($this->shoppingCartService->itemsForRequest($request));
        $totals = $this->calculateTotals($cart);
        $user = Auth::user()?->load('addresses');

        $addresses = $user
            ? $user->addresses->map(fn ($address) => [
                'id' => $address->id,
                'street' => $address->street,
                'city' => $address->city,
                'province' => $address->province,
                'zip_code' => $address->zip_code,
                'country' => $address->country,
                'created_at' => $address->created_at,
                'make_default' => $address->id === $user->default_address_id,
            ])->values()->all()
            : [];

        $shippingOptions = array_values($this->shippingOptionsForSubtotal($totals['subtotal']));

        return Inertia::render('Shop/Checkout', [
            'cartItems' => $cart,
            'totals' => [
                'subtotal' => $totals['subtotal'],
                'discount' => $totals['discount'],
                'shipping' => $totals['shipping_cost'],
                'total' => $totals['total'],
            ],
            'shipping' => [
                'method' => $totals['shipping_method'],
                'label' => $totals['shipping_label'],
                'description' => $totals['shipping_description'],
                'eta' => $totals['shipping_eta'],
                'cost' => $totals['shipping_cost'],
            ],
            'shippingOptions' => $shippingOptions,
            'coupon' => [
                'code' => $totals['coupon_code'],
                'label' => $totals['coupon_label'],
                'amount' => $totals['discount'],
            ],
            'currency' => 'EUR',
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'lastname' => $user->lastname,
                    'email' => $user->email,
                    'phone' => $user->phone ?? null,
                    'default_address_id' => $user->default_address_id,
                ] : null,
            ],
            'addresses' => $addresses,
            'defaultAddressId' => $user?->default_address_id,
        ]);
    }

    public function applyCoupon(Request $request)
    {
        $cart = $this->shoppingCartService->itemsForRequest($request);
        if (empty($cart)) {
            return back()->withErrors(['code' => 'Tu carrito esta vacio.']);
        }

        $data = $request->validate([
            'code' => ['nullable', 'string', 'max:40'],
        ]);

        $code = strtoupper(trim($data['code'] ?? ''));

        if ($code === '') {
            $this->clearCouponSession();
            $this->calculateTotals($cart);

            return back()->with('success', 'Cupon eliminado.');
        }

        $subtotal = array_reduce($cart, fn ($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0);
        $coupon = Coupon::whereRaw('UPPER(code) = ?', [$code])->first();

        if (!$coupon) {
            return back()->withErrors(['code' => 'Cupon no valido o inexistente.']);
        }

        if (!$coupon->canBeRedeemed($subtotal)) {
            return back()->withErrors(['code' => $this->couponErrorMessage($coupon, $subtotal)]);
        }

        $discount = round($coupon->discountAmount($subtotal), 2);

        session()->put('checkout.coupon_id', $coupon->id);
        session()->put('checkout.coupon', $coupon->code);
        session()->put('checkout.coupon_label', $coupon->description ?? $coupon->code);
        session()->put('checkout.discount', $discount);

        $this->calculateTotals($cart);

        return back()->with('success', 'Cupon aplicado correctamente.');
    }

    public function updateShipping(Request $request)
    {
        $cart = $this->shoppingCartService->itemsForRequest($request);
        if (empty($cart)) {
            return $this->shippingUpdateErrorResponse($request, 'Tu carrito está vacío.');
        }

        $data = $request->validate([
            'method' => ['required', 'string'],
        ]);

        $subtotal = array_reduce($cart, fn ($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0);
        $options = $this->shippingOptionsForSubtotal($subtotal);

        if (!array_key_exists($data['method'], $options)) {
            return $this->shippingUpdateErrorResponse($request, 'Método de envío no disponible.');
        }

        $selected = $options[$data['method']];

        session()->put('checkout.shipping_method', $selected['value']);
        session()->put('checkout.shipping_cost', $selected['cost']);
        session()->put('checkout.shipping_label', $selected['label']);
        session()->put('checkout.shipping_description', $selected['description']);
        session()->put('checkout.shipping_eta', $selected['eta']);

        $totals = $this->calculateTotals($cart);

        if ($request->expectsJson()) {
            return response()->json([
                'message' => 'Método de envío actualizado.',
                'totals' => [
                    'subtotal' => $totals['subtotal'],
                    'discount' => $totals['discount'],
                    'shipping' => $totals['shipping_cost'],
                    'total' => $totals['total'],
                ],
                'shipping' => [
                    'method' => $totals['shipping_method'],
                    'label' => $totals['shipping_label'],
                    'description' => $totals['shipping_description'],
                    'eta' => $totals['shipping_eta'],
                    'cost' => $totals['shipping_cost'],
                ],
                'shippingOptions' => array_values($this->shippingOptionsForSubtotal($totals['subtotal'])),
            ]);
        }

        return back()->with('success', 'Método de envío actualizado.');
    }

    public function stripeCheckout(Request $request)
    {
        try {
            $validated = $request->validate([
                'address_id' => [
                    'required',
                    Rule::exists('addresses', 'id')->where(
                        fn ($query) => $query->where('user_id', $request->user()->id)
                    ),
                ],
            ]);

            $user = $request->user()->loadMissing('addresses');
            $address = $this->resolveUserAddress($user, (int) $validated['address_id']);

            $cart = array_values($this->shoppingCartService->itemsForRequest($request));
            if (empty($cart)) {
                return response()->json(['error' => 'Tu carrito está vacío.'], 400);
            }

            $totals = $this->calculateTotals($cart);
            if ($totals['total'] <= 0) {
                return response()->json(['error' => 'El total del pedido debe ser mayor a cero.'], 400);
            }

            Stripe::setApiKey(config('services.stripe.secret'));

            $descriptionParts = [
                sprintf('%d artículo(s)', count($cart)),
                sprintf('Envío: %s', $totals['shipping_label']),
            ];

            if ($totals['coupon_code']) {
                $descriptionParts[] = 'Cupón: ' . $totals['coupon_code'];
            }

            $lineItems = [[
                'price_data' => [
                    'currency' => 'eur',
                    'product_data' => [
                        'name' => config('app.name', 'Limoneo'),
                        'description' => implode(' · ', $descriptionParts),
                    ],
                    'unit_amount' => (int) round($totals['total'] * 100),
                ],
                'quantity' => 1,
            ]];

            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => $lineItems,
                'mode' => 'payment',
                'success_url' => route('checkout.success', [], true) . '?provider=stripe&session_id={CHECKOUT_SESSION_ID}',
                'cancel_url' => route('checkout.cancel', [], true),
                'customer_email' => $user->email,
                'metadata' => [
                    'user_id' => $user->id,
                    'address_id' => $address['id'],
                    'coupon_code' => $totals['coupon_code'] ?? '',
                    'shipping_method' => $totals['shipping_method'],
                    'shipping_cost' => $totals['shipping_cost'],
                    'discount' => $totals['discount'],
                ],
            ]);

            session()->put('stripe_session_id', $session->id);
            session()->put('selected_address', $address);

            return response()->json([
                'sessionId' => $session->id,
                'stripePublicKey' => config('services.stripe.key'),
            ]);
        } catch (\Exception $e) {
            Log::error('Error en Stripe Checkout: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function paypalCheckout(Request $request)
    {
        try {
            $validated = $request->validate([
                'address_id' => [
                    'required',
                    Rule::exists('addresses', 'id')->where(
                        fn ($query) => $query->where('user_id', $request->user()->id)
                    ),
                ],
            ]);

            $user = $request->user()->loadMissing('addresses');
            $address = $this->resolveUserAddress($user, (int) $validated['address_id']);

            $cart = array_values($this->shoppingCartService->itemsForRequest($request));
            if (empty($cart)) {
                return response()->json(['error' => 'Tu carrito está vacío.'], 400);
            }

            $totals = $this->calculateTotals($cart);
            if ($totals['total'] <= 0) {
                return response()->json(['error' => 'El total del pedido debe ser mayor a cero.'], 400);
            }

            $client = $this->paypalClient();

            $orderReq = new OrdersCreateRequest();
            $orderReq->prefer('return=representation');
            $orderReq->body = [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'amount' => [
                        'currency_code' => 'EUR',
                        'value' => number_format($totals['total'], 2, '.', ''),
                        'breakdown' => [
                            'item_total' => [
                                'currency_code' => 'EUR',
                                'value' => number_format(max($totals['subtotal'] - $totals['discount'], 0), 2, '.', ''),
                            ],
                            'shipping' => [
                                'currency_code' => 'EUR',
                                'value' => number_format($totals['shipping_cost'], 2, '.', ''),
                            ],
                        ],
                    ],
                ]],
                'application_context' => [
                    'return_url' => route('checkout.success', [], true) . '?provider=paypal',
                    'cancel_url' => route('checkout.cancel', [], true),
                ],
            ];

            $response = $client->execute($orderReq);
            $approvalLink = collect($response->result->links)->firstWhere('rel', 'approve')->href ?? null;

            if (!$approvalLink) {
                throw new \Exception('No se encontró el enlace de aprobación.');
            }

            session()->put('paypal_order_id', $response->result->id);
            session()->put('selected_address', $address);

            return response()->json(['approvalLink' => $approvalLink]);
        } catch (\Exception $e) {
            Log::error('Error en PayPal Checkout: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function success(Request $request)
    {
        $cart = array_values($this->shoppingCartService->itemsForRequest($request));
        $address = session()->get('selected_address');
        $storedStripeSessionId = session()->get('stripe_session_id');
        $storedPaypalOrderId = session()->get('paypal_order_id');
        $provider = request()->query('provider');
        $stripeSessionId = request()->query('session_id');
        $paypalOrderId = request()->query('token');

        if (empty($cart) || !$address || (!$storedStripeSessionId && !$storedPaypalOrderId)) {
            return redirect()->route('dashboard')->with('error', 'Faltan datos para completar la compra.');
        }

        $user = Auth::user();
        $totals = $this->calculateTotals($cart);

        try {
            if ($provider === 'stripe') {
                if (!$stripeSessionId || $stripeSessionId !== $storedStripeSessionId) {
                    throw new \RuntimeException('La sesión de Stripe no coincide con la compra iniciada.');
                }

                $session = $this->verifiedStripeSession($stripeSessionId);
                if (($session->metadata->user_id ?? null) && (int) $session->metadata->user_id !== (int) $user?->id) {
                    throw new \RuntimeException('La sesión de pago no pertenece al usuario autenticado.');
                }
            } elseif ($provider === 'paypal') {
                $paypalOrderId = $paypalOrderId ?: $storedPaypalOrderId;
                if (!$paypalOrderId || $paypalOrderId !== $storedPaypalOrderId) {
                    throw new \RuntimeException('La orden de PayPal no coincide con la compra iniciada.');
                }

                $capture = $this->capturePaypalOrder($paypalOrderId);
                if (($capture->status ?? null) !== 'COMPLETED') {
                    throw new \RuntimeException('El pago con PayPal no se completó correctamente.');
                }
            } else {
                throw new \RuntimeException('Proveedor de pago no soportado para confirmar la compra.');
            }

            $order = new Order();
            $order->user_id = $user?->id;
            $order->name = trim(implode(' ', array_filter([$user?->name, $user?->lastname])));
            $order->email = $user?->email;
            $order->address = $this->formatAddress($address);
            $order->shipping_method = session('checkout.shipping_method');
            $order->shipping_label = session('checkout.shipping_label');
            $order->shipping_description = session('checkout.shipping_description');
            $order->shipping_eta = session('checkout.shipping_eta');
            $order->shipping_cost = $totals['shipping_cost'] ?? 0;
            $order->coupon_id = session('checkout.coupon_id');
            $order->coupon_code = $totals['coupon_code'] ?? null;
            $order->discount = $totals['discount'] ?? 0;
            $order->payment_method = $provider;
            $order->total = $totals['total'];
            $order->transaction_id = $provider === 'stripe' ? $stripeSessionId : $paypalOrderId;
            $order->payment_reference_id = $provider === 'stripe'
                ? $this->resolveStripePaymentIntentId($session ?? null)
                : $this->resolvePaypalCaptureId($capture ?? null);
            $order->status = 'pagado';
            $order->save();

            foreach ($cart as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                    'status' => 'pagado',
                ]);
            }

            $couponId = session('checkout.coupon_id');
            if ($couponId) {
                Coupon::whereKey($couponId)->increment('used_count');
            } elseif (!empty($totals['coupon_code'])) {
                Coupon::whereRaw('UPPER(code) = ?', [strtoupper($totals['coupon_code'])])->increment('used_count');
            }

            $this->clearCouponSession();
            if ($user) {
                $this->shoppingCartService->clearUserCart($user);
            }

            session()->forget([
                'cart',
                'selected_address',
                'stripe_session_id',
                'paypal_order_id',
                'checkout.shipping_method',
                'checkout.shipping_cost',
                'checkout.shipping_label',
                'checkout.shipping_description',
                'checkout.shipping_eta',
                'checkout.total',
            ]);

            return redirect()->route('dashboard')->with('success', '¡Pago completado con éxito!');
        } catch (\Exception $e) {
            Log::error('Error al guardar la orden: ' . $e->getMessage());
            return redirect()->route('dashboard')->with('error', 'Error al guardar la orden.');
        }
    }

    public function cancel()
    {
        return redirect()->route('checkout')->with('error', 'El pago fue cancelado.');
    }

    private function calculateTotals(?array $cart = null): array
    {
        $cart ??= array_values($this->shoppingCartService->itemsForRequest(request()));

        $subtotal = round(array_reduce($cart, fn ($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0), 2);

        $options = $this->shippingOptionsForSubtotal($subtotal);
        $selectedKey = session('checkout.shipping_method', 'standard');
        $selected = $options[$selectedKey] ?? reset($options);

        session()->put('checkout.shipping_method', $selected['value']);
        session()->put('checkout.shipping_cost', $selected['cost']);
        session()->put('checkout.shipping_label', $selected['label']);
        session()->put('checkout.shipping_description', $selected['description']);
        session()->put('checkout.shipping_eta', $selected['eta']);

        $discount = 0.0;
        $couponData = $this->resolveCouponForSubtotal($subtotal);

        if ($couponData) {
            [$coupon, $discount] = $couponData;
            session()->put('checkout.coupon_id', $coupon->id);
            session()->put('checkout.coupon', $coupon->code);
            session()->put('checkout.coupon_label', $coupon->description ?? $coupon->code);
            session()->put('checkout.discount', $discount);
        } else {
            $this->clearCouponSession();
        }

        $discount = min($discount, $subtotal);

        $total = max($subtotal - $discount + $selected['cost'], 0);
        $total = round($total, 2);

        session()->put('checkout.total', $total);

        return [
            'subtotal' => $subtotal,
            'discount' => round($discount, 2),
            'coupon_code' => session('checkout.coupon'),
            'coupon_label' => session('checkout.coupon_label'),
            'shipping_method' => $selected['value'],
            'shipping_label' => $selected['label'],
            'shipping_description' => $selected['description'],
            'shipping_eta' => $selected['eta'],
            'shipping_cost' => $selected['cost'],
            'total' => $total,
        ];
    }

    private function shippingBlueprint(): array
    {
        return [
            'standard' => [
                'label' => 'Envío estándar',
                'description' => 'Gratis en pedidos superiores a 50 EUR',
                'eta' => '3-5 días hábiles',
                'cost' => 4.99,
                'free_over' => 50,
                'badge' => 'Popular',
            ],
            'express' => [
                'label' => 'Envío exprés',
                'description' => 'Entrega prioritaria en 48h',
                'eta' => '1-2 días hábiles',
                'cost' => 9.99,
                'badge' => 'Más rápido',
            ],
            'priority' => [
                'label' => 'Entrega al día siguiente',
                'description' => 'Despacho en menos de 12h',
                'eta' => '24h garantizadas',
                'cost' => 14.99,
                'badge' => 'Premium',
            ],
        ];
    }

    private function shippingOptionsForSubtotal(float $subtotal): array
    {
        $options = [];
        foreach ($this->shippingBlueprint() as $key => $option) {
            $cost = $option['cost'];
            if (!empty($option['free_over']) && $subtotal >= $option['free_over']) {
                $cost = 0.0;
            }

            $options[$key] = [
                'value' => $key,
                'label' => $option['label'],
                'description' => $option['description'],
                'eta' => $option['eta'],
                'cost' => round($cost, 2),
                'badge' => $option['badge'] ?? null,
            ];
        }

        return $options;
    }

    private function shippingUpdateErrorResponse(Request $request, string $message)
    {
        if ($request->expectsJson()) {
            return response()->json([
                'message' => $message,
                'errors' => [
                    'method' => [$message],
                ],
            ], 422);
        }

        return back()->withErrors(['method' => $message]);
    }

    private function resolveCouponForSubtotal(float $subtotal): ?array
    {
        $couponId = session('checkout.coupon_id');
        $couponCode = session('checkout.coupon');

        if (!$couponId && !$couponCode) {
            return null;
        }

        $query = Coupon::query();

        if ($couponId) {
            $query->whereKey($couponId);
        } elseif ($couponCode) {
            $query->whereRaw('UPPER(code) = ?', [strtoupper($couponCode)]);
        }

        $coupon = $query->first();

        if (!$coupon || !$coupon->canBeRedeemed($subtotal)) {
            $this->clearCouponSession();
            return null;
        }

        $discount = round($coupon->discountAmount($subtotal), 2);

        return [$coupon, $discount];
    }

    private function couponErrorMessage(Coupon $coupon, float $subtotal): string
    {
        if (!$coupon->is_active) {
            return 'Cupon inactivo.';
        }

        if ($coupon->isExpired()) {
            return 'Cupon expirado.';
        }

        if ($coupon->min_subtotal > 0 && $subtotal < $coupon->min_subtotal) {
            return sprintf('Este cupon requiere un minimo de %.2f.', $coupon->min_subtotal);
        }

        if (!is_null($coupon->usage_limit) && $coupon->used_count >= $coupon->usage_limit) {
            return 'Se alcanzo el limite de usos para este cupon.';
        }

        return 'No es posible aplicar este cupon.';
    }

    private function clearCouponSession(): void
    {
        session()->forget([
            'checkout.coupon_id',
            'checkout.coupon',
            'checkout.coupon_label',
            'checkout.discount',
            'checkout.discount_type',
            'checkout.discount_value',
        ]);
    }

    private function resolveUserAddress($user, int $addressId): array
    {
        $address = $user->addresses->firstWhere('id', $addressId);

        if (!$address) {
            throw new \RuntimeException('No se encontró la dirección de envío.');
        }

        return [
            'id' => $address->id,
            'street' => $address->street,
            'city' => $address->city,
            'province' => $address->province,
            'zip_code' => $address->zip_code,
            'country' => $address->country,
        ];
    }

    private function formatAddress(array $address): string
    {
        return implode(', ', [
            $address['street'],
            $address['city'],
            $address['province'],
            $address['zip_code'],
            $address['country'],
        ]);
    }

    private function verifiedStripeSession(string $sessionId): Session
    {
        Stripe::setApiKey(config('services.stripe.secret'));

        $session = Session::retrieve($sessionId);
        if (($session->payment_status ?? null) !== 'paid') {
            throw new \RuntimeException('Stripe no confirmó el pago de esta sesión.');
        }

        return $session;
    }

    private function capturePaypalOrder(string $orderId)
    {
        $request = new OrdersCaptureRequest($orderId);
        $request->prefer('return=representation');

        $response = $this->paypalClient()->execute($request);

        return $response->result;
    }

    private function paypalClient(): PayPalHttpClient
    {
        $clientId = config('services.paypal.client_id');
        $clientSecret = config('services.paypal.client_secret');

        $environment = config('services.paypal.mode') === 'live'
            ? new LiveEnvironment($clientId, $clientSecret)
            : new SandboxEnvironment($clientId, $clientSecret);

        return new PayPalHttpClient($environment);
    }

    private function resolveStripePaymentIntentId(?Session $session): ?string
    {
        if (!$session) {
            return null;
        }

        return is_string($session->payment_intent ?? null)
            ? $session->payment_intent
            : ($session->payment_intent->id ?? null);
    }

    private function resolvePaypalCaptureId($capture): ?string
    {
        $purchaseUnits = $capture->purchase_units ?? [];

        foreach ($purchaseUnits as $purchaseUnit) {
            $captures = $purchaseUnit->payments->captures ?? [];

            foreach ($captures as $paymentCapture) {
                if (!empty($paymentCapture->id)) {
                    return $paymentCapture->id;
                }
            }
        }

        return null;
    }
}
