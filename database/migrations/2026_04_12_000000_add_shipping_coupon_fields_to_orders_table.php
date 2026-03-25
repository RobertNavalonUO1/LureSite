<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (!Schema::hasColumn('orders', 'shipping_method')) {
                $table->string('shipping_method')->nullable()->after('address');
            }

            if (!Schema::hasColumn('orders', 'shipping_label')) {
                $table->string('shipping_label')->nullable()->after('shipping_method');
            }

            if (!Schema::hasColumn('orders', 'shipping_description')) {
                $table->string('shipping_description')->nullable()->after('shipping_label');
            }

            if (!Schema::hasColumn('orders', 'shipping_eta')) {
                $table->string('shipping_eta')->nullable()->after('shipping_description');
            }

            if (!Schema::hasColumn('orders', 'shipping_cost')) {
                $table->decimal('shipping_cost', 10, 2)->default(0)->after('shipping_eta');
            }

            if (!Schema::hasColumn('orders', 'coupon_id')) {
                $table->foreignId('coupon_id')->nullable()->after('shipping_cost')->constrained('coupons')->nullOnDelete();
            }

            if (!Schema::hasColumn('orders', 'coupon_code')) {
                $table->string('coupon_code')->nullable()->after('coupon_id');
            }

            if (!Schema::hasColumn('orders', 'discount')) {
                $table->decimal('discount', 10, 2)->default(0)->after('coupon_code');
            }
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            if (Schema::hasColumn('orders', 'coupon_id')) {
                $table->dropForeign(['coupon_id']);
            }

            $columns = [
                'shipping_method',
                'shipping_label',
                'shipping_description',
                'shipping_eta',
                'shipping_cost',
                'coupon_id',
                'coupon_code',
                'discount',
            ];

            $existingColumns = array_values(array_filter($columns, fn (string $column) => Schema::hasColumn('orders', $column)));

            if ($existingColumns !== []) {
                $table->dropColumn($existingColumns);
            }
        });
    }
};