<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class PaymentAttempt extends Model
{
    protected $fillable = [
        'context_id',
        'user_id',
        'address_id',
        'order_id',
        'provider',
        'channel',
        'status',
        'currency',
        'amount',
        'cart_snapshot',
        'quote_snapshot',
        'mobile_return',
        'provider_checkout_id',
        'checkout_url',
        'payment_reference_id',
        'provider_payment_status',
        'provider_payload',
        'last_return_payload',
        'error_code',
        'error_message',
        'webhook_last_received_at',
        'completed_at',
        'expires_at',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'cart_snapshot' => 'array',
        'quote_snapshot' => 'array',
        'mobile_return' => 'array',
        'provider_payload' => 'array',
        'last_return_payload' => 'array',
        'webhook_last_received_at' => 'datetime',
        'completed_at' => 'datetime',
        'expires_at' => 'datetime',
    ];

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}