<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Address;
use Stripe\Stripe;
use Stripe\Checkout\Session;
use Inertia\Inertia;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;

class CheckoutController extends Controller
{
    public function index()
    {
        $cart = session()->get('cart', []);
        $total = array_reduce($cart, fn($sum, $item) => $sum + $item['price'] * $item['quantity'], 0);

        $user = Auth::user()?->load('addresses');

        return Inertia::render('Checkout', [
            'cartItems' => $cart,
            'total' => number_format($total, 2),
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'phone' => $user->phone ?? null,
                    'default_address_id' => $user->default_address_id,
                ] : null,
            ],
            'addresses' => $user?->addresses ?? [],
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
            'message' => 'Dirección guardada correctamente',
            'address' => $validated,
        ]);
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
                throw new \Exception('No se encontró la dirección de envío.');
            }

            $cart = session()->get('cart', []);
            if (empty($cart)) {
                return response()->json(['error' => 'Tu carrito está vacío.'], 400);
            }

            Stripe::setApiKey(env('STRIPE_SECRET'));

            $lineItems = array_map(fn($item) => [
                'price_data' => [
                    'currency' => 'usd',
                    'product_data' => [
                        'name' => $item['title'],
                        'images' => [$item['image_url']],
                    ],
                    'unit_amount' => $item['price'] * 100,
                ],
                'quantity' => $item['quantity'],
            ], array_values($cart));

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
                throw new \Exception('No se encontró la dirección de envío.');
            }

            $cart = session()->get('cart', []);
            if (empty($cart)) {
                return response()->json(['error' => 'Tu carrito está vacío.'], 400);
            }

            $total = array_reduce($cart, fn($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0);

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
                        'value' => number_format($total, 2, '.', ''),
                    ]
                ]]
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

    public function success()
    {
        $cart = session()->get('cart', []);
        $address = session()->get('selected_address') ?? session()->get('guest_address');
        $stripeSessionId = session()->get('stripe_session_id');
        $paypalOrderId = session()->get('paypal_order_id');

        if (empty($cart) || !$address || (!$stripeSessionId && !$paypalOrderId)) {
            return redirect()->route('dashboard')->with('error', 'Faltan datos para completar la compra.');
        }

        $user = Auth::user();

        try {
            $order = new Order();
            $order->user_id = $user?->id;
            $order->name = $user?->name ?? 'Invitado';
            $order->email = $user?->email ?? 'invitado@correo.com';
            $order->address = "{$address->street}, {$address->city}, {$address->province}, {$address->zip_code}, {$address->country}";
            $order->payment_method = $stripeSessionId ? 'Stripe' : 'PayPal';
            $order->total = array_reduce($cart, fn($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0);
            $order->transaction_id = $stripeSessionId ?? $paypalOrderId;
            $order->save();

            foreach ($cart as $item) {
                OrderItem::create([
                    'order_id' => $order->id,
                    'product_id' => $item['id'],
                    'quantity' => $item['quantity'],
                    'price' => $item['price'],
                ]);
            }

            session()->forget(['cart', 'selected_address', 'guest_address', 'stripe_session_id', 'paypal_order_id']);

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

    public function storeAddress(Request $request)
    {
        $validated = $request->validate([
            'street' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'zip_code' => 'required|string|max:255',
            'country' => 'required|string|max:255',
            'make_default' => 'sometimes|boolean',
        ]);

        $user = Auth::user();
        $address = Address::create(array_merge($validated, ['user_id' => $user->id]));

        if ($request->boolean('make_default')) {
            $user->default_address_id = $address->id;
            $user->save();
        }

        return back()->with([
            'success' => 'Dirección guardada correctamente.',
            'newAddress' => $address,
        ]);
    }
}
