<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;
use Illuminate\Support\Facades\DB;
return new class extends Migration {
    public function up(): void
    {
        Schema::table('users', function (Blueprint $table) {
            if (!Schema::hasColumn('users', 'default_address_id')) {
                $table->unsignedBigInteger('default_address_id')->nullable();
            }

            // Verificar si la clave foránea no existe antes de agregarla
            $foreignKeys = DB::select("SELECT CONSTRAINT_NAME FROM information_schema.KEY_COLUMN_USAGE WHERE TABLE_NAME = 'users' AND COLUMN_NAME = 'default_address_id'");

            if (empty($foreignKeys)) {
                $table->foreign('default_address_id')->references('id')->on('addresses')->nullOnDelete();
            }
        });

    }

    public function down(): void
    {
        Schema::table('users', function (Blueprint $table) {
            $table->dropForeign(['default_address_id']);
        });
    }
};
