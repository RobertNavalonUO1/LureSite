import React from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import TopNavMenu from '@/Components/navigation/TopNavMenu.jsx';

export default function Terms() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Head title="Términos de servicio | WorldExpense" />
      <Header />
      <TopNavMenu />
      <main className="flex-grow max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Términos de servicio</h1>
        <div className="bg-white rounded-xl shadow p-6 space-y-4 text-gray-700 text-sm">
          <p>
            Bienvenido a WorldExpense. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte, por favor no utilices nuestros servicios.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">1. Uso del sitio</h2>
          <p>
            El usuario se compromete a utilizar este sitio únicamente para fines legales y personales. No está permitido realizar actividades fraudulentas, copiar contenido, ni interferir con el funcionamiento del sitio.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">2. Compras y pagos</h2>
          <p>
            Todos los precios están expresados en la moneda local e incluyen impuestos aplicables. Nos reservamos el derecho de modificar precios y productos sin previo aviso. Los pagos se procesan de forma segura a través de nuestros proveedores autorizados.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">3. Envíos y devoluciones</h2>
          <p>
            Los plazos de entrega son estimados y pueden variar. Puedes solicitar la devolución de productos dentro de los 14 días posteriores a la recepción, siempre que estén en condiciones originales.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">4. Propiedad intelectual</h2>
          <p>
            Todo el contenido de este sitio, incluyendo textos, imágenes y logotipos, es propiedad de WorldExpense o de sus proveedores y está protegido por derechos de autor.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">5. Modificaciones</h2>
          <p>
            Nos reservamos el derecho de actualizar estos términos en cualquier momento. Te recomendamos revisarlos periódicamente.
          </p>
          <h2 className="font-semibold text-indigo-600 mt-4">6. Contacto</h2>
          <p>
            Para cualquier consulta, puedes contactarnos a través de la página de <a href="/contact" className="text-indigo-600 underline">Contacto</a>.
          </p>
        </div>
      </main>
    </div>
  );
}