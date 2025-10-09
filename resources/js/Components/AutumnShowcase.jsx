import React from 'react';

const CARDS = [
  {
    image: '/images/autumn-photo-03.jpg',
    eyebrow: 'Momento cafe y te',
    title: 'Mugs artesanales con infusiones',
    description: 'Coleccion de tazas de ceramica y mezclas especiadas listas para regalar.',
    cta: 'Descubrir mugs',
    href: '/otono/bebidas',
  },
  {
    image: '/images/autumn-photo-07.jpg',
    eyebrow: 'Panaderia gourmet',
    title: 'Pasteleria de otono recién hecha',
    description: 'Pie de calabaza, roles de canela y tartaletas para tus reuniones.',
    cta: 'Encargar reposteria',
    href: '/otono/panaderia',
  },
  {
    image: '/images/autumn-photo-09.jpg',
    eyebrow: 'Bienestar aromatico',
    title: 'Difusores y aceites esenciales',
    description: 'Aromas de bosque, vainilla y citricos para un ambiente acogedor.',
    cta: 'Ver aromas',
    href: '/otono/aromas',
  },
];

const AutumnShowcase = () => {
  return (
    <section className="mt-10 rounded-[32px] border border-amber-100 bg-gradient-to-r from-amber-50 via-white to-amber-50/60 p-6 sm:p-10 shadow-sm">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-amber-500">
            Otono en el marketplace
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 leading-tight">
            Explora las nuevas colecciones y experiencias de otono
          </h2>
          <p className="text-sm sm:text-base text-slate-600 mt-2 max-w-2xl">
            Encuentra ideas rapidas para renovar tus espacios, tu estilo y tus reuniones acogedoras.
          </p>
        </div>
      </div>

      <div className="mt-8 grid gap-6 md:grid-cols-3">
        {CARDS.map((card) => (
          <article
            key={card.href}
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
              <div className="absolute top-4 left-4">
                <span className="inline-flex items-center rounded-full bg-white/90 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-slate-900 shadow">
                  {card.eyebrow}
                </span>
              </div>
            </div>
            <div className="p-5 space-y-3">
              <h3 className="text-xl font-bold text-slate-900">{card.title}</h3>
              <p className="text-sm text-slate-600">{card.description}</p>
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
