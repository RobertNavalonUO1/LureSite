<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->string('payment_reference_id')->nullable()->after('transaction_id');
            $table->string('refund_reference_id')->nullable()->after('payment_reference_id');
            $table->timestamp('refunded_at')->nullable()->after('cancelled_at');
            $table->text('refund_error')->nullable()->after('refunded_at');
        });
    }

    public function down(): void
    {
        Schema::table('orders', function (Blueprint $table) {
            $table->dropColumn([
                'payment_reference_id',
                'refund_reference_id',
                'refunded_at',
                'refund_error',
            ]);
        });
    }
};