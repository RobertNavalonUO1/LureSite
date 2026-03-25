<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class CookiePreference extends Model
{
    use HasFactory;

    protected $fillable = [
        'user_id',
        'analytics',
        'marketing',
        'funcionales',
    ];

    // Relación con el usuario
    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
