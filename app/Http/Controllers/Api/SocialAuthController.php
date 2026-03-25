<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ProfileService;
use App\Services\ShoppingCartService;
use Illuminate\Http\Request;
use Illuminate\Support\Carbon;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    use RespondsWithApi;

    private const PROVIDERS = ['google', 'facebook'];

    public function __construct(
        private readonly ProfileService $profileService,
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

    public function exchange(Request $request)
    {
        $validated = $request->validate([
            'provider' => ['required', 'string'],
            'access_token' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
            'cart' => ['sometimes', 'array'],
            'cart.items' => ['sometimes', 'array'],
            'cart.items.*.product_id' => ['required', 'integer'],
            'cart.items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $provider = $this->ensureProvider($validated['provider']);

        try {
            $socialUser = Socialite::driver($provider)
                ->stateless()
                ->userFromToken($validated['access_token']);
        } catch (\Throwable $exception) {
            report($exception);

            return $this->error('Invalid social token.', 'invalid_social_token', 401);
        }

        $email = $socialUser->getEmail();
        if (! $email) {
            return response()->json([
                'message' => 'The social provider did not return an email.',
                'errors' => [
                    'email' => ['The social provider did not return an email.'],
                ],
            ], 422);
        }

        $user = User::where('email', $email)->first();
        if (! $user) {
            $user = new User();
            $user->email = $email;
            $user->password = Hash::make(Str::random(32));
        }

        $name = $socialUser->getName() ?: $socialUser->getNickname();
        if ($name) {
            $user->name = $user->name ?: $name;
        }

        $avatar = $socialUser->getAvatar();
        if ($avatar) {
            $user->photo_url = $avatar;
        }

        $user->oauth_provider = $provider;
        $user->oauth_provider_id = (string) $socialUser->getId();
        $user->email_verified_at = $user->email_verified_at ?: Carbon::now();
        $user->save();

        $warnings = $this->shoppingCartService->mergeSnapshot($user, $validated['cart']['items'] ?? []);
        $token = $user->createToken($validated['device_name'] ?? 'android')->plainTextToken;

        return $this->success([
            'token' => $token,
            'user' => $this->profileService->serializeUser($user->fresh()),
        ], [
            'provider' => $provider,
            'merge_warnings' => $warnings,
        ]);
    }
}
