<?php

namespace Database\Seeders;

use App\Models\CookiePreference;
use App\Models\User;
use Illuminate\Database\Seeder;

class CookiePreferencesSeeder extends Seeder
{
    public function run(): void
    {
        $users = User::query()->select('id')->get();

        foreach ($users as $user) {
            CookiePreference::updateOrCreate(
                ['user_id' => $user->id],
                [
                    'analytics' => (bool) rand(0, 1),
                    'marketing' => (bool) rand(0, 1),
                    'funcionales' => true,
                ]
            );
        }
    }
}
