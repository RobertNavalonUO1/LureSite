import React from 'react';
import { Search } from 'lucide-react'; // Asegúrate de tener lucide-react instalado

const AdvancedSearch = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  categories
}) => {
  return (
    <div className="w-full bg-white shadow-md rounded-xl p-4 flex flex-col sm:flex-row items-stretch sm:items-center gap-4">
      {/* Campo de búsqueda con ícono */}
      <div className="relative flex-grow">
        <Search className="absolute left-3 top-2.5 text-gray-400 w-5 h-5" />
        <input
          type="text"
          placeholder="Buscar productos..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
      </div>

      {/* Categorías */}
      <select
        className="w-full sm:w-48 border border-gray-300 px-3 py-2 rounded-lg text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-400"
        value={selectedCategory || ''}
        onChange={(e) => setSelectedCategory(e.target.value ? parseInt(e.target.value) : null)}
      >
        <option value="">Todas las categorías</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>{cat.name}</option>
        ))}
      </select>

      {/* Precio mínimo */}
      <input
        type="number"
        placeholder="Precio mín"
        value={minPrice}
        onChange={(e) => setMinPrice(e.target.value)}
        className="w-full sm:w-28 border border-gray-300 px-3 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />

      {/* Precio máximo */}
      <input
        type="number"
        placeholder="Precio máx"
        value={maxPrice}
        onChange={(e) => setMaxPrice(e.target.value)}
        className="w-full sm:w-28 border border-gray-300 px-3 py-2 rounded-lg text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-400"
      />
    </div>
  );
};

export default AdvancedSearch;
