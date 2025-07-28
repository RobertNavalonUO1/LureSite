<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    /**
     * Run the migrations.
     */
public function up()
{
    Schema::table('orders', function (Blueprint $table) {
        if (!Schema::hasColumn('orders', 'status')) {
            $table->string('status')->default('pendiente_envio');
        }

        if (!Schema::hasColumn('orders', 'payment_method')) {
            $table->string('payment_method')->nullable();
        }

        if (!Schema::hasColumn('orders', 'transaction_id')) {
            $table->string('transaction_id')->nullable();
        }
    });
}

};
