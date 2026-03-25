import React, { useEffect, useMemo, useRef, useState } from 'react';
import { BadgePercent, Clock3, Sparkles, X } from 'lucide-react';
import { useI18n } from '@/i18n';

const STORAGE_KEY = 'limoneo.promoPopups.dismissedAt';
const DISMISS_DURATION_HOURS = 6;

const PROMOTION_CONFIG = {
  global: [
    {
      id: 'autumn-flash',
      translationKey: 'promo.global.autumn_flash',
      href: '/ofertas/otono',
      accentClass: 'from-amber-500 via-orange-500 to-rose-500',
      surfaceClass: 'from-amber-50 via-orange-50 to-rose-50',
      glowClass: 'shadow-amber-500/20',
      ringClass: 'focus:ring-amber-200',
    },
    {
      id: 'bundle-warm',
      translationKey: 'promo.global.bundle_warm',
      href: '/packs/otono',
      accentClass: 'from-rose-500 via-fuchsia-500 to-orange-400',
      surfaceClass: 'from-rose-50 via-white to-orange-50',
      glowClass: 'shadow-rose-500/20',
      ringClass: 'focus:ring-rose-200',
    },
  ],
  category: [
    {
      id: 'category-extra',
      translationKey: 'promo.category.category_extra',
      href: '#destacados',
      accentClass: 'from-indigo-500 via-violet-500 to-sky-500',
      surfaceClass: 'from-indigo-50 via-violet-50 to-sky-50',
      glowClass: 'shadow-indigo-500/20',
      ringClass: 'focus:ring-indigo-200',
    },
    {
      id: 'free-shipping',
      translationKey: 'promo.category.free_shipping',
      href: '/envio-rapido',
      accentClass: 'from-emerald-500 via-teal-500 to-cyan-500',
      surfaceClass: 'from-emerald-50 via-white to-cyan-50',
      glowClass: 'shadow-emerald-500/20',
      ringClass: 'focus:ring-emerald-200',
    },
  ],
};

const PromoPopups = ({ context = 'global', suppressed = false }) => {
  const { t } = useI18n();
  const promotions = useMemo(() => {
    const list = PROMOTION_CONFIG[context] || PROMOTION_CONFIG.global;

    return list.map((promotion) => ({
      ...promotion,
      title: t(`${promotion.translationKey}.title`),
      message: t(`${promotion.translationKey}.message`),
      eyebrow: t(`${promotion.translationKey}.eyebrow`),
      detail: t(`${promotion.translationKey}.detail`),
      benefitPrimary: t(`${promotion.translationKey}.benefit_primary`),
      benefitSecondary: t(`${promotion.translationKey}.benefit_secondary`),
      cta: t(`${promotion.translationKey}.cta`),
    }));
  }, [context, t]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const [isPaused, setIsPaused] = useState(false);
  const autoHideRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;
    if (suppressed) return undefined;

    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY));
    const elapsed = Date.now() - dismissedAt;
    const shouldSkip = dismissedAt && elapsed < DISMISS_DURATION_HOURS * 60 * 60 * 1000;

    if (shouldSkip) return undefined;

    const showTimer = window.setTimeout(() => {
      setShouldRender(true);
      setIsVisible(true);
    }, 1600);

    return () => window.clearTimeout(showTimer);
  }, [context, suppressed]);

  useEffect(() => {
    if (!isVisible || isPaused) return undefined;

    autoHideRef.current = window.setTimeout(() => {
      handleAdvance();
    }, 14000);

    return () => {
      if (autoHideRef.current) {
        window.clearTimeout(autoHideRef.current);
        autoHideRef.current = null;
      }
    };
  }, [isVisible, currentIndex, isPaused]);

  const storeDismissal = () => {
    if (typeof window === 'undefined') return;
    localStorage.setItem(STORAGE_KEY, Date.now().toString());
  };

  const handleAdvance = () => {
    if (autoHideRef.current) {
      window.clearTimeout(autoHideRef.current);
      autoHideRef.current = null;
    }

    setIsVisible(false);

    window.setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < promotions.length) {
        setCurrentIndex(nextIndex);
        setIsVisible(true);
        return;
      }

      setShouldRender(false);
      storeDismissal();
    }, 280);
  };

  const handleDismissToday = () => {
    if (autoHideRef.current) {
      window.clearTimeout(autoHideRef.current);
      autoHideRef.current = null;
    }

    setIsVisible(false);

    window.setTimeout(() => {
      setShouldRender(false);
      storeDismissal();
    }, 240);
  };

  if (!shouldRender) {
    return null;
  }

  if (suppressed) {
    return null;
  }

  const promo = promotions[currentIndex];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[999] flex justify-center px-4 sm:justify-end sm:px-6">
      <div
        className={`pointer-events-auto relative w-full max-w-[25rem] overflow-hidden rounded-[2rem] border border-white/70 bg-white shadow-2xl transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
        role="dialog"
        aria-live="polite"
        aria-label={promo.title}
        onMouseEnter={() => setIsPaused(true)}
        onMouseLeave={() => setIsPaused(false)}
      >
        <div className={`absolute inset-x-0 top-0 h-28 bg-gradient-to-r ${promo.accentClass}`} />
        <div className={`absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.38),transparent_32%)]`} />
        <div className="relative p-5">
          <div className="flex items-start justify-between gap-4">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center gap-2 rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-slate-700 shadow-sm">
                  <Sparkles className="h-3.5 w-3.5" />
                  {promo.eyebrow}
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-slate-950/85 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-white">
                  <Clock3 className="h-3.5 w-3.5" />
                  {t('promo.live_now')}
                </span>
              </div>

              <div className={`inline-flex h-12 w-12 items-center justify-center rounded-2xl bg-gradient-to-br ${promo.accentClass} text-white shadow-lg ${promo.glowClass}`}>
                <BadgePercent className="h-5 w-5" />
              </div>
            </div>

            <button
              type="button"
              onClick={handleAdvance}
              className="rounded-full border border-white/70 bg-white/90 p-2 text-slate-500 shadow-sm transition hover:bg-white hover:text-slate-700 focus:outline-none focus:ring-2 focus:ring-slate-200"
              aria-label={t('promo.close')}
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          <div className={`mt-4 rounded-[1.75rem] border border-white/80 bg-gradient-to-br p-4 shadow-[0_18px_55px_rgba(15,23,42,0.10)] backdrop-blur ${promo.surfaceClass}`}>
            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-400">
              {t('promo.label')}
            </p>
            <h3 className="mt-2 text-xl font-semibold leading-tight text-slate-950">{promo.title}</h3>
            <p className="mt-2 text-sm leading-6 text-slate-700">{promo.message}</p>
            <p className="mt-3 text-sm font-medium text-slate-500">{promo.detail}</p>

            <div className="mt-4 grid gap-2 sm:grid-cols-2">
              <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                {promo.benefitPrimary}
              </div>
              <div className="rounded-2xl border border-white/80 bg-white/80 px-3 py-2 text-xs font-medium text-slate-700 shadow-sm">
                {promo.benefitSecondary}
              </div>
            </div>

            <div className="mt-5 flex flex-wrap gap-2">
              <a
                href={promo.href}
                className={`inline-flex items-center gap-2 rounded-full bg-gradient-to-r px-4 py-2.5 text-xs font-semibold uppercase tracking-wide text-white shadow-lg transition hover:-translate-y-0.5 focus:outline-none focus:ring-2 focus:ring-offset-2 ${promo.accentClass} ${promo.ringClass}`}
              >
                {promo.cta}
                <span aria-hidden="true">-&gt;</span>
              </a>
              <button
                type="button"
                onClick={handleDismissToday}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                {t('promo.dismiss_today')}
              </button>
            </div>
          </div>

          <div className="mt-4 flex items-center justify-between gap-3 px-1">
            <div className="flex items-center gap-2" aria-hidden="true">
              {promotions.map((entry, index) => (
                <span
                  key={entry.id}
                  className={`h-2 rounded-full transition-all ${index === currentIndex ? 'w-6 bg-slate-900' : 'w-2 bg-slate-300'}`}
                />
              ))}
            </div>
            <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
              {t('promo.hover_hint')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PromoPopups;
