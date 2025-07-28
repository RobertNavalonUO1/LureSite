// ===============================
// Product Details Page Component
// Adaptado para usarse sin header duplicado
// ===============================

import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import SidebarBanners from '@/Components/SidebarBanners';
import { usePage } from '@inertiajs/react';

const ProductDetails = ({ product, onCartOpen }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedImage, setSelectedImage] = useState(product.gallery?.[0] || product.image_url);
  const [isLoading, setIsLoading] = useState(false);
  const { banners } = usePage().props;

  const addToCart = () => {
    setIsLoading(true);
    Inertia.post(`/cart/${product.id}/add`, {}, {
      onSuccess: () => {
        onCartOpen();
        setIsLoading(false);
      },
      onError: () => {
        alert('Error al agregar al carrito');
        setIsLoading(false);
      },
    });
  };

  const banner4 = banners?.[3] ? [banners[3]] : [{
    src: '/images/banner4.webp',
    alt: 'Promoción destacada',
    href: '/promocion/3',
    button: 'Descubrir'
  }];

  return (
    <div className="w-full grid grid-cols-1 lg:grid-cols-[3fr_1.5fr] gap-4">
      {/* === Detalles del producto === */}
      <main className="bg-white rounded-xl shadow p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
          <div>
            <img
              src={selectedImage}
              alt={product.name}
              className="w-full h-[420px] object-contain border rounded-xl shadow-sm"
            />
            <div className="mt-4 flex gap-2 overflow-x-auto">
              {[...(product.gallery || [product.image_url])].map((img, index) => (
                <img
                  key={index}
                  src={img}
                  onClick={() => setSelectedImage(img)}
                  className={`w-16 h-16 object-cover border rounded cursor-pointer transition hover:opacity-80 ${
                    selectedImage === img ? 'ring-2 ring-indigo-500' : ''
                  }`}
                />
              ))}
            </div>
          </div>

          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-1">{product.category?.name || 'Sin categoría'}</p>
            <p className="text-xl text-rose-600 font-semibold mb-2">${product.price}</p>
            <p className={`text-sm font-medium mb-3 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `En stock: ${product.stock}` : 'Agotado'}
            </p>
            <p className="text-sm text-gray-600 mb-4">{product.description || 'Descripción no disponible.'}</p>

            {product.colors?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-1">Color</h4>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 rounded-full border ${selectedColor === color ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {product.sizes?.length > 0 && (
              <div className="mb-4">
                <h4 className="font-medium mb-1">Tamaño</h4>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size, index) => (
                    <button
                      key={index}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 rounded-full border ${selectedSize === size ? 'bg-indigo-600 text-white' : 'bg-white text-gray-800 hover:bg-gray-100'}`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            <div className="flex gap-4 mt-6">
              <button
                onClick={addToCart}
                disabled={isLoading || product.stock === 0}
                className={`px-6 py-3 font-semibold text-white rounded-xl shadow transition ${product.stock > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-400 cursor-not-allowed'}`}
              >
                {isLoading ? 'Agregando...' : 'Agregar al carrito'}
              </button>
              <a href="/" className="px-6 py-3 border rounded-xl text-gray-700 hover:bg-gray-100">
                ← Volver
              </a>
            </div>

            <div className="mt-6 text-xs text-gray-400">
              SKU: {product.id} • Vendidos: {product.sold_count || 0} • Valoración: ⭐ {product.rating || 4.5}
            </div>
          </div>
        </div>

        <div className="mt-10 border-t pt-6">
          <h2 className="text-lg font-bold mb-2">Opiniones de clientes</h2>
          <p className="text-sm text-gray-500 mb-4">⭐ {product.rating || 4.5} de 5 — reseñas ficticias</p>
          <ul className="space-y-2">
            <li className="border-t pt-2 text-gray-700">🧑‍💬 "Muy buen producto, excelente calidad."</li>
            <li className="border-t pt-2 text-gray-700">🧑‍💬 "Tal como se describe. Llegó rápido."</li>
          </ul>
        </div>
      </main>

      <SidebarBanners banners={banner4} />
    </div>
  );
};

export default ProductDetails;
