import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Footer from '@/Components/navigation/Footer.jsx';
import StorefrontLayout from '@/Layouts/StorefrontLayout.jsx';

export default function FacebookDataDeletion() {
  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Head title="Eliminacion de datos de Facebook | Limoneo" />
      <StorefrontLayout showTopNav />

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-sky-900 px-6 py-10 text-white sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-sky-200/90">Meta App Review</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">Instrucciones para la eliminacion de datos de Facebook</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              Si has utilizado el inicio de sesion con Facebook en Limoneo, puedes solicitar la eliminacion de los datos vinculados a esa conexion desde Facebook o contactando directamente con nuestro equipo de soporte.
            </p>
          </div>

          <div className="space-y-6 px-6 py-8 text-sm text-slate-600 sm:px-10 sm:py-10 sm:text-base">
            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">1. Solicitud desde Facebook</h2>
              <p className="mt-3 leading-relaxed">
                Puedes eliminar la vinculacion de tu cuenta de Facebook con Limoneo desde la configuracion de aplicaciones y sitios web de tu cuenta de Facebook. Cuando Meta envía la solicitud de eliminacion, Limoneo procesa la desvinculacion y elimina los datos de acceso asociados a Facebook.
              </p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">2. Datos que se eliminan</h2>
              <p className="mt-3 leading-relaxed">
                Se elimina la relacion entre tu usuario de Limoneo y tu identificador de Facebook, incluidos el proveedor OAuth y el identificador del proveedor. Tambien se invalidan los tokens activos emitidos a traves de esa conexion social.
              </p>
            </section>

            <section className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">3. Solicitud manual</h2>
              <p className="mt-3 leading-relaxed">
                Si prefieres tramitar la solicitud manualmente, escribe a <a className="font-medium text-sky-700 underline" href="mailto:soporte@limoneo.com">soporte@limoneo.com</a> indicando el correo de tu cuenta y que deseas eliminar la vinculacion de Facebook.
              </p>
            </section>

            <section className="rounded-[28px] border border-sky-100 bg-sky-50/80 p-6 shadow-sm">
              <h2 className="font-semibold text-slate-900">4. Confirmacion de estado</h2>
              <p className="mt-3 leading-relaxed">
                El endpoint tecnico que procesa las solicitudes de Meta es <span className="font-medium text-slate-900">/auth/facebook/data-deletion</span>. Meta recibe una URL de confirmacion para consultar el estado de cada solicitud.
              </p>
              <p className="mt-3 leading-relaxed">
                Para consultas generales sobre privacidad, revisa nuestra <Link href="/privacy" className="font-medium text-sky-700 underline">politica de privacidad</Link> o utiliza la <Link href="/contact" className="font-medium text-sky-700 underline">pagina de contacto</Link>.
              </p>
            </section>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}