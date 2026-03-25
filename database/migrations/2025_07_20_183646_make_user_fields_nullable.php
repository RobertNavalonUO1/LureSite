<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable()->change();
            $table->string('lastname')->nullable()->change();
            $table->string('phone')->nullable()->change();
            $table->string('password')->nullable()->change();
            $table->unsignedBigInteger('default_address_id')->nullable()->change();
            $table->string('avatar')->nullable()->change();
            $table->timestamp('email_verified_at')->nullable()->change();
            $table->rememberToken()->nullable()->change(); // por si acaso
        });
    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->string('name')->nullable(false)->change();
            $table->string('lastname')->nullable(false)->change();
            $table->string('phone')->nullable(false)->change();
            $table->string('password')->nullable(false)->change();
            $table->unsignedBigInteger('default_address_id')->nullable(false)->change();
            $table->string('avatar')->nullable(false)->change();
            $table->timestamp('email_verified_at')->nullable(false)->change();
            $table->rememberToken()->nullable(false)->change();
        });
    }
};
