// resources/js/Pages/HomePage.jsx
import React from 'react';
import ProductCatalog from '@/Components/catalog/ProductCatalog.jsx';

const HomePage = ({ products, cartCount }) => {
  return (
    <div>
      <h1>Bienvenido a la tienda</h1>
      <ProductCatalog products={products} cartCount={cartCount} />
    </div>
  );
};

export default HomePage;