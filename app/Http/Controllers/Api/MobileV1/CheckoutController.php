<?php

namespace App\Http\Controllers\Api\MobileV1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Services\Mobile\MobileApiException;
use App\Services\Mobile\MobileCheckoutService;
use Illuminate\Http\Request;
use Illuminate\Validation\ValidationException;

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
        $mobileReturn = $this->validateMobileReturn($request);

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

    public function paymentStatus(Request $request, string $contextId)
    {
        return $this->success(
            $this->checkoutService->paymentStatus($request->user(), $contextId)
        );
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

    private function validateMobileReturn(Request $request): array
    {
        $mobileReturn = $request->validate([
            'mobile_return' => ['required', 'array'],
            'mobile_return.success_url' => ['required', 'string'],
            'mobile_return.cancel_url' => ['required', 'string'],
            'mobile_return.fallback_success_url' => ['nullable', 'string'],
            'mobile_return.fallback_cancel_url' => ['nullable', 'string'],
        ])['mobile_return'];

        $errors = [];

        foreach ([
            'success_url' => true,
            'cancel_url' => true,
            'fallback_success_url' => false,
            'fallback_cancel_url' => false,
        ] as $field => $required) {
            $value = $mobileReturn[$field] ?? null;

            if (! is_string($value) || trim($value) === '') {
                if ($required) {
                    $errors["mobile_return.{$field}"] = 'The mobile return URL is required.';
                }

                continue;
            }

            if (! $this->isSupportedReturnUrl($value)) {
                $errors["mobile_return.{$field}"] = 'The mobile return URL must be an absolute https URL or a valid app deep link.';
            }
        }

        if ($errors !== []) {
            throw ValidationException::withMessages($errors);
        }

        return $mobileReturn;
    }

    private function isSupportedReturnUrl(string $value): bool
    {
        $scheme = parse_url($value, PHP_URL_SCHEME);

        if (! is_string($scheme) || $scheme === '') {
            return false;
        }

        if (in_array(strtolower($scheme), ['http', 'https'], true)) {
            return filter_var($value, FILTER_VALIDATE_URL) !== false;
        }

        if (! preg_match('/^[a-z][a-z0-9+.-]*$/i', $scheme)) {
            return false;
        }

        $path = parse_url($value, PHP_URL_PATH);
        $host = parse_url($value, PHP_URL_HOST);

        return is_string($host) && $host !== ''
            && is_string($path) && $path !== '';
    }
}
