import React from 'react';

export default function TermsModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
      <div className="bg-white max-w-2xl w-full rounded-xl shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-400 hover:text-indigo-600 text-xl font-bold"
          aria-label="Cerrar"
        >
          ×
        </button>
        <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Términos de servicio</h2>
        <div className="space-y-4 text-gray-700 text-sm max-h-[70vh] overflow-y-auto pr-2">
          <p>
            Bienvenido a Limoneo. Al acceder y utilizar nuestro sitio web, aceptas cumplir con los siguientes términos y condiciones. Si no estás de acuerdo con alguna parte, por favor no utilices nuestros servicios.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">1. Uso del sitio</h3>
          <p>
            El usuario se compromete a utilizar este sitio únicamente para fines legales y personales. No está permitido realizar actividades fraudulentas, copiar contenido, ni interferir con el funcionamiento del sitio.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">2. Compras y pagos</h3>
          <p>
            Todos los precios están expresados en la moneda local e incluyen impuestos aplicables. Nos reservamos el derecho de modificar precios y productos sin previo aviso. Los pagos se procesan de forma segura a través de nuestros proveedores autorizados.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">3. Envíos y devoluciones</h3>
          <p>
            Los plazos de entrega son estimados y pueden variar. Puedes solicitar la devolución de productos dentro de los 14 días posteriores a la recepción, siempre que estén en condiciones originales.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">4. Propiedad intelectual</h3>
          <p>
            Todo el contenido de este sitio, incluyendo textos, imágenes y logotipos, es propiedad de Limoneo o de sus proveedores y está protegido por derechos de autor.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">5. Modificaciones</h3>
          <p>
            Nos reservamos el derecho de actualizar estos términos en cualquier momento. Te recomendamos revisarlos periódicamente.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">6. Contacto</h3>
          <p>
            Para cualquier consulta, puedes contactarnos a través de la página de <a href="/contact" className="text-indigo-600 underline">Contacto</a>.
          </p>
        </div>
      </div>
    </div>
  );
}