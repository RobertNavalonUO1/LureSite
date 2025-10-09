<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'total',
        'status',
        'address',
        'cancellation_reason',
        'cancelled_by',
        'cancelled_at',
        // otros campos...
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isCancelable(): bool
    {
        return in_array($this->status, ['confirmado', 'pendiente_envio', 'pagado']);
    }

    public function isRefundable(): bool
    {
        return in_array($this->status, ['cancelado', 'devolucion_aprobada']);
    }

    public function canBeCancelled()
    {
        // Solo si está pendiente o pagado y no enviado/entregado/cancelado
        return in_array($this->status, ['pendiente_pago', 'pagado', 'pendiente_envio', 'confirmado'])
            && !$this->cancelled_at
            && !$this->isShipped();
    }

    public function isShipped()
    {
        return in_array($this->status, ['enviado', 'entregado']);
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
            'cancelacion_pendiente',
            'pendiente_envio',
            'enviado',
            'entregado',
            'confirmado',
            'reembolsado',
            'devolucion_aprobada'
        ]);
    }

    public function scopeShipped($query)
    {
        return $query->whereIn('status', ['pagado', 'pendiente_envio', 'enviado', 'entregado', 'confirmado', 'devolucion_aprobada']);
    }
}
