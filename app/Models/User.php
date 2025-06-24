<?php

namespace App\Models;

use Illuminate\Contracts\Auth\MustVerifyEmail;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Laravel\Sanctum\HasApiTokens;

use App\Models\{CookiePreference, Address};

class User extends Authenticatable
{
    use HasApiTokens, HasFactory, Notifiable;

    /**
     * Atributos que se pueden asignar en masa.
     */
    protected $fillable = [
        'name',
        'lastname',
        'email',
        'phone',
        'password',
        'default_address_id',
        'avatar', // ✅ NUEVO: avatar del usuario (imagen)
    ];

    /**
     * Atributos que deben ocultarse en arrays/JSON.
     */
    protected $hidden = [
        'password',
        'remember_token',
    ];

    /**
     * Atributos que deben convertirse a tipos nativos.
     */
    protected $casts = [
        'email_verified_at' => 'datetime',
    ];

    /**
     * Relación: el usuario tiene preferencias de cookies.
     */
    public function cookiePreference()
    {
        return $this->hasOne(CookiePreference::class);
    }

    /**
     * Relación: el usuario tiene muchas direcciones.
     */
    public function addresses()
    {
        return $this->hasMany(Address::class);
    }

    /**
     * Relación: la dirección predeterminada del usuario.
     */
    public function defaultAddress()
    {
        return $this->belongsTo(Address::class, 'default_address_id');
    }
}
