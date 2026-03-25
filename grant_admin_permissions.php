<?php

use App\Models\User;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

$user = User::where('email', 'testuser@example.com')->first();

if ($user) {
    $user->is_admin = true;
    $user->save();
    echo "Admin permissions granted to test user.\n";
} else {
    echo "Test user not found.\n";
}