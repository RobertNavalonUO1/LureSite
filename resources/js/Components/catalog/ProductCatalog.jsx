// resources/js/Components/ProductCatalog.jsx
import React from 'react';
import { Inertia } from '@inertiajs/inertia';

const ProductCatalog = ({ products, cartCount }) => {

  const handleAddToCart = (productId) => {
    Inertia.post(`/cart/${productId}/add`);
  };

  return (
    <div>
      <h2>Productos</h2>
      <div>
        {products.map((product) => (
          <div key={product.id}>
            <img src={product.image_url} alt={product.name} />
            <h3>{product.name}</h3>
            <p>{product.price} $</p>
            <button onClick={() => handleAddToCart(product.id)}>
              Agregar al carrito
            </button>
          </div>
        ))}
      </div>
      <div>
        <p>Productos en el carrito: {cartCount}</p>
      </div>
    </div>
  );
};

export default ProductCatalog;
