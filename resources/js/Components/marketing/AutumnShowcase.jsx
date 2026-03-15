import React, { useMemo } from 'react';
import { repairText, useI18n } from '@/i18n';

const FALLBACK_CARD_CONFIG = [
  { image: '/images/autumn-photo-03.jpg', href: '/new-arrivals', key: 'coffee' },
  { image: '/images/autumn-photo-07.jpg', href: '/deals/today', key: 'bakery' },
  { image: '/images/autumn-photo-09.jpg', href: '/fast-shipping', key: 'wellness' },
];

const buildFallbackCards = (t) => FALLBACK_CARD_CONFIG.map((card) => ({
  image: card.image,
  eyebrow: t(`marketing.autumn.cards.${card.key}.eyebrow`),
  title: t(`marketing.autumn.cards.${card.key}.title`),
  description: t(`marketing.autumn.cards.${card.key}.description`),
  cta: t(`marketing.autumn.cards.${card.key}.cta`),
  href: card.href,
  key: card.key,
}));

const normalizeCards = (cards = [], fallbackCards) =>
  (cards.length ? cards : fallbackCards).map((card, index) => {
    const fallback = fallbackCards[index % fallbackCards.length];

    return {
      image: card.image ?? card.image_path ?? fallback.image,
      eyebrow: repairText(card.subtitle ?? card.eyebrow ?? fallback.eyebrow),
      title: repairText(card.title ?? fallback.title),
      description: repairText(card.description ?? fallback.description),
      cta: repairText(card.cta_label ?? card.cta ?? fallback.cta),
      href: card.link ?? card.href ?? fallback.href,
      key: card.id ?? `${card.link ?? card.href ?? fallback.key}-${index}`,
    };
  });

const AutumnShowcase = ({ cards = [], campaignName }) => {
  const { t } = useI18n();
  const fallbackCards = useMemo(() => buildFallbackCards(t), [t]);
  const cardList = useMemo(() => normalizeCards(cards, fallbackCards), [cards, fallbackCards]);

  const heading = campaignName
    ? t('marketing.autumn.heading_with_campaign', { campaign: repairText(campaignName.replace(/-/g, ' ')) })
    : t('marketing.autumn.heading_default');

  return (
    <section className="mt-10 rounded-[32px] border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-6 shadow-sm sm:p-10">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
            {t('marketing.autumn.kicker')}
          </p>
          <h2 className="text-2xl font-extrabold capitalize leading-tight text-slate-900 sm:text-3xl">
            {heading}
          </h2>
          <p className="mt-2 max-w-2xl text-sm text-slate-600 sm:text-base">
            {t('marketing.autumn.subtitle')}
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {cardList.map((card) => (
          <article
            key={card.key}
            className="group relative isolate overflow-hidden rounded-3xl border border-white/60 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="pointer-events-none absolute inset-0 z-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              {card.eyebrow ? (
                <div className="absolute left-4 top-4 z-10">
                  <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow">
                    {card.eyebrow}
                  </span>
                </div>
              ) : null}
            </div>
            <div className="space-y-3 p-5">
              <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
              {card.description ? <p className="text-sm text-slate-600">{card.description}</p> : null}
              <a
                href={card.href}
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                {card.cta}
                <span aria-hidden="true">-&gt;</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AutumnShowcase;
