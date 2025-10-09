import React from 'react';

const LeftBanner = () => {
  return (
    <div className="hidden lg:block w-60 p-4">
      <div className="rounded-3xl overflow-hidden shadow-lg bg-slate-900/85 text-white">
        <div className="relative h-44">
          <img
            src="/images/autumn-photo-04.jpg"
            alt="Canasta gourmet con productos artesanales"
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-black/10 via-black/40 to-black/80" />
          <div className="absolute inset-x-0 bottom-4 px-4">
            <span className="inline-flex rounded-full bg-amber-400/90 px-3 py-1 text-xs font-semibold text-slate-900 shadow">
              Especial de otono
            </span>
          </div>
        </div>
        <div className="p-4 space-y-2">
          <h3 className="text-lg font-bold leading-tight uppercase">
            Caja gourmet de otono
          </h3>
          <p className="text-sm text-white/80">
            Mermeladas artesanales, galletas especiadas y tazas para regalar o compartir.
          </p>
          <a
            href="/otono/regalos"
            className="inline-flex items-center justify-center gap-1 rounded-full bg-amber-400 px-4 py-2 text-xs font-semibold text-slate-900 transition hover:bg-amber-300 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            Preparar mi caja
            <span aria-hidden="true">→</span>
          </a>
        </div>
      </div>
    </div>
  );
};

export default LeftBanner;
