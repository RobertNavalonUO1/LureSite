<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'total',
        'status',
        'address',
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
        return in_array($this->status, ['pendiente_pago', 'pagado', 'pendiente_envio'], true);
    }

    public function isRefundable(): bool
    {
        return in_array($this->status, ['entregado', 'confirmado'], true);
    }

    public function canBeCancelled()
    {
        return in_array($this->status, ['pendiente_pago', 'pagado', 'pendiente_envio'], true)
            && !$this->cancelled_at
            && !$this->isShipped();
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
}
