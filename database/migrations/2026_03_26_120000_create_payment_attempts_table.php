<?php

use Illuminate\Database\Migrations\Migration;
use Illuminate\Database\Schema\Blueprint;
use Illuminate\Support\Facades\Schema;

return new class extends Migration
{
    public function up(): void
    {
        Schema::create('payment_attempts', function (Blueprint $table) {
            $table->id();
            $table->string('context_id')->unique();
            $table->foreignId('user_id')->constrained()->cascadeOnDelete();
            $table->foreignId('address_id')->nullable()->constrained()->nullOnDelete();
            $table->foreignId('order_id')->nullable()->constrained()->nullOnDelete();
            $table->string('provider', 20);
            $table->string('channel', 20)->default('mobile');
            $table->string('status', 40)->default('created');
            $table->string('currency', 3)->default('EUR');
            $table->decimal('amount', 10, 2);
            $table->json('cart_snapshot');
            $table->json('quote_snapshot');
            $table->json('mobile_return')->nullable();
            $table->string('provider_checkout_id')->nullable()->index();
            $table->text('checkout_url')->nullable();
            $table->string('payment_reference_id')->nullable()->index();
            $table->string('provider_payment_status')->nullable();
            $table->json('provider_payload')->nullable();
            $table->json('last_return_payload')->nullable();
            $table->string('error_code')->nullable();
            $table->text('error_message')->nullable();
            $table->timestamp('webhook_last_received_at')->nullable();
            $table->timestamp('completed_at')->nullable();
            $table->timestamp('expires_at')->nullable();
            $table->timestamps();

            $table->index(['user_id', 'provider', 'status']);
        });
    }

    public function down(): void
    {
        Schema::dropIfExists('payment_attempts');
    }
};