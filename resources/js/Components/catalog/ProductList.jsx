import React from 'react';
import { usePage } from '@inertiajs/react';

const ProductDetails = () => {
    const { product } = usePage().props;

    return (
        <div className="min-h-screen bg-gray-50 flex flex-col items-center p-6">
            <h1 className="text-3xl font-bold">{product.name}</h1>
            <img src={product.image_url} alt={product.name} className="w-80 h-80 object-cover my-4 rounded-md" />
            <p className="text-gray-600">{product.category.name}</p>
            <p className="text-blue-600 font-bold text-2xl">€{product.price}</p>
            <p className="text-gray-700 mt-4">{product.stock} unidades disponibles</p>
            {product.is_adult && <p className="text-red-500 text-sm">🔞 Este producto es solo para adultos</p>}

            <div className="mt-6 flex space-x-4">
                <button className="bg-blue-500 text-white px-6 py-2 rounded hover:bg-blue-700">
                    🛒 Agregar al carrito
                </button>
                <a href="/" className="bg-gray-500 text-white px-6 py-2 rounded hover:bg-gray-700">
                    Volver a la tienda
                </a>
            </div>
        </div>
    );
};

export default ProductDetails;
