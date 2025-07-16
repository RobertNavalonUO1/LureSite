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

            $user = User::firstOrCreate(
                ['email' => $firebaseUser->email],
                [
                    'firebase_uid' => $firebaseUser->uid,
                    'name' => $firebaseUser->displayName ?? 'Usuario',
                    'password' => Hash::make(Str::random(32)),
                ]
            );

            auth()->login($user);

            return redirect('/')->with('success', 'Sesión iniciada correctamente');

        } catch (\Throwable $e) {
            return redirect('/login')->with('error', 'Error al validar con Firebase. Intenta nuevamente.');
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

            $user = User::firstOrCreate(
                ['email' => $firebaseUser->email],
                [
                    'firebase_uid' => $firebaseUser->uid,
                    'name' => $firebaseUser->displayName ?? 'Usuario',
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
