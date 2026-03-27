<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Services\Mobile\MobileCheckoutService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class PaymentsWebhookController extends Controller
{
    public function __construct(
        private readonly MobileCheckoutService $checkoutService,
    ) {
    }

    public function stripe(Request $request): JsonResponse
    {
        $this->checkoutService->handleStripeWebhook($request);

        return response()->json(['received' => true]);
    }

    public function paypal(Request $request): JsonResponse
    {
        $this->checkoutService->handlePaypalWebhook($request);

        return response()->json(['received' => true]);
    }
}