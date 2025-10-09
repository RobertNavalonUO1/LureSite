<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemporaryProductImage extends Model
{
    protected $fillable = [
        'temporary_product_id',
        'image_url',
        'position',
    ];

    public function temporaryProduct()
    {
        return $this->belongsTo(TemporaryProduct::class);
    }
}