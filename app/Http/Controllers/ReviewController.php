<?php

namespace App\Http\Controllers;

use App\Models\Review;
use App\Models\Product;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function index($productId)
    {
        $reviews = Review::with('user')
            ->where('product_id', $productId)
            ->latest()
            ->get()
            ->map(function ($r) {
                return [
                    'id' => $r->id,
                    'author' => $r->user?->name ?? $r->author ?? 'Anónimo',
                    'rating' => $r->rating,
                    'comment' => $r->comment,
                    'created_at' => $r->created_at,
                ];
            });

        return response()->json($reviews);
    }

    public function store(Request $request, $productId)
    {
        $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        $product = Product::findOrFail($productId);

        // 🔒 Validar si ya existe reseña del usuario
        $existing = Review::where('product_id', $productId)
            ->where('user_id', Auth::id())
            ->first();

        if ($existing) {
            // Si ya existe, la actualizamos
            $existing->update([
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);
            $review = $existing;
        } else {
            // Si no existe, la creamos
            $review = Review::create([
                'product_id' => $productId,
                'user_id' => Auth::id(),
                'rating' => $request->rating,
                'comment' => $request->comment,
            ]);
        }

        // 🔄 Recalcular promedio
        $avg = Review::where('product_id', $productId)->avg('rating');
        $product->update(['average_rating' => $avg]);

        return response()->json([
            'id' => $review->id,
            'author' => $review->user->name,
            'rating' => $review->rating,
            'comment' => $review->comment,
            'created_at' => $review->created_at,
            'average_rating' => $product->average_rating
        ]);
    }
}