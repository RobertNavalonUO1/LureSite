import React, { useState, useRef, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import {
  Tv, Shirt, Home, Puzzle, Dumbbell, HeartPulse, Car, Smartphone, Laptop,
  Camera, Watch, ShoppingBag, Sofa, ShieldCheck, Fridge, Hammer, Baby,
  PawPrint, UtensilsCrossed, Package
} from 'lucide-react';

const iconMap = {
  'Electrónica': Tv,
  'Moda y Ropa': Shirt,
  'Hogar y Jardín': Home,
  'Juguetes y Juegos': Puzzle,
  'Deportes y Aire Libre': Dumbbell,
  'Belleza y Salud': HeartPulse,
  'Automóviles y Motos': Car,
  'Telefonía y Accesorios': Smartphone,
  'Computadoras y Oficina': Laptop,
  'Cámaras y Fotografía': Camera,
  'Relojes y Joyas': Watch,
  'Bolsas y Calzado': ShoppingBag,
  'Muebles y Decoración': Sofa,
  'Seguridad y Protección': ShieldCheck,
  'Electrodomésticos': Fridge,
  'Herramientas e Industria': Hammer,
  'Bebés y Niños': Baby,
  'Mascotas y Animales': PawPrint,
  'Alimentos y Bebidas': UtensilsCrossed,
  'General': Package
};

const getIcon = (name) => {
  const Icon = iconMap[name] || Package;
  return <Icon className="w-4 h-4 text-gray-500" />;
};

const CategoryCards = ({ categories, renderDropdown }) => {
  const [showAll, setShowAll] = useState(false);
  const [showMore, setShowMore] = useState(false);
  const [visibleCategories, setVisibleCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const containerRef = useRef(null);
  const allBtnRef = useRef(null);
  const moreBtnRef = useRef(null);

  useEffect(() => {
    const observer = new ResizeObserver(() => {
      if (!containerRef.current) return;
      const containerWidth = containerRef.current.offsetWidth;
      let totalWidth = allBtnRef.current?.offsetWidth || 0;
      const visible = [];
      const hidden = [];

      for (const category of categories) {
        const temp = document.createElement('span');
        temp.className = 'text-sm font-medium px-2 py-1 whitespace-nowrap';
        temp.style.position = 'absolute';
        temp.style.visibility = 'hidden';
        temp.innerText = category.name;
        containerRef.current.appendChild(temp);
        const width = temp.offsetWidth + 40;
        containerRef.current.removeChild(temp);

        totalWidth += width;
        if (totalWidth < containerWidth - 120) {
          visible.push(category);
        } else {
          hidden.push(category);
        }
      }

      setVisibleCategories(visible);
      setHiddenCategories(hidden);
    });

    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [categories]);

  const openDropdown = (type, ref, list) => {
    const rect = ref.current.getBoundingClientRect();
    const position = {
      top: rect.bottom + window.scrollY,
      left: rect.left + window.scrollX,
    };

    const close = () => {
      setShowAll(false);
      setShowMore(false);
      renderDropdown(null);
    };

    renderDropdown(
      <DropdownList
        categories={list}
        position={position}
        onClose={close}
        title={type === 'all' ? 'Todas las categorías' : 'Más categorías'}
        icon={<Package className="w-4 h-4" />}
      />
    );

    setShowAll(type === 'all');
    setShowMore(type === 'more');
  };

  useEffect(() => {
    const handler = (e) => {
      if (
        !allBtnRef.current?.contains(e.target) &&
        !moreBtnRef.current?.contains(e.target)
      ) {
        setShowAll(false);
        setShowMore(false);
        renderDropdown(null);
      }
    };

    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  return (
    <div
      ref={containerRef}
      className="relative flex items-center gap-4 px-4 py-3 text-sm font-medium text-slate-700 whitespace-nowrap overflow-hidden"
    >
      <div ref={allBtnRef}>
        <button
          onClick={() => openDropdown('all', allBtnRef, categories)}
          className="text-violet-600 hover:text-fuchsia-500 font-semibold flex items-center gap-1"
        >
          <Package className="w-4 h-4" /> <span>Todas las categorías ▾</span>
        </button>
      </div>

      {visibleCategories.map((cat) => (
        <Link
          key={cat.id}
          href={`/category/${cat.id}`}
          className="flex items-center gap-1 px-2 py-1 hover:text-indigo-600 hover:bg-indigo-50 rounded transition"
        >
          {getIcon(cat.name)}
          <span>{cat.name}</span>
        </Link>
      ))}

      {hiddenCategories.length > 0 && (
        <div ref={moreBtnRef}>
          <button
            onClick={() => openDropdown('more', moreBtnRef, hiddenCategories)}
            className="text-violet-600 hover:text-fuchsia-500 font-semibold flex items-center gap-1"
          >
            ➕ Más ▾
          </button>
        </div>
      )}
    </div>
  );
};

const DropdownList = ({ categories, position, onClose, title, icon }) => (
  <div
    className="fixed z-[2000] w-64 max-h-[400px] overflow-y-auto bg-white border shadow-2xl rounded-xl animate-fade-in"
    style={{
      top: `${position.top}px`,
      left: `${position.left}px`
    }}
  >
    <div className="px-4 py-3 font-semibold text-indigo-700 border-b bg-indigo-50 flex items-center gap-2">
      {icon} <span>{title}</span>
    </div>
    <ul className="divide-y divide-gray-100 py-1">
      {categories.map((cat) => (
        <li key={cat.id}>
          <Link
            href={`/category/${cat.id}`}
            onClick={onClose}
            className="flex items-center gap-2 px-4 py-2 hover:bg-indigo-50 text-slate-700 transition"
          >
            {getIcon(cat.name)}
            <span>{cat.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default CategoryCards;
