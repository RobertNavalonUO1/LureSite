<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;

class AddressController extends Controller
{
    public function __construct()
    {
        $this->middleware('auth');
    }

    public function store(Request $request)
    {
        $user = $request->user();
        $data = $this->validatedData($request);

        $address = $user->addresses()->create($data);

        if ($request->boolean('make_default')) {
            $user->default_address_id = $address->id;
            $user->save();
        }

        return back()->with('success', 'Dirección guardada correctamente.');
    }

    public function update(Request $request, Address $address)
    {
        $this->authorizeAddress($request, $address);

        $data = $this->validatedData($request);
        $address->update($data);

        if ($request->boolean('make_default')) {
            $request->user()->forceFill(['default_address_id' => $address->id])->save();
        }

        return back()->with('success', 'Dirección actualizada.');
    }

    public function makeDefault(Request $request, Address $address)
    {
        $this->authorizeAddress($request, $address);

        $request->user()->forceFill(['default_address_id' => $address->id])->save();

        return back()->with('success', 'Dirección establecida como predeterminada.');
    }

    public function destroy(Request $request, Address $address)
    {
        $this->authorizeAddress($request, $address);

        $user = $request->user();
        $wasDefault = $user->default_address_id === $address->id;

        $address->delete();

        if ($wasDefault) {
            $nextDefault = $user->addresses()->orderByDesc('id')->value('id');
            $user->forceFill(['default_address_id' => $nextDefault])->save();
        }

        return back()->with('success', 'Dirección eliminada correctamente.');
    }

    protected function authorizeAddress(Request $request, Address $address): void
    {
        abort_unless($address->user_id === $request->user()->id, 403);
    }

    protected function validatedData(Request $request): array
    {
        return $request->validate([
            'street' => ['required', 'string', 'max:255'],
            'city' => ['required', 'string', 'max:255'],
            'province' => ['required', 'string', 'max:255'],
            'zip_code' => ['required', 'string', 'max:30'],
            'country' => ['required', 'string', 'max:255'],
            'make_default' => ['sometimes', 'boolean'],
        ]);
    }
}