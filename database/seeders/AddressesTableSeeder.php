<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class AddressesTableSeeder extends Seeder
{
    public function run(): void
    {
        $faker = \Faker\Factory::create('es_ES');
        $users = DB::table('users')->pluck('id');
        $provinces = [
            'Madrid', 'Barcelona', 'Valencia', 'Sevilla', 'Zaragoza', 'Málaga', 'Murcia', 'Palma', 'Las Palmas', 'Bilbao',
            'Alicante', 'Córdoba', 'Valladolid', 'Vigo', 'Gijón', 'Hospitalet', 'A Coruña', 'Vitoria', 'Granada', 'Elche'
        ];
        foreach ($users as $user_id) {
            $address_ids = [];
            $numAddresses = rand(2, 5);
            for ($i = 0; $i < $numAddresses; $i++) {
                $province = $faker->randomElement($provinces);
                $address_id = DB::table('addresses')->insertGetId([
                    'user_id' => $user_id,
                    'street' => $faker->streetAddress,
                    'city' => $faker->city,
                    'province' => $province,
                    'zip_code' => $faker->numberBetween(10000, 52999),
                    'country' => 'España',
                    'created_at' => $faker->dateTimeBetween('-2 years', 'now'),
                    'updated_at' => now(),
                ]);
                $address_ids[] = $address_id;
            }
            if (!empty($address_ids)) {
                DB::table('users')->where('id', $user_id)->update([
                    'default_address_id' => $faker->randomElement($address_ids)
                ]);
            }
        }
    }
}
