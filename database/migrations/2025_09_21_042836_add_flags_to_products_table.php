<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->boolean('is_featured')->default(false)->after('price');
            $table->boolean('is_superdeal')->default(false)->after('is_featured');
            $table->boolean('is_fast_shipping')->default(false)->after('is_superdeal');
            $table->boolean('is_new_arrival')->default(false)->after('is_fast_shipping');
            $table->boolean('is_seasonal')->default(false)->after('is_new_arrival');
            $table->unsignedInteger('discount')->default(0)->after('is_seasonal');
        });
    }

    public function down()
    {
        Schema::table('products', function (Blueprint $table) {
            $table->dropColumn([
                'is_featured',
                'is_superdeal',
                'is_fast_shipping',
                'is_new_arrival',
                'is_seasonal',
                'discount',
            ]);
        });
    }
};