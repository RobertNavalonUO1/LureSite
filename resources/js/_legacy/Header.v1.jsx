import React from 'react';
import { Inertia } from '@inertiajs/inertia';
import CartDropdown from '@/Components/cart/CartDropdown.jsx';
import AdvancedSearch from '@/Components/navigation/AdvancedSearch.jsx';

const Header = ({
  search,
  setSearch,
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  categories,
  user,
  onLoginOpen
}) => {
  const handleLogout = () => {
    Inertia.post('/logout');
  };

  return (
    <header className="bg-indigo-600 text-white py-4 px-6 shadow-md z-30">
      <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
        <h1 className="text-2xl font-bold tracking-tight">Limoneo</h1>

        <div className="w-full sm:w-auto flex-grow max-w-2xl">
          <AdvancedSearch
            search={search}
            setSearch={setSearch}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            categories={categories}
          />
        </div>

        <nav className="flex flex-wrap items-center gap-3 text-sm">
          <a href="/about" className="hover:underline">Acerca de</a>
          <a href="/contact" className="hover:underline">Contacto</a>
          <CartDropdown />
          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">Hola, {user.name}</span>
              <a href="/dashboard">
                <img
                  src={user.avatar || user.photo_url || '/default-avatar.png'}
                  alt="Avatar"
                  className="w-9 h-9 rounded-full border border-white object-cover shadow"
                />
              </a>
              <button
                onClick={handleLogout}
                className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded transition"
              >
                Cerrar sesión
              </button>
            </div>
          ) : (
            <button
              onClick={onLoginOpen}
              className="bg-white text-indigo-600 px-4 py-2 rounded hover:bg-indigo-100 transition"
            >
              Iniciar Sesión
            </button>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;