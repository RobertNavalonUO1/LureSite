<?php

namespace App\Http\Controllers;

use App\Http\Requests\StoreAddressRequest;
use App\Http\Requests\UpdateAddressRequest;
use App\Models\Address;
use App\Services\ProfileService;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function __construct(
        protected ProfileService $profileService
    ) {
    }

    public function store(StoreAddressRequest $request): JsonResponse
    {
        $address = $this->profileService->createAddress($request->user(), $request->validated());
        $user = $request->user()->fresh();

        return response()->json([
            'message' => __('profile.address.saved'),
            'address' => $this->profileService->serializeAddress($address, $user),
            'default_address_id' => $user->default_address_id,
        ], 201);
    }

    public function update(UpdateAddressRequest $request, Address $address): JsonResponse
    {
        $address = $this->profileService->updateAddress($request->user(), $address, $request->validated());
        $user = $request->user()->fresh();

        return response()->json([
            'message' => __('profile.address.updated'),
            'address' => $this->profileService->serializeAddress($address, $user),
            'default_address_id' => $user->default_address_id,
        ]);
    }

    public function makeDefault(Request $request, Address $address): JsonResponse
    {
        $this->profileService->setDefaultAddress($request->user(), $address);
        $user = $request->user()->fresh();

        return response()->json([
            'message' => __('profile.address.default_updated'),
            'default_address_id' => $user->default_address_id,
            'address' => $this->profileService->serializeAddress($address, $user),
        ]);
    }

    public function destroy(Request $request, Address $address): JsonResponse
    {
        $defaultAddressId = $this->profileService->deleteAddress($request->user(), $address);

        return response()->json([
            'message' => __('profile.address.deleted'),
            'default_address_id' => $defaultAddressId,
        ]);
    }
}
