import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { Search } from 'lucide-react';

const SearchBar = () => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      Inertia.get('/search', { query: searchQuery });
    }
  };

  return (
    <form
      onSubmit={handleSearchSubmit}
      className="relative w-full max-w-4xl mx-auto"
      aria-label="Buscar productos"
    >
      <div className="flex items-center bg-indigo-500/10 backdrop-blur-md border border-indigo-200 rounded-full shadow-sm overflow-hidden focus-within:ring-2 focus-within:ring-white transition">
        <span className="pl-4 text-white/70">
          <Search size={18} />
        </span>
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          placeholder="Buscar producto"
          className="w-full px-4 py-2 text-sm text-slate-800 placeholder-white/60 bg-white/90 rounded-none focus:outline-none"
          aria-label="Campo de búsqueda"
        />
        <button
          type="submit"
          className="bg-white hover:bg-white text-indigo-600 font-medium text-sm px-5 py-2 rounded-r-full transition border-l border-indigo-100"
        >
          Buscar
        </button>
      </div>
    </form>
  );
};

export default SearchBar;
