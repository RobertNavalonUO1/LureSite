import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';

const FALLBACK_BANNERS = [
  {
    image: '/images/autumn-photo-02.jpg',
    title: 'Oferta de temporada: accesorios en tonos tierra',
    link: '/seasonal',
    cta: 'Ver temporada',
  },
  {
    image: '/images/autumn-photo-04.jpg',
    title: 'Canastas gourmet y regalos seleccionados',
    link: '/new-arrivals',
    cta: 'Ver novedades',
  },
  {
    image: '/images/autumn-photo-06.jpg',
    title: 'Aromas y hogar: detalles que transforman',
    link: '/deals/today',
    cta: 'Ver ofertas',
  },
  {
    image: '/images/autumn-photo-08.jpg',
    title: 'Envío rápido: recibe en 48h',
    link: '/fast-shipping',
    cta: 'Envío rápido',
  },
  {
    image: '/images/autumn-photo-01.jpg',
    title: 'SuperDeal destacado de la semana',
    link: '/superdeal',
    cta: 'Ver SuperDeal',
  },
  {
    image: '/images/autumn-photo-03.jpg',
    title: 'Explora por categorías y encuentra tu estilo',
    link: '/search?query=oferta',
    cta: 'Buscar ofertas',
  },
  {
    image: '/images/autumn-market-1.jpg',
    title: 'Selección del mercado: picks del día',
    link: '/deals/today',
    cta: 'Picks del día',
  },
  {
    image: '/images/autumn-market-2.jpg',
    title: 'Nuevos lanzamientos y tendencias',
    link: '/new-arrivals',
    cta: 'Descubrir',
  },
  {
    image: '/images/autumn-market-3.jpg',
    title: 'Ideas rápidas para regalar',
    link: '/search?query=regalo',
    cta: 'Ver ideas',
  },
];

const MIN_BANNERS = 8;

const normalizeBanners = (banners) => {
  const list = Array.isArray(banners) ? banners : [];
  const count = Math.max(list.length, MIN_BANNERS);

  return Array.from({ length: count }).map((_, index) => {
    const banner = list[index] ?? null;
    const fallback = FALLBACK_BANNERS[index % FALLBACK_BANNERS.length];

    const link = banner?.link ?? banner?.href ?? fallback.link ?? '#';

    return {
      image: banner?.image ?? banner?.image_path ?? banner?.src ?? fallback.image,
      alt: banner?.title ?? banner?.alt ?? fallback.title,
      link,
      cta: banner?.cta_label ?? banner?.button ?? fallback.cta,
      key: banner?.id ?? `${link}-${index}`,
    };
  });
};

const SidebarBanners = ({ banners }) => {
  const bannerList = useMemo(() => normalizeBanners(banners), [banners]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion) return;
    if (isPaused) return;
    if (!bannerList.length) return;

    const id = window.setInterval(() => {
      setActiveIndex((i) => (i + 1) % bannerList.length);
    }, 5500);

    return () => window.clearInterval(id);
  }, [bannerList.length, isPaused, prefersReducedMotion]);

  useEffect(() => {
    if (!bannerList.length) return;
    if (activeIndex >= bannerList.length) setActiveIndex(0);
  }, [activeIndex, bannerList.length]);

  const handleImageError = (event) => {
    event.target.onerror = null;
    event.target.src = FALLBACK_BANNERS[0].image;
  };

  const featured = bannerList[activeIndex] || bannerList[0];
  const thumb1 = bannerList[(activeIndex + 1) % bannerList.length];
  const thumb2 = bannerList[(activeIndex + 2) % bannerList.length];

  return (
    <div className="flex w-full flex-col gap-4 lg:gap-6 lg:sticky lg:top-24">
      {/* Mobile: swipeable strip */}
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:hidden">
        {bannerList.map((banner) => (
          <a
            key={banner.key}
            href={banner.link}
            className="group relative block min-w-[260px] overflow-hidden rounded-3xl bg-slate-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <img
              src={banner.image}
              alt={banner.alt}
              onError={handleImageError}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent transition-opacity duration-300 group-hover:from-slate-900/60" />
            <div className="absolute bottom-6 left-1/2 w-[80%] -translate-x-1/2 text-center">
              <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-colors duration-200 group-hover:bg-amber-300">
                {banner.cta}
              </span>
            </div>
          </a>
        ))}
      </div>

      {/* Desktop: featured carousel + thumbnails */}
      <div
        className="hidden lg:block"
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
        onFocusCapture={() => setIsPaused(true)}
        onBlurCapture={() => setIsPaused(false)}
      >
        <a
          href={featured?.link}
          className={clsx(
            'group relative block overflow-hidden rounded-3xl bg-slate-100 shadow-lg',
            'transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl'
          )}
        >
          <div className="relative aspect-[4/3]">
            {bannerList.map((banner, index) => (
              <img
                key={banner.key}
                src={banner.image}
                alt={banner.alt}
                onError={handleImageError}
                className={clsx(
                  'absolute inset-0 h-full w-full object-cover transition-opacity duration-700',
                  index === activeIndex ? 'opacity-100' : 'opacity-0'
                )}
                loading={index === activeIndex ? 'eager' : 'lazy'}
              />
            ))}

            <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent transition-opacity duration-500 group-hover:from-slate-900/60" />
            <div className="absolute inset-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent translate-x-0 group-hover:translate-x-[260%] transition-transform duration-700" />
            </div>

            <div className="absolute bottom-6 left-6 right-6">
              <div className="flex items-end justify-between gap-4">
                <div>
                  <div className="text-sm font-semibold text-slate-200/90">Recomendado</div>
                  <div className="mt-1 text-lg font-bold text-white leading-snug">
                    {featured?.alt}
                  </div>
                </div>
                <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-colors duration-200 group-hover:bg-amber-300">
                  {featured?.cta}
                </span>
              </div>
            </div>
          </div>
        </a>

        <div className="mt-4 grid grid-cols-2 gap-4">
          {[thumb1, thumb2].filter(Boolean).map((banner) => (
            <button
              key={banner.key}
              type="button"
              onClick={() => {
                const nextIndex = bannerList.findIndex((b) => b.key === banner.key);
                if (nextIndex >= 0) setActiveIndex(nextIndex);
              }}
              className="group relative overflow-hidden rounded-3xl border border-slate-200 bg-white/70 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              aria-label={`Ver banner: ${banner.alt}`}
            >
              <div className="flex items-center gap-4 p-3">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  onError={handleImageError}
                  className="h-16 w-16 rounded-2xl object-cover shadow"
                  loading="lazy"
                />
                <div className="text-left">
                  <div className="text-sm font-semibold text-slate-800 line-clamp-2">{banner.alt}</div>
                  <div className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 group-hover:bg-indigo-100 transition">
                    {banner.cta}
                  </div>
                </div>
              </div>
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            {bannerList.slice(0, Math.min(bannerList.length, 8)).map((_, index) => (
              <button
                key={`dot-${index}`}
                type="button"
                onClick={() => setActiveIndex(index)}
                className={clsx(
                  'h-2.5 w-2.5 rounded-full transition-all duration-300',
                  index === activeIndex ? 'bg-indigo-600 w-6' : 'bg-slate-300 hover:bg-slate-400'
                )}
                aria-label={`Ir al banner ${index + 1}`}
              />
            ))}
          </div>

          {!prefersReducedMotion && (
            <div className="text-xs text-slate-500">
              {isPaused ? 'Pausado' : 'Auto'}
            </div>
          )}
        </div>
      </div>

      <div className="hidden border-t border-slate-200 pt-4 text-xs text-slate-500 lg:block">
        Descubre promociones y lanzamientos seleccionados para ti.
      </div>
    </div>
  );
};

export default SidebarBanners;
