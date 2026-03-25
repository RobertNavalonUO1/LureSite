<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Hash;

class UsersTableSeeder extends Seeder
{
    public function run(): void
    {
        $adminEmail = 'admin@limoneo.com';

        DB::table('users')->updateOrInsert(
            ['email' => $adminEmail],
            [
                'name' => 'Administrador',
                'password' => Hash::make('admin123'),
                'is_admin' => true,
                'created_at' => now()->subDays(60),
                'updated_at' => now(),
            ]
        );

        if (! class_exists(\Faker\Factory::class)) {
            return;
        }

        $faker = \Faker\Factory::create('es_ES');
        $defaultPassword = Hash::make('password123');
        $users = [];

        $regularUsersToGenerate = 200;
        $faker->unique(true);

        for ($i = 0; $i < $regularUsersToGenerate; $i++) {
            $gender = $faker->randomElement(['men', 'women']);

            $users[] = [
                'name' => $faker->name(),
                'email' => $faker->unique()->safeEmail(),
                'password' => $defaultPassword,
                'avatar' => "https://randomuser.me/api/portraits/{$gender}/".$faker->numberBetween(1, 99).".jpg",
                'is_admin' => false,
                'created_at' => $faker->dateTimeBetween('-3 years', 'now'),
                'updated_at' => now(),
            ];
        }

        DB::table('users')->insert($users);
    }
}
