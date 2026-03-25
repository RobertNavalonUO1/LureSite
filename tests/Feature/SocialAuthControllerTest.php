<?php

namespace Tests\Feature;

use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SocialAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    public function test_facebook_data_deletion_callback_clears_provider_link_and_returns_status_url(): void
    {
        config()->set('services.facebook.client_secret', 'fb-test-secret');

        $user = User::factory()->create([
            'oauth_provider' => 'facebook',
            'oauth_provider_id' => 'facebook-user-123',
        ]);

        $signedRequest = $this->facebookSignedRequest([
            'algorithm' => 'HMAC-SHA256',
            'issued_at' => now()->timestamp,
            'user_id' => 'facebook-user-123',
        ], 'fb-test-secret');

        $response = $this->post(route('auth.social.facebook.data-deletion'), [
            'signed_request' => $signedRequest,
        ]);

        $response
            ->assertOk()
            ->assertJsonStructure(['url', 'confirmation_code']);

        $statusPath = parse_url($response->json('url'), PHP_URL_PATH);

        $this->getJson($statusPath)
            ->assertOk()
            ->assertJsonPath('data.status', 'completed')
            ->assertJsonPath('data.deleted_user_id', $user->id);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'oauth_provider' => null,
            'oauth_provider_id' => null,
        ]);
    }

    public function test_facebook_deauthorize_callback_clears_provider_link_and_returns_status_url(): void
    {
        config()->set('services.facebook.client_secret', 'fb-test-secret');

        $user = User::factory()->create([
            'oauth_provider' => 'facebook',
            'oauth_provider_id' => 'facebook-user-456',
        ]);

        $signedRequest = $this->facebookSignedRequest([
            'algorithm' => 'HMAC-SHA256',
            'issued_at' => now()->timestamp,
            'user_id' => 'facebook-user-456',
        ], 'fb-test-secret');

        $response = $this->post(route('auth.social.facebook.deauthorize'), [
            'signed_request' => $signedRequest,
        ]);

        $response
            ->assertOk()
            ->assertJsonPath('success', true)
            ->assertJsonStructure(['confirmation_code', 'status_url']);

        $this->assertDatabaseHas('users', [
            'id' => $user->id,
            'oauth_provider' => null,
            'oauth_provider_id' => null,
        ]);
    }

    private function facebookSignedRequest(array $payload, string $secret): string
    {
        $encodedPayload = $this->base64UrlEncode(json_encode($payload, JSON_UNESCAPED_SLASHES));
        $signature = hash_hmac('sha256', $encodedPayload, $secret, true);

        return $this->base64UrlEncode($signature).'.'.$encodedPayload;
    }

    private function base64UrlEncode(string $value): string
    {
        return rtrim(strtr(base64_encode($value), '+/', '-_'), '=');
    }
}