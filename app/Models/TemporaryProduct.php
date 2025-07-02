<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class TemporaryProduct extends Model
{
    protected $table = 'temporary_products';

    protected $fillable = [
        'title',
        'seo_title',
        'seo_description',
        'price',
        'image_url',
    ];
}