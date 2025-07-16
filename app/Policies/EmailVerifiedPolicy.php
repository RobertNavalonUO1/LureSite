<?php
namespace App\Policies;

use App\Models\User;
use Kreait\Firebase\Factory;

class EmailVerifiedPolicy
{
    public function verified(User $user): bool
    {
        try {
            $auth = (new Factory())
                ->withServiceAccount(storage_path('app/firebase/firebase_credentials.json'))
                ->createAuth();

            $firebaseUser = $auth->getUser($user->firebase_uid);

            return $firebaseUser->emailVerified;
        } catch (\Throwable $e) {
            return false;
        }
    }
}
