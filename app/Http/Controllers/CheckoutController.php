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

// Actualiza los namespaces del SDK de PayPal
use PayPalCheckoutSdk\Core\PayPalHttpClient;
use PayPalCheckoutSdk\Core\SandboxEnvironment;
use PayPalCheckoutSdk\Orders\OrdersCreateRequest;

class CheckoutController extends Controller
{
    public function index()
    {
        $cart = session()->get('cart', []);
        $total = array_reduce($cart, fn($sum, $item) => $sum + $item['price'] * $item['quantity'], 0);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $addresses = $user->addresses;

        Log::info('Checkout index reached', ['user_id' => $user->id, 'cart_count' => count($cart)]);

        return Inertia::render('Checkout', [
            'cartItems'        => $cart,
            'total'            => number_format($total, 2),
            'user'             => $user,
            'addresses'        => $addresses,
            'defaultAddressId' => $user->default_address_id,
        ]);
    }

    public function stripeCheckout(Request $request)
    {
        Log::info('Stripe checkout request received', $request->all());

        try {
            $validated = $request->validate([
                'address_id' => 'required|exists:addresses,id',
            ]);

            /** @var \App\Models\User $user */
            $user = Auth::user();
            $user->load('addresses');
            $address = $user->addresses->firstWhere('id', $request->address_id);
            if (!$address) {
                throw new \Exception('Dirección no encontrada.');
            }

            Stripe::setApiKey(env('STRIPE_SECRET'));
            $cart = session()->get('cart', []);

            if (empty($cart)) {
                Log::warning('Cart is empty in stripeCheckout');
                return response()->json(['error' => 'Tu carrito está vacío.'], 400);
            }

            $lineItems = array_map(function ($item) {
                return [
                    'price_data' => [
                        'currency'     => 'usd',
                        'product_data' => [
                            'name'   => $item['title'],
                            'images' => [$item['image_url']],
                        ],
                        'unit_amount'  => $item['price'] * 100,
                    ],
                    'quantity'   => $item['quantity'],
                ];
            }, array_values($cart));

            $session = Session::create([
                'payment_method_types' => ['card'],
                'line_items'           => $lineItems,
                'mode'                 => 'payment',
                'success_url'          => route('checkout.success', [], true),
                'cancel_url'           => route('checkout.cancel', [], true),
                'customer_email'       => $user->email,
                'metadata'             => [
                    'user_id'    => $user->id,
                    'address_id' => $address->id,
                ],
            ]);

            Log::info('Stripe session created successfully', ['sessionId' => $session->id]);

            session()->put('stripe_session_id', $session->id);
            session()->put('selected_address', $address);

            return response()->json([
                'sessionId'       => $session->id,
                'stripePublicKey' => env('STRIPE_KEY'),
            ]);
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::error('Validation error in stripeCheckout: ' . $ve->getMessage(), ['errors' => $ve->errors()]);
            return response()->json([
                'error'   => 'Validation error',
                'message' => $ve->getMessage(),
                'details' => $ve->errors()
            ], 422);
        } catch (\Stripe\Exception\ApiErrorException $se) {
            Log::error('Stripe API error in stripeCheckout: ' . $se->getMessage(), ['exception' => $se]);
            return response()->json([
                'error'   => 'Stripe API error',
                'message' => $se->getMessage(),
                'code'    => $se->getHttpStatus(),
            ], 500);
        } catch (\Exception $e) {
            Log::error('General error in stripeCheckout: ' . $e->getMessage(), [
                'exception' => $e,
                'file'      => $e->getFile(),
                'line'      => $e->getLine()
            ]);
            return response()->json([
                'error'   => 'Server error',
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine(),
            ], 500);
        }
    }

    public function paypalCheckout(Request $request)
    {
        Log::info('PayPal checkout request received', $request->all());

        try {
            $validated = $request->validate([
                'address_id' => 'required|exists:addresses,id',
            ]);

            /** @var \App\Models\User $user */
            $user = Auth::user();
            $user->load('addresses');
            $address = $user->addresses->firstWhere('id', $validated['address_id']);
            if (!$address) {
                throw new \Exception('Dirección no encontrada.');
            }

            $cart = session()->get('cart', []);
            if (empty($cart)) {
                Log::warning('Cart is empty in paypalCheckout');
                return response()->json(['error' => 'Tu carrito está vacío.'], 400);
            }

            $total = array_reduce($cart, fn($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0);

            // Configurar el entorno de PayPal (Sandbox para pruebas)
            $clientId = env('PAYPAL_CLIENT_ID');
            $clientSecret = env('PAYPAL_CLIENT_SECRET');
            $environment = new SandboxEnvironment($clientId, $clientSecret);
            $client = new PayPalHttpClient($environment);

            $requestOrder = new OrdersCreateRequest();
            $requestOrder->prefer('return=representation');
            $requestOrder->body = [
                "intent" => "CAPTURE",
                "purchase_units" => [[
                    "amount" => [
                        "currency_code" => "USD",
                        "value"         => number_format($total, 2, '.', '')
                    ]
                ]]
            ];

            $response = $client->execute($requestOrder);

            if ($response->statusCode == 201) {
                $approvalLink = null;
                foreach ($response->result->links as $link) {
                    if ($link->rel === "approve") {
                        $approvalLink = $link->href;
                        break;
                    }
                }
                if (!$approvalLink) {
                    throw new \Exception("No se encontró el enlace de aprobación en la respuesta de PayPal.");
                }

                session()->put('paypal_order_id', $response->result->id);
                session()->put('selected_address', $address);

                return response()->json([
                    'approvalLink' => $approvalLink,
                ]);
            } else {
                throw new \Exception("Error al crear la orden en PayPal, status code: " . $response->statusCode);
            }
        } catch (\Illuminate\Validation\ValidationException $ve) {
            Log::error('Validation error in paypalCheckout: ' . $ve->getMessage(), ['errors' => $ve->errors()]);
            return response()->json([
                'error'   => 'Validation error',
                'message' => $ve->getMessage(),
                'details' => $ve->errors()
            ], 422);
        } catch (\Exception $e) {
            Log::error('General error in paypalCheckout: ' . $e->getMessage(), [
                'exception' => $e,
                'file'      => $e->getFile(),
                'line'      => $e->getLine()
            ]);
            return response()->json([
                'error'   => 'Server error',
                'message' => $e->getMessage(),
                'file'    => $e->getFile(),
                'line'    => $e->getLine()
            ], 500);
        }
    }

    public function success()
    {
        $cart            = session()->get('cart', []);
        $address         = session()->get('selected_address');
        $stripeSessionId = session()->get('stripe_session_id');
        $paypalOrderId   = session()->get('paypal_order_id');

        if (empty($cart) || !$address || (!$stripeSessionId && !$paypalOrderId)) {
            Log::warning('Missing data in success handler');
            return redirect()->route('dashboard')->with('error', 'Faltan datos del pedido.');
        }

        /** @var \App\Models\User $user */
        $user = Auth::user();

        try {
            $order = new Order();
            $order->user_id        = $user->id;
            $order->name           = $user->name;
            $order->email          = $user->email;
            $order->address        = "{$address->street}, {$address->city}, {$address->province}, {$address->zip_code}, {$address->country}";
            $order->payment_method = $stripeSessionId ? 'Stripe' : 'PayPal';
            $order->total          = array_reduce($cart, fn($sum, $item) => $sum + ($item['price'] * $item['quantity']), 0);
            $order->transaction_id = $stripeSessionId ?? $paypalOrderId;
            $order->save();

            foreach ($cart as $item) {
                OrderItem::create([
                    'order_id'   => $order->id,
                    'product_id' => $item['id'],
                    'quantity'   => $item['quantity'],
                    'price'      => $item['price'],
                ]);
            }

            session()->forget(['cart', 'selected_address', 'stripe_session_id', 'paypal_order_id']);
            Log::info('Order created successfully', ['order_id' => $order->id]);

            return redirect()->route('dashboard')->with('success', '¡Pago completado con éxito!');
        } catch (\Exception $e) {
            Log::error('Error creating order: ' . $e->getMessage(), ['exception' => $e]);
            return redirect()->route('dashboard')->with('error', 'Error al procesar tu pedido.');
        }
    }

    public function cancel()
    {
        Log::info('Payment cancelled by user');
        return redirect()->route('checkout')->with('error', 'El pago fue cancelado.');
    }

    public function storeAddress(Request $request)
    {
        $validated = $request->validate([
            'street'       => 'required|string|max:255',
            'city'         => 'required|string|max:255',
            'province'     => 'required|string|max:255',
            'zip_code'     => 'required|string|max:255',
            'country'      => 'required|string|max:255',
            'make_default' => 'sometimes|boolean',
        ]);

        /** @var \App\Models\User $user */
        $user = Auth::user();
        $address = Address::create(array_merge($validated, ['user_id' => $user->id]));

        if ($request->boolean('make_default')) {
            $user->default_address_id = $address->id;
            $user->save();
        }

        return back()->with('success', 'Dirección guardada correctamente.');
    }
}
