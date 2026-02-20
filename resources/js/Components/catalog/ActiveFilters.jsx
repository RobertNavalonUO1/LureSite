// src/Components/ActiveFilters.jsx
import React from 'react';

const ActiveFilters = ({ selectedCategory, minPrice, maxPrice, categories, onClear }) => {
  if (!selectedCategory && !minPrice && !maxPrice) return null;

  return (
    <div className="mb-4 text-sm text-gray-600">
      <span className="mr-2 font-semibold">Filtros activos:</span>
      {selectedCategory && (
        <span className="mr-2 bg-gray-200 px-2 py-1 rounded">
          {categories.find(cat => cat.id === selectedCategory)?.name}
        </span>
      )}
      {minPrice && <span className="mr-2 bg-gray-200 px-2 py-1 rounded">Min: ${minPrice}</span>}
      {maxPrice && <span className="mr-2 bg-gray-200 px-2 py-1 rounded">Max: ${maxPrice}</span>}
      <button onClick={onClear} className="text-blue-600 underline ml-2">Limpiar filtros</button>
    </div>
  );
};

export default ActiveFilters;
