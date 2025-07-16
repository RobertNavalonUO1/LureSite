<?php

namespace App\Http\Middleware;

use Closure;
use Illuminate\Http\Request;
use App\Services\FirebaseAuthService;

class FirebaseAuth
{
    protected FirebaseAuthService $firebase;

    public function __construct(FirebaseAuthService $firebase)
    {
        $this->firebase = $firebase;
    }

    public function handle(Request $request, Closure $next)
    {
        // 🔐 1. Obtener ID token
        $idToken = $request->bearerToken();

        if (!$idToken) {
            return $this->unauthorizedResponse($request, 'Token no proporcionado');
        }

        // 🔐 2. Validar y obtener usuario
        $user = $this->firebase->verifyAndGetUser($idToken);
        if (!$user) {
            return $this->unauthorizedResponse($request, 'Token inválido');
        }

        // 🔐 3. Iniciar sesión localmente
        auth()->login($user);

        // 🔐 4. Verificación de correo electrónico (desde Firebase)
        $firebaseUser = $this->firebase->getFirebaseUserFromToken($idToken);

        if (!$firebaseUser || !$firebaseUser->emailVerified) {
            return $this->emailNotVerifiedResponse($request);
        }

        return $next($request);
    }

    /**
     * Respuesta en caso de token no válido.
     */
    protected function unauthorizedResponse(Request $request, string $message)
    {
        return $request->expectsJson() || $request->is('api/*')
            ? response()->json(['error' => $message], 401)
            : redirect()->route('login')->withErrors(['auth' => $message]);
    }

    /**
     * Respuesta en caso de email no verificado.
     */
    protected function emailNotVerifiedResponse(Request $request)
    {
        return $request->expectsJson() || $request->is('api/*')
            ? response()->json(['error' => 'Correo no verificado'], 403)
            : redirect()->route('verification.notice');
    }
}
