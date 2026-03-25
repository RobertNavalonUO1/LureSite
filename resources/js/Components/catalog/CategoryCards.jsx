// resources/js/Components/CategoryCards.jsx
import React, { useCallback, useEffect, useRef, useState } from "react";
import { Link } from "@inertiajs/react";
import {
  Tv,
  Shirt,
  Home,
  Puzzle,
  Dumbbell,
  HeartPulse,
  Car,
  Smartphone,
  Laptop,
  Camera,
  Watch,
  ShoppingBag,
  Sofa,
  ShieldCheck,
  Hammer,
  Baby,
  PawPrint,
  UtensilsCrossed,
  Package,
  Headphones,
  Gamepad2,
  Gift,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Plus,
} from "lucide-react";

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
  juguetes: Puzzle,
  juegos: Puzzle,
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

const resolveIcon = (name = "", { variant = "default" } = {}) => {
  const normalized = name
    .toString()
    .normalize("NFD")
    .replace(/\p{Diacritic}/gu, "")
    .toLowerCase();

  const Icon = ICON_MAP[normalized] || ICON_MAP[normalized.split(" ")[0]] || Package;

  return (
    <Icon
      className={`h-4 w-4 flex-shrink-0 transition ${
        variant === "nav"
          ? "text-white/70 group-hover:text-[#febd69]"
          : "text-slate-500 group-hover:text-[#f3a847]"
      }`}
      aria-hidden="true"
    />
  );
};

const CategoryCards = ({ categories = [], renderDropdown }) => {
  const [visibleCategories, setVisibleCategories] = useState([]);
  const [hiddenCategories, setHiddenCategories] = useState([]);
  const [activeDropdown, setActiveDropdown] = useState(null);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const containerRef = useRef(null);
  const allButtonRef = useRef(null);
  const moreButtonRef = useRef(null);
  const measurementCache = useRef(new Map());

  const measureLabel = useCallback((label = "") => {
    if (measurementCache.current.has(label)) {
      return measurementCache.current.get(label);
    }

    const element = document.createElement("span");
    element.className = "px-3 py-1 text-sm font-medium whitespace-nowrap";
    element.style.position = "absolute";
    element.style.visibility = "hidden";
    element.textContent = label;

    document.body.appendChild(element);
    const width = element.offsetWidth + 48;
    document.body.removeChild(element);

    measurementCache.current.set(label, width);
    return width;
  }, []);

  const updateScrollIndicators = useCallback(() => {
    const node = containerRef.current;
    if (!node) {
      setCanScrollPrev(false);
      setCanScrollNext(false);
      return;
    }

    const { scrollLeft, scrollWidth, clientWidth } = node;
    setCanScrollPrev(scrollLeft > 8);
    setCanScrollNext(scrollLeft + clientWidth + 8 < scrollWidth);
  }, []);

  useEffect(() => {
    if (!containerRef.current) return undefined;

    const observer = new ResizeObserver(() => {
      if (!containerRef.current) return;

      const containerWidth = containerRef.current.offsetWidth;
      const visible = [];
      const hidden = [];

      const reservedSpace =
        (allButtonRef.current?.offsetWidth || 0) +
        (moreButtonRef.current?.offsetWidth || 96) +
        24;

      let spaceLeft = containerWidth - reservedSpace;

      for (const category of categories) {
        const width = measureLabel(category.name);
        if (spaceLeft - width >= 0) {
          visible.push(category);
          spaceLeft -= width;
        } else {
          hidden.push(category);
        }
      }

      setVisibleCategories(visible);
      setHiddenCategories(hidden);

      requestAnimationFrame(updateScrollIndicators);
    });

    observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [categories, measureLabel, updateScrollIndicators]);

  useEffect(() => {
    const handler = (event) => {
      if (
        !allButtonRef.current?.contains(event.target) &&
        !moreButtonRef.current?.contains(event.target)
      ) {
        closeDropdown();
      }
    };

    document.addEventListener("click", handler);
    return () => document.removeEventListener("click", handler);
  }, []);

  useEffect(() => {
    const node = containerRef.current;
    if (!node) return undefined;

    updateScrollIndicators();

    node.addEventListener("scroll", updateScrollIndicators, { passive: true });

    const resizeObserver = new ResizeObserver(updateScrollIndicators);
    resizeObserver.observe(node);

    return () => {
      node.removeEventListener("scroll", updateScrollIndicators);
      resizeObserver.disconnect();
    };
  }, [updateScrollIndicators]);

  const closeDropdown = () => {
    setActiveDropdown(null);
    renderDropdown?.(null);
  };

  const openDropdown = (type, anchorRef, list) => {
    if (!anchorRef.current) return;

    const rect = anchorRef.current.getBoundingClientRect();
    const dropdownWidth = Math.max(rect.width, 260);
    const viewportPadding = 16;
    const maxLeft = window.innerWidth - dropdownWidth - viewportPadding;

    const position = {
      top: rect.bottom + window.scrollY + 8,
      left: Math.min(rect.left + window.scrollX, maxLeft),
      width: dropdownWidth,
    };

    const dropdown = (
      <CategoryDropdown
        key={type}
        title={type === "all" ? "Todas las categorías" : "Más categorías"}
        categories={list}
        position={position}
        onClose={closeDropdown}
      />
    );

    setActiveDropdown(type);
    renderDropdown?.(dropdown);
  };

  const scrollContainer = (direction) => {
    if (!containerRef.current) return;
    const scrollAmount = direction === "next" ? 240 : -240;
    containerRef.current.scrollBy({ left: scrollAmount, behavior: "smooth" });
    setTimeout(updateScrollIndicators, 200);
  };

  return (
    <section className="relative overflow-hidden rounded-[28px] bg-gradient-to-r from-[#131921] via-[#182538] to-[#232f3e] px-2 sm:px-4 lg:px-6 py-3 md:py-5 shadow-lg ring-1 ring-black/15">
      <div className="pointer-events-none absolute inset-y-3 md:inset-y-4 left-0 hidden w-16 bg-gradient-to-r from-[#131921] to-transparent md:block" />
      <div className="pointer-events-none absolute inset-y-3 md:inset-y-4 right-0 hidden w-16 bg-gradient-to-l from-[#232f3e] to-transparent md:block" />

      <div className="relative flex items-center gap-3 sm:gap-4">
        <button
          type="button"
          onClick={() => scrollContainer("prev")}
          className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:border-white/40 hover:bg-white/20 hover:text-white md:flex"
          style={{
            opacity: canScrollPrev ? 1 : 0,
            pointerEvents: canScrollPrev ? "auto" : "none",
          }}
          aria-label="Ver categorías anteriores"
        >
          <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        </button>

        <div
          ref={containerRef}
          className="flex w-full items-center gap-3 overflow-x-auto px-1 py-3 md:py-4 text-sm font-medium text-white/80 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-white/20"
        >
          <div ref={allButtonRef} className="flex-shrink-0">
            <button
              type="button"
              onClick={() => openDropdown("all", allButtonRef, categories)}
              className={`group inline-flex items-center gap-3 rounded-full border px-5 py-2.5 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                activeDropdown === "all"
                  ? "border-[#f3a847] bg-[#f3a847] text-[#131921] shadow-lg"
                  : "border-transparent bg-[#febd69] text-[#131921] shadow-md hover:bg-[#f3a847]"
              }`}
              aria-haspopup="menu"
              aria-expanded={activeDropdown === "all"}
            >
              <Package className="h-4 w-4 text-[#131921]" aria-hidden="true" />
              <span>Todas las categorías</span>
              <ChevronDown
                className={`h-3.5 w-3.5 transition ${
                  activeDropdown === "all" ? "rotate-180" : "group-hover:-translate-y-0.5"
                }`}
                aria-hidden="true"
              />
            </button>
          </div>

          {visibleCategories.map((category) => (
            <Link
              key={category.id ?? category.slug ?? category.name}
              href={`/categoria/${category.slug ?? category.id ?? ""}`}
              className="group inline-flex min-w-[140px] items-center gap-2.5 rounded-full border border-transparent bg-white/5 px-5 py-2.5 text-white/80 transition hover:border-white/30 hover:bg-white/15 hover:text-white focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400"
            >
              {resolveIcon(category.name, { variant: "nav" })}
              <span className="truncate text-sm">{category.name}</span>
            </Link>
          ))}

          {hiddenCategories.length > 0 && (
            <div ref={moreButtonRef} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => openDropdown("more", moreButtonRef, hiddenCategories)}
                className={`group inline-flex items-center gap-3 rounded-full border px-5 py-2.5 text-white transition focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-400 ${
                  activeDropdown === "more"
                    ? "border-white bg-white/25 text-white shadow-lg"
                    : "border-white/10 bg-white/5 text-white/80 hover:border-white/30 hover:bg-white/15 hover:text-white"
                }`}
                aria-haspopup="menu"
                aria-expanded={activeDropdown === "more"}
              >
                <Plus className="h-4 w-4 text-[#febd69]" aria-hidden="true" />
                <span>Más</span>
                <ChevronDown
                  className={`h-3.5 w-3.5 transition ${
                    activeDropdown === "more" ? "rotate-180" : "group-hover:-translate-y-0.5"
                  }`}
                  aria-hidden="true"
                />
              </button>
            </div>
          )}
        </div>

        <button
          type="button"
          onClick={() => scrollContainer("next")}
          className="hidden h-10 w-10 items-center justify-center rounded-full border border-white/10 bg-white/10 text-white/70 transition hover:border-white/40 hover:bg-white/20 hover:text-white md:flex"
          style={{
            opacity: canScrollNext ? 1 : 0,
            pointerEvents: canScrollNext ? "auto" : "none",
          }}
          aria-label="Ver más categorías"
        >
          <ChevronRight className="h-4 w-4" aria-hidden="true" />
        </button>
      </div>
    </section>
  );
};

const CategoryDropdown = ({ categories, position, onClose, title }) => (
  <div
    className="fixed z-[2000] w-[min(320px,90vw)] max-h-[420px] overflow-y-auto rounded-2xl border border-slate-200 bg-white shadow-2xl ring-1 ring-black/10"
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
      {categories.map((category) => (
        <li key={category.id ?? category.slug ?? category.name}>
          <Link
            href={`/categoria/${category.slug ?? category.id ?? ""}`}
            onClick={onClose}
            className="group flex items-center gap-2 px-4 py-3 transition hover:bg-[#fdeac2] hover:text-[#131921]"
            role="menuitem"
          >
            {resolveIcon(category.name)}
            <span className="truncate">{category.name}</span>
          </Link>
        </li>
      ))}
    </ul>
  </div>
);

export default CategoryCards;
