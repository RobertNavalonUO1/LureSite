<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Http\Request;
use Inertia\Inertia;

class CartController extends Controller
{
    // Mostrar el carrito
    public function index()
    {
        $cartItems = session()->get('cart', []);

        // Calcular el total
        $total = array_sum(array_map(fn($item) => $item['price'] * $item['quantity'], $cartItems));

        return inertia('CartPage', [
            'cartItems' => $cartItems,
            'cartCount' => array_sum(array_column($cartItems, 'quantity')),
            'total' => number_format($total, 2),
        ]);
    }

    // Agregar un producto al carrito
    public function addToCart($productId)
    {
        $product = Product::findOrFail($productId);

        // Obtener el carrito actual
        $cart = session()->get('cart', []);

        // Si el producto ya está en el carrito, aumentar la cantidad
        if (isset($cart[$productId])) {
            $cart[$productId]['quantity']++;
        } else {
            // Si no está en el carrito, agregarlo con una cantidad inicial de 1
            $cart[$productId] = [
                'id' => $product->id,
                'title' => $product->name, // Cambio de 'name' a 'title' para mantener consistencia con el frontend
                'price' => $product->price,
                'image_url' => $product->image_url ?? '/default-image.jpg',

                'quantity' => 1,
            ];
        }

        // Guardar el carrito actualizado en la sesión
        session()->put('cart', $cart);

        return redirect()->back();
    }

    // Eliminar un producto del carrito
    public function removeFromCart($productId)
    {
        // Obtener el carrito de la sesión
        $cart = session()->get('cart', []);

        // Verificar si el producto existe en el carrito y eliminarlo
        if (isset($cart[$productId])) {
            unset($cart[$productId]);
            // Guardar el carrito actualizado en la sesión
            session()->put('cart', $cart);
        }

        return redirect()->back();
    }

    // Incrementar la cantidad de un producto en el carrito
    public function incrementQuantity($productId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity']++;
            session()->put('cart', $cart);
        }

        return redirect()->back();
    }

    // Decrementar la cantidad de un producto en el carrito
    public function decreaseQuantity($productId)
    {
        $cart = session()->get('cart', []);

        if (isset($cart[$productId])) {
            if ($cart[$productId]['quantity'] > 1) {
                $cart[$productId]['quantity']--;
            } else {
                // Si la cantidad es 1, eliminar el producto del carrito
                unset($cart[$productId]);
            }
            session()->put('cart', $cart);
        }

        return redirect()->back();
    }

    // Procesar el checkout
    public function checkout()
    {
        return inertia('CheckoutPage');
    }

    // Confirmar la compra
    public function confirmOrder(Request $request)
    {
        // Vaciar el carrito después de confirmar la compra
        session()->forget('cart');

        return redirect()->route('home')->with('success', 'Pedido confirmado!');
    }
}
