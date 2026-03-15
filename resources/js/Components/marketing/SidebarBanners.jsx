import React, { useEffect, useMemo, useState } from 'react';
import clsx from 'clsx';
import { repairText, useI18n } from '@/i18n';

const FALLBACK_BANNER_CONFIG = [
  { image: '/images/autumn-photo-02.jpg', link: '/seasonal', key: 'seasonal_accessories' },
  { image: '/images/autumn-photo-04.jpg', link: '/new-arrivals', key: 'gourmet_baskets' },
  { image: '/images/autumn-photo-06.jpg', link: '/deals/today', key: 'aromas_home' },
  { image: '/images/autumn-photo-08.jpg', link: '/fast-shipping', key: 'fast_shipping' },
  { image: '/images/autumn-photo-01.jpg', link: '/superdeal', key: 'superdeal' },
  { image: '/images/autumn-photo-03.jpg', link: '/search?query=oferta', key: 'categories' },
  { image: '/images/autumn-market-1.jpg', link: '/deals/today', key: 'market_picks' },
  { image: '/images/autumn-market-2.jpg', link: '/new-arrivals', key: 'launches' },
];

const MIN_BANNERS = 8;

const buildFallbackBanners = (t) => FALLBACK_BANNER_CONFIG.map((banner) => ({
  image: banner.image,
  title: t(`banners.fallbacks.${banner.key}.title`),
  link: banner.link,
  cta: t(`banners.fallbacks.${banner.key}.cta`),
  key: banner.key,
}));

const normalizeBanners = (banners, fallbackBanners) => {
  const list = Array.isArray(banners) ? banners : [];
  const count = Math.max(list.length, MIN_BANNERS);

  return Array.from({ length: count }).map((_, index) => {
    const banner = list[index] ?? null;
    const fallback = fallbackBanners[index % fallbackBanners.length];
    const link = banner?.link ?? banner?.href ?? fallback.link ?? '#';
    const title = banner?.title ?? banner?.alt ?? fallback.title;

    return {
      image: banner?.image ?? banner?.image_path ?? banner?.src ?? fallback.image,
      alt: repairText(title),
      link,
      cta: repairText(banner?.cta_label ?? banner?.button ?? fallback.cta),
      key: banner?.id ?? `${link}-${index}`,
    };
  });
};

const SidebarBanners = ({ banners }) => {
  const { t } = useI18n();
  const fallbackBanners = useMemo(() => buildFallbackBanners(t), [t]);
  const bannerList = useMemo(() => normalizeBanners(banners, fallbackBanners), [banners, fallbackBanners]);
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const prefersReducedMotion = useMemo(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return false;
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  }, []);

  useEffect(() => {
    if (prefersReducedMotion || isPaused || !bannerList.length) return undefined;

    const id = window.setInterval(() => {
      setActiveIndex((index) => (index + 1) % bannerList.length);
    }, 5500);

    return () => window.clearInterval(id);
  }, [bannerList.length, isPaused, prefersReducedMotion]);

  useEffect(() => {
    if (!bannerList.length) return;
    if (activeIndex >= bannerList.length) setActiveIndex(0);
  }, [activeIndex, bannerList.length]);

  const handleImageError = (event) => {
    event.target.onerror = null;
    event.target.src = fallbackBanners[0].image;
  };

  const featured = bannerList[activeIndex] || bannerList[0];
  const thumb1 = bannerList[(activeIndex + 1) % bannerList.length];
  const thumb2 = bannerList[(activeIndex + 2) % bannerList.length];

  return (
    <div className="relative z-0 flex w-full flex-col gap-4 lg:gap-6">
      <div className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-3 lg:hidden">
        {bannerList.map((banner) => (
          <a
            key={banner.key}
            href={banner.link}
            className="group relative isolate block min-w-[260px] overflow-hidden rounded-3xl bg-slate-100 shadow-lg transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl"
          >
            <img
              src={banner.image}
              alt={banner.alt}
              onError={handleImageError}
              className="h-full w-full object-cover"
              loading="lazy"
            />
            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-slate-900/80 via-slate-900/10 to-transparent transition-opacity duration-300 group-hover:from-slate-900/60" />
            <div className="absolute bottom-6 left-1/2 z-10 w-[80%] -translate-x-1/2 text-center">
              <span className="inline-flex items-center justify-center rounded-full bg-amber-400 px-5 py-2 text-sm font-semibold text-slate-900 shadow-lg transition-colors duration-200 group-hover:bg-amber-300">
                {banner.cta}
              </span>
            </div>
          </a>
        ))}
      </div>

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
            'group relative isolate block overflow-hidden rounded-[30px] border border-slate-200/60 bg-slate-100 shadow-lg',
            'transition-all duration-500 hover:-translate-y-1 hover:shadow-2xl'
          )}
        >
          <div className="relative aspect-[4/3] min-h-[22rem]">
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

            <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-slate-950/85 via-slate-900/25 to-transparent transition-opacity duration-500 group-hover:from-slate-950/70" />
            <div className="pointer-events-none absolute inset-0 z-0 opacity-0 transition-opacity duration-500 group-hover:opacity-100">
              <div className="absolute -left-1/2 top-0 h-full w-1/2 -skew-x-12 bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-700 group-hover:translate-x-[260%]" />
            </div>

            <div className="absolute inset-x-5 bottom-5 z-10">
              <div className="rounded-[28px] border border-white/10 bg-slate-950/55 p-5 shadow-2xl backdrop-blur-md">
                <div className="flex items-center justify-between gap-3 text-xs font-semibold uppercase tracking-[0.28em] text-slate-200/70">
                  <span>{t('banners.recommended')}</span>
                  <span>{String(activeIndex + 1).padStart(2, '0')} / {String(bannerList.length).padStart(2, '0')}</span>
                </div>
                <div className="mt-3 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
                  <div className="max-w-[18rem]">
                    <div className="text-xl font-bold leading-snug text-white">{featured?.alt}</div>
                    <p className="mt-2 text-sm leading-relaxed text-slate-200/80">
                      {t('banners.featured_description')}
                    </p>
                  </div>
                  <span className="inline-flex shrink-0 items-center justify-center rounded-full bg-amber-400 px-5 py-2.5 text-sm font-semibold text-slate-900 shadow-lg transition-colors duration-200 group-hover:bg-amber-300">
                    {featured?.cta}
                  </span>
                </div>
              </div>
            </div>
          </div>
        </a>

        <div className="mt-4 grid grid-cols-1 gap-3 xl:grid-cols-2">
          {[thumb1, thumb2].filter(Boolean).map((banner) => (
            <button
              key={banner.key}
              type="button"
              onClick={() => {
                const nextIndex = bannerList.findIndex((item) => item.key === banner.key);
                if (nextIndex >= 0) setActiveIndex(nextIndex);
              }}
              className="group relative isolate overflow-hidden rounded-[28px] border border-slate-200 bg-white/85 shadow-sm transition-all duration-300 hover:-translate-y-0.5 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60"
              aria-label={t('banners.view_banner', { title: banner.alt })}
            >
              <div className="flex items-center gap-4 p-3.5">
                <img
                  src={banner.image}
                  alt={banner.alt}
                  onError={handleImageError}
                  className="h-16 w-16 rounded-2xl object-cover shadow"
                  loading="lazy"
                />
                <div className="text-left">
                  <div className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800">{banner.alt}</div>
                  <div className="mt-2 inline-flex rounded-full bg-indigo-50 px-3 py-1 text-xs font-semibold text-indigo-700 transition group-hover:bg-indigo-100">
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
                  'h-2.5 rounded-full transition-all duration-300',
                  index === activeIndex ? 'w-6 bg-indigo-600' : 'w-2.5 bg-slate-300 hover:bg-slate-400'
                )}
                aria-label={t('banners.go_to_banner', { index: index + 1 })}
              />
            ))}
          </div>

          {!prefersReducedMotion ? (
            <div className="text-xs text-slate-500">
              {isPaused ? t('banners.paused') : t('banners.auto')}
            </div>
          ) : null}
        </div>
      </div>

      <div className="hidden border-t border-slate-200 pt-4 text-xs text-slate-500 lg:block">
        {t('banners.footer_note')}
      </div>
    </div>
  );
};

export default SidebarBanners;
