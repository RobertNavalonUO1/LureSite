<?php

namespace App\Http\Controllers;

use App\Http\Requests\DeleteUserRequest;
use App\Http\Requests\ProfileUpdateRequest;
use App\Services\ProfileService;
use App\Services\TransactionalEmailService;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Redirect;
use Inertia\Inertia;
use Inertia\Response;

class ProfileController extends Controller
{
    public function __construct(
        protected ProfileService $profileService,
        protected TransactionalEmailService $transactionalEmailService,
    ) {
    }

    public function edit(): Response
    {
        return Inertia::render('Profile/EditProfile', [
            'profile' => $this->profileService->profilePageData(Auth::user()),
        ]);
    }

    public function update(ProfileUpdateRequest $request)
    {
        $this->profileService->updateProfile($request->user(), $request->validated());

        return Redirect::route('profile.edit')->with('success', __('profile.updated'));
    }

    public function destroy(DeleteUserRequest $request)
    {
        $user = $request->user();

        $this->transactionalEmailService->sendAccountDeletionConfirmation($user);

        Auth::logout();

        $user->delete();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return Redirect::to('/');
    }
}
