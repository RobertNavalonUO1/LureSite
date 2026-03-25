<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     *
     * @return void
     */
    public function up()
    {
        Schema::table('temporary_products', function (Blueprint $table) {
            if (!Schema::hasColumn('temporary_products', 'seo_title')) {
                $table->string('seo_title')->nullable()->after('title');
            }
            if (!Schema::hasColumn('temporary_products', 'seo_description')) {
                $table->text('seo_description')->nullable()->after('seo_title');
            }
        });
    }

    /**
     * Reverse the migrations.
     *
     * @return void
     */
    public function down()
    {
        Schema::table('temporary_products', function (Blueprint $table) {
            if (Schema::hasColumn('temporary_products', 'seo_description')) {
                $table->dropColumn('seo_description');
            }
            if (Schema::hasColumn('temporary_products', 'seo_title')) {
                $table->dropColumn('seo_title');
            }
        });
    }
};