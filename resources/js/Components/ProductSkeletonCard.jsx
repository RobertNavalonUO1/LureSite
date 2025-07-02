// src/Components/ProductSkeletonCard.jsx
import React from 'react';

const ProductSkeletonCard = () => {
  return (
    <div className="bg-white p-4 shadow-md rounded-lg animate-pulse relative">
      {/* Icono favorito fantasma */}
      <div className="absolute top-2 right-2 h-5 w-5 bg-gray-300 rounded-full" />

      {/* Imagen fantasma */}
      <div className="w-full h-40 bg-gray-200 rounded-md mb-4"></div>

      {/* Nombre del producto */}
      <div className="h-4 bg-gray-300 rounded w-3/4 mb-2"></div>

      {/* Categoría */}
      <div className="h-3 bg-gray-200 rounded w-1/2 mb-3"></div>

      {/* Estrellas falsas */}
      <div className="flex items-center space-x-1 mb-2">
        {Array(5).fill(0).map((_, i) => (
          <div key={i} className="w-4 h-4 bg-gray-200 rounded-full" />
        ))}
      </div>

      {/* Precio */}
      <div className="h-4 bg-gray-300 rounded w-1/3 mb-4"></div>

      {/* Botón */}
      <div className="h-10 bg-gray-300 rounded w-full"></div>
    </div>
  );
};

export default ProductSkeletonCard;
