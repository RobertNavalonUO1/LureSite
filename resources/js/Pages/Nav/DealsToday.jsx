import React from 'react';
import ProductCard from '@/Components/ProductCard';

const DealsToday = ({ products }) => {
  return (
    <div className="max-w-7xl mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold text-red-600 mb-4">🔥 Ofertas de Hoy</h1>

      {products.length > 0 ? (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-4">
          {products.map((product) => (
            <ProductCard key={product.id} product={product} />
          ))}
        </div>
      ) : (
        <p className="text-gray-600">No hay ofertas activas en este momento.</p>
      )}
    </div>
  );
};

export default DealsToday;
