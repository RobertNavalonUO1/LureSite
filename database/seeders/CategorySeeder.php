<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Category;
use Illuminate\Support\Str;

class CategorySeeder extends Seeder
{
    /**
     * Ejecutar el seeder.
     *
     * @return void
     */
    public function run()
    {
        $categories = [
            'Electrónica',
            'Moda y Ropa',
            'Hogar y Jardín',
            'Juguetes y Juegos',
            'Deportes y Aire Libre',
            'Belleza y Salud',
            'Automóviles y Motos',
            'Telefonía y Accesorios',
            'Computadoras y Oficina',
            'Cámaras y Fotografía',
            'Relojes y Joyas',
            'Bolsas y Calzado',
            'Muebles y Decoración',
            'Seguridad y Protección',
            'Electrodomésticos',
            'Herramientas e Industria',
            'Bebés y Niños',
            'Mascotas y Animales',
            'Alimentos y Bebidas',
        ];

        foreach ($categories as $category) {
            Category::create([
                'name' => $category,
                'slug' => Str::slug($category),
                'description' => 'Categoría de ' . strtolower($category),
            ]);
        }
    }
}
