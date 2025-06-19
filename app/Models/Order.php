<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id', 'name', 'email', 'address', 'payment_method', 'total', 'transaction_id'
    ];

    /**
     * Relación con los elementos de la orden (OrderItem)
     */
    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * Relación con el usuario que hizo la orden
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
