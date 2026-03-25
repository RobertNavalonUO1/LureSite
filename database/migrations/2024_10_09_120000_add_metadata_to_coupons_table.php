<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        if (!Schema::hasTable('coupons')) {
            return;
        }

        if (!Schema::hasColumn('coupons', 'description')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->string('description')->nullable()->after('code');
            });
        }

        if (!Schema::hasColumn('coupons', 'min_subtotal')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->decimal('min_subtotal', 10, 2)->default(0)->after('type');
            });
        }

        if (!Schema::hasColumn('coupons', 'is_active')) {
            Schema::table('coupons', function (Blueprint $table) {
                $table->boolean('is_active')->default(true)->after('usage_limit');
            });
        }
    }

    public function down(): void
    {
        if (!Schema::hasTable('coupons')) {
            return;
        }

        $columns = ['description', 'min_subtotal', 'is_active'];
        Schema::table('coupons', function (Blueprint $table) use ($columns) {
            foreach ($columns as $column) {
                if (Schema::hasColumn('coupons', $column)) {
                    $table->dropColumn($column);
                }
            }
        });
    }
};
