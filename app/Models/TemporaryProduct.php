<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class TemporaryProduct extends Model
{
    use HasFactory;

    protected $fillable = [
        'title',
        'price',
        'original_price',
        'discount',
        'sold_count',
        'rating',
        'image_url',
        'product_url',
    ];

}
