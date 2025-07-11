import React, { useState } from 'react';

const ProductDetails = ({ product, onCartOpen }) => {
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
  const [selectedImage, setSelectedImage] = useState(product.gallery?.[0] || product.image_url);
  const [isLoading, setIsLoading] = useState(false);
  const [feedback, setFeedback] = useState(null);

  const addToCart = () => {
    setIsLoading(true);
    window.axios.post(`/cart/${product.id}/add`)
      .then(() => {
        setFeedback({ type: 'success', message: 'Producto agregado correctamente' });
        onCartOpen(); // Abrimos el lateral del carrito
      })
      .catch(() => {
        setFeedback({ type: 'error', message: 'Error al agregar el producto' });
      })
      .finally(() => {
        setIsLoading(false);
        setTimeout(() => setFeedback(null), 2500); // Ocultar mensaje después de 2.5 segundos
      });
  };

  return (
    <div className="max-w-7xl mx-auto p-6 bg-white mt-4 shadow-md rounded relative">
      {/* Feedback visual */}
      {feedback && (
        <div className={`absolute top-4 right-4 px-4 py-2 rounded shadow-md text-white text-sm
          ${feedback.type === 'success' ? 'bg-green-600' : 'bg-red-600'}`}>
          {feedback.message}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-10">
        {/* Galería */}
        <div>
          <img
            src={selectedImage}
            alt={product.name}
            className="w-full h-[400px] object-contain rounded border"
          />
          <div className="mt-4 flex gap-2 overflow-x-auto">
            {[...(product.gallery || [product.image_url])].map((img, i) => (
              <img
                key={i}
                src={img}
                onClick={() => setSelectedImage(img)}
                className={`w-20 h-20 object-cover border rounded cursor-pointer ${selectedImage === img ? 'ring-2 ring-blue-500' : ''}`}
              />
            ))}
          </div>
        </div>

        {/* Información */}
        <div>
          <h1 className="text-2xl font-bold mb-1">{product.name}</h1>
          <p className="text-sm text-gray-500 mb-3">{product.category?.name || 'Sin categoría'}</p>
          <div className="text-2xl text-red-600 font-semibold mb-4">${product.price}</div>

          {product.colors?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Color:</h4>
              <div className="flex gap-2 flex-wrap">
                {product.colors.map((color, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedColor(color)}
                    className={`px-3 py-1 rounded border ${selectedColor === color ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    {color}
                  </button>
                ))}
              </div>
            </div>
          )}

          {product.sizes?.length > 0 && (
            <div className="mb-4">
              <h4 className="font-medium mb-1">Tamaño:</h4>
              <div className="flex gap-2 flex-wrap">
                {product.sizes.map((size, i) => (
                  <button
                    key={i}
                    onClick={() => setSelectedSize(size)}
                    className={`px-3 py-1 rounded border ${selectedSize === size ? 'bg-blue-600 text-white' : 'bg-white text-gray-700'}`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          )}

          <p className={`mb-2 font-medium ${product.stock > 0 ? 'text-green-600' : 'text-red-600'}`}>
            {product.stock > 0 ? `Disponible: ${product.stock}` : 'Agotado'}
          </p>

          <p className="text-sm text-gray-600 mb-4">{product.description || 'Sin descripción.'}</p>

          <div className="flex gap-4 mt-6">
            <button
              onClick={addToCart}
              disabled={isLoading || product.stock === 0}
              className={`px-6 py-3 font-semibold text-white rounded ${product.stock > 0 ? 'bg-red-600 hover:bg-red-700' : 'bg-gray-400 cursor-not-allowed'}`}
            >
              {isLoading ? 'Agregando...' : '🛒 Agregar al carrito'}
            </button>
            <a href="/" className="px-6 py-3 border rounded text-gray-700 hover:bg-gray-100">
              ← Volver
            </a>
          </div>

          <div className="mt-6 text-xs text-gray-400">
            SKU: {product.id} · Vendidos: {product.sold_count || 0} · Valoración: ⭐ {product.rating || 4.5}
          </div>
        </div>
      </div>

      {/* Opiniones */}
      <div className="mt-10 border-t pt-6">
        <h2 className="text-xl font-bold mb-2">Opiniones de clientes</h2>
        <p className="text-gray-500 mb-4">⭐ {product.rating || 4.5} de 5 - Opiniones ficticias</p>
        <ul className="space-y-2">
          <li className="border-t pt-2 text-gray-700">🧑‍💬 "Muy buen producto, calidad excelente."</li>
          <li className="border-t pt-2 text-gray-700">🧑‍💬 "Tal como se describe. Llegó rápido."</li>
        </ul>
      </div>
    </div>
  );
};

export default ProductDetails;
