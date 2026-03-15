<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\User;
use App\Services\ShoppingCartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

class SocialAuthController extends Controller
{
    private const PROVIDERS = ['google', 'facebook'];

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

        return Socialite::driver($provider)->redirect();
    }

    public function callback(Request $request, string $provider)
    {
        $provider = $this->ensureProvider($provider);

        try {
            $socialUser = Socialite::driver($provider)->user();
        } catch (\Throwable $exception) {
            report($exception);

            return redirect('/login')->with('error', 'No se pudo iniciar sesiÃ³n. Intenta nuevamente.');
        }

        $email = $socialUser->getEmail();
        if (! $email) {
            return redirect('/login')->with('error', 'El proveedor no devolviÃ³ un email. Revisa permisos de la app.');
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
        $user->save();

        auth()->login($user, true);
        $request->session()->regenerate();
        $this->shoppingCartService->mergeSessionIntoUserCart($request, $user);

        return redirect('/')->with('success', 'SesiÃ³n iniciada correctamente');
    }
}
