<?php

namespace App\Services;

use App\Models\Address;
use App\Models\User;
use App\Support\ProfileAvatar;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Log;
use Illuminate\Validation\ValidationException;

class ProfileService
{
    public function profilePageData(User $user): array
    {
        $user->loadMissing(['addresses']);

        return [
            'user' => $this->serializeUser($user),
            'addresses' => $user->addresses
                ->sortByDesc('id')
                ->values()
                ->map(fn (Address $address) => $this->serializeAddress($address, $user))
                ->all(),
            'paymentMethods' => [
                'default' => 'stripe',
                'available' => ['stripe', 'paypal'],
            ],
        ];
    }

    public function updateProfile(User $user, array $data): User
    {
        $emailChanged = ($data['email'] ?? null) !== $user->email;

        if ($emailChanged) {
            $user->forceFill(['email_verified_at' => null]);
        }

        $user->fill([
            'name' => $data['name'],
            'lastname' => $data['lastname'] ?? null,
            'email' => $data['email'],
            'phone' => $data['phone'] ?? null,
            'avatar' => $data['avatar'] ?? null,
            'default_address_id' => $data['default_address_id'] ?? null,
        ])->save();

        if ($emailChanged) {
            try {
                $user->sendEmailVerificationNotification();
            } catch (\Throwable $exception) {
                Log::warning('No se pudo reenviar la verificacion de email tras actualizar el perfil.', [
                    'user_id' => $user->id,
                    'exception' => $exception,
                ]);
            }
        }

        return $user->fresh(['addresses']);
    }

    public function createAddress(User $user, array $data): Address
    {
        return DB::transaction(function () use ($user, $data) {
            $address = $user->addresses()->create($this->addressAttributes($data));

            if (($data['make_default'] ?? false) || $user->addresses()->count() === 1) {
                $this->setDefaultAddress($user, $address);
            }

            return $address->fresh();
        });
    }

    public function updateAddress(User $user, Address $address, array $data): Address
    {
        $this->guardOwnership($user, $address);

        return DB::transaction(function () use ($user, $address, $data) {
            $address->update($this->addressAttributes($data));

            if ($data['make_default'] ?? false) {
                $this->setDefaultAddress($user, $address);
            }

            return $address->fresh();
        });
    }

    public function setDefaultAddress(User $user, Address $address): void
    {
        $this->guardOwnership($user, $address);

        $user->forceFill([
            'default_address_id' => $address->id,
        ])->save();
    }

    public function deleteAddress(User $user, Address $address): ?int
    {
        $this->guardOwnership($user, $address);

        if ($user->addresses()->count() <= 1) {
            throw ValidationException::withMessages([
                'address' => __('profile.address.minimum_one'),
            ]);
        }

        return DB::transaction(function () use ($user, $address) {
            $wasDefault = (int) $user->default_address_id === (int) $address->id;

            $address->delete();

            if (! $wasDefault) {
                return $user->fresh()->default_address_id;
            }

            $nextDefaultId = $user->addresses()
                ->whereKeyNot($address->id)
                ->latest('id')
                ->value('id');

            $user->forceFill([
                'default_address_id' => $nextDefaultId,
            ])->save();

            return $nextDefaultId;
        });
    }

    public function serializeAddress(Address $address, User $user): array
    {
        return [
            'id' => $address->id,
            'street' => $address->street,
            'city' => $address->city,
            'province' => $address->province,
            'zip_code' => $address->zip_code,
            'country' => $address->country,
            'is_default' => (int) $user->default_address_id === (int) $address->id,
            'created_at' => optional($address->created_at)?->toISOString(),
            'updated_at' => optional($address->updated_at)?->toISOString(),
        ];
    }

    public function serializeUser(User $user): array
    {
        return [
            'id' => $user->id,
            'name' => $user->name,
            'lastname' => $user->lastname,
            'email' => $user->email,
            'phone' => $user->phone,
            'avatar' => ProfileAvatar::resolve($user->avatar, $user->id, $user->email, $user->photo_url),
            'photo_url' => $user->photo_url,
            'default_address_id' => $user->default_address_id,
            'email_verified_at' => optional($user->email_verified_at)?->toISOString(),
        ];
    }

    protected function addressAttributes(array $data): array
    {
        return [
            'street' => $data['street'],
            'city' => $data['city'],
            'province' => $data['province'],
            'zip_code' => $data['zip_code'],
            'country' => $data['country'],
        ];
    }

    protected function guardOwnership(User $user, Address $address): void
    {
        abort_unless((int) $address->user_id === (int) $user->id, 403);
    }
}
