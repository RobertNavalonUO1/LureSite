<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Foundation\Auth\User as Authenticatable;
use Illuminate\Notifications\Notifiable;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use App\Models\Address;

class User extends Authenticatable
{
    use HasFactory, Notifiable;

    protected $fillable = [
        'name',
        'email',
        'password',
        'default_address_id', // Campo para la dirección predeterminada
    ];

    protected $hidden = [
        'password',
        'remember_token',
    ];

    protected function casts(): array
    {
        return [
            'email_verified_at' => 'datetime',
            'password'          => 'hashed',
        ];
    }

    // Relación con las direcciones del usuario
    public function addresses(): HasMany
    {
        return $this->hasMany(Address::class);
    }

    // Relación con la dirección predeterminada
    public function defaultAddress(): BelongsTo
    {
        return $this->belongsTo(Address::class, 'default_address_id');
    }

    // Establece una dirección como predeterminada
    public function setDefaultAddress(Address $address): void
    {
        $this->default_address_id = $address->id;
        $this->save();
    }
}
