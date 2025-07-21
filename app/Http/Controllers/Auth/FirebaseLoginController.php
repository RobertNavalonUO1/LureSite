<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Kreait\Firebase\Factory;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Illuminate\Support\Facades\Session;

class FirebaseLoginController extends Controller
{
    /**
     * Autenticación Firebase para la web (login persistente).
     */
    public function handle(Request $request)
    {
        $idToken = $request->input('id_token');

        if (!$idToken) {
            Log::warning('❌ ID token no recibido en la solicitud');
            return redirect('/login')->with('error', 'No se recibió token de Firebase.');
        }

        try {
            $auth = (new Factory)
                ->withServiceAccount(storage_path('app/firebase/firebase_credentials.json'))
                ->createAuth();

            // ✅ 1. Verificar token
            $verifiedToken = $auth->verifyIdToken($idToken);
            $uid = $verifiedToken->claims()->get('sub');

            // ✅ 2. Obtener usuario desde Firebase
            $firebaseUser = $auth->getUser($uid);

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

            return redirect('/login')->with('error', 'Error al validar con Firebase. Intenta nuevamente.');
        }
    }

    /**
     * Autenticación Firebase para apps móviles con Sanctum.
     */
    public function handleMobile(Request $request)
    {
        $idToken = $request->input('id_token');

        try {
            $auth = (new Factory)
                ->withServiceAccount(storage_path('app/firebase/firebase_credentials.json'))
                ->createAuth();

            $verifiedToken = $auth->verifyIdToken($idToken);
            $uid = $verifiedToken->claims()->get('sub');
            $firebaseUser = $auth->getUser($uid);

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
