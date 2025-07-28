import React from 'react';
import ProductCard from './ProductCard';
import FeaturedProductCard from './FeaturedProductCard';

const ProductGrid = ({ products, featuredProducts, onAddToCart, onToggleFavorite, favorites }) => {
  const columnsPerRow = 4;
  const insertEvery = 3;

  const rows = [];
  for (let i = 0, fIndex = 0; i < products.length; i += columnsPerRow) {
    const chunk = products.slice(i, i + columnsPerRow);
    rows.push(
      <div key={`row-${i}`} className="grid grid-cols-4 gap-4">
        {chunk.map((product) => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={onAddToCart}
            onToggleFavorite={onToggleFavorite}
            isFavorite={favorites.includes(product.id)}
          />
        ))}
      </div>
    );

    // Agrega destacado después de cada X filas
    if ((rows.length % insertEvery === 0) && featuredProducts[fIndex]) {
      rows.push(
        <FeaturedProductCard key={`featured-${fIndex}`} product={featuredProducts[fIndex]} />
      );
      fIndex++;
    }
  }

  return <div className="space-y-6">{rows}</div>;
};

export default ProductGrid;
