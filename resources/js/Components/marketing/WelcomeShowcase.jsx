import React from "react";

const WelcomeShowcase = ({ user, stats, onClose }) => (
  <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm">
    <div className="overflow-hidden rounded-3xl border-0 bg-gradient-to-br from-indigo-600 via-purple-500 to-pink-400 shadow-2xl max-w-3xl w-full mx-4">
      <div className="px-8 py-10 text-white sm:px-16 flex flex-col gap-4">
        <div className="flex items-center gap-3">
          <span className="inline-flex items-center justify-center rounded-full bg-white/20 px-4 py-2 text-xs font-semibold tracking-widest text-white/80 shadow-lg backdrop-blur">
            {user ? `👋 Hola, ${user.name}` : "🌎 Bienvenido a WorldExpense"}
          </span>
          <span className="rounded-full bg-white/10 px-4 py-2 text-xs font-medium animate-pulse">
            🆕 Nuevos productos cada semana
          </span>
        </div>
        <h1 className="mt-2 text-4xl font-extrabold leading-tight drop-shadow-lg sm:text-5xl">
          Encuentra tendencias, clásicos y ofertas exclusivas
        </h1>
        <p className="mt-2 max-w-2xl text-base text-white/90 sm:text-lg">
          Productos seleccionados, envíos flexibles y recomendaciones personalizadas.<br />
          <span className="font-semibold text-pink-200">Explora lo mejor cada día.</span>
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <a
            href="#destacados"
            className="inline-flex items-center gap-2 rounded-full bg-white px-6 py-3 text-base font-bold text-indigo-600 shadow-xl transition-all hover:bg-indigo-50 hover:scale-105"
          >
            <svg className="w-5 h-5 text-indigo-500" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M5 12h14M12 5l7 7-7 7"></path></svg>
            Ver destacados
          </a>
        </div>
      </div>
      <dl className="grid gap-6 px-8 py-8 sm:grid-cols-3 sm:px-16 bg-white/10 backdrop-blur rounded-b-3xl">
        <div className="flex flex-col items-center">
          <dt className="text-xs font-bold uppercase tracking-wide text-indigo-200">PRODUCTOS ACTIVOS</dt>
          <dd className="mt-2 text-3xl font-extrabold text-white drop-shadow">{stats.total}</dd>
          <p className="mt-1 text-xs text-indigo-100">Actualizados a diario</p>
        </div>
        <div className="flex flex-col items-center">
          <dt className="text-xs font-bold uppercase tracking-wide text-pink-200">CON DESCUENTO</dt>
          <dd className="mt-2 text-3xl font-extrabold text-white drop-shadow">{stats.discounted}</dd>
          <p className="mt-1 text-xs text-pink-100">Ahorro frente a PVP</p>
        </div>
        <div className="flex flex-col items-center">
          <dt className="text-xs font-bold uppercase tracking-wide text-purple-200">ENVÍO RÁPIDO</dt>
          <dd className="mt-2 text-3xl font-extrabold text-white drop-shadow">{stats.fastShipping}</dd>
          <p className="mt-1 text-xs text-purple-100">Entrega en 48h o menos</p>
        </div>
      </dl>
      <button
        onClick={onClose}
        className="absolute top-4 right-4 rounded-full bg-white/30 hover:bg-white/60 p-2 transition text-white"
        aria-label="Cerrar"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24"><path d="M6 18L18 6M6 6l12 12"></path></svg>
      </button>
    </div>
  </div>
);

export default WelcomeShowcase;