import React, { useEffect, useMemo, useRef } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  Flame,
  BadgePercent,
  Truck,
  Sparkles,
  CalendarCheck,
  Compass,
} from "lucide-react";

const BASE_NAV_ITEMS = [
  {
    key: "dealsToday",
    label: "Ofertas de hoy",
    href: "/deals/today",
    icon: Flame,
    accent: "text-rose-500",
  },
  {
    key: "superDeal",
    label: "Super Deal",
    href: "/superdeal",
    icon: BadgePercent,
    accent: "text-amber-500",
  },
  {
    key: "fastShipping",
    label: "Envíos rápidos",
    href: "/fast-shipping",
    icon: Truck,
    accent: "text-emerald-500",
  },
  {
    key: "newArrivals",
    label: "Novedades",
    href: "/new-arrivals",
    icon: Sparkles,
    accent: "text-indigo-500",
  },
  {
    key: "seasonal",
    label: "Temporada",
    href: "/seasonal",
    icon: CalendarCheck,
    accent: "text-purple-500",
  },
];

const TopNavMenu = () => {
  const { url, props } = usePage();
  const metrics = props?.navMetrics || {};
  const navRef = useRef(null);

  const navItems = useMemo(
    () =>
      BASE_NAV_ITEMS.map((item) => ({
        ...item,
        badge: metrics?.[item.key]?.count ?? null,
        subtitle: metrics?.[item.key]?.label ?? null,
      })),
    [metrics]
  );

  useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    const updateHeight = () => {
      const height = navRef.current?.offsetHeight ?? 0;
      root.style.setProperty('--topnav-sticky-height', `${height}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (navRef.current) observer.observe(navRef.current);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, []);

  return (
    <nav
      ref={navRef}
      className="sticky z-40 border-b border-slate-200 bg-white/90 backdrop-blur"
      style={{ top: 'var(--header-sticky-height, 0px)' }}
    >
      <div className="relative mx-auto flex max-w-full items-center gap-3 px-2 sm:px-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white" />
        <ul className="flex w-full gap-2 overflow-x-auto py-3 text-lg font-bold text-slate-700 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              url === item.href || (url !== "/" && url.startsWith(item.href));
            return (
              <li key={item.key} className="flex-shrink-0">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex flex-col items-start justify-center rounded-2xl border px-5 py-3 transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 sm:flex-row sm:items-center sm:gap-2 ${
                    isActive
                      ? "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm"
                      : "border-transparent bg-white hover:border-indigo-100 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`h-5 w-5 ${item.accent}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {item.subtitle && !isActive && (
                    <span className="text-sm font-medium text-slate-400 sm:hidden">
                      {item.subtitle}
                    </span>
                  )}
                  {item.badge !== null && (
                    <span
                      className={`mt-1 inline-flex items-center rounded-full px-3 py-1 text-xs font-semibold sm:mt-0 ${
                        isActive
                          ? "bg-indigo-100 text-indigo-700"
                          : "bg-slate-100 text-slate-500 group-hover:bg-indigo-100 group-hover:text-indigo-600"
                      }`}
                    >
                      {item.badge}
                    </span>
                  )}
                </Link>
              </li>
            );
          })}
        </ul>

        <div className="hidden flex-shrink-0 lg:block">
          <Link
            href="/search"
            className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 px-5 py-3 text-base font-bold uppercase tracking-wide text-indigo-600 transition hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400"
          >
            <Compass className="h-5 w-5" />
            Ver todo
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TopNavMenu;
