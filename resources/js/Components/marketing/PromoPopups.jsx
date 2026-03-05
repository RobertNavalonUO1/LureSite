import React, { useEffect, useMemo, useRef, useState } from 'react';

const STORAGE_KEY = 'limoneo.promoPopups.dismissedAt';
const DISMISS_DURATION_HOURS = 6;

const PROMOTIONS = {
  global: [
    {
      id: 'autumn-flash',
      title: 'Venta flash de otoño',
      message: 'Aprovecha 25% de descuento en la colección de decoración cálida hasta medianoche.',
      cta: 'Ver venta flash',
      href: '/ofertas/otono',
      accentClass: 'bg-amber-500',
      ringClass: 'focus:ring-amber-200',
    },
    {
      id: 'bundle-warm',
      title: 'Pack hogar acogedor',
      message: 'Combina mantas, velas y luces con envío gratis a partir de 49 EUR.',
      cta: 'Armar mi pack',
      href: '/packs/otono',
      accentClass: 'bg-rose-500',
      ringClass: 'focus:ring-rose-200',
    },
  ],
  category: [
    {
      id: 'category-extra',
      title: '10% extra en tu categoría',
      message: 'Usa el cupón CATEGORIA10 al finalizar la compra y obténlo en los productos destacados.',
      cta: 'Aplicar cupon',
      href: '#destacados',
      accentClass: 'bg-indigo-500',
      ringClass: 'focus:ring-indigo-200',
    },
    {
      id: 'free-shipping',
      title: 'Envío exprés sin costo',
      message: 'Entrega en 48h disponible en artículos con etiqueta de envío rápido.',
      cta: 'Buscar envío rápido',
      href: '/envio-rapido',
      accentClass: 'bg-emerald-500',
      ringClass: 'focus:ring-emerald-200',
    },
  ],
};

const PromoPopups = ({ context = 'global' }) => {
  const promotions = useMemo(() => PROMOTIONS[context] || PROMOTIONS.global, [context]);
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

    const showTimer = setTimeout(() => {
      setShouldRender(true);
      setIsVisible(true);
    }, 1600);

    return () => clearTimeout(showTimer);
  }, [context]);

  useEffect(() => {
    if (!isVisible) return undefined;

    autoHideRef.current = setTimeout(() => {
      handleAdvance();
    }, 12000);

    return () => {
      if (autoHideRef.current) {
        clearTimeout(autoHideRef.current);
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
      clearTimeout(autoHideRef.current);
      autoHideRef.current = null;
    }
    setIsVisible(false);
    setTimeout(() => {
      const nextIndex = currentIndex + 1;
      if (nextIndex < promotions.length) {
        setCurrentIndex(nextIndex);
        setIsVisible(true);
      } else {
        setShouldRender(false);
        storeDismissal();
      }
    }, 280);
  };

  const handleDismissToday = () => {
    if (autoHideRef.current) {
      clearTimeout(autoHideRef.current);
      autoHideRef.current = null;
    }
    setIsVisible(false);
    setTimeout(() => {
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
              Promocion destacada
            </p>
            <h3 className="text-lg font-bold text-slate-900">{promo.title}</h3>
            <p className="mt-2 text-sm text-slate-600">{promo.message}</p>

            <div className="mt-4 flex flex-wrap gap-2">
              <a
                href={promo.href}
                className={`inline-flex items-center gap-2 rounded-full px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow transition hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-offset-2 ${promo.accentClass} ${promo.ringClass}`}
              >
                {promo.cta}
                <span aria-hidden="true">→</span>
              </a>
              <button
                type="button"
                onClick={handleDismissToday}
                className="rounded-full border border-slate-200 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-slate-500 transition hover:bg-slate-100 focus:outline-none focus:ring-2 focus:ring-slate-200"
              >
                No mostrar hoy
              </button>
            </div>
          </div>

          <button
            type="button"
            onClick={handleAdvance}
            className="ml-2 text-slate-400 transition hover:text-slate-600 focus:outline-none"
            aria-label="Cerrar promocion"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
};

export default PromoPopups;
