<?php
namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Support\Str;

class Product extends Model
{
    use HasFactory;

    protected $fillable = [
        'name',
        'description',
        'price',
        'image_url',
        'stock',
        'category_id',
        'is_adult',
        'link',
        'is_featured',
        'is_superdeal',
        'is_fast_shipping',
        'is_new_arrival',
        'is_seasonal',
        'discount',
    ];

    protected $appends = ['image_url_full'];

    protected $casts = [
        'is_featured' => 'boolean',
        'is_superdeal' => 'boolean',
        'is_fast_shipping' => 'boolean',
        'is_new_arrival' => 'boolean',
        'is_seasonal' => 'boolean',
        'discount' => 'integer',
    ];

    public function category()
    {
        return $this->belongsTo(Category::class);
    }

    // Generates the fully qualified image URL
    public function getImageUrlFullAttribute()
    {
        if (!$this->image_url) {
            return null;
        }

        if (Str::startsWith($this->image_url, ['http://', 'https://', '//'])) {
            return $this->image_url;
        }

        return url('storage/' . ltrim($this->image_url, '/'));
    }

    public function details()
    {
        return $this->hasOne(ProductDetail::class);
    }

    public function reviews()
    {
        return $this->hasMany(\App\Models\Review::class);
    }

    public function images()
    {
        return $this->hasMany(ProductImage::class);
    }

    // Scopes to filter products by flags
    public function scopeFeatured($query)
    {
        return $query->where('is_featured', true);
    }

    public function scopeSuperdeal($query)
    {
        return $query->where('is_superdeal', true);
    }

    public function scopeFastShipping($query)
    {
        return $query->where('is_fast_shipping', true);
    }

    public function scopeNewArrival($query)
    {
        return $query->where('is_new_arrival', true);
    }

    public function scopeSeasonal($query)
    {
        return $query->where('is_seasonal', true);
    }
}
