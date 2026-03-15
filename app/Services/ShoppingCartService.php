<?php

namespace App\Services;

use App\Models\CartItem;
use App\Models\Product;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Collection;

class ShoppingCartService
{
    public function itemsForRequest(Request $request): array
    {
        $user = $request->user();

        return $user
            ? $this->webItemsFromUser($user)
            : $this->webItemsFromSession($request);
    }

    public function add(Request $request, int $productId, int $quantity = 1): array
    {
        $quantity = max(1, $quantity);

        if ($user = $request->user()) {
            $product = Product::findOrFail($productId);
            $item = CartItem::firstOrNew([
                'user_id' => $user->id,
                'product_id' => $product->id,
            ]);
            $item->quantity = ($item->exists ? $item->quantity : 0) + $quantity;
            $item->save();

            return $this->webItemsFromUser($user->fresh());
        }

        $product = Product::findOrFail($productId);
        $cart = $request->session()->get('cart', []);

        if (isset($cart[$productId])) {
            $cart[$productId]['quantity'] += $quantity;
        } else {
            $cart[$productId] = $this->webItemPayload($product, $quantity);
        }

        $request->session()->put('cart', $cart);

        return $cart;
    }

    public function setQuantity(Request $request, int $productId, int $quantity): array
    {
        if ($quantity <= 0) {
            return $this->remove($request, $productId);
        }

        if ($user = $request->user()) {
            $product = Product::findOrFail($productId);
            CartItem::updateOrCreate(
                ['user_id' => $user->id, 'product_id' => $product->id],
                ['quantity' => $quantity],
            );

            return $this->webItemsFromUser($user->fresh());
        }

        $cart = $request->session()->get('cart', []);
        if (!isset($cart[$productId])) {
            $product = Product::findOrFail($productId);
            $cart[$productId] = $this->webItemPayload($product, $quantity);
        } else {
            $cart[$productId]['quantity'] = $quantity;
        }

        $request->session()->put('cart', $cart);

        return $cart;
    }

    public function remove(Request $request, int $productId): array
    {
        if ($user = $request->user()) {
            CartItem::query()
                ->where('user_id', $user->id)
                ->where('product_id', $productId)
                ->delete();

            return $this->webItemsFromUser($user->fresh());
        }

        $cart = $request->session()->get('cart', []);
        unset($cart[$productId]);
        $request->session()->put('cart', $cart);

        return $cart;
    }

    public function summaryForRequest(Request $request): array
    {
        $cartItems = $this->itemsForRequest($request);

        return [
            'cartItems' => array_values($cartItems),
            'cartCount' => array_sum(array_column($cartItems, 'quantity')),
            'total' => number_format(collect($cartItems)->sum(fn ($item) => $item['price'] * $item['quantity']), 2),
        ];
    }

    public function mergeSessionIntoUserCart(Request $request, User $user): void
    {
        $sessionCart = $request->session()->get('cart', []);
        if ($sessionCart === []) {
            return;
        }

        $snapshot = collect($sessionCart)
            ->map(fn ($item, $productId) => [
                'product_id' => (int) ($item['id'] ?? $productId),
                'quantity' => (int) ($item['quantity'] ?? 0),
            ])
            ->filter(fn ($item) => $item['quantity'] > 0)
            ->values()
            ->all();

        $this->mergeSnapshot($user, $snapshot);
        $request->session()->forget('cart');
    }

    public function mergeSnapshot(User $user, array $snapshot): array
    {
        $normalized = $this->normalizeSnapshot($snapshot);
        $warnings = [];

        foreach ($normalized as $productId => $quantity) {
            $product = Product::find($productId);
            if (!$product) {
                $warnings[] = [
                    'code' => 'product_not_found',
                    'message' => "Product {$productId} was removed because it no longer exists.",
                    'product_id' => $productId,
                ];
                continue;
            }

            $finalQuantity = min($quantity, max(0, (int) $product->stock));

            if ($finalQuantity <= 0) {
                $warnings[] = [
                    'code' => 'product_out_of_stock',
                    'message' => "Product {$productId} was removed because it is out of stock.",
                    'product_id' => $productId,
                ];
                continue;
            }

            if ($finalQuantity !== $quantity) {
                $warnings[] = [
                    'code' => 'quantity_clamped',
                    'message' => "Quantity for product {$productId} was reduced to available stock.",
                    'product_id' => $productId,
                ];
            }

            $item = CartItem::firstOrNew([
                'user_id' => $user->id,
                'product_id' => $productId,
            ]);

            $item->quantity = ($item->exists ? $item->quantity : 0) + $finalQuantity;
            $item->save();
        }

        return $warnings;
    }

    public function replaceWithSnapshot(User $user, array $snapshot): array
    {
        CartItem::query()->where('user_id', $user->id)->delete();

        return $this->mergeSnapshot($user, $snapshot);
    }

    public function clearUserCart(User $user): void
    {
        CartItem::query()->where('user_id', $user->id)->delete();
    }

    public function quantitiesForUser(User $user): array
    {
        return CartItem::query()
            ->where('user_id', $user->id)
            ->pluck('quantity', 'product_id')
            ->map(fn ($quantity) => (int) $quantity)
            ->all();
    }

    public function itemsCollectionForUser(User $user): Collection
    {
        return CartItem::query()
            ->with(['product.category'])
            ->where('user_id', $user->id)
            ->get();
    }

    public function normalizeSnapshot(array $snapshot): array
    {
        return collect($snapshot)
            ->map(function ($item) {
                if (!is_array($item)) {
                    return null;
                }

                $productId = (int) ($item['product_id'] ?? 0);
                $quantity = (int) ($item['quantity'] ?? 0);

                if ($productId <= 0 || $quantity <= 0) {
                    return null;
                }

                return [
                    'product_id' => $productId,
                    'quantity' => $quantity,
                ];
            })
            ->filter()
            ->groupBy('product_id')
            ->map(fn (Collection $rows) => $rows->sum('quantity'))
            ->all();
    }

    private function webItemsFromUser(User $user): array
    {
        return $this->itemsCollectionForUser($user)
            ->mapWithKeys(fn (CartItem $item) => [
                $item->product_id => $this->webItemPayload($item->product, (int) $item->quantity),
            ])
            ->all();
    }

    private function webItemsFromSession(Request $request): array
    {
        return $request->session()->get('cart', []);
    }

    private function webItemPayload(Product $product, int $quantity): array
    {
        return [
            'id' => $product->id,
            'title' => $product->name,
            'price' => (float) $product->price,
            'image_url' => $product->image_url ?? '/default-image.jpg',
            'quantity' => $quantity,
        ];
    }
}
