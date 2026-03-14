<?php

namespace App\Http\Controllers;

use App\Support\ProfileAvatar;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AvatarController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();
        $data = $request->input('image');
        $preset = $request->input('preset');

        if (is_string($preset) && ProfileAvatar::isDefaultPreset($preset)) {
            $user->avatar = $preset;
            $user->save();

            return response()->json([
                'url' => $preset,
                'message' => __('avatar.saved'),
            ]);
        }

        if ($data === null && $preset === null) {
            $user->avatar = null;
            $user->save();

            return response()->json([
                'url' => ProfileAvatar::defaultPath($user->id, $user->email),
                'message' => __('avatar.reset'),
            ]);
        }

        if (! is_string($data) || ! preg_match('/^data:image\/png;base64,/', $data)) {
            return response()->json(['message' => __('avatar.invalid_format')], 422);
        }

        $data = substr($data, strpos($data, ',') + 1);
        $data = base64_decode($data);

        $filename = 'avatars/avatar_' . $user->id . '_' . time() . '.png';
        Storage::disk('public')->put($filename, $data);

        $user->avatar = 'storage/' . $filename;
        $user->save();

        return response()->json([
            'url' => asset('storage/' . $filename),
            'message' => __('avatar.saved'),
        ]);
    }
}
