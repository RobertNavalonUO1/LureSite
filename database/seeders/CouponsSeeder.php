<?php

namespace Database\Seeders;

use App\Models\Coupon;
use Illuminate\Database\Seeder;

class CouponsSeeder extends Seeder
{
    public function run(): void
    {
        $defaults = [
            [
                'code' => 'WELCOME10',
                'discount' => 10,
                'type' => 'percent',
                'expires_at' => now()->addDays(60)->toDateString(),
                'usage_limit' => 500,
                'used_count' => 0,
            ],
            [
                'code' => 'SAVE5',
                'discount' => 5,
                'type' => 'fixed',
                'expires_at' => now()->addDays(30)->toDateString(),
                'usage_limit' => 300,
                'used_count' => 0,
            ],
            [
                'code' => 'FREESHIP',
                'discount' => 0,
                'type' => 'fixed',
                'expires_at' => null,
                'usage_limit' => null,
                'used_count' => 0,
            ],
        ];

        foreach ($defaults as $coupon) {
            Coupon::updateOrCreate(
                ['code' => $coupon['code']],
                $coupon
            );
        }
    }
}
