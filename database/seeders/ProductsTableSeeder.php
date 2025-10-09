<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class ProductsTableSeeder extends Seeder
{
    /**
     * Run the database seeds.
     */
    public function run(): void
    {
        // Obtener todas las categorías existentes
        $categories = DB::table('categories')->pluck('id', 'name')->toArray();

        // Lista extensa de productos
        $products = [
            // Electrónica
            ['Smartphone Xiaomi Redmi Note 12', 'Potente con pantalla AMOLED', 299.99, 'Electrónica', false],
            ['Laptop Dell XPS 15', 'Laptop de alto rendimiento para trabajo y gaming', 1299.99, 'Computadoras y Oficina', false],
            ['Auriculares Inalámbricos Sony', 'Cancelación de ruido y gran calidad de sonido', 199.99, 'Electrónica', false],
            ['Smartwatch Apple Watch Series 8', 'Medición de salud y rendimiento deportivo', 499.99, 'Relojes y Joyas', false],
            ['Monitor LG UltraWide 34"', 'Pantalla curva para multitarea y gaming', 499.99, 'Computadoras y Oficina', false],
            ['iPhone 15 Pro', 'El último smartphone de Apple con chip A17', 1399.99, 'Electrónica', false],
            ['Samsung Galaxy S23 Ultra', 'Cámara de 200MP y pantalla Dynamic AMOLED', 1199.99, 'Electrónica', false],
            ['Tablet iPad Air 2024', 'Ligera, potente y con pantalla Liquid Retina', 799.99, 'Electrónica', false],
            ['Kindle Paperwhite 11ª Gen', 'E-reader con luz cálida ajustable', 149.99, 'Electrónica', false],
            ['Xiaomi Mi Band 8', 'Pulsera inteligente con monitor de salud', 49.99, 'Electrónica', false],

            // Moda y Ropa
            ['Chaqueta de Cuero Negra', 'Estilo elegante y resistente', 129.99, 'Moda y Ropa', false],
            ['Zapatillas Adidas Running', 'Para mayor comodidad en el deporte', 89.99, 'Moda y Ropa', false],
            ['Reloj Casio G-Shock', 'Resistente al agua y a golpes', 149.99, 'Relojes y Joyas', false],
            ['Bolso de Cuero para Dama', 'Diseño elegante y espacioso', 79.99, 'Bolsas y Calzado', false],
            ['Gafas de Sol Ray-Ban', 'Protección UV y diseño clásico', 99.99, 'Moda y Ropa', false],
            ['Sudadera Nike Sportswear', 'Comodidad y estilo casual', 59.99, 'Moda y Ropa', false],
            ['Pantalón Levi’s 511', 'Vaquero slim fit clásico', 69.99, 'Moda y Ropa', false],
            ['Vestido Mango Floral', 'Vestido largo con estampado primaveral', 49.99, 'Moda y Ropa', false],
            ['Botines Panama Jack', 'Calzado resistente para invierno', 119.99, 'Moda y Ropa', false],
            ['Camiseta Desigual Original', 'Diseño colorido y único', 39.99, 'Moda y Ropa', false],

            // Hogar y Jardín
            ['Juego de Sábanas King Size', '100% algodón para mayor suavidad', 59.99, 'Hogar y Jardín', false],
            ['Cafetera Expresso Automática', 'Prepara café de calidad barista en casa', 249.99, 'Electrodomésticos', false],
            ['Aspiradora Robot Xiaomi', 'Limpieza automática con sensores inteligentes', 349.99, 'Electrodomésticos', false],
            ['Silla Gamer RGB', 'Comodidad y estilo para largas sesiones de juego', 199.99, 'Muebles y Decoración', false],
            ['Espejo LED con Sensor', 'Iluminación ajustable para maquillaje', 49.99, 'Hogar y Jardín', false],
            ['Colchón Pikolin Normablock', 'Descanso ergonómico y firme', 399.99, 'Hogar y Jardín', false],
            ['Robot de Cocina Cecotec Mambo', 'Cocina multifunción con wifi', 299.99, 'Electrodomésticos', false],
            ['Aire Acondicionado Daikin', 'Eficiencia energética A+++', 699.99, 'Electrodomésticos', false],
            ['Lámpara Philips Hue', 'Iluminación inteligente controlable por app', 89.99, 'Hogar y Jardín', false],
            ['Barbacoa Weber Spirit II', 'Barbacoa a gas para jardín', 499.99, 'Hogar y Jardín', false],

            // Juguetes y Juegos
            ['Dron DJI Mini 3', 'Cámara 4K y vuelo estabilizado', 499.99, 'Juguetes y Juegos', false],
            ['Consola PlayStation 5', 'La consola más avanzada de Sony', 599.99, 'Juguetes y Juegos', false],
            ['Set LEGO Star Wars', 'Nave de colección con más de 1500 piezas', 159.99, 'Juguetes y Juegos', false],
            ['Patineta Eléctrica Xiaomi', 'Autonomía de 30 km y diseño ligero', 399.99, 'Deportes y Aire Libre', false],
            ['Juego de Mesa Catán', 'Estrategia y diversión para toda la familia', 39.99, 'Juguetes y Juegos', false],
            ['Nintendo Switch OLED', 'Consola híbrida con pantalla mejorada', 349.99, 'Juguetes y Juegos', false],
            ['Funko Pop Harry Potter', 'Figura coleccionable edición limitada', 19.99, 'Juguetes y Juegos', false],
            ['Puzzle Ravensburger 3000 piezas', 'Rompecabezas de alta calidad', 29.99, 'Juguetes y Juegos', false],
            ['Monopoly España', 'Edición especial con ciudades españolas', 34.99, 'Juguetes y Juegos', false],
            ['Playmobil City Action', 'Set de bomberos con accesorios', 44.99, 'Juguetes y Juegos', false],

            // Belleza y Salud
            ['Perfume Dior Sauvage', 'Fragancia elegante y masculina', 89.99, 'Belleza y Salud', false],
            ['Plancha para el Cabello Babyliss', 'Tecnología iónica para un alisado perfecto', 79.99, 'Belleza y Salud', false],
            ['Rizador de Pestañas Automático', 'Rizos duraderos con calor controlado', 49.99, 'Belleza y Salud', false],
            ['Suplemento Proteico Whey', 'Alto contenido de proteína para atletas', 69.99, 'Belleza y Salud', false],
            ['Sillón de Masajes Shiatsu', 'Relajación total con diferentes modos', 599.99, 'Muebles y Decoración', false],
            ['Crema Nivea Soft', 'Hidratación intensiva para todo tipo de piel', 4.99, 'Belleza y Salud', false],
            ['Cepillo Eléctrico Oral-B', 'Limpieza dental profesional en casa', 39.99, 'Belleza y Salud', false],
            ['Protector Solar ISDIN', 'Alta protección UVA/UVB', 24.99, 'Belleza y Salud', false],
            ['Mascarilla Garnier Fructis', 'Nutrición intensa para el cabello', 6.99, 'Belleza y Salud', false],
            ['Bálsamo Labial Carmex', 'Alivio inmediato para labios secos', 3.99, 'Belleza y Salud', false],

            // Automóviles y Motos
            ['Casco para Motociclista', 'Certificado DOT con diseño aerodinámico', 129.99, 'Automóviles y Motos', false],
            ['Llantas Michelin 18”', 'Mayor agarre y durabilidad', 149.99, 'Automóviles y Motos', false],
            ['Batería de Auto Bosch', 'Alta duración y rendimiento', 119.99, 'Automóviles y Motos', false],
            ['Radio Multimedia para Coche', 'Pantalla táctil con Bluetooth y GPS', 249.99, 'Automóviles y Motos', false],
            ['Cámara de Reversa HD', 'Mayor seguridad al estacionar', 89.99, 'Automóviles y Motos', false],
            ['Aceite Castrol EDGE 5W-30', 'Lubricante sintético para motor', 39.99, 'Automóviles y Motos', false],
            ['Portabicicletas Thule', 'Para transportar bicicletas en el coche', 199.99, 'Automóviles y Motos', false],
            ['Kit de Emergencia Michelin', 'Incluye triángulo, chaleco y botiquín', 29.99, 'Automóviles y Motos', false],
            ['Cargador de Batería NOCO', 'Cargador inteligente para coche', 59.99, 'Automóviles y Motos', false],
            ['Limpiaparabrisas Bosch Aerotwin', 'Limpieza eficiente y silenciosa', 19.99, 'Automóviles y Motos', false],

            // Productos para adultos
            ['Juguete para Adultos Premium', 'Producto de alta calidad para mayores de edad', 69.99, 'Belleza y Salud', true],
            ['Lubricante Base Agua', 'Hipoalergénico y de larga duración', 19.99, 'Belleza y Salud', true],
            ['Lencería Sexy Roja', 'Con encaje y detalles elegantes', 39.99, 'Moda y Ropa', true],
        ];

        // Insertar los productos en la base de datos
        foreach ($products as $product) {
            DB::table('products')->insert([
                'name' => $product[0],
                'description' => $product[1],
                'price' => $product[2],
                'image_url' => 'https://via.placeholder.com/150', // Imagen de prueba
                'stock' => rand(10, 100), // Stock aleatorio
                'category_id' => $categories[$product[3]] ?? 1, // Relación con la categoría
                'is_adult' => $product[4],
                'link' => '/product/' . strtolower(str_replace(' ', '-', $product[0])),
            ]);
        }
    }
}
