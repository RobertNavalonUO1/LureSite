import React from 'react';
import { Inertia } from '@inertiajs/inertia';

const ProductCard = ({ product, onAddToCart, isFavorite, onToggleFavorite }) => {
  const rating = product.rating || 4;
  const reviews = product.reviews || 12;

  const filledStars = '★'.repeat(rating);
  const emptyStars = '☆'.repeat(5 - rating);

  const goToProduct = () => {
    Inertia.visit(`/product/${product.id}`);
  };

  return (
    <div
      onClick={goToProduct}
      className="cursor-pointer bg-white rounded-xl shadow-sm hover:shadow-md transition-all duration-200 border border-slate-100 group flex flex-col"
    >
      {/* Imagen cuadrada */}
      <div className="relative w-full aspect-square overflow-hidden rounded-t-xl">
        <picture>
          <source srcSet={product.image_url} type="image/avif" />
          <img
            src={product.image_url.replace('.avif', '.jpg')}
            alt={product.name}
            className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          />
        </picture>

        {/* Botón de favorito */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            onToggleFavorite(product.id);
          }}
          className="absolute top-2 right-2 text-lg z-10 bg-white rounded-full p-1 shadow hover:scale-110 transition"
          title="Agregar a favoritos"
        >
          {isFavorite ? '❤️' : '🤍'}
        </button>
      </div>

      {/* Contenido compacto */}
      <div className="flex flex-col justify-between flex-grow px-3 py-2">
        <div className="space-y-0.5">
          <h3 className="text-sm font-semibold text-slate-800 line-clamp-2 leading-snug">{product.name}</h3>
          <p className="text-xs text-slate-500">{product.category.name}</p>

          <div className="flex items-center text-yellow-400 text-sm">
            <span>{filledStars}{emptyStars}</span>
            <span className="ml-1 text-xs text-slate-400">({reviews})</span>
          </div>
        </div>

        <div className="mt-2 space-y-1">
          <p className="text-indigo-600 font-bold text-base">${product.price}</p>
          <button
            onClick={(e) => {
              e.stopPropagation();
              onAddToCart(product.id);
            }}
            disabled={product.stock === 0}
            className={`w-full py-1.5 text-sm rounded-lg font-semibold transition ${
              product.stock > 0
                ? 'bg-green-600 hover:bg-green-700 text-white'
                : 'bg-gray-300 text-gray-600 cursor-not-allowed'
            }`}
          >
            {product.stock > 0 ? '🛒 Agregar' : 'Agotado'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
