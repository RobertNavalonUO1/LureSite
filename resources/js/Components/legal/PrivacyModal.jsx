import React from 'react';

export default function PrivacyModal({ isOpen, onClose }) {
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
        <h2 className="text-2xl font-bold text-indigo-700 mb-4 text-center">Política de privacidad</h2>
        <div className="space-y-4 text-gray-700 text-sm max-h-[70vh] overflow-y-auto pr-2">
          <p>
            En Limoneo, tu privacidad es fundamental. Esta política explica cómo recopilamos, usamos y protegemos tu información personal.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">1. Información recopilada</h3>
          <p>
            Recopilamos datos que nos proporcionas al registrarte, realizar compras o contactar soporte, como nombre, correo electrónico, dirección y detalles de pago.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">2. Uso de la información</h3>
          <p>
            Utilizamos tus datos para procesar pedidos, mejorar tu experiencia, enviar notificaciones relevantes y cumplir con obligaciones legales.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">3. Protección de datos</h3>
          <p>
            Implementamos medidas de seguridad para proteger tu información contra accesos no autorizados, alteraciones o divulgación.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">4. Compartir información</h3>
          <p>
            No compartimos tus datos personales con terceros, salvo para procesar pagos, envíos o cuando la ley lo requiera.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">5. Cookies</h3>
          <p>
            Utilizamos cookies para mejorar la navegación y personalizar la experiencia. Puedes gestionar tus preferencias en cualquier momento.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">6. Derechos del usuario</h3>
          <p>
            Puedes acceder, modificar o eliminar tus datos personales contactándonos a través de la página de <a href="/contact" className="text-indigo-600 underline">Contacto</a>.
          </p>
          <h3 className="font-semibold text-indigo-600 mt-4">7. Cambios en la política</h3>
          <p>
            Nos reservamos el derecho de actualizar esta política. Te notificaremos sobre cambios importantes a través del sitio web o por correo electrónico.
          </p>
        </div>
      </div>
    </div>
  );
}