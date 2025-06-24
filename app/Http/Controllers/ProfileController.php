<?php

namespace App\Http\Controllers;

use App\Models\Address;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;

class ProfileController extends Controller
{
    /**
     * Muestra el formulario de edición del perfil.
     */
    public function edit()
    {
        $user = Auth::user()->load('addresses');

        $uniqueAddresses = $user->addresses
            ->unique(fn($addr) => $addr->street . $addr->city . $addr->zip_code)
            ->values();

        return Inertia::render('EditProfile', [
            'auth' => [
                'user' => [
                    'id' => $user->id,
                    'name' => $user->name,
                    'lastname' => $user->lastname,
                    'email' => $user->email,
                    'phone' => $user->phone,
                    'avatar' => $user->avatar ?? '/default-avatar.png',
                    'default_address_id' => $user->default_address_id,
                ],
            ],
            'addresses' => $uniqueAddresses,
            'paymentMethods' => [
                'default' => 'stripe',
                'available' => ['stripe', 'paypal'],
            ],
        ]);
    }

    /**
     * Actualiza el perfil del usuario (nombre, avatar, etc.).
     */
    public function update(Request $request)
    {
        $user = Auth::user();

        $validated = $request->validate([
            'name' => ['nullable', 'string', 'max:255'],
            'lastname' => ['nullable', 'string', 'max:255'],
            'email' => ['nullable', 'email', 'max:255'],
            'phone' => ['nullable', 'string', 'regex:/^\+\d{1,4}\s\d{6,15}$/'],
            'avatar' => ['nullable', 'string', 'max:255'], // Ruta del avatar (URL o asset local)
            'payment_method' => ['nullable', 'in:stripe,paypal'],
            'default_address_id' => ['nullable', 'exists:addresses,id'],
        ]);

        $user->fill($validated);
        $user->save();

        return back()->with('success', 'Perfil actualizado correctamente.');
    }

    /**
     * Actualiza una dirección existente del usuario.
     */
    public function updateAddress(Request $request, Address $address)
    {
        $this->authorize('update', $address);

        $validated = $request->validate([
            'street' => 'required|string|max:255',
            'city' => 'required|string|max:255',
            'province' => 'required|string|max:255',
            'zip_code' => 'required|string|max:255',
            'country' => 'required|string|max:255',
        ]);

        $address->update($validated);

        return back()->with('success', 'Dirección actualizada correctamente.');
    }

    /**
     * Elimina una dirección del usuario (si tiene más de una).
     */
    public function destroyAddress(Address $address)
    {
        $this->authorize('delete', $address);

        $user = Auth::user();
        if ($user->addresses()->count() <= 1) {
            return response()->json(['error' => 'Debes tener al menos una dirección.'], 422);
        }

        if ($user->default_address_id === $address->id) {
            $user->default_address_id = $user->addresses()->where('id', '!=', $address->id)->first()?->id;
            $user->save();
        }

        $address->delete();

        return response()->json(['success' => true]);
    }

    /**
     * Define la dirección predeterminada del usuario.
     */
    public function setDefaultAddress(Request $request, Address $address)
    {
        $this->authorize('update', $address);

        $user = Auth::user();
        $user->default_address_id = $address->id;
        $user->save();

        return response()->json(['success' => true, 'default_address_id' => $address->id]);
    }
}
