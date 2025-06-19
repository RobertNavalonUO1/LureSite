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
    public function addToCart($productId)
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

        return redirect()->back()->with('success', 'Producto agregado al carrito.');
    }

    /**
     * Eliminar un producto del carrito.
     */
    public function removeFromCart($productId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            unset($cart[$productId]);
            session()->put('cart', $cart);
            Log::info("Producto eliminado del carrito", ['product_id' => $productId]);
        }

        return redirect()->back();
    }

    /**
     * Incrementar cantidad de un producto en el carrito.
     */
    public function incrementQuantity($productId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity']++;
            session()->put('cart', $cart);
            Log::info("Cantidad incrementada", ['product_id' => $productId]);
        }

        return redirect()->back();
    }

    /**
     * Decrementar cantidad o eliminar si llega a 0.
     */
    public function decreaseQuantity($productId)
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

        return redirect()->back();
    }

    /**
     * 🚫 Eliminado: checkout() y confirmOrder()
     * Mantenemos esa lógica en CheckoutController para evitar duplicación.
     */
}
