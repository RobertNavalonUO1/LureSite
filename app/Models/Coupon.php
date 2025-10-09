<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Coupon extends Model
{
    protected $fillable = [
        'code', 'discount', 'type', 'expires_at', 'usage_limit', 'used_count'
    ];
}