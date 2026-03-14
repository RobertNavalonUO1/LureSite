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

const normalizeKey = (value = '') =>
  value
    .toString()
    .normalize('NFD')
    .replace(/\p{Diacritic}/gu, '')
    .toLowerCase()
    .trim();

const resolveIcon = (category) => {
  const candidates = [category?.slug, category?.name, category]
    .map((value) => normalizeKey(value || ''))
    .filter(Boolean);

  for (const candidate of candidates) {
    const firstWord = candidate.split(/[-_\s]+/)[0];
    if (ICON_MAP[candidate]) return ICON_MAP[candidate];
    if (ICON_MAP[firstWord]) return ICON_MAP[firstWord];
  }

  return Package;
};

const CategoryDropdown = ({ categories, position, onClose, title }) => (
  <div
    className="fixed z-[5200] w-[min(360px,92vw)] max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/10"
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
    <ul className="grid grid-cols-1 divide-y divide-slate-100 text-sm text-slate-600 sm:grid-cols-2 sm:divide-y-0 sm:divide-x">
      {categories.map((category) => {
        const categoryLabel = category?.name ?? String(category ?? '');
        const categorySlug = category?.slug ?? category?.id ?? '';
        const Icon = resolveIcon(category);
        return (
          <li key={category?.id ?? category?.slug ?? categoryLabel}>
            <Link
              href={`/categoria/${categorySlug}`}
              onClick={onClose}
              className="group flex items-center gap-2 px-4 py-3 transition hover:bg-[#fdeac2] hover:text-[#131921]"
              role="menuitem"
            >
              <Icon className="h-4 w-4 flex-shrink-0 text-slate-500 transition group-hover:text-[#f3a847]" aria-hidden="true" />
              <span className="truncate">{categoryLabel}</span>
            </Link>
          </li>
        );
      })}
    </ul>
  </div>
);

export default function CategoryIconBar({ categories = [], renderDropdown, maxVisible = 7, compact = false }) {
  const [activeDropdown, setActiveDropdown] = React.useState(null);
  const allButtonRef = React.useRef(null);
  const moreButtonRef = React.useRef(null);

  const effectiveVisible = compact ? Math.max(5, Math.min(maxVisible, 8)) : maxVisible;
  const visible = categories.slice(0, effectiveVisible);
  const hidden = categories.slice(effectiveVisible);

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
        title={type === 'all' ? 'Todas las categorías' : 'Más categorías'}
        categories={list}
        position={position}
        onClose={closeDropdown}
      />
    );

    setActiveDropdown(type);
    renderDropdown?.(dropdown);
  };

  const buttonBase = compact
    ? 'group inline-flex h-9 w-9 md:h-10 md:w-10 flex-shrink-0 items-center justify-center rounded-lg md:rounded-xl border border-white/10 bg-white/10 text-white/85 shadow-sm transition hover:border-white/25 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400'
    : 'group inline-flex flex-shrink-0 items-center gap-2 rounded-full border border-white/10 bg-white/10 px-4 py-2.5 text-sm font-semibold text-white/85 shadow-sm transition hover:border-white/25 hover:bg-white/15 focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400';

  const activeButton = 'border-[#f3a847] bg-[#febd69] text-[#131921] shadow-md';

  return (
    <div className="relative">
      <div className="mx-auto w-full max-w-[120rem] px-2 sm:px-4">
        <div className={compact ? 'relative mt-0' : 'relative -mt-3'}>
          <div
            className={[
              'flex items-center justify-between gap-3 bg-gradient-to-r from-[#131921] via-[#182538] to-[#232f3e] shadow-lg ring-1 ring-black/15',
              compact ? 'rounded-xl md:rounded-2xl px-1.5 md:px-2 py-1.5 md:py-2' : 'rounded-full px-3 py-2',
            ].join(' ')}
          >
            <div className={compact ? 'flex w-full items-center gap-1.5 md:gap-2 overflow-x-auto py-0.5 md:py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20' : 'flex w-full items-center gap-2 overflow-x-auto py-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20'}>
              <button
                ref={allButtonRef}
                type="button"
                onClick={() => openDropdown('all', allButtonRef, categories)}
                className={`${buttonBase} ${activeDropdown === 'all' ? activeButton : ''}`}
                aria-label="Todas las categorías"
                aria-haspopup="menu"
                aria-expanded={activeDropdown === 'all'}
                title="Todas las categorías"
              >
                <Package className="h-4 w-4" aria-hidden="true" />
                {!compact ? <span className="whitespace-nowrap">Todas las categorías</span> : null}
                {!compact ? <ChevronDown className="h-4 w-4 opacity-80" aria-hidden="true" /> : null}
                {compact ? <span className="sr-only">Todas las categorías</span> : null}
              </button>

              {visible.map((category) => {
                const categoryLabel = category?.name ?? String(category ?? '');
                const categorySlug = category?.slug ?? category?.id ?? '';
                const Icon = resolveIcon(category);
                return (
                  <Link
                    key={category?.id ?? category?.slug ?? categoryLabel}
                    href={`/categoria/${categorySlug}`}
                    className={buttonBase}
                    aria-label={categoryLabel}
                    title={categoryLabel}
                  >
                    <Icon className="h-4 w-4 text-white/90 transition group-hover:text-[#febd69]" aria-hidden="true" />
                    {!compact ? <span className="whitespace-nowrap">{categoryLabel}</span> : null}
                    {compact ? <span className="sr-only">{categoryLabel}</span> : null}
                  </Link>
                );
              })}

              {hidden.length > 0 && (
                <button
                  ref={moreButtonRef}
                  type="button"
                  onClick={() => openDropdown('more', moreButtonRef, hidden)}
                  className={`${buttonBase} ${activeDropdown === 'more' ? activeButton : ''}`}
                  aria-label="Más categorías"
                  aria-haspopup="menu"
                  aria-expanded={activeDropdown === 'more'}
                  title="Más"
                >
                  <Plus className="h-4 w-4" aria-hidden="true" />
                  {!compact ? <span className="whitespace-nowrap">Más</span> : null}
                  {!compact ? <ChevronDown className="h-4 w-4 opacity-80" aria-hidden="true" /> : null}
                  {compact ? <span className="sr-only">Más categorías</span> : null}
                </button>
              )}
            </div>

            <div className={`hidden items-center gap-2 pr-1 text-xs font-semibold text-white/60 sm:flex ${compact ? 'opacity-0 w-0 overflow-hidden pr-0' : ''}`}>
              <span className="hidden md:inline">Categorías</span>
              <span className="h-1.5 w-1.5 rounded-full bg-white/25" />
              <span className="hidden lg:inline">Tap para abrir</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
