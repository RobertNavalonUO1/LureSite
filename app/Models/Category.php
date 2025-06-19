<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Category extends Model
{
    use HasFactory;

    // Definir los campos que se pueden asignar de manera masiva
    protected $fillable = [
        'name',
        'slug',
        'description',
    ];

    /**
     * Relación con el modelo Product (si es necesario)
     * Si una categoría tiene muchos productos, lo defines de esta manera.
     */
    public function products()
    {
        return $this->hasMany(Product::class);
    }
}
