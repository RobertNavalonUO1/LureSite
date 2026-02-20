<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Services\FirebaseAuthService;
use App\Models\User;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;

class FirebaseLoginController extends Controller
{
    /**
     * Autenticación Firebase para la web (login persistente).
     */
    public function handle(Request $request, FirebaseAuthService $firebase)
    {
        $idToken = $request->input('id_token');

        if (!$idToken) {
            Log::warning('❌ ID token no recibido en la solicitud');
            return redirect('/login')->with('error', 'No se recibió token de Firebase.');
        }

        try {
            $result = $firebase->verifyIdTokenAndGetUser($idToken);
            $firebaseUser = $result['user'];

            if (!$firebaseUser->email) {
                Log::error('❌ Firebase user no tiene email');
                return redirect('/login')->with('error', 'No se pudo recuperar el email del usuario.');
            }

            Log::info('✅ Usuario Firebase autenticado', [
                'uid' => $firebaseUser->uid,
                'email' => $firebaseUser->email,
                'name' => $firebaseUser->displayName,
            ]);

            // ✅ 3. Crear o actualizar usuario en base de datos
            $user = User::updateOrCreate(
                ['email' => $firebaseUser->email],
                [
                    'firebase_uid' => $firebaseUser->uid,
                    'name' => $firebaseUser->displayName ?? 'Usuario',
                    'photo_url' => $firebaseUser->photoUrl ?? null,
                    'password' => Hash::make(Str::random(32)), // aleatoria
                ]
            );

            // ✅ 4. Iniciar sesión en Laravel (recordar sesión)
            auth()->login($user, true); // <- `true` asegura persistencia

            // ✅ 4.1 Regenerar sesión (mismo patrón que el login tradicional)
            $request->session()->regenerate();

            Log::info('✅ Usuario autenticado en Laravel', [
                'user_id' => $user->id,
                'session_id' => session()->getId(),
                'session_data' => session()->all(),
            ]);

            return redirect('/')->with('success', 'Sesión iniciada correctamente');

        } catch (\Throwable $e) {
            report($e);
            Log::error('❌ Error al autenticar con Firebase', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            $message = 'Error al validar con Firebase. Intenta nuevamente.';
            $lower = strtolower($e->getMessage());
            if (str_contains($lower, 'curl error 60') || str_contains($lower, 'unable to get local issuer certificate')) {
                $message = 'Error SSL al validar Firebase (cURL 60). Revisa el CA bundle de PHP/Apache.';
            } elseif (str_contains($lower, 'expired') || str_contains($lower, 'token has expired')) {
                $message = 'Tu sesión con Google expiró. Vuelve a iniciar sesión.';
            } elseif (str_contains($lower, 'invalid') || str_contains($lower, 'token')) {
                $message = 'Token inválido. Vuelve a iniciar sesión con Google.';
            }

            return redirect('/login')->with('error', $message);
        }
    }

    /**
     * Autenticación Firebase para apps móviles con Sanctum.
     */
    public function handleMobile(Request $request, FirebaseAuthService $firebase)
    {
        $idToken = $request->input('id_token');

        try {
            $result = $firebase->verifyIdTokenAndGetUser($idToken);
            $firebaseUser = $result['user'];

            $user = User::updateOrCreate(
                ['email' => $firebaseUser->email],
                [
                    'firebase_uid' => $firebaseUser->uid,
                    'name' => $firebaseUser->displayName ?? 'Usuario',
                    'photo_url' => $firebaseUser->photoUrl ?? null,
                    'password' => Hash::make(Str::random(32)),
                ]
            );

            $token = $user->createToken('mobile')->plainTextToken;

            return response()->json([
                'token' => $token,
                'user' => $user,
            ]);

        } catch (\Throwable $e) {
            report($e);
            Log::error('❌ Error en autenticación móvil Firebase', [
                'message' => $e->getMessage(),
                'trace' => $e->getTraceAsString(),
            ]);

            return response()->json(['error' => 'Token inválido'], 401);
        }
    }
}
