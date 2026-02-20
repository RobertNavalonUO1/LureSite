import React, { useMemo } from 'react';

const FALLBACK_CARDS = [
  {
    image: '/images/autumn-photo-03.jpg',
    eyebrow: 'Momento café y té',
    title: 'Mugs artesanales con infusiones',
    description: 'Colección de tazas de cerámica y mezclas especiadas listas para regalar.',
    cta: 'Descubrir mugs',
    href: '/otono/bebidas',
  },
  {
    image: '/images/autumn-photo-07.jpg',
    eyebrow: 'Panadería gourmet',
    title: 'Pastelería de otoño recién hecha',
    description: 'Pie de calabaza, roles de canela y tartaletas para tus reuniones.',
    cta: 'Encargar repostería',
    href: '/otono/panaderia',
  },
  {
    image: '/images/autumn-photo-09.jpg',
    eyebrow: 'Bienestar aromático',
    title: 'Difusores y aceites esenciales',
    description: 'Aromas de bosque, vainilla y cítricos para un ambiente acogedor.',
    cta: 'Ver aromas',
    href: '/otono/aromas',
  },
];

const normalizeCards = (cards = []) =>
  (cards.length ? cards : FALLBACK_CARDS).map((card, index) => {
    const fallback = FALLBACK_CARDS[index % FALLBACK_CARDS.length];

    return {
      image: card.image ?? card.image_path ?? fallback.image,
      eyebrow: card.subtitle ?? card.eyebrow ?? fallback.eyebrow,
      title: card.title ?? fallback.title,
      description: card.description ?? fallback.description,
      cta: card.cta_label ?? card.cta ?? fallback.cta,
      href: card.link ?? card.href ?? '#',
      key: card.id ?? `${card.link ?? 'card'}-${index}`,
    };
  });

const AutumnShowcase = ({ cards = [], campaignName }) => {
  const cardList = useMemo(() => normalizeCards(cards), [cards]);

  const heading = campaignName
    ? `Explora lo nuevo de ${campaignName.replace(/-/g, ' ')}`
    : 'Explora las nuevas colecciones y experiencias de otoño';

  return (
    <section className="mt-10 rounded-[32px] border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-6 sm:p-10 shadow-sm">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
            Selección especial
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight capitalize">
            {heading}
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
            Encuentra ideas rápidas para renovar tus espacios, tu estilo y tus momentos favoritos.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {cardList.map((card) => (
          <article
            key={card.key}
            className="group relative overflow-hidden rounded-3xl border border-white/60 bg-white shadow-lg transition hover:-translate-y-1 hover:shadow-xl"
          >
            <div className="relative h-56 w-full overflow-hidden">
              <img
                src={card.image}
                alt={card.title}
                className="h-full w-full object-cover transition duration-500 group-hover:scale-105"
                loading="lazy"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/80 via-slate-900/20 to-transparent" />
              {card.eyebrow && (
                <div className="absolute top-4 left-4">
                  <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow">
                    {card.eyebrow}
                  </span>
                </div>
              )}
            </div>
            <div className="p-5 space-y-3">
              <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
              {card.description && <p className="text-sm text-slate-600">{card.description}</p>}
              <a
                href={card.href}
                className="inline-flex items-center gap-2 rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-slate-900 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
              >
                {card.cta}
                <span aria-hidden="true">→</span>
              </a>
            </div>
          </article>
        ))}
      </div>
    </section>
  );
};

export default AutumnShowcase;
