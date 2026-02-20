<?php

namespace App\Services;

use Illuminate\Support\Facades\Log;
use Kreait\Firebase\Auth;
use Kreait\Firebase\Factory;
use Kreait\Firebase\Http\HttpClientOptions;

class FirebaseAuthService
{
	/**
	 * Crea el cliente Auth de Firebase con opciones HTTP (CA bundle / verify).
	 */
	public function auth(): Auth
	{
		$factory = (new Factory)
			->withServiceAccount(storage_path('app/firebase/firebase_credentials.json'));

		$httpOptions = HttpClientOptions::default();

		$verify = $this->resolveVerifyOption();
		if ($verify !== null) {
			$httpOptions = $httpOptions->withGuzzleConfigOption('verify', $verify);
		}

		Log::debug('🔐 Firebase HTTP verify config', [
			'verify' => $verify,
			'env_FIREBASE_CA_BUNDLE' => env('FIREBASE_CA_BUNDLE'),
			'env_FIREBASE_HTTP_VERIFY' => env('FIREBASE_HTTP_VERIFY'),
			'ini_curl.cainfo' => ini_get('curl.cainfo'),
			'ini_openssl.cafile' => ini_get('openssl.cafile'),
		]);

		return $factory
			->withHttpClientOptions($httpOptions)
			->createAuth();
	}

	/**
	 * Verifica un ID token y devuelve el UserRecord.
	 *
	 * @return array{uid: string, user: \Kreait\Firebase\Auth\UserRecord}
	 */
	public function verifyIdTokenAndGetUser(string $idToken): array
	{
		$auth = $this->auth();

		$verifiedToken = $auth->verifyIdToken($idToken);
		$uid = (string) $verifiedToken->claims()->get('sub');
		$firebaseUser = $auth->getUser($uid);

		return [
			'uid' => $uid,
			'user' => $firebaseUser,
		];
	}

	/**
	 * Resuelve el valor para Guzzle `verify`.
	 * - `false` desactiva verificación SSL (solo dev)
	 * - `string` ruta CA bundle
	 * - `null` deja default de Guzzle
	 *
	 * @return bool|string|null
	 */
	private function resolveVerifyOption()
	{
		$rawVerify = env('FIREBASE_HTTP_VERIFY');
		if ($rawVerify !== null) {
			$normalized = strtolower(trim((string) $rawVerify));
			if (in_array($normalized, ['0', 'false', 'no', 'off'], true)) {
				return false;
			}
		}

		$envBundle = env('FIREBASE_CA_BUNDLE');
		if (is_string($envBundle) && $envBundle !== '' && is_file($envBundle)) {
			return $envBundle;
		}

		$iniCurl = ini_get('curl.cainfo');
		if (is_string($iniCurl) && $iniCurl !== '' && is_file($iniCurl)) {
			return $iniCurl;
		}

		$iniOpenSsl = ini_get('openssl.cafile');
		if (is_string($iniOpenSsl) && $iniOpenSsl !== '' && is_file($iniOpenSsl)) {
			return $iniOpenSsl;
		}

		return null;
	}
}
