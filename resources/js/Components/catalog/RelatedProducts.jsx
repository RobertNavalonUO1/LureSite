import React from 'react';

const RelatedProducts = ({ categoryId, excludeId, products = [] }) => {
  const filtered = products.filter(
    (p) => p.id !== excludeId && p.category_id === categoryId
  );

  if (!filtered.length) return null;

  return (
    <div className="flex gap-4 overflow-x-auto pb-2">
      {filtered.map((item) => (
        <a
          key={item.id}
          href={`/product/${item.id}`}
          className="min-w-[150px] border rounded-lg p-2 flex-shrink-0 hover:shadow transition"
        >
          <img
            src={item.image_url}
            alt={item.name}
            className="h-28 object-contain mx-auto mb-1"
          />
          <p className="text-xs font-medium text-gray-800 text-center">
            {item.name}
          </p>
          <p className="text-sm text-rose-600 text-center">${item.price}</p>
        </a>
      ))}
    </div>
  );
};

export default RelatedProducts;
