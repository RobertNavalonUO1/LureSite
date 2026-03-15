<?php

namespace Tests\Feature;

use App\Models\Address;
use App\Models\Banner;
use App\Models\Category;
use App\Models\CookiePreference;
use App\Models\Coupon;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Product;
use App\Models\ProductDetail;
use App\Models\ProductImage;
use App\Models\Review;
use App\Models\TemporaryProduct;
use App\Models\TemporaryProductImage;
use App\Models\User;
use Database\Seeders\QaDatasetSeeder;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class QaDatasetSeederTest extends TestCase
{
    use RefreshDatabase;

    public function test_qa_dataset_seeder_populates_key_domains_with_high_volume(): void
    {
        $this->seed(QaDatasetSeeder::class);

        $this->assertGreaterThanOrEqual(60, User::query()->where('email', 'like', 'qa.user%@limoneo.test')->count());
        $this->assertGreaterThanOrEqual(60, Category::query()->count());
        $this->assertGreaterThanOrEqual(180, Product::query()->where('name', 'like', 'QA Producto %')->count());
        $this->assertGreaterThanOrEqual(180, ProductDetail::query()->count());
        $this->assertGreaterThanOrEqual(360, ProductImage::query()->count());
        $this->assertGreaterThanOrEqual(60, TemporaryProduct::query()->where('title', 'like', 'QA Temporal %')->count());
        $this->assertGreaterThanOrEqual(120, TemporaryProductImage::query()->count());
        $this->assertGreaterThanOrEqual(180, Address::query()->count());
        $this->assertGreaterThanOrEqual(60, CookiePreference::query()->count());
        $this->assertGreaterThanOrEqual(60, Coupon::query()->where('code', 'like', 'QA%')->count());
        $this->assertGreaterThanOrEqual(60, Banner::query()->where('campaign', 'qa-dataset')->count());
        $this->assertGreaterThanOrEqual(240, Review::query()->count());
        $this->assertGreaterThanOrEqual(1950, OrderItem::query()->count());

        foreach (QaDatasetSeeder::ORDER_STATUSES as $status) {
            $this->assertGreaterThanOrEqual(
                50,
                Order::query()->where('status', $status)->count(),
                sprintf('El estado %s no llego al minimo esperado.', $status)
            );
        }

        $qaUsers = User::query()
            ->where('email', 'like', 'qa.user%@limoneo.test')
            ->get();

        foreach ($qaUsers as $user) {
            $userStatuses = Order::query()
                ->where('user_id', $user->id)
                ->distinct()
                ->pluck('status');

            $this->assertCount(
                count(QaDatasetSeeder::ORDER_STATUSES),
                $userStatuses,
                sprintf('El usuario QA %s no tiene cobertura completa de estados.', $user->email)
            );

            foreach (QaDatasetSeeder::ORDER_STATUSES as $status) {
                $this->assertTrue(
                    $userStatuses->contains($status),
                    sprintf('El usuario QA %s no tiene pedidos en estado %s.', $user->email, $status)
                );
            }
        }
    }
}