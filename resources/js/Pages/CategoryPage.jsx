import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import TopBanner from '@/Components/TopBanner';
import CategoryCards from '@/Components/CategoryCards';
import ProductCard from '@/Components/ProductCard';
import ActiveFilters from '@/Components/ActiveFilters';
import ProductSkeletonCard from '@/Components/ProductSkeletonCard';
import Loader from '@/Components/Loader';

import UI_CONFIG from '@/config/ui.config';

const CATEGORY_BACKGROUNDS = {
  electronica: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
  moda: 'bg-gradient-to-br from-pink-100 via-pink-50 to-white',
  hogar: 'bg-gradient-to-br from-yellow-100 via-yellow-50 to-white',
  deportes: 'bg-gradient-to-br from-green-100 via-green-50 to-white',
  belleza: 'bg-gradient-to-br from-purple-100 via-purple-50 to-white',
  // Agrega más slugs y estilos según tus categorías
  default: 'bg-gradient-to-br from-slate-100 via-white to-white',
};

const CategoryPage = () => {
  const { category, categories, products } = usePage().props;

  const [favorites, setFavorites] = useState([]);
  const [dropdownElement, setDropdownElement] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), UI_CONFIG.loader.delay);
    return () => clearTimeout(timer);
  }, []);

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId)
        ? prev.filter((id) => id !== productId)
        : [...prev, productId]
    );
  };

  const addToCart = (productId) => {
    Inertia.post(`/cart/${productId}/add`, {}, {
      onSuccess: (response) => {
        // Manejo de feedback opcional
      },
      onError: () => {
        alert('Error al agregar el producto al carrito');
      }
    });
  };

  // Selecciona el fondo según el slug, o usa el default
  const backgroundClass =
    CATEGORY_BACKGROUNDS[category?.slug] || CATEGORY_BACKGROUNDS.default;

  return (
    <div className={`flex flex-col min-h-screen text-slate-800 relative ${backgroundClass}`}>
      {/* Categorías horizontales */}
      <div className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <CategoryCards
            categories={categories}
            renderDropdown={(dropdown) => setDropdownElement(dropdown)}
          />
        </div>
      </div>

      {/* Layout principal */}
      <div className="flex flex-grow flex-col lg:flex-row max-w-7xl mx-auto w-full px-4">
        {/* SIDEBAR */}
        <aside className="lg:w-64 bg-white border-r p-4 hidden lg:block rounded-tr-2xl rounded-br-2xl shadow-md">
          <h2 className="text-lg font-semibold mb-4 text-indigo-700">Categorías</h2>
          <ul className="space-y-2">
            {categories.map((cat) => (
              <li key={cat.id}>
                <a
                  href={`/category/${cat.id}`}
                  className={`block py-2 px-3 rounded transition cursor-pointer ${
                    cat.id === category.id
                      ? 'bg-indigo-200 text-indigo-900 font-semibold'
                      : 'hover:bg-indigo-50 text-slate-700'
                  }`}
                >
                  {cat.name}
                </a>
              </li>
            ))}
          </ul>
        </aside>

        {/* CONTENIDO */}
        <main className="flex-grow p-4 sm:p-6">
          <TopBanner height="h-80" />

          <h2 className="text-3xl font-bold mb-2 text-indigo-800">{category.name}</h2>
          <p className="text-slate-500 mb-4">Mostrando productos en esta categoría</p>

          <ActiveFilters
            selectedCategory={category.id}
            categories={categories}
            onClear={() => {
              Inertia.visit('/');
            }}
          />

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
            {isLoading ? (
              Array.from({ length: UI_CONFIG.loader.skeletonCount }).map((_, i) => (
                <ProductSkeletonCard key={i} />
              ))
            ) : products.length > 0 ? (
              products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            ) : (
              <Loader text="No hay productos en esta categoría." />
            )}
          </div>
        </main>
      </div>

      {/* Dropdown flotante de categorías */}
      {dropdownElement}
    </div>
  );
};

export default CategoryPage;
