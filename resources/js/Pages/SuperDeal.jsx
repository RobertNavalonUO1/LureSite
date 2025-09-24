// Importación de librerías de React y herramientas de Inertia.js
import React, { useState, useEffect } from 'react';
import { usePage, Head } from '@inertiajs/react';

// Importación de componentes visuales y funcionales de la aplicación
import Header from '@/Components/Header';
import TopNavMenu from '@/Components/TopNavMenu';
import SidebarBanners from '@/Components/SidebarBanners';

function SuperDealCard({ product }) {
  return (
    <div
      className="bg-gradient-to-br from-orange-50 via-white to-yellow-100 rounded-2xl shadow-md p-4 flex flex-col hover:shadow-xl transition group border border-orange-200 relative"
      style={{ width: 220, minHeight: 340, maxWidth: 220 }}
    >
      <div className="relative mb-3">
        <img
          src={product.image || product.image_url || "/images/logo.png"}
          alt={product.title || product.name}
          className="h-32 w-full object-contain rounded-lg bg-orange-50"
          style={{ minHeight: 128, maxHeight: 128 }}
        />
        <span className="absolute top-2 left-2 bg-orange-500 text-white text-xs px-2 py-1 rounded font-bold shadow">
          🔥 Super Deal
        </span>
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 bg-rose-500 text-white text-xs px-2 py-1 rounded font-bold shadow">
            -{product.discount}%
          </span>
        )}
      </div>
      <h2 className="font-semibold text-base mb-1 group-hover:text-orange-700 transition line-clamp-2">{product.title || product.name}</h2>
      <p className="text-gray-500 text-xs mb-2">{product.category?.name}</p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-orange-600 font-bold text-lg">
          {product.price} €
        </span>
        {product.old_price && (
          <span className="line-through text-gray-400 text-xs">
            {product.old_price} €
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-auto">
        <a
          href={product.link || `/product/${product.id}`}
          className="flex-1 bg-orange-500 text-white rounded-lg py-2 px-2 text-xs font-semibold transition-all duration-200 hover:bg-orange-600 text-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          Comprar ahora
        </a>
      </div>
    </div>
  );
}

const SuperDeal = () => {
  const { banners } = usePage().props;
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/superdeals")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-orange-50 via-white to-yellow-100 text-slate-800">
      <Head title="Super Deals" />
      <Header />
      <TopNavMenu />

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-8">
          {/* Contenido principal */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 text-center border border-orange-200">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 flex items-center gap-2 justify-center text-orange-600 drop-shadow">
                🔥 Super Deals
              </h1>
              <p className="mb-8 text-gray-700 text-lg">
                Descubre productos seleccionados con descuentos exclusivos solo por tiempo limitado.<br />
                <span className="text-orange-500 font-semibold">¡No dejes pasar estas oportunidades!</span>
              </p>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Cargando superdeals...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No hay superdeals activos.</div>
              ) : (
                <div className="flex flex-wrap justify-center gap-6">
                  {products.map((product) => (
                    <SuperDealCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
            <p className="mt-8 text-center text-gray-500 text-sm">
              ⚡ ¡Recuerda! Estas ofertas pueden cambiar en cualquier momento.
            </p>
          </div>
          {/* Banners laterales */}
          <aside className="mt-4 lg:mt-0">
            <div className="hidden lg:block">
              <SidebarBanners banners={banners?.superDeal || banners?.default || []} />
            </div>
            <div className="block lg:hidden mb-4">
              {banners?.superDeal?.[0] && (
                <img
                  src={banners.superDeal[0].src}
                  alt={banners.superDeal[0].alt || "Banner"}
                  className="rounded-xl shadow-md w-full max-h-32 object-cover"
                />
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SuperDeal;
