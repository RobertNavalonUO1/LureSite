<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::create('addresses', function (Blueprint $table) {
            $table->id(); // Esto equivale a bigIncrements()
            $table->foreignId('user_id')->nullable()->constrained()->onDelete('cascade');
            $table->string('street');
            $table->string('city');
            $table->string('province');
            $table->string('zip_code');
            $table->string('country')->default('España');
            $table->timestamps();
        });


        // Modificar la tabla `users` para agregar `default_address_id`
        Schema::table('users', function (Blueprint $table) {
            $table->foreignId('default_address_id')->nullable()->constrained('addresses')->nullOnDelete();
        });
    }

    public function down(): void
    {
        // Primero eliminar la relación de `default_address_id` en `users`
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['default_address_id']);
            $table->dropColumn('default_address_id');
        });

        Schema::dropIfExists('addresses');
    }
};
