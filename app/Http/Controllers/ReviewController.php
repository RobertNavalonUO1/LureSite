<?php

namespace App\Http\Controllers;

use App\Models\Review;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;

class ReviewController extends Controller
{
    public function index($productId)
    {
        $reviews = Review::where('product_id', $productId)->latest()->get();
        return response()->json($reviews);
    }

    public function store(Request $request, $productId)
    {
        $data = $request->validate([
            'rating' => 'required|integer|min:1|max:5',
            'comment' => 'required|string|max:1000',
        ]);

        $review = Review::create([
            'product_id' => $productId,
            'user_id' => Auth::id(),
            'author' => Auth::user()->name ?? 'Anónimo',
            'rating' => $data['rating'],
            'comment' => $data['comment'],
        ]);

        return response()->json($review, 201);
    }
}