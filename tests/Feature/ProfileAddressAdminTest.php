<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Setting;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ProfileAddressAdminTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_address_through_json_api(): void
    {
        $user = User::factory()->create();

        $response = $this->actingAs($user)
            ->postJson('/addresses', [
                'street' => 'Calle Mayor 1',
                'city' => 'Madrid',
                'province' => 'Madrid',
                'zip_code' => '28001',
                'country' => 'España',
                'make_default' => true,
            ]);

        $response
            ->assertCreated()
            ->assertJsonPath('address.street', 'Calle Mayor 1')
            ->assertJsonPath('default_address_id', 1);

        $this->assertDatabaseHas('addresses', [
            'user_id' => $user->id,
            'street' => 'Calle Mayor 1',
        ]);

        $this->assertSame(1, $user->fresh()->default_address_id);
    }

    public function test_user_cannot_modify_address_owned_by_another_user(): void
    {
        $user = User::factory()->create();
        $owner = User::factory()->create();
        $address = Address::create([
            'user_id' => $owner->id,
            'street' => 'Ajena 5',
            'city' => 'Sevilla',
            'province' => 'Sevilla',
            'zip_code' => '41001',
            'country' => 'España',
        ]);

        $this->actingAs($user)
            ->patchJson("/addresses/{$address->id}", [
                'street' => 'Modificada',
                'city' => 'Sevilla',
                'province' => 'Sevilla',
                'zip_code' => '41001',
                'country' => 'España',
            ])
            ->assertForbidden();
    }

    public function test_admin_settings_update_only_allowed_keys(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->post('/admin/settings/update', [
                'campaign' => [
                    'mode' => 'manual',
                    'manual_slug' => 'navidad',
                ],
                'dangerous_key' => 'should-not-persist',
            ])
            ->assertSessionHasNoErrors()
            ->assertRedirect();

        $this->assertDatabaseHas('settings', [
            'key' => 'campaign.mode',
            'value' => 'manual',
        ]);

        $this->assertDatabaseHas('settings', [
            'key' => 'campaign.manual_slug',
            'value' => 'navidad',
        ]);

        $this->assertDatabaseMissing('settings', [
            'key' => 'dangerous_key',
        ]);
    }

    public function test_admin_cannot_remove_the_last_admin_account(): void
    {
        $admin = User::factory()->create(['is_admin' => true]);

        $this->actingAs($admin)
            ->patch("/admin/users/{$admin->id}/toggle-admin")
            ->assertSessionHas('error');

        $this->assertTrue($admin->fresh()->is_admin);
    }
}
