<?php

namespace App\Http\Controllers;

use Illuminate\Http\Request;
use App\Models\CookiePreference;
use Illuminate\Support\Facades\Auth;

class CookiePreferenceController extends Controller
{
    public function store(Request $request)
    {
        $request->validate([
            'analytics' => 'required|boolean',
            'marketing' => 'required|boolean',
        ]);

        $user = Auth::user();

        $preference = CookiePreference::updateOrCreate(
            ['user_id' => $user->id],
            [
                'analytics' => $request->analytics,
                'marketing' => $request->marketing,
                'funcionales' => true,
            ]
        );

        return response()->json([
            'message' => 'Preferencias guardadas correctamente.',
            'data' => $preference,
        ]);
    }

    public function get()
    {
        $user = Auth::user();

        return response()->json(
            $user->cookiePreference
        );
    }
}
