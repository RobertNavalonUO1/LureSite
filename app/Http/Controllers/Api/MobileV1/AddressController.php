<?php

namespace App\Http\Controllers\Api\MobileV1;

use App\Http\Controllers\Controller;
use App\Http\Controllers\Api\Concerns\RespondsWithApi;
use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Models\Address;
use App\Services\ProfileService;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    use RespondsWithApi;

    public function __construct(
        private readonly ProfileService $profileService,
    ) {
    }

    public function index(Request $request)
    {
        $profile = $this->profileService->profilePageData($request->user());

        return $this->success($profile['addresses'], [
            'default_address_id' => $profile['user']['default_address_id'],
        ]);
    }

    public function store(StoreAddressRequest $request)
    {
        $address = $this->profileService->createAddress($request->user(), $request->validated());
        $user = $request->user()->fresh();

        return $this->success(
            $this->profileService->serializeAddress($address, $user),
            [
                'message' => 'Address created.',
                'default_address_id' => $user->default_address_id,
            ],
            201
        );
    }

    public function update(UpdateAddressRequest $request, Address $address)
    {
        $address = $this->profileService->updateAddress($request->user(), $address, $request->validated());
        $user = $request->user()->fresh();

        return $this->success(
            $this->profileService->serializeAddress($address, $user),
            [
                'message' => 'Address updated.',
                'default_address_id' => $user->default_address_id,
            ]
        );
    }

    public function makeDefault(Request $request, Address $address)
    {
        $this->profileService->setDefaultAddress($request->user(), $address);
        $user = $request->user()->fresh();

        return $this->success(
            $this->profileService->serializeAddress($address->fresh(), $user),
            [
                'message' => 'Default address updated.',
                'default_address_id' => $user->default_address_id,
            ]
        );
    }

    public function destroy(Request $request, Address $address)
    {
        $defaultAddressId = $this->profileService->deleteAddress($request->user(), $address);

        return $this->success(null, [
            'message' => 'Address deleted.',
            'default_address_id' => $defaultAddressId,
        ]);
    }
}
