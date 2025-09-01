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

    protected $appends = ['image_url_full'];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // 🔽 Esto genera la URL completa
    public function getImageUrlFullAttribute()
    {
        return url('storage/' . $this->image_url);
    }

    public function details()
{
    return $this->hasOne(ProductDetail::class);
}

public function reviews()
{
    return $this->hasMany(Review::class);
}
}
