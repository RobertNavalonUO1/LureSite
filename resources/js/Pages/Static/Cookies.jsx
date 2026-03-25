import React from 'react';
import { Head } from '@inertiajs/react';
import Footer from '@/Components/navigation/Footer.jsx';
import StorefrontLayout from '@/Layouts/StorefrontLayout.jsx';

export default function Cookies() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Head title="Política de cookies | Limoneo" />
      <StorefrontLayout showTopNav />

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 px-6 py-10 text-white sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200/90">Preferencias de navegación</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Política de cookies</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              Limoneo utiliza cookies y mecanismos equivalentes para recordar idioma, consentimiento y parte de la experiencia funcional necesaria para navegar la tienda con continuidad.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 text-sm text-slate-600 sm:px-10 sm:py-10 sm:text-base">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">1. Cookies funcionales</h2>
              <p className="mt-3 leading-relaxed">Son las necesarias para mantener elementos como el idioma elegido, el estado del consentimiento y otras preferencias básicas de navegación dentro del storefront.</p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">2. Cookies de experiencia</h2>
              <p className="mt-3 leading-relaxed">Pueden emplearse para que ciertas interacciones del catálogo, banners o módulos de personalización recuerden tu última elección y no repitan la misma configuración en cada visita.</p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">3. Gestión del consentimiento</h2>
              <p className="mt-3 leading-relaxed">La interfaz incorpora un modal de consentimiento y personalización. Desde ahí puedes aceptar, rechazar o revisar el uso básico de cookies disponibles en la experiencia actual.</p>
            </section>

            <section className="rounded-[28px] border border-indigo-100 bg-indigo-50/80 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">4. Más información</h2>
              <p className="mt-3 leading-relaxed">Si necesitas aclarar cómo se usan estas preferencias dentro de tu cuenta o en la navegación del sitio, utiliza la página de contacto o revisa la política de privacidad para el contexto general de tratamiento de datos.</p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}