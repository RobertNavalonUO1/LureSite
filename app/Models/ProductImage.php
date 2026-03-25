<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use App\Models\Product; // Agrega esta línea

class ProductImage extends Model
{
    protected $fillable = [
        'product_id',
        'image_url',
        'position',
    ];

    public function product()
    {
        return $this->belongsTo(Product::class);
    }
}
