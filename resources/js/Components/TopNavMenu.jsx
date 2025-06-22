import React from 'react';
import {
  Flame,
  BadgePercent,
  Truck,
  Sparkles,
  CalendarCheck,
} from 'lucide-react';

const navItems = [
  { label: 'Ofertas hoy', href: '/deals/today', icon: <Flame className="w-4 h-4 mr-1 text-red-500" /> },
  { label: 'SuperDeal', href: '/superdeal', icon: <BadgePercent className="w-4 h-4 mr-1 text-yellow-500" /> },
  { label: 'Envíos rápidos', href: '/fast-shipping', icon: <Truck className="w-4 h-4 mr-1 text-green-600" /> },
  { label: 'Novedades', href: '/new-arrivals', icon: <Sparkles className="w-4 h-4 mr-1 text-blue-500" /> },
  { label: 'Productos de temporada', href: '/seasonal', icon: <CalendarCheck className="w-4 h-4 mr-1 text-purple-600" /> },
];

const TopNavMenu = () => {
  return (
    <nav className="bg-white shadow-sm border-t border-b border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 overflow-x-auto">
        <ul className="flex space-x-6 whitespace-nowrap py-3 text-sm font-medium text-gray-700">
          {navItems.map((item) => (
            <li key={item.label}>
              <a
                href={item.href}
                className="flex items-center hover:text-blue-600 transition"
              >
                {item.icon}
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
};

export default TopNavMenu;
