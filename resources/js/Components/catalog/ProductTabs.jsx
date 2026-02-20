import React, { useState } from 'react';

const ProductTabs = ({ product }) => {
  const [activeTab, setActiveTab] = useState('descripcion');

  return (
    <div className="mt-10">
      {/* Tabs de navegación */}
      <div className="flex gap-6 border-b text-sm font-medium text-indigo-600">
        {['descripcion', 'especificaciones', 'reviews'].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`py-2 border-b-2 ${activeTab === tab ? 'border-indigo-600 font-bold' : 'border-transparent'}`}
          >
            {tab === 'descripcion' ? 'Descripción' : tab === 'especificaciones' ? 'Especificaciones' : 'Reseñas'}
          </button>
        ))}
      </div>

      {/* Contenido de la pestaña activa */}
      <div className="mt-6">
        {activeTab === 'descripcion' && (
          <div>
            <h2 className="text-lg font-bold mb-2">Descripción del producto</h2>
            <p className="text-gray-600">{product.description || 'Sin descripción.'}</p>
          </div>
        )}

        {activeTab === 'especificaciones' && (
          <div>
            <h2 className="text-lg font-bold mb-2">Especificaciones técnicas</h2>
            <ul className="list-disc list-inside text-gray-600">
              <li>Modelo: UltraWide 34"</li>
              <li>Resolución: 3440x1440</li>
              <li>Panel: IPS</li>
              <li>Frecuencia: 75Hz</li>
            </ul>
          </div>
        )}

        {activeTab === 'reviews' && (
          <div>
            <h2 className="text-lg font-bold mb-2">Opiniones de clientes</h2>
            <p className="text-sm text-gray-500 mb-4">⭐ {product.rating || 4.5} de 5 — reseñas ficticias</p>
            <ul className="space-y-2">
              <li className="border-t pt-2 text-gray-700">🧑‍💬 "Muy buen producto, excelente calidad."</li>
              <li className="border-t pt-2 text-gray-700">🧑‍💬 "Tal como se describe. Llegó rápido."</li>
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProductTabs;
