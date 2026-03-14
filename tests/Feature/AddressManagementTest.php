<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AddressManagementTest extends TestCase
{
    use RefreshDatabase;

    public function test_user_can_create_an_address_and_make_it_default(): void
    {
        $user = User::factory()->create();

        $response = $this
            ->actingAs($user)
            ->postJson('/addresses', $this->addressPayload([
                'make_default' => true,
            ]));

        $response
            ->assertCreated()
            ->assertJsonPath('message', 'Direccion guardada correctamente.')
            ->assertJsonPath('address.street', 'Calle Mayor 123');

        $user->refresh();
        $address = $user->addresses()->first();

        $this->assertNotNull($address);
        $this->assertSame($address->id, $user->default_address_id);
    }

    public function test_user_can_update_an_address_and_mark_it_as_default(): void
    {
        $user = User::factory()->create();
        $firstAddress = Address::create(array_merge($this->addressPayload(), ['user_id' => $user->id]));
        $secondAddress = Address::create(array_merge($this->addressPayload([
            'street' => 'Gran Via 45',
            'city' => 'Madrid',
            'zip_code' => '28013',
        ]), ['user_id' => $user->id]));
        $user->forceFill(['default_address_id' => $firstAddress->id])->save();

        $response = $this
            ->actingAs($user)
            ->patchJson("/addresses/{$secondAddress->id}", $this->addressPayload([
                'street' => 'Gran Via 99',
                'make_default' => true,
            ]));

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Direccion actualizada correctamente.')
            ->assertJsonPath('address.street', 'Gran Via 99')
            ->assertJsonPath('default_address_id', $secondAddress->id);

        $this->assertSame($secondAddress->id, $user->refresh()->default_address_id);
        $this->assertSame('Gran Via 99', $secondAddress->fresh()->street);
    }

    public function test_user_can_delete_an_address_and_default_falls_back(): void
    {
        $user = User::factory()->create();
        $firstAddress = Address::create(array_merge($this->addressPayload(), ['user_id' => $user->id]));
        $secondAddress = Address::create(array_merge($this->addressPayload([
            'street' => 'Avenida del Puerto 9',
            'city' => 'Valencia',
            'zip_code' => '46021',
        ]), ['user_id' => $user->id]));
        $user->forceFill(['default_address_id' => $secondAddress->id])->save();

        $response = $this
            ->actingAs($user)
            ->deleteJson("/addresses/{$secondAddress->id}");

        $response
            ->assertOk()
            ->assertJsonPath('message', 'Direccion eliminada correctamente.')
            ->assertJsonPath('default_address_id', $firstAddress->id);

        $this->assertDatabaseMissing('addresses', ['id' => $secondAddress->id]);
        $this->assertSame($firstAddress->id, $user->refresh()->default_address_id);
    }

    public function test_user_cannot_delete_last_remaining_address(): void
    {
        $user = User::factory()->create();
        $address = Address::create(array_merge($this->addressPayload(), ['user_id' => $user->id]));
        $user->forceFill(['default_address_id' => $address->id])->save();

        $response = $this
            ->actingAs($user)
            ->deleteJson("/addresses/{$address->id}");

        $response
            ->assertStatus(422)
            ->assertJsonValidationErrors('address');

        $this->assertDatabaseHas('addresses', ['id' => $address->id]);
    }

    private function addressPayload(array $overrides = []): array
    {
        return array_merge([
            'street' => 'Calle Mayor 123',
            'city' => 'Barcelona',
            'province' => 'Barcelona',
            'zip_code' => '08001',
            'country' => 'Espana',
        ], $overrides);
    }
}
