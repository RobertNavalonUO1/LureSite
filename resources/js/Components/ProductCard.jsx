// src/Components/ProductCard.jsx
import React from 'react';

const ProductCard = ({ product, onAddToCart, isFavorite, onToggleFavorite }) => {
  const filledStars = '★'.repeat(product.rating || 4);
  const emptyStars = '☆'.repeat(5 - (product.rating || 4));

  return (
    <div className="bg-white p-4 shadow-md rounded-lg relative">
      <button
        onClick={() => onToggleFavorite(product.id)}
        className="absolute top-2 right-2 text-xl"
        title="Agregar a favoritos"
      >
        {isFavorite ? '❤️' : '🤍'}
      </button>

      <a href={product.link || `/product/${product.id}`}>
        <picture>
          <source srcSet={product.image_url} type="image/avif" />
          <img
            src={product.image_url.replace('.avif', '.jpg')}
            alt={product.name}
            className="w-full h-40 object-cover rounded-md"
          />
        </picture>
      </a>

      <h3 className="text-xl font-bold mt-2 text-gray-800">{product.name}</h3>
      <p className="text-gray-500 text-sm">{product.category.name}</p>

      <div className="flex items-center mt-1 text-yellow-400">
        {filledStars}{emptyStars}
        <span className="ml-2 text-xs text-gray-500">({product.reviews || 12} reseñas)</span>
      </div>

      <p className="text-blue-700 font-extrabold text-lg mt-2">${product.price}</p>

      <button
        className={`mt-3 px-4 py-2 rounded w-full font-semibold text-white ${product.stock > 0 ? 'bg-green-600 hover:bg-green-700' : 'bg-gray-400 cursor-not-allowed'}`}
        onClick={() => onAddToCart(product.id)}
        disabled={product.stock === 0}
      >
        {product.stock > 0 ? "🛒 Agregar al carrito" : "Agotado"}
      </button>
    </div>
  );
};

export default ProductCard;
