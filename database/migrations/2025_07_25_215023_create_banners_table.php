<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
    public function up(): void
    {
Schema::create('banners', function (Blueprint $table) {
    $table->id();
    $table->string('title')->nullable();
    $table->string('image_path'); // Ej: /storage/banners/banner1.webp
    $table->string('link')->nullable(); // Redirecciona al hacer click
    $table->boolean('active')->default(true);
    $table->timestamps();
});
    }

    /**
     * Reverse the migrations.
     */
    public function down(): void
    {
        Schema::dropIfExists('banners');
    }
};
