<?php

namespace App\Http\Controllers\Api\MobileV1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Services\Mobile\MobileApiException;
use App\Services\Mobile\MobileCheckoutService;
use Illuminate\Http\Request;

class CheckoutController extends Controller
{
    use RespondsWithApi;

    public function __construct(
        private readonly MobileCheckoutService $checkoutService,
    ) {
    }

    public function quote(Request $request)
    {
        return $this->success($this->validatedQuote($request)['quote']);
    }

    public function coupon(Request $request)
    {
        return $this->success($this->validatedQuote($request)['quote'], ['message' => 'Coupon applied.']);
    }

    public function shipping(Request $request)
    {
        return $this->success($this->validatedQuote($request)['quote'], ['message' => 'Shipping updated.']);
    }

    public function paymentSession(Request $request, string $provider)
    {
        $data = $this->validateCheckoutRequest($request);
        $mobileReturn = $request->validate([
            'mobile_return.success_url' => ['required', 'url'],
            'mobile_return.cancel_url' => ['required', 'url'],
            'mobile_return.fallback_success_url' => ['nullable', 'url'],
            'mobile_return.fallback_cancel_url' => ['nullable', 'url'],
        ])['mobile_return'];

        $result = $this->checkoutService->createPaymentSession(
            $request->user(),
            $data['cart']['items'],
            (int) $data['address_id'],
            $data['coupon_code'] ?? null,
            $data['shipping_method'] ?? 'standard',
            $provider,
            $mobileReturn
        );

        return $this->success($result, ['message' => 'Payment session created.'], 201);
    }

    public function paymentReturn(Request $request, string $provider)
    {
        $contextId = (string) $request->query('context', '');
        $result = $this->checkoutService->handleReturn($provider, $contextId, $request->query());

        return redirect()->away($result['return_url']);
    }

    public function paymentCancel(Request $request, string $provider)
    {
        $contextId = (string) $request->query('context', '');

        return redirect()->away($this->checkoutService->cancelReturnUrl($provider, $contextId));
    }

    private function validatedQuote(Request $request): array
    {
        $data = $this->validateCheckoutRequest($request);

        return $this->checkoutService->quote(
            $request->user(),
            $data['cart']['items'],
            (int) $data['address_id'],
            $data['coupon_code'] ?? null,
            $data['shipping_method'] ?? 'standard'
        );
    }

    private function validateCheckoutRequest(Request $request): array
    {
        return $request->validate([
            'cart.items' => ['required', 'array', 'min:1'],
            'cart.items.*.product_id' => ['required', 'integer'],
            'cart.items.*.quantity' => ['required', 'integer', 'min:1'],
            'address_id' => ['required', 'integer'],
            'coupon_code' => ['nullable', 'string', 'max:40'],
            'shipping_method' => ['nullable', 'string'],
        ]);
    }
}
