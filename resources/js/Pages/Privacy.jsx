import React from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/Components/Header';
import TopNavMenu from '@/Components/TopNavMenu';

export default function Privacy() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Head title="Política de privacidad | WorldExpense" />
      <Header />
      <TopNavMenu />
      <main className="flex-grow max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Política de privacidad</h1>
        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-700 text-sm">
          <p>
            En WorldExpense, tu privacidad es fundamental. Esta política explica cómo recopilamos, usamos y protegemos tu información personal.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">1. Información recopilada</h2>
          <p>
            Recopilamos datos que nos proporcionas al registrarte, realizar compras o contactar soporte, como nombre, correo electrónico, dirección y detalles de pago.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">2. Uso de la información</h2>
          <p>
            Utilizamos tus datos para procesar pedidos, mejorar tu experiencia, enviar notificaciones relevantes y cumplir con obligaciones legales.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">3. Protección de datos</h2>
          <p>
            Implementamos medidas de seguridad para proteger tu información contra accesos no autorizados, alteraciones o divulgación.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">4. Compartir información</h2>
          <p>
            No compartimos tus datos personales con terceros, salvo para procesar pagos, envíos o cuando la ley lo requiera.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">5. Cookies</h2>
          <p>
            Utilizamos cookies para mejorar la navegación y personalizar la experiencia. Puedes gestionar tus preferencias en cualquier momento.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">6. Derechos del usuario</h2>
          <p>
            Puedes acceder, modificar o eliminar tus datos personales contactándonos a través de la página de <a href="/contact" className="text-indigo-600 underline">Contacto</a>.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">7. Cambios en la política</h2>
          <p>
            Nos reservamos el derecho de actualizar esta política. Te notificaremos sobre cambios importantes a través del sitio web o por correo electrónico.
          </p>
        </div>
      </main>
    </div>
  );
}