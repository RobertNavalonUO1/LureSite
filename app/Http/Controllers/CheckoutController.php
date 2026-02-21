<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;
use Stripe\Checkout\Session;
use Stripe\Stripe;

class CheckoutController extends Controller
{
    public function index()
    {
        $cart = array_values(session()->get('cart', []));
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
            'currency' => 'USD',
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

    public function storeGuestAddress(Request $request)
    {
        $validated = $request->validate([
            'street' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'zip_code' => 'required|string|max:255',
            'country' => 'required|string|max:255',
        ]);

        session()->put('guest_address', (object) $validated);

        return response()->json([
            'success' => true,
            'message' => 'DirecciÃ³n guardada correctamente',
            'address' => $validated,
        ]);
    }

    public function applyCoupon(Request $request)
    {
        $cart = session()->get('cart', []);
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
        $cart = session()->get('cart', []);
        if (empty($cart)) {
            return back()->withErrors(['method' => 'Tu carrito estÃ¡ vacÃ­o.']);
        }

        $data = $request->validate([
            'method' => ['required', 'string'],
        ]);

        $subtotal = array_reduce($cart, fn ($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0);
        $options = $this->shippingOptionsForSubtotal($subtotal);

        if (!array_key_exists($data['method'], $options)) {
            return back()->withErrors(['method' => 'MÃ©todo de envÃ­o no disponible.']);
        }

        $selected = $options[$data['method']];

        session()->put('checkout.shipping_method', $selected['value']);
        session()->put('checkout.shipping_cost', $selected['cost']);
        session()->put('checkout.shipping_label', $selected['label']);
        session()->put('checkout.shipping_description', $selected['description']);
        session()->put('checkout.shipping_eta', $selected['eta']);

        $this->calculateTotals($cart);

        return back()->with('success', 'MÃ©todo de envÃ­o actualizado.');
    }

    public function stripeCheckout(Request $request)
    {
        try {
            $validated = $request->validate([
                'address_id' => 'nullable|exists:addresses,id',
            ]);

            $user = Auth::user();
            $address = $user
                ? $user->addresses->firstWhere('id', $validated['address_id'])
                : session()->get('guest_address');

            if (!$address) {
                throw new \Exception('No se encontrÃ³ la direcciÃ³n de envÃ­o.');
            }

            $cart = array_values(session()->get('cart', []));
            if (empty($cart)) {
                return response()->json(['error' => 'Tu carrito estÃ¡ vacÃ­o.'], 400);
            }

            $totals = $this->calculateTotals($cart);
            if ($totals['total'] <= 0) {
                return response()->json(['error' => 'El total del pedido debe ser mayor a cero.'], 400);
            }

            Stripe::setApiKey(env('STRIPE_SECRET'));

            $descriptionParts = [
                sprintf('%d artÃ­culo(s)', count($cart)),
                sprintf('EnvÃ­o: %s', $totals['shipping_label']),
            ];

            if ($totals['coupon_code']) {
                $descriptionParts[] = 'CupÃ³n: ' . $totals['coupon_code'];
            }

            $lineItems = [[
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => config('app.name', 'Limoneo'),
                        'description' => implode(' Â· ', $descriptionParts),
                    ],
                    'unit_amount' => (int) round($totals['total'] * 100),
                ],
                'quantity' => 1,
            ]];

            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items' => $lineItems,
                'mode' => 'payment',
                'success_url' => route('checkout.success', [], true),
                'cancel_url' => route('checkout.cancel', [], true),
                'customer_email' => $user?->email ?? 'invitado@correo.com',
                'metadata' => [
                    'user_id' => $user?->id ?? null,
                    'address_id' => $address->id ?? null,
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
                'stripePublicKey' => env('STRIPE_KEY'),
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
                'address_id' => 'nullable|exists:addresses,id',
            ]);

            $user = Auth::user();
            $address = $user
                ? $user->addresses->firstWhere('id', $validated['address_id'])
                : session()->get('guest_address');

            if (!$address) {
                throw new \Exception('No se encontrÃ³ la direcciÃ³n de envÃ­o.');
            }

            $cart = array_values(session()->get('cart', []));
            if (empty($cart)) {
                return response()->json(['error' => 'Tu carrito estÃ¡ vacÃ­o.'], 400);
            }

            $totals = $this->calculateTotals($cart);
            if ($totals['total'] <= 0) {
                return response()->json(['error' => 'El total del pedido debe ser mayor a cero.'], 400);
            }

            $client = new PayPalHttpClient(new SandboxEnvironment(
                env('PAYPAL_CLIENT_ID'),
                env('PAYPAL_CLIENT_SECRET')
            ));

            $orderReq = new OrdersCreateRequest();
            $orderReq->prefer('return=representation');
            $orderReq->body = [
                'intent' => 'CAPTURE',
                'purchase_units' => [[
                    'amount' => [
                        'currency_code' => 'USD',
                        'value' => number_format($totals['total'], 2, '.', ''),
                        'breakdown' => [
                            'item_total' => [
                                'currency_code' => 'USD',
                                'value' => number_format(max($totals['subtotal'] - $totals['discount'], 0), 2, '.', ''),
                            ],
                            'shipping' => [
                                'currency_code' => 'USD',
                                'value' => number_format($totals['shipping_cost'], 2, '.', ''),
                            ],
                        ],
                    ],
                ]],
            ];

            $response = $client->execute($orderReq);
            $approvalLink = collect($response->result->links)->firstWhere('rel', 'approve')->href ?? null;

            if (!$approvalLink) {
                throw new \Exception('No se encontrÃ³ el enlace de aprobaciÃ³n.');
            }

            session()->put('paypal_order_id', $response->result->id);
            session()->put('selected_address', $address);

            return response()->json(['approvalLink' => $approvalLink]);
        } catch (\Exception $e) {
            Log::error('Error en PayPal Checkout: ' . $e->getMessage());
            return response()->json(['error' => $e->getMessage()], 500);
        }
    }

    public function success()
    {
        $cart = array_values(session()->get('cart', []));
        $address = session()->get('selected_address') ?? session()->get('guest_address');
        $stripeSessionId = session()->get('stripe_session_id');
        $paypalOrderId = session()->get('paypal_order_id');

        if (empty($cart) || !$address || (!$stripeSessionId && !$paypalOrderId)) {
            return redirect()->route('dashboard')->with('error', 'Faltan datos para completar la compra.');
        }

        $user = Auth::user();
        $totals = $this->calculateTotals($cart);

        try {
            $order = new Order();
            $order->user_id = $user?->id;
            $order->name = $user?->name ?? 'Invitado';
            $order->email = $user?->email ?? 'invitado@correo.com';
            $order->address = sprintf('%s, %s, %s, %s, %s', $address->street, $address->city, $address->province, $address->zip_code, $address->country);
            $order->payment_method = $stripeSessionId ? 'Stripe' : 'PayPal';
            $order->total = $totals['total'];
            $order->transaction_id = $stripeSessionId ?? $paypalOrderId;
            $order->status = 'confirmado';
            $order->save();

            foreach ($cart as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);
            }

            $couponId = session('checkout.coupon_id');
            if ($couponId) {
                Coupon::whereKey($couponId)->increment('used_count');
            } elseif (!empty($totals['coupon_code'])) {
                Coupon::whereRaw('UPPER(code) = ?', [strtoupper($totals['coupon_code'])])->increment('used_count');
            }

            $this->clearCouponSession();

            session()->forget([
                'cart',
                'selected_address',
                'guest_address',
                'stripe_session_id',
                'paypal_order_id',
                'checkout.shipping_method',
                'checkout.shipping_cost',
                'checkout.shipping_label',
                'checkout.shipping_description',
                'checkout.shipping_eta',
                'checkout.total',
            ]);

            return redirect()->route('dashboard')->with('success', 'Â¡Pago completado con Ã©xito!');
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
        $cart ??= array_values(session()->get('cart', []));

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
                'label' => 'EnvÃ­o estÃ¡ndar',
                'description' => 'Gratis en pedidos superiores a $50',
                'eta' => '3-5 dÃ­as hÃ¡biles',
                'cost' => 4.99,
                'free_over' => 50,
                'badge' => 'Popular',
            ],
            'express' => [
                'label' => 'EnvÃ­o exprÃ©s',
                'description' => 'Entrega prioritaria en 48h',
                'eta' => '1-2 dÃ­as hÃ¡biles',
                'cost' => 9.99,
                'badge' => 'MÃ¡s rÃ¡pido',
            ],
            'priority' => [
                'label' => 'Entrega al dÃ­a siguiente',
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
}





