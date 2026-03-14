import React, { useMemo } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  Flame,
  BadgePercent,
  Truck,
  Sparkles,
  CalendarCheck,
  Compass,
} from "lucide-react";
import { useI18n } from "@/i18n";

const BASE_NAV_ITEMS = [
  {
    key: "dealsToday",
    labelKey: "nav.deals_today",
    href: "/deals/today",
    icon: Flame,
    accent: "text-rose-500",
  },
  {
    key: "superDeal",
    labelKey: "nav.super_deal",
    href: "/superdeal",
    icon: BadgePercent,
    accent: "text-amber-500",
  },
  {
    key: "fastShipping",
    labelKey: "nav.fast_shipping",
    href: "/fast-shipping",
    icon: Truck,
    accent: "text-emerald-500",
  },
  {
    key: "newArrivals",
    labelKey: "nav.new_arrivals",
    href: "/new-arrivals",
    icon: Sparkles,
    accent: "text-indigo-500",
  },
  {
    key: "seasonal",
    labelKey: "nav.seasonal",
    href: "/seasonal",
    icon: CalendarCheck,
    accent: "text-purple-500",
  },
];

const TopNavMenu = ({ isCompact = false }) => {
  const { url, props } = usePage();
  const { t } = useI18n();
  const metrics = props?.navMetrics || {};

  const navItems = useMemo(
    () =>
      BASE_NAV_ITEMS.map((item) => ({
        ...item,
        label: t(item.labelKey),
        badge: metrics?.[item.key]?.count ?? null,
        subtitle: metrics?.[item.key]?.label ?? null,
      })),
    [metrics, t]
  );

  return (
    <nav
      className="sticky z-[60] h-[var(--topnav-sticky-height)] border-b border-slate-200 bg-white/95 backdrop-blur"
      style={{ top: 'calc(var(--header-sticky-height, 0px) - var(--header-compact-offset-active, 0px))' }}
    >
      <div className="relative mx-auto flex h-full max-w-full items-center gap-3 px-2 sm:px-4">
        <div className="pointer-events-none absolute inset-y-0 left-0 w-8 bg-gradient-to-r from-white" />
        <div className="pointer-events-none absolute inset-y-0 right-0 w-8 bg-gradient-to-l from-white" />
        <ul
          className={[
            'flex h-full w-full items-center gap-2 overflow-x-auto py-0 font-bold text-slate-700 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200',
            isCompact ? 'text-xs sm:text-sm' : 'text-lg',
          ].join(' ')}
        >
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive =
              url === item.href || (url !== "/" && url.startsWith(item.href));
            return (
              <li key={item.key} className="flex-shrink-0">
                <Link
                  href={item.href}
                  aria-current={isActive ? "page" : undefined}
                  className={`group relative flex items-center justify-center rounded-2xl border transition focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
                    isCompact ? 'gap-2 whitespace-nowrap px-3 py-2' : 'flex-col items-start px-5 py-3 sm:flex-row sm:items-center sm:gap-2'
                  } ${
                    isActive
                      ? "border-indigo-200 bg-indigo-50 text-indigo-600 shadow-sm"
                      : "border-transparent bg-white hover:border-indigo-100 hover:bg-slate-50"
                  }`}
                >
                  <span className="flex items-center gap-2">
                    <Icon className={`${isCompact ? 'h-4 w-4' : 'h-5 w-5'} ${item.accent}`} aria-hidden="true" />
                    <span>{item.label}</span>
                  </span>
                  {item.subtitle && !isActive && !isCompact && (
                    <span className="text-sm font-medium text-slate-400 sm:hidden">
                      {item.subtitle}
                    </span>
                  )}
                  {item.badge !== null && !isCompact && (
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
            className={`inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50 text-indigo-600 transition hover:bg-indigo-100 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400 ${
              isCompact ? 'whitespace-nowrap px-3 py-2 text-sm font-semibold tracking-normal' : 'px-5 py-3 text-base font-bold uppercase tracking-wide'
            }`}
          >
            <Compass className={isCompact ? 'h-4 w-4' : 'h-5 w-5'} />
            <span>{t('nav.see_all')}</span>
          </Link>
        </div>
      </div>
    </nav>
  );
};

export default TopNavMenu;
