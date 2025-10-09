<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Illuminate\Support\Facades\Log;

class CartController extends Controller
{
    /**
     * Mostrar el contenido del carrito.
     */
    public function index()
    {
        $cartItems = session()->get('cart', []);
        $total = collect($cartItems)->sum(fn($item) => $item['price'] * $item['quantity']);
        $cartCount = array_sum(array_column($cartItems, 'quantity'));

        Log::info('Vista del carrito accedida', ['cartCount' => $cartCount]);

        return Inertia::render('CartPage', [
            'cartItems' => array_values($cartItems),
            'cartCount' => $cartCount,
            'total'     => number_format($total, 2),
        ]);
    }

    /**
     * Agregar un producto al carrito (o incrementar si ya existe).
     */
    public function addToCart(Request $request, $productId)
    {
        $product = Product::findOrFail($productId);
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity']++;
        } else {
            $cart[$productId] = [
                'id'        => $product->id,
                'title'     => $product->name,
                'price'     => $product->price,
                'image_url' => $product->image_url ?? '/default-image.jpg',
                'quantity'  => 1,
            ];
        }

        session()->put('cart', $cart);
        Log::info("Producto agregado al carrito", ['product_id' => $productId]);

        return $this->cartResponse($request, 'Producto agregado al carrito.');
    }

    /**
     * Eliminar un producto del carrito.
     */
    public function removeFromCart(Request $request, $productId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            unset($cart[$productId]);
            session()->put('cart', $cart);
            Log::info("Producto eliminado del carrito", ['product_id' => $productId]);
        }

        return $this->cartResponse($request);
    }

    /**
     * Incrementar cantidad de un producto en el carrito.
     */
    public function incrementQuantity(Request $request, $productId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity']++;
            session()->put('cart', $cart);
            Log::info("Cantidad incrementada", ['product_id' => $productId]);
        }

        return $this->cartResponse($request);
    }

    /**
     * Decrementar cantidad o eliminar si llega a 0.
     */
    public function decreaseQuantity(Request $request, $productId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            if ($cart[$productId]['quantity'] > 1) {
                $cart[$productId]['quantity']--;
                Log::info("Cantidad reducida", ['product_id' => $productId]);
            } else {
                unset($cart[$productId]);
                Log::info("Producto eliminado por cantidad 0", ['product_id' => $productId]);
            }
            session()->put('cart', $cart);
        }

        return $this->cartResponse($request);
    }

    /**
     * Eliminado: checkout() y confirmOrder()
     * Mantenemos esa logica en CheckoutController para evitar duplicacion.
     */
    /**
     * Resumen del carrito para peticiones asincronas.
     */
    public function summary(Request $request)
    {
        return response()->json($this->cartSnapshot());
    }

    /**
     * Construye la respuesta del carrito respetando el tipo de peticion.
     */
    private function cartResponse(Request $request, ?string $message = null)
    {
        $payload = $this->cartSnapshot();

        if ($message) {
            $payload['message'] = $message;
        }

        if ($request->expectsJson()) {
            return response()->json($payload);
        }

        $redirect = redirect()->back();

        if ($message) {
            $redirect->with('success', $message);
        }

        return $redirect;
    }

    /**
     * Devuelve el estado actual del carrito listo para serializar.
     */
    private function cartSnapshot(): array
    {
        $cartItems = session()->get('cart', []);
        $total = collect($cartItems)->sum(fn($item) => $item['price'] * $item['quantity']);
        $cartCount = array_sum(array_column($cartItems, 'quantity'));

        return [
            'cartItems' => array_values($cartItems),
            'cartCount' => $cartCount,
            'total'     => number_format($total, 2),
        ];
    }
}
