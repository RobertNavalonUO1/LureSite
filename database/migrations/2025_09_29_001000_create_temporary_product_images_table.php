<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('temporary_product_images', function (Blueprint $table) {
            $table->id();
            $table->foreignId('temporary_product_id')
                  ->constrained('temporary_products')
                  ->cascadeOnDelete();
            $table->string('image_url');
            $table->unsignedInteger('position')->nullable();
            $table->timestamps();

            $table->index(['temporary_product_id', 'position']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('temporary_product_images');
    }
};
