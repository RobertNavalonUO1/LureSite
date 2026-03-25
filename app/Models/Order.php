<?php

namespace App\Models;

use App\Support\OrderState;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Collection;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'total',
        'status',
        'address',
        'shipping_method',
        'shipping_label',
        'shipping_description',
        'shipping_eta',
        'shipping_cost',
        'tracking_carrier',
        'tracking_number',
        'tracking_url',
        'coupon_id',
        'coupon_code',
        'discount',
        'payment_method',
        'transaction_id',
        'payment_reference_id',
        'refund_reference_id',
        'cancellation_reason',
        'cancelled_by',
        'cancelled_at',
        'refunded_at',
        'refund_error',
        // otros campos...
    ];

    protected $casts = [
        'cancelled_at' => 'datetime',
        'refunded_at' => 'datetime',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function user()
    {
        return $this->belongsTo(User::class);
    }

    public function isCancelable(): bool
    {
        return $this->statusSummary()['can_cancel_order'];
    }

    public function isRefundable(): bool
    {
        return $this->statusSummary()['can_refund_order'];
    }

    public function canBeCancelled()
    {
        return $this->statusSummary()['can_cancel_order'];
    }

    public function isShipped()
    {
        return in_array($this->status, ['enviado', 'entregado', 'confirmado'], true);
    }

    // Scopes para facilitar queries
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    // Solo pedidos pagados y posteriores
    public function scopePaid($query)
    {
        return $query->whereIn('status', [
            'pagado',
            'pendiente_envio',
            'enviado',
            'entregado',
            'confirmado',
        ]);
    }

    public function scopeShipped($query)
    {
        return $query->whereIn('status', ['enviado', 'entregado', 'confirmado']);
    }

    public function statusSummary(): array
    {
        return OrderState::summarize($this->orderItemsCollection(), $this->status);
    }

    public function summaryStatus(): string
    {
        return $this->statusSummary()['summary_status'];
    }

    public function hasPartialCancellation(): bool
    {
        return $this->summaryStatus() === 'parcialmente_cancelado';
    }

    public function hasPartialRefund(): bool
    {
        return $this->summaryStatus() === 'parcialmente_reembolsado';
    }

    private function orderItemsCollection(): Collection
    {
        return $this->relationLoaded('items') ? $this->items : $this->items()->get();
    }
}
