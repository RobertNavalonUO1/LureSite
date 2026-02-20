<?php

namespace App\Http\Controllers;

use App\Models\Coupon;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Validation\Rule;
use Inertia\Inertia;
use Inertia\Response;

class CouponController extends Controller
{
    public function index(): Response
    {
        $coupons = Coupon::orderByDesc('created_at')->get();

        return Inertia::render('Admin/Coupons', [
            'coupons' => $coupons,
        ]);
    }

    public function store(Request $request): RedirectResponse
    {
        $data = $this->validatedData($request);
        Coupon::create($data);

        return back()->with('success', 'Cupón creado correctamente.');
    }

    public function update(Request $request, Coupon $coupon): RedirectResponse
    {
        $data = $this->validatedData($request, $coupon->id);
        $coupon->update($data);

        return back()->with('success', 'Cupón actualizado.');
    }

    public function destroy(Coupon $coupon): RedirectResponse
    {
        $coupon->delete();

        return back()->with('success', 'Cupón eliminado.');
    }

    private function validatedData(Request $request, ?int $ignoreId = null): array
    {
        $uniqueRule = Rule::unique('coupons', 'code');
        if ($ignoreId) {
            $uniqueRule->ignore($ignoreId);
        }

        $validated = $request->validate([
            'code' => ['required', 'string', 'max:40', $uniqueRule],
            'description' => ['nullable', 'string', 'max:255'],
            'discount' => ['required', 'numeric', 'min:0'],
            'type' => ['required', 'in:percent,fixed'],
            'min_subtotal' => ['nullable', 'numeric', 'min:0'],
            'expires_at' => ['nullable', 'date'],
            'usage_limit' => ['nullable', 'integer', 'min:1'],
            'is_active' => ['nullable', 'boolean'],
        ]);

        $validated['code'] = strtoupper(trim($validated['code']));
        $validated['description'] = array_key_exists('description', $validated) && $validated['description'] !== null
            ? trim($validated['description'])
            : null;
        $validated['min_subtotal'] = array_key_exists('min_subtotal', $validated)
            ? (float) $validated['min_subtotal']
            : 0.0;
        $validated['discount'] = (float) $validated['discount'];
        $validated['usage_limit'] = array_key_exists('usage_limit', $validated)
            ? (int) $validated['usage_limit']
            : null;
        $validated['expires_at'] = $validated['expires_at'] ?? null;
        $validated['is_active'] = $request->has('is_active')
            ? $request->boolean('is_active')
            : true;

        return $validated;
    }
}
