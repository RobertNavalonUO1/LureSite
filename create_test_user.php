<?php

use Illuminate\Support\Facades\Hash;
use App\Models\User;

require __DIR__.'/vendor/autoload.php';

$app = require_once __DIR__.'/bootstrap/app.php';

$app->make(Illuminate\Contracts\Console\Kernel::class)->bootstrap();

User::create([
    'name' => 'Test User',
    'email' => 'testuser@example.com',
    'password' => Hash::make('password'),
]);

echo "Test user created successfully.\n";