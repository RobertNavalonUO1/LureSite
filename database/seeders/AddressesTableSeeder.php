<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AddressesTableSeeder extends Seeder
{
    public function run(): void
    {
        $users = DB::table('users')->pluck('id');

        foreach ($users as $user_id) {
            $address_ids = [];

            // Crear de 1 a 6 direcciones por usuario
            for ($i = 0; $i < rand(1, 6); $i++) {
                $address_id = DB::table('addresses')->insertGetId([
                    'user_id' => $user_id,
                    'street' => 'Calle ' . rand(100, 999),
                    'city' => 'Madrid',
                    'province' => 'Madrid',
                    'zip_code' => rand(28000, 28999),
                    'country' => 'España',
                    'created_at' => now(),
                    'updated_at' => now(),
                ]);

                $address_ids[] = $address_id;
            }

            // Seleccionar una dirección al azar como "default"
            if (!empty($address_ids)) {
                DB::table('users')->where('id', $user_id)->update([
                    'default_address_id' => $address_ids[array_rand($address_ids)]
                ]);
            }
        }
    }
}
