<?php
namespace App\Http\Controllers;

use Illuminate\Http\Request;
use Illuminate\Support\Facades\Storage;

class AvatarController extends Controller
{
    public function store(Request $request)
    {
        $user = $request->user();

        $data = $request->get('image');
        if (!preg_match('/^data:image\/png;base64,/', $data)) {
            return response()->json(['error' => 'Formato inválido'], 422);
        }

        $data = substr($data, strpos($data, ',') + 1);
        $data = base64_decode($data);

        $filename = 'avatars/avatar_' . $user->id . '_' . time() . '.png';
        Storage::disk('public')->put($filename, $data);

        $user->avatar = 'storage/' . $filename;
        $user->save();

        return response()->json(['url' => asset('storage/' . $filename)]);
    }
}
