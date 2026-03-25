<?php

namespace App\Models;

use App\Support\OrderState;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;

    protected $fillable = [
        'order_id',
        'product_id',
        'quantity',
        'price',
        'status',
        'cancellation_reason',
        'cancelled_by',
        'cancelled_at',
        'return_reason',
        'refund_reference_id',
        'refunded_at',
        'refund_error',
    ];

    protected $casts = [
        'cancelled_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    /**
     * Relación con la orden a la que pertenece
     */
    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    /**
     * Relación con el producto comprado
     */
    public function product()
    {
        return $this->belongsTo(Product::class);
    }

    public function canBeCancelled(): bool
    {
        return in_array($this->status, OrderState::CANCELLABLE_ITEM_STATUSES, true);
    }

    public function canRequestRefund(): bool
    {
        return in_array($this->status, OrderState::REFUNDABLE_ITEM_STATUSES, true);
    }

    public function isAffected(): bool
    {
        return !in_array($this->status, OrderState::ACTIVE_ITEM_STATUSES, true);
    }
}
