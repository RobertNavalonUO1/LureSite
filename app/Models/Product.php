<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name', 'description', 'price', 'image_url', 'stock', 'category_id', 'is_adult', 'link'
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }
}
