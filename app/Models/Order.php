<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    protected $fillable = [
        'user_id',
        'name',
        'email',
        'address',
        'status',
        'payment_method',
        'transaction_id',
        'total',
    ];

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    public function isCancelable(): bool
    {
        return in_array($this->status, ['pendiente_envio', 'pagado']);
    }

    public function isRefundable(): bool
    {
        return $this->status === 'pagado';
    }

    // Scopes para facilitar queries
    public function scopeByUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }

    public function scopePaid($query)
    {
        return $query->whereIn('status', ['pagado', 'enviado', 'entregado', 'confirmado']);
    }

    public function scopeShipped($query)
    {
        return $query->whereIn('status', ['enviado', 'entregado', 'confirmado']);
    }
}
