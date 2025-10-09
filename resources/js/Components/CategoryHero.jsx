import React from 'react';
import { Link } from '@inertiajs/react';
import { ArrowRight, Sparkles } from 'lucide-react';

const FALLBACK_DESCRIPTION =
  'Explora productos seleccionados, ofertas activas y envios seguros adaptados a lo que necesitas.';

const VISUAL_TAGS = [
  'Envio sin complicaciones',
  'Soporte especializado',
  'Devoluciones sencillas',
];

const CategoryHero = ({ category = {}, productCount = 0, isCondensed = false }) => {
  const { name = 'Categoria', description } = category;
  const safeDescription =
    description && description.trim().length > 0 ? description : FALLBACK_DESCRIPTION;

  const containerClasses = [
    'relative overflow-hidden rounded-[32px] border border-white/70 bg-white shadow-lg transition-all duration-500 ease-out',
    isCondensed ? 'py-8 lg:py-10 scale-[0.98] lg:scale-[0.97]' : 'py-10 lg:py-16',
  ].join(' ');

  return (
    <section className={containerClasses}>
      <div className="absolute inset-0">
        <div className="absolute -left-20 top-10 h-48 w-48 rounded-full bg-indigo-200/35 blur-3xl" />
        <div className="absolute right-[-40px] bottom-[-60px] h-72 w-72 rounded-full bg-violet-200/50 blur-3xl" />
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.65),_transparent_60%)]" />
      </div>

      <div className="relative z-10 px-6 sm:px-10 lg:px-14">
        <nav className="flex items-center gap-2 text-xs sm:text-sm text-slate-500" aria-label="Breadcrumb">
          <Link href="/" className="font-medium text-indigo-600 hover:text-indigo-700 transition">
            Inicio
          </Link>
          <span className="text-slate-400">/</span>
          <span className="font-semibold text-slate-700 truncate max-w-[60%]">{name}</span>
        </nav>

        <div className="mt-8 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-10">
          <div className="flex-1 space-y-6">
            <span className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-indigo-50/70 px-4 py-1 text-xs sm:text-sm uppercase tracking-wide text-indigo-600 shadow-sm">
              <Sparkles className="h-4 w-4" />
              Categoria destacada
            </span>

            <div className="space-y-4">
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold text-slate-900 leading-tight">
                {name}
              </h1>
              <p className="max-w-2xl text-sm sm:text-base text-slate-600 leading-relaxed">
                {safeDescription}
              </p>
            </div>

            <ul className="flex flex-wrap gap-2">
              {VISUAL_TAGS.map((item) => (
                <li
                  key={item}
                  className="rounded-full border border-slate-200 bg-white/80 px-4 py-2 text-xs sm:text-sm font-medium text-slate-600"
                >
                  {item}
                </li>
              ))}
            </ul>

            <div className="flex flex-wrap items-center gap-4 pt-1">
              <Link
                href="#productos"
                className="inline-flex items-center gap-2 rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg hover:bg-indigo-700 transition"
              >
                Ver catalogo completo
                <ArrowRight className="h-4 w-4" />
              </Link>
              <a
                href="/deals/today"
                className="inline-flex items-center gap-2 rounded-full border border-indigo-200 bg-white px-5 py-3 text-sm font-semibold text-indigo-600 shadow-sm hover:border-indigo-300 transition"
              >
                Ofertas del dia
              </a>
            </div>
          </div>

          <div className="relative w-full max-w-sm">
            <div className="relative overflow-hidden rounded-[28px] bg-gradient-to-br from-indigo-500 via-purple-500 to-blue-500 shadow-2xl">
              <div className="absolute inset-0 opacity-40 bg-[radial-gradient(circle_at_top,_rgba(255,255,255,0.9),_transparent_70%)]" />
              <div className="absolute -top-8 right-6 h-28 w-28 rounded-full bg-white/25 blur-2xl" />
              <div className="relative px-7 pt-8 pb-9 text-white">
                <div className="space-y-8">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/70">Disponible</p>
                    <p className="text-4xl font-semibold mt-1">
                      {productCount.toLocaleString()}
                    </p>
                    <p className="text-sm text-white/80">Productos listos para enviar</p>
                  </div>

                  <div className="rounded-2xl bg-white/10 backdrop-blur px-4 py-4 space-y-2">
                    <p className="text-xs uppercase tracking-widest text-white/70">Opinion media</p>
                    <p className="text-2xl font-semibold">4.8/5</p>
                    <p className="text-xs text-white/80">
                      Basado en experiencias verificadas de clientes recientes.
                    </p>
                  </div>
                </div>
              </div>
            </div>
            <div className="absolute -bottom-8 -left-6 hidden sm:block h-24 w-24 rounded-full border border-white/40 bg-white/50 backdrop-blur shadow-lg" />
          </div>
        </div>
      </div>
    </section>
  );
};

export default CategoryHero;
