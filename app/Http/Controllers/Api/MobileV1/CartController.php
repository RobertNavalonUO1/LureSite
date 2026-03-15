<?php

namespace App\Http\Controllers\Api\MobileV1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Services\Mobile\MobileCatalogPresenter;
use App\Services\ShoppingCartService;
use Illuminate\Http\Request;

class CartController extends Controller
{
    use RespondsWithApi;

    public function __construct(
        private readonly ShoppingCartService $shoppingCartService,
        private readonly MobileCatalogPresenter $catalogPresenter,
    ) {
    }

    public function index(Request $request)
    {
        return $this->success($this->cartSummary($request));
    }

    public function replace(Request $request)
    {
        $data = $request->validate([
            'items' => ['required', 'array'],
            'items.*.product_id' => ['required', 'integer'],
            'items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $warnings = $this->shoppingCartService->replaceWithSnapshot($request->user(), $data['items']);

        return $this->success($this->cartSummary($request, $warnings), [
            'merge_strategy' => 'sum_by_product',
        ]);
    }

    public function store(Request $request)
    {
        $data = $request->validate([
            'product_id' => ['required', 'integer', 'exists:products,id'],
            'quantity' => ['nullable', 'integer', 'min:1'],
        ]);

        $this->shoppingCartService->add($request, (int) $data['product_id'], (int) ($data['quantity'] ?? 1));

        return $this->success($this->cartSummary($request), [
            'message' => 'Product added.',
        ]);
    }

    public function update(Request $request, int $lineId)
    {
        $data = $request->validate([
            'quantity' => ['required', 'integer', 'min:1'],
        ]);

        $this->shoppingCartService->setQuantity($request, $lineId, (int) $data['quantity']);

        return $this->success($this->cartSummary($request), [
            'message' => 'Cart updated.',
        ]);
    }

    public function destroy(Request $request, int $lineId)
    {
        $this->shoppingCartService->remove($request, $lineId);

        return $this->success($this->cartSummary($request), [
            'message' => 'Line removed.',
        ]);
    }

    private function cartSummary(Request $request, array $warnings = []): array
    {
        $items = $this->shoppingCartService->itemsCollectionForUser($request->user())
            ->map(function ($item) {
                return [
                    'id' => $item->product_id,
                    'product_id' => $item->product_id,
                    'quantity' => (int) $item->quantity,
                    'unit_price' => round((float) $item->product->price, 2),
                    'subtotal' => round((float) $item->product->price * (int) $item->quantity, 2),
                    'product' => $this->catalogPresenter->productCard($item->product),
                ];
            })
            ->values();

        $subtotal = round($items->sum('subtotal'), 2);

        return [
            'currency' => 'USD',
            'items_count' => $items->sum('quantity'),
            'subtotal' => $subtotal,
            'discount' => 0.0,
            'shipping' => 0.0,
            'total' => $subtotal,
            'coupon' => null,
            'shipping_method' => null,
            'shipping_options' => [],
            'items' => $items->all(),
            'warnings' => $warnings,
        ];
    }
}
