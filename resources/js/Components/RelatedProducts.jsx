import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import CartDropdown from '@/Components/CartDropdown';
import CartDropdownLateral from '@/Components/CartDropdownLateral';
import LeftBanner from '@/Components/LeftBanner';
import TopNavMenu from '@/Components/TopNavMenu';

import ProductDetails from '@/Components/ProductDetails';
import ProductTabs from '@/Components/ProductTabs';
import RelatedProducts from '@/Components/RelatedProducts';
import SearchTags from '@/Components/SearchTags';

const ProductPageLayout = ({ product, relatedProducts = [] }) => {
  const [cartOpen, setCartOpen] = useState(true);
  const { auth } = usePage().props;
  const user = auth?.user;

  const handleAddToCart = (productId) => {
    Inertia.post(`/cart/${productId}/add`, {}, {
      onSuccess: (response) => {
        const { success, error } = response.data;
        if (success) console.log(success);
        else if (error) console.error(error);
      },
      onError: () => console.error('Hubo un error al agregar el producto al carrito.'),
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      {/* Header */}
      <header className="bg-indigo-600 text-white py-4 px-6 shadow-md z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">WorldExpense</h1>
          <div className="w-full sm:w-auto flex-grow max-w-2xl">
            <input
              type="text"
              placeholder="Buscar productos..."
              className="w-full px-4 py-2 rounded-md text-black focus:outline-none focus:ring-2 focus:ring-yellow-400"
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
                <form method="POST" action="/logout">
                  <button type="submit" className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded transition">
                    Cerrar sesión
                  </button>
                </form>
              </div>
            ) : (
              <a href="/login" className="bg-white text-indigo-600 px-4 py-2 rounded hover:bg-indigo-100 transition">
                Iniciar Sesión
              </a>
            )}
          </nav>
        </div>
      </header>

      {/* Navegación */}
      <TopNavMenu />

      {/* Contenido principal del producto */}
      <div className="max-w-7xl mx-auto flex mt-6 px-4 gap-6">
        <LeftBanner />
        <div className="flex-1">
          <ProductDetails product={product} onCartOpen={() => setCartOpen(true)} />
        </div>
      </div>

      {/* Sección extendida: tabs + recomendaciones + tags */}
      <div className="max-w-7xl mx-auto mt-8 px-4">
        <ProductTabs product={product} />
        <RelatedProducts categoryId={product.category_id} excludeId={product.id} products={relatedProducts} />
        <SearchTags tags={['Monitores ultraanchos', 'Ofertas pantallas', 'Accesorios gamer']} />
      </div>

      {/* Carrito lateral */}
      <CartDropdownLateral isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default ProductPageLayout;
