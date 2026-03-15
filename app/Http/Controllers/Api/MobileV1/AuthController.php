<?php

namespace App\Http\Controllers\Api\MobileV1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Http\Requests\ProfileUpdateRequest;
use App\Models\User;
use App\Services\ProfileService;
use App\Services\ShoppingCartService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;

class AuthController extends Controller
{
    use RespondsWithApi;

    public function __construct(
        private readonly ProfileService $profileService,
        private readonly ShoppingCartService $shoppingCartService,
    ) {
    }

    public function register(Request $request)
    {
        $data = $request->validate([
            'name' => ['required', 'string', 'max:255'],
            'lastname' => ['nullable', 'string', 'max:255'],
            'email' => ['required', 'email', 'max:255', 'unique:users,email'],
            'password' => ['required', 'string', 'min:6', 'confirmed'],
            'device_name' => ['nullable', 'string', 'max:100'],
            'cart' => ['sometimes', 'array'],
            'cart.items' => ['sometimes', 'array'],
            'cart.items.*.product_id' => ['required', 'integer'],
            'cart.items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $user = User::create([
            'name' => $data['name'],
            'lastname' => $data['lastname'] ?? null,
            'email' => $data['email'],
            'password' => Hash::make($data['password']),
        ]);

        $warnings = $this->shoppingCartService->mergeSnapshot($user, $data['cart']['items'] ?? []);
        $token = $user->createToken($data['device_name'] ?? 'android')->plainTextToken;

        return $this->success([
            'token' => $token,
            'user' => $this->profileService->serializeUser($user->fresh()),
        ], [
            'message' => 'Account created.',
            'merge_warnings' => $warnings,
        ], 201);
    }

    public function login(Request $request)
    {
        $data = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
            'device_name' => ['nullable', 'string', 'max:100'],
            'cart' => ['sometimes', 'array'],
            'cart.items' => ['sometimes', 'array'],
            'cart.items.*.product_id' => ['required', 'integer'],
            'cart.items.*.quantity' => ['required', 'integer', 'min:1'],
        ]);

        $user = User::where('email', $data['email'])->first();
        if (!$user || !Hash::check($data['password'], $user->password)) {
            return $this->error('Invalid credentials.', 'invalid_credentials', 401);
        }

        $warnings = $this->shoppingCartService->mergeSnapshot($user, $data['cart']['items'] ?? []);
        $token = $user->createToken($data['device_name'] ?? 'android')->plainTextToken;

        return $this->success([
            'token' => $token,
            'user' => $this->profileService->serializeUser($user->fresh()),
        ], [
            'message' => 'Login successful.',
            'merge_warnings' => $warnings,
        ]);
    }

    public function logout(Request $request)
    {
        $request->user()?->currentAccessToken()?->delete();

        return $this->success(null, ['message' => 'Session closed.']);
    }

    public function me(Request $request)
    {
        return $this->success($this->profileService->serializeUser($request->user()));
    }

    public function update(ProfileUpdateRequest $request)
    {
        $user = $this->profileService->updateProfile($request->user(), $request->validated());

        return $this->success(
            $this->profileService->serializeUser($user),
            ['message' => 'Profile updated.']
        );
    }
}
