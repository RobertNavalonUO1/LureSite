import React from 'react';
import {
  Tv, Shirt, Home, Puzzle, Football, HeartPulse, Car, Smartphone, Laptop,
  Camera, Watch, ShoppingBag, Sofa, ShieldCheck, Fridge, Hammer, Baby,
  PawPrint, Utensils, Package
} from 'lucide-react';

const categories = [
  { name: 'Electrónica', icon: Tv },
  { name: 'Moda y Ropa', icon: Shirt },
  { name: 'Hogar y Jardín', icon: Home },
  { name: 'Juguetes y Juegos', icon: Puzzle },
  { name: 'Deportes y Aire Libre', icon: Football },
  { name: 'Belleza y Salud', icon: HeartPulse },
  { name: 'Automóviles y Motos', icon: Car },
  { name: 'Telefonía y Accesorios', icon: Smartphone },
  { name: 'Computadoras y Oficina', icon: Laptop },
  { name: 'Cámaras y Fotografía', icon: Camera },
  { name: 'Relojes y Joyas', icon: Watch },
  { name: 'Bolsas y Calzado', icon: ShoppingBag },
  { name: 'Muebles y Decoración', icon: Sofa },
  { name: 'Seguridad y Protección', icon: ShieldCheck },
  { name: 'Electrodomésticos', icon: Fridge },
  { name: 'Herramientas e Industria', icon: Hammer },
  { name: 'Bebés y Niños', icon: Baby },
  { name: 'Mascotas y Animales', icon: PawPrint },
  { name: 'Alimentos y Bebidas', icon: Utensils },
  { name: 'General', icon: Package }
];

export default function CategoryIconsGrid() {
  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-6 p-4">
      {categories.map(({ name, icon: Icon }) => (
        <div key={name} className="flex flex-col items-center text-center hover:scale-105 transition-transform">
          <Icon className="w-8 h-8 text-blue-600 mb-2" />
          <span className="text-sm font-medium text-gray-700">{name}</span>
        </div>
      ))}
    </div>
  );
}
