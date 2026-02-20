<?php

namespace App\Http\Controllers;

use App\Models\Product;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class SpecialPagesController extends Controller
{
    public function dealsToday()
    {
        $products = Product::where('is_offer', true)
            ->whereDate('offer_end', '>=', now())
            ->latest()
            ->get();

        return Inertia::render('Special/DealsToday', [
            'products' => $products
        ]);
    }

    public function superDeal()
    {
        $products = Product::where('super_deal', true)->get();

        return Inertia::render('Special/SuperDeal', [
            'products' => $products
        ]);
    }

    public function fastShipping()
    {
        $products = Product::where('fast_shipping', true)->get();

        return Inertia::render('Special/FastShipping', [
            'products' => $products
        ]);
    }

    public function newArrivals()
    {
        $products = Product::latest()->take(20)->get();

        return Inertia::render('Special/NewArrivals', [
            'products' => $products
        ]);
    }

    public function seasonal()
    {
        $season = now()->format('F'); // por ejemplo "June"
        $products = Product::where('season', $season)->get();

        return Inertia::render('Special/SeasonalProducts', [
            'products' => $products,
            'season' => $season
        ]);
    }
}
