import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useI18n } from '@/i18n';

const STORAGE_KEY = 'limoneo.promoPopups.dismissedAt';
const DISMISS_DURATION_HOURS = 6;

const PROMOTION_CONFIG = {
  global: [
    {
      id: 'autumn-flash',
      translationKey: 'promo.global.autumn_flash',
      href: '/ofertas/otono',
      accentClass: 'bg-amber-500',
      ringClass: 'focus:ring-amber-200',
    },
    {
      id: 'bundle-warm',
      translationKey: 'promo.global.bundle_warm',
      href: '/packs/otono',
      accentClass: 'bg-rose-500',
      ringClass: 'focus:ring-rose-200',
    },
  ],
  category: [
    {
      id: 'category-extra',
      translationKey: 'promo.category.category_extra',
      href: '#destacados',
      accentClass: 'bg-indigo-500',
      ringClass: 'focus:ring-indigo-200',
    },
    {
      id: 'free-shipping',
      translationKey: 'promo.category.free_shipping',
      href: '/envio-rapido',
      accentClass: 'bg-emerald-500',
      ringClass: 'focus:ring-emerald-200',
    },
  ],
};

const PromoPopups = ({ context = 'global' }) => {
  const { t } = useI18n();
  const promotions = useMemo(() => {
    const list = PROMOTION_CONFIG[context] || PROMOTION_CONFIG.global;

    return list.map((promotion) => ({
      ...promotion,
      title: t(`${promotion.translationKey}.title`),
      message: t(`${promotion.translationKey}.message`),
      cta: t(`${promotion.translationKey}.cta`),
    }));
  }, [context, t]);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [isVisible, setIsVisible] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);
  const autoHideRef = useRef(null);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const dismissedAt = Number(localStorage.getItem(STORAGE_KEY));
    const elapsed = Date.now() - dismissedAt;
    const shouldSkip = dismissedAt && elapsed < DISMISS_DURATION_HOURS * 60 * 60 * 1000;

    if (shouldSkip) return undefined;

    const showTimer = window.setTimeout(() => {
      setShouldRender(true);
      setIsVisible(true);
    }, 1600);

    return () => window.clearTimeout(showTimer);
  }, [context]);

  useEffect(() => {
    if (!isVisible) return undefined;

    autoHideRef.current = window.setTimeout(() => {
      handleAdvance();
    }, 12000);

    return () => {
      if (autoHideRef.current) {
        window.clearTimeout(autoHideRef.current);
        autoHideRef.current = null;
      }
    };
  }, [isVisible, currentIndex]);

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

  const promo = promotions[currentIndex];

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-6 z-[999] flex justify-center px-4 sm:justify-end sm:px-6">
      <div
        className={`pointer-events-auto w-full max-w-sm overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl transition-all duration-300 ease-out ${
          isVisible ? 'translate-y-0 opacity-100' : 'translate-y-6 opacity-0'
        }`}
        role="dialog"
        aria-live="polite"
        aria-label={promo.title}
      >
        <div className="flex items-start gap-4 p-5">
          <span className={`mt-1 inline-flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full text-white shadow ${promo.accentClass}`}>
            %
          </span>

          <div className="flex-1">
            <p className="text-sm font-semibold uppercase tracking-wide text-slate-400">
              {t('promo.label')}
            </p>
            <h3 className="text-lg font-bold text-slate-900">{promo.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{promo.message}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={promo.href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${promo.accentClass} ${promo.ringClass}`}
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

          <button
            type="button"
            onClick={handleAdvance}
            className="ml-2 rounded-full p-1 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 focus:outline-none focus:ring-2 focus:ring-slate-200"
            aria-label={t('promo.close')}
          >
            x
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoPopups;
