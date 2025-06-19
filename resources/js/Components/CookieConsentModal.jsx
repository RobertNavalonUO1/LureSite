import React from 'react';
import { ShieldCheck, SlidersHorizontal, X } from 'lucide-react';

const CookieConsentModal = ({ onAccept, onReject, onCustomize }) => {
  return (
    <div className="fixed bottom-0 left-0 w-full bg-white border-t p-4 shadow-2xl z-50 animate-fade-in-up">
      <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 text-sm text-gray-700">
          <ShieldCheck className="text-green-600 w-5 h-5" />
          <p>
            Usamos cookies para ofrecer una mejor experiencia, personalizar contenido y analizar el tráfico.
            Puedes aceptar, rechazar o personalizar tus preferencias.
          </p>
        </div>

        <div className="flex gap-2 flex-wrap justify-center md:justify-end mt-2 md:mt-0">
          <button
            onClick={onCustomize}
            className="flex items-center gap-2 px-4 py-2 border text-gray-700 rounded hover:bg-gray-100"
          >
            <SlidersHorizontal className="w-4 h-4" />
            Personalizar
          </button>
          <button
            onClick={onReject}
            className="flex items-center gap-2 px-4 py-2 bg-red-100 text-red-600 border border-red-300 rounded hover:bg-red-200"
          >
            <X className="w-4 h-4" />
            Rechazar
          </button>
          <button
            onClick={onAccept}
            className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700 shadow-sm"
          >
            <ShieldCheck className="w-4 h-4" />
            Aceptar cookies
          </button>
        </div>
      </div>
    </div>
  );
};

export default CookieConsentModal;
