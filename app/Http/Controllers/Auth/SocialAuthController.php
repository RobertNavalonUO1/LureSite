<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ShoppingCartService;
use Illuminate\Support\Facades\Cache;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Illuminate\Support\Arr;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];
    private const DEFAULT_MOBILE_CALLBACK = 'limoneo://auth/complete';
    private const FALLBACK_MOBILE_CALLBACK = 'https://limoneo.com/app/auth/complete';

    public function __construct(
        private readonly ShoppingCartService $shoppingCartService,
    ) {
    }

    private function normalizeProvider(string $provider): string
    {
        return strtolower(trim($provider));
    }

    private function ensureProvider(string $provider): string
    {
        $provider = $this->normalizeProvider($provider);

        abort_unless(in_array($provider, self::PROVIDERS, true), 404);

        return $provider;
    }

    public function redirect(string $provider)
    {
        $provider = $this->ensureProvider($provider);

        $driver = Socialite::driver($provider);

        if ($provider === 'facebook') {
            $driver = $driver
                ->scopes(['email'])
                ->fields(['name', 'email']);
        }

        return $driver->redirect();
    }

    public function mobileRedirect(Request $request, string $provider)
    {
        $provider = $this->ensureProvider($provider);

        $callbackUrl = $this->resolveMobileCallback($request->string('callback')->toString());
        $request->session()->put('mobile_auth_callback', $callbackUrl);

        $driver = Socialite::driver($provider)
            ->redirectUrl(route('auth.social.mobile.callback', ['provider' => $provider]));

        if ($provider === 'facebook') {
            $driver = $driver
                ->scopes(['email'])
                ->fields(['name', 'email']);
        }

        return $driver->redirect();
    }

    public function callback(Request $request, string $provider)
    {
        $provider = $this->ensureProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable $exception) {
            report($exception);

            return redirect('/login')->with('error', 'No se pudo iniciar sesion. Intenta nuevamente.');
        }

        $email = $socialUser->getEmail();
        if (! $email) {
            return redirect('/login')->with('error', 'El proveedor no devolvio un email. Revisa permisos de la app.');
        }

        $user = $this->upsertSocialUser($provider, $socialUser->getId(), $email, $socialUser->getName() ?: $socialUser->getNickname(), $socialUser->getAvatar());

        auth()->login($user, true);
        $request->session()->regenerate();
        $this->shoppingCartService->mergeSessionIntoUserCart($request, $user);

        return redirect('/')->with('success', 'Sesion iniciada correctamente');
    }

    public function mobileCallback(Request $request, string $provider)
    {
        $provider = $this->ensureProvider($provider);
        $callbackUrl = $this->resolveMobileCallback((string) $request->session()->pull('mobile_auth_callback', self::DEFAULT_MOBILE_CALLBACK));

        try {
            $socialUser = Socialite::driver($provider)
                ->redirectUrl(route('auth.social.mobile.callback', ['provider' => $provider]))
                ->user();
        } catch (\Throwable $exception) {
            report($exception);

            return redirect()->away($this->appendQuery($callbackUrl, [
                'status' => 'error',
                'provider' => $provider,
                'code' => 'social_auth_failed',
            ]));
        }

        $email = $socialUser->getEmail();
        if (! $email) {
            return redirect()->away($this->appendQuery($callbackUrl, [
                'status' => 'error',
                'provider' => $provider,
                'code' => 'email_required',
            ]));
        }

        $user = $this->upsertSocialUser(
            provider: $provider,
            providerId: (string) $socialUser->getId(),
            email: $email,
            name: $socialUser->getName() ?: $socialUser->getNickname(),
            avatar: $socialUser->getAvatar(),
        );

        $token = $user->createToken('android-social')->plainTextToken;

        return redirect()->away($this->appendQuery($callbackUrl, [
            'status' => 'success',
            'provider' => $provider,
            'token' => $token,
        ]));
    }

    public function facebookDataDeletion(Request $request)
    {
        $status = $this->processFacebookSignedRequest((string) $request->input('signed_request', ''), 'Deletion request received.');

        return response()->json([
            'url' => route('auth.social.facebook.data-deletion.status', ['confirmationCode' => $status['confirmation_code']]),
            'confirmation_code' => $status['confirmation_code'],
        ]);
    }

    public function facebookDeauthorize(Request $request)
    {
        $status = $this->processFacebookSignedRequest((string) $request->input('signed_request', ''), 'Deauthorization request received.');

        return response()->json([
            'success' => true,
            'confirmation_code' => $status['confirmation_code'],
            'status_url' => route('auth.social.facebook.data-deletion.status', ['confirmationCode' => $status['confirmation_code']]),
        ]);
    }

    public function facebookDataDeletionStatus(string $confirmationCode)
    {
        $status = Cache::get($this->facebookDeletionStatusKey($confirmationCode));

        abort_unless($status, 404);

        return response()->json([
            'data' => $status,
            'meta' => new \stdClass(),
        ]);
    }

    private function upsertSocialUser(
        string $provider,
        string $providerId,
        string $email,
        ?string $name,
        ?string $avatar,
    ): User {
        $user = User::where('email', $email)->first();
        if (! $user) {
            $user = new User();
            $user->email = $email;
            $user->password = Hash::make(Str::random(32));
        }

        if ($name) {
            $user->name = $user->name ?: $name;
        }

        if ($avatar) {
            $user->photo_url = $this->normalizeAvatarUrl($avatar);
        }

        $user->oauth_provider = $provider;
        $user->oauth_provider_id = $providerId;
        $user->save();

        return $user;
    }

    private function resolveMobileCallback(?string $callbackUrl): string
    {
        $candidate = trim((string) $callbackUrl);

        if ($candidate === '') {
            return self::DEFAULT_MOBILE_CALLBACK;
        }

        return in_array($candidate, [self::DEFAULT_MOBILE_CALLBACK, self::FALLBACK_MOBILE_CALLBACK], true)
            ? $candidate
            : self::DEFAULT_MOBILE_CALLBACK;
    }

    private function appendQuery(string $baseUrl, array $query): string
    {
        $separator = str_contains($baseUrl, '?') ? '&' : '?';

        return $baseUrl.$separator.http_build_query(array_filter($query, fn ($value) => $value !== null && $value !== ''));
    }

    private function processFacebookSignedRequest(string $signedRequest, string $initialMessage): array
    {
        $payload = $this->decodeFacebookSignedRequest($signedRequest);
        $providerUserId = (string) ($payload['user_id'] ?? '');
        $confirmationCode = (string) Str::uuid();

        $status = [
            'confirmation_code' => $confirmationCode,
            'provider' => 'facebook',
            'provider_user_id' => $providerUserId !== '' ? $providerUserId : null,
            'status' => 'accepted',
            'message' => $initialMessage,
            'received_at' => now()->toIso8601String(),
        ];

        if ($providerUserId !== '') {
            $user = User::query()
                ->where('oauth_provider', 'facebook')
                ->where('oauth_provider_id', $providerUserId)
                ->first();

            if ($user) {
                $user->forceFill([
                    'oauth_provider' => null,
                    'oauth_provider_id' => null,
                ])->save();

                $user->tokens()->delete();

                $status['status'] = 'completed';
                $status['message'] = 'Facebook access data removed successfully.';
                $status['deleted_user_id'] = $user->id;
            } else {
                $status['status'] = 'not_found';
                $status['message'] = 'No linked Facebook account was found for this request.';
            }
        }

        Cache::put($this->facebookDeletionStatusKey($confirmationCode), $status, now()->addDays(30));

        return $status;
    }

    private function normalizeAvatarUrl(?string $avatar): ?string
    {
        $avatar = trim((string) $avatar);

        if ($avatar === '') {
            return null;
        }

        if (strlen($avatar) <= 255) {
            return $avatar;
        }

        $parsed = parse_url($avatar);
        if (! is_array($parsed)) {
            return null;
        }

        $baseAvatar = Arr::get($parsed, 'scheme') && Arr::get($parsed, 'host')
            ? Arr::get($parsed, 'scheme').'://'.Arr::get($parsed, 'host').Arr::get($parsed, 'path', '')
            : null;

        return is_string($baseAvatar) && strlen($baseAvatar) <= 255
            ? $baseAvatar
            : null;
    }

    private function decodeFacebookSignedRequest(string $signedRequest): array
    {
        abort_if($signedRequest === '', 422, 'signed_request is required.');

        $parts = explode('.', $signedRequest, 2);
        abort_if(count($parts) !== 2, 422, 'Invalid signed_request format.');

        [$encodedSignature, $encodedPayload] = $parts;

        $payloadJson = $this->base64UrlDecode($encodedPayload);
        $payload = json_decode($payloadJson, true);

        abort_unless(is_array($payload), 422, 'Invalid signed_request payload.');
        abort_unless(($payload['algorithm'] ?? null) === 'HMAC-SHA256', 422, 'Unsupported signed_request algorithm.');

        $secret = (string) config('services.facebook.client_secret');
        abort_if($secret === '', 500, 'Facebook client secret is not configured.');

        $expectedSignature = hash_hmac('sha256', $encodedPayload, $secret, true);
        $signature = $this->base64UrlDecode($encodedSignature);

        abort_unless(hash_equals($expectedSignature, $signature), 422, 'Invalid signed_request signature.');

        return $payload;
    }

    private function base64UrlDecode(string $value): string
    {
        $normalized = strtr($value, '-_', '+/');
        $padding = strlen($normalized) % 4;

        if ($padding > 0) {
            $normalized .= str_repeat('=', 4 - $padding);
        }

        return base64_decode($normalized, true) ?: '';
    }

    private function facebookDeletionStatusKey(string $confirmationCode): string
    {
        return 'facebook-data-deletion:'.$confirmationCode;
    }
}
