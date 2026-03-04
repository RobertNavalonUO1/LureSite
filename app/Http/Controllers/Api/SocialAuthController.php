<?php

namespace App\Http\Controllers\Api;

use App\Http\Controllers\Controller;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];

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
        ]);

        $provider = $this->ensureProvider($validated['provider']);

        try {
            $socialUser = Socialite::driver($provider)
                ->stateless()
                ->userFromToken($validated['access_token']);
        } catch (\Throwable $e) {
            report($e);
            return response()->json(['error' => 'Token inválido'], 401);
        }

        $email = $socialUser->getEmail();
        if (!$email) {
            return response()->json(['error' => 'El proveedor no devolvió email'], 422);
        }

        $user = User::where('email', $email)->first();
        if (!$user) {
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

        $user->save();

        $token = $user->createToken('mobile')->plainTextToken;

        return response()->json([
            'token' => $token,
            'user' => $user,
        ]);
    }
}
