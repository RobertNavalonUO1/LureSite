<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\Request;
use Kreait\Firebase\Factory;
use App\Models\User;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;

class FirebaseLoginController extends Controller
{
    /**
     * Autenticación Firebase para WEB (cookies + redirect + flash).
     */
    public function handle(Request $request)
    {
        $idToken = $request->input('id_token');

        $auth = (new Factory)
            ->withServiceAccount(storage_path('app/firebase/firebase_credentials.json'))
            ->createAuth();

        try {
            $verifiedToken = $auth->verifyIdToken($idToken);
            $firebaseUser = $auth->getUser($verifiedToken->claims()->get('sub'));

            $user = User::updateOrCreate(
                ['email' => $firebaseUser->email],
                [
                    'firebase_uid' => $firebaseUser->uid,
                    'name' => $firebaseUser->displayName ?? 'Usuario',
                    'photo_url' => $firebaseUser->photoUrl ?? null,
                    'password' => Hash::make(Str::random(32)),
                ]
            );

            auth()->login($user);

            return redirect('/')->with([
                'success' => 'Sesión iniciada correctamente',
                'avatar' => $user->photo_url,
                'email' => $user->email,
            ]);

        } catch (\Throwable $e) {
            return redirect('/')->with('firebase_error', 'Error al validar con Firebase. Intenta nuevamente.');
        }
    }

    /**
     * Autenticación Firebase para APP (token con Sanctum).
     */
    public function handleMobile(Request $request)
    {
        $idToken = $request->input('id_token');

        $auth = (new Factory)
            ->withServiceAccount(storage_path('app/firebase/firebase_credentials.json'))
            ->createAuth();

        try {
            $verifiedToken = $auth->verifyIdToken($idToken);
            $firebaseUser = $auth->getUser($verifiedToken->claims()->get('sub'));

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
            return response()->json(['error' => 'Token inválido'], 401);
        }
    }
}
