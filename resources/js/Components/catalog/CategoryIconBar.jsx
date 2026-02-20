import React from 'react';
import { Link } from '@inertiajs/react';
import {
  Baby,
  Camera,
  Car,
  ChevronDown,
  Dumbbell,
  Gamepad2,
  Gift,
  Hammer,
  Headphones,
  HeartPulse,
  Home,
  Laptop,
  Package,
  PawPrint,
  Plus,
  Shirt,
  ShieldCheck,
  ShoppingBag,
  Smartphone,
  Sofa,
  Tv,
  UtensilsCrossed,
  Watch,
} from 'lucide-react';

const ICON_MAP = {
  electronica: Tv,
  tecnologia: Smartphone,
  telefonia: Smartphone,
  computadoras: Laptop,
  oficina: Laptop,
  audio: Headphones,
  videojuegos: Gamepad2,
  moda: Shirt,
  ropa: Shirt,
  calzado: ShoppingBag,
  bolsos: ShoppingBag,
  hogar: Home,
  jardin: Home,
  muebles: Sofa,
  decoracion: Sofa,
  juguetes: Gift,
  juegos: Gamepad2,
  deporte: Dumbbell,
  deportes: Dumbbell,
  belleza: HeartPulse,
  salud: HeartPulse,
  automovil: Car,
  autos: Car,
  moto: Car,
  camara: Camera,
  fotografia: Camera,
  relojes: Watch,
  joyeria: Watch,
  seguridad: ShieldCheck,
  proteccion: ShieldCheck,
  electrodomestico: ShieldCheck,
  herramientas: Hammer,
  industrial: Hammer,
  bebe: Baby,
  infantil: Baby,
  mascotas: PawPrint,
  animales: PawPrint,
  alimentos: UtensilsCrossed,
  bebidas: UtensilsCrossed,
  regalo: Gift,
};

const resolveIcon = (name = '') => {
  const normalized = name
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase();

  return ICON_MAP[normalized] || ICON_MAP[normalized.split(' ')[0]] || Package;
};

const CategoryDropdown = ({ categories, position, onClose, title }) => (
  <div
    className="fixed z-[2000] w-[min(360px,92vw)] max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/10"
    style={{
      top: position.top,
      left: position.left,
      minWidth: position.width,
    }}
    role="menu"
  >
    <div className="sticky top-0 flex items-center gap-2 border-b border-slate-200 bg-[#131921] px-4 py-3 text-sm font-semibold text-[#febd69]">
      <Package className="h-4 w-4 text-[#febd69]" aria-hidden="true" />
      <span>{title}</span>
    </div>
    <ul className="grid grid-cols-1 divide-y divide-slate-100 text-sm text-slate-600 sm:grid-cols-2 sm:divide-y-0 sm:divide-x sm:[&>li]:border-b sm:[&>li]:border-b-0">
      {categories.map((category) => {
        const Icon = resolveIcon(category.name);
        return (
          <li key={category.id ?? category.slug ?? category.name}>
            <Link
              href={`/categoria/${category.slug ?? category.id ?? ''}`}
              onClick={onClose}
              className="group flex items-center gap-2 px-4 py-3 transition hover:bg-[#fdeac2] hover:text-[#131921]"
              role="menuitem"
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-slate-500 transition group-hover:text-[#f3a847]" aria-hidden="true" />
              <span className="truncate">{category.name}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  </div>
);

const ChevronBadge = () => (
  <span className="pointer-events-none absolute -bottom-1 -right-1 inline-flex h-4 w-4 items-center justify-center rounded-full border border-white/10 bg-white/10">
    <ChevronDown className="h-3 w-3 text-white/70" aria-hidden="true" />
  </span>
);

export default function CategoryIconBar({ categories = [], renderDropdown, maxVisible = 7 }) {
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const allButtonRef = React.useRef(null);
  const moreButtonRef = React.useRef(null);

  const visible = categories.slice(0, maxVisible);
  const hidden = categories.slice(maxVisible);

  const closeDropdown = React.useCallback(() => {
    setActiveDropdown(null);
    renderDropdown?.(null);
  }, [renderDropdown]);

  React.useEffect(() => {
    const handler = (event) => {
      if (
        !allButtonRef.current?.contains(event.target) &&
        !moreButtonRef.current?.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener('click', handler);
    return () => document.removeEventListener('click', handler);
  }, [closeDropdown]);

  const openDropdown = (type, anchorRef, list) => {
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const dropdownWidth = Math.min(380, Math.max(rect.width * 6, 280));
    const viewportPadding = 12;
    const maxLeft = window.innerWidth - dropdownWidth - viewportPadding;

    const position = {
      top: rect.bottom + window.scrollY + 10,
      left: Math.min(rect.left + window.scrollX, maxLeft),
      width: dropdownWidth,
    };

    const dropdown = (
      <CategoryDropdown
        key={type}
        title={type === 'all' ? 'Todas las categorias' : 'Mas categorias'}
        categories={list}
        position={position}
        onClose={closeDropdown}
      />
    );

    setActiveDropdown(type);
    renderDropdown?.(dropdown);
  };

  const buttonBase =
    'relative group inline-flex h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/80 shadow-sm transition hover:border-white/25 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400';

  const activeButton = 'border-[#f3a847] bg-[#febd69] text-[#131921] shadow-md';

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-[120rem] px-2 sm:px-4">
        <div className="relative -mt-3">
          <div className="flex items-center justify-between gap-3 rounded-full bg-gradient-to-r from-[#131921] via-[#182538] to-[#232f3e] px-3 py-2 shadow-lg ring-1 ring-black/15">
            <div className="flex w-full items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20">
              <button
                ref={allButtonRef}
                type="button"
                onClick={() => openDropdown('all', allButtonRef, categories)}
                className={`${buttonBase} ${activeDropdown === 'all' ? activeButton : ''}`}
                aria-label="Todas las categorias"
                aria-haspopup="menu"
                aria-expanded={activeDropdown === 'all'}
                title="Todas las categorias"
              >
                <Package className="h-5 w-5" aria-hidden="true" />
                <ChevronBadge />
              </button>

              {visible.map((category) => {
                const Icon = resolveIcon(category.name);
                return (
                  <Link
                    key={category.id ?? category.slug ?? category.name}
                    href={`/categoria/${category.slug ?? category.id ?? ''}`}
                    className={buttonBase}
                    aria-label={category.name}
                    title={category.name}
                  >
                    <Icon className="h-5 w-5 transition group-hover:text-[#febd69]" aria-hidden="true" />
                  </Link>
                );
              })}

              {hidden.length > 0 && (
                <button
                  ref={moreButtonRef}
                  type="button"
                  onClick={() => openDropdown('more', moreButtonRef, hidden)}
                  className={`${buttonBase} ${activeDropdown === 'more' ? activeButton : ''}`}
                  aria-label="Mas categorias"
                  aria-haspopup="menu"
                  aria-expanded={activeDropdown === 'more'}
                  title="Mas"
                >
                  <Plus className="h-5 w-5" aria-hidden="true" />
                  <ChevronBadge />
                </button>
              )}
            </div>

            <div className="hidden items-center gap-2 pr-1 text-xs font-semibold text-white/60 sm:flex">
              <span className="hidden md:inline">Categorias</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              <span className="hidden lg:inline">Tap para abrir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
