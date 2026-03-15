<?php

namespace App\Http\Controllers;

use App\Services\ShoppingCartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class CartController extends Controller
{
    public function __construct(
        private readonly ShoppingCartService $shoppingCartService,
    ) {
    }

    /**
     * Mostrar el contenido del carrito.
     */
    public function index(Request $request)
    {
        $snapshot = $this->cartSnapshot($request);

        Log::info('Vista del carrito accedida', ['cartCount' => $snapshot['cartCount']]);

        return Inertia::render('Shop/CartPage', $snapshot);
    }

    /**
     * Agregar un producto al carrito (o incrementar si ya existe).
     */
    public function addToCart(Request $request, $productId)
    {
        $this->shoppingCartService->add($request, (int) $productId);
        Log::info('Producto agregado al carrito', ['product_id' => (int) $productId]);

        return $this->cartResponse($request, 'Producto agregado al carrito.');
    }

    /**
     * Eliminar un producto del carrito.
     */
    public function removeFromCart(Request $request, $productId)
    {
        $this->shoppingCartService->remove($request, (int) $productId);
        Log::info('Producto eliminado del carrito', ['product_id' => (int) $productId]);

        return $this->cartResponse($request);
    }

    /**
     * Incrementar cantidad de un producto en el carrito.
     */
    public function incrementQuantity(Request $request, $productId)
    {
        $this->shoppingCartService->add($request, (int) $productId, 1);
        Log::info('Cantidad incrementada', ['product_id' => (int) $productId]);

        return $this->cartResponse($request);
    }

    /**
     * Decrementar cantidad o eliminar si llega a 0.
     */
    public function decreaseQuantity(Request $request, $productId)
    {
        $cart = $this->shoppingCartService->itemsForRequest($request);
        $currentQuantity = (int) ($cart[(int) $productId]['quantity'] ?? 0);

        if ($currentQuantity > 1) {
            $this->shoppingCartService->setQuantity($request, (int) $productId, $currentQuantity - 1);
            Log::info('Cantidad reducida', ['product_id' => (int) $productId]);
        } elseif ($currentQuantity === 1) {
            $this->shoppingCartService->remove($request, (int) $productId);
            Log::info('Producto eliminado por cantidad 0', ['product_id' => (int) $productId]);
        }

        return $this->cartResponse($request);
    }

    /**
     * Resumen del carrito para peticiones asincronas.
     */
    public function summary(Request $request)
    {
        return response()->json($this->cartSnapshot($request));
    }

    /**
     * Construye la respuesta del carrito respetando el tipo de peticion.
     */
    private function cartResponse(Request $request, ?string $message = null)
    {
        $payload = $this->cartSnapshot($request);

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
    private function cartSnapshot(Request $request): array
    {
        return $this->shoppingCartService->summaryForRequest($request);
    }
}
