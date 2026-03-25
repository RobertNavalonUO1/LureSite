<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        if (!Schema::hasTable('coupons')) {
            return;
        }

        Schema::table('coupons', function (Blueprint $table) {
            if (!Schema::hasColumn('coupons', 'description')) {
                $table->string('description')->nullable()->after('code');
            }

            if (!Schema::hasColumn('coupons', 'min_subtotal')) {
                $table->decimal('min_subtotal', 10, 2)->default(0)->after('type');
            }

            if (!Schema::hasColumn('coupons', 'is_active')) {
                $table->boolean('is_active')->default(true)->after('usage_limit');
            }
        });
    }

    public function down(): void
    {
        if (!Schema::hasTable('coupons')) {
            return;
        }

        Schema::table('coupons', function (Blueprint $table) {
            $columns = [];

            if (Schema::hasColumn('coupons', 'description')) {
                $columns[] = 'description';
            }

            if (Schema::hasColumn('coupons', 'min_subtotal')) {
                $columns[] = 'min_subtotal';
            }

            if (Schema::hasColumn('coupons', 'is_active')) {
                $columns[] = 'is_active';
            }

            if ($columns !== []) {
                $table->dropColumn($columns);
            }
        });
    }
};