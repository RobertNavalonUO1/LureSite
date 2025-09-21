// ===============================
// Product Details Page Component
// Adaptado para usarse sin header duplicado
// ===============================

import React, { useState } from 'react';
import { router, usePage } from '@inertiajs/react';
import SidebarBanners from '@/Components/SidebarBanners';
import ProductReviews from '@/Components/ProductReviews';

const ProductDetails = ({ product, onCartOpen, reviews = [], user, onReviewSubmit, submittingReview, userReview }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedImage, setSelectedImage] = useState(product.gallery?.[0] || product.image_url);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});
  const { banners } = usePage().props;

  const requiresColor = Array.isArray(product.colors) && product.colors.length > 0;
  const requiresSize  = Array.isArray(product.sizes)  && product.sizes.length  > 0;

  const addToCart = () => {
    setErrors({});

    if (product.stock === 0) return;
    if (requiresColor && !selectedColor) {
      setErrors(prev => ({ ...prev, color: 'Selecciona un color.' }));
      return;
    }
    if (requiresSize && !selectedSize) {
      setErrors(prev => ({ ...prev, size: 'Selecciona un tamaño.' }));
      return;
    }

    setIsLoading(true);

    router.post(
      `/cart/${product.id}/add`,
      {
        quantity: Math.max(1, Number(quantity) || 1),
        color: requiresColor ? selectedColor : null,
        size:  requiresSize  ? selectedSize  : null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          onCartOpen?.();
          setIsLoading(false);
        },
        onError: (serverErrors) => {
          setErrors(serverErrors || {});
          alert('Error al agregar al carrito');
          setIsLoading(false);
        },
      }
    );
  };

  const banner4 = banners?.[3]
    ? [banners[3]]
    : [{
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
          {/* Galería */}
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

          {/* Info */}
          <div>
            <h1 className="text-2xl font-bold text-slate-800 mb-1">{product.name}</h1>
            <p className="text-sm text-gray-500 mb-1">{product.category?.name || 'Sin categoría'}</p>
            <p className="text-xl text-rose-600 font-semibold mb-2">${product.price}</p>
            <p className={`text-sm font-medium mb-3 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
              {product.stock > 0 ? `En stock: ${product.stock}` : 'Agotado'}
            </p>
            <p className="text-sm text-gray-600 mb-4">{product.description || 'Descripción no disponible.'}</p>

            {/* Color */}
            {requiresColor && (
              <div className="mb-4">
                <h4 className="font-medium mb-1">Color</h4>
                <div className="flex gap-2 flex-wrap">
                  {product.colors.map((color, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1 rounded-full border ${
                        selectedColor === color
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
                {errors.color && <p className="text-xs text-rose-600 mt-1">{errors.color}</p>}
              </div>
            )}

            {/* Talla */}
            {requiresSize && (
              <div className="mb-4">
                <h4 className="font-medium mb-1">Tamaño</h4>
                <div className="flex gap-2 flex-wrap">
                  {product.sizes.map((size, index) => (
                    <button
                      type="button"
                      key={index}
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1 rounded-full border ${
                        selectedSize === size
                          ? 'bg-indigo-600 text-white'
                          : 'bg-white text-gray-800 hover:bg-gray-100'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
                {errors.size && <p className="text-xs text-rose-600 mt-1">{errors.size}</p>}
              </div>
            )}

            {/* Cantidad */}
            <div className="mb-4 flex items-center gap-2">
              <label className="text-sm text-gray-700">Cantidad</label>
              <input
                type="number"
                min="1"
                max={product.stock || 99}
                value={quantity}
                onChange={(e) => setQuantity(Math.max(1, Number(e.target.value) || 1))}
                className="w-20 border rounded-lg px-3 py-2"
              />
            </div>

            {/* Acciones */}
            <div className="flex gap-4 mt-6">
              <button
                type="button"
                onClick={addToCart}
                disabled={isLoading || product.stock === 0}
                className={`px-6 py-3 font-semibold text-white rounded-xl shadow transition ${
                  product.stock > 0 ? 'bg-rose-600 hover:bg-rose-700' : 'bg-gray-400 cursor-not-allowed'
                }`}
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

        {/* Reseñas reales */}
        <ProductReviews
          reviews={reviews}
          user={user}
          onSubmit={onReviewSubmit}
          submitting={submittingReview}
          userReview={userReview}
        />
      </main>

      <SidebarBanners banners={banner4} />
    </div>
  );
};

export default ProductDetails;
