import React, { useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import CartDropdownLateral from '@/Components/CartDropdownLateral';
import LeftBanner from '@/Components/LeftBanner';
import ProductDetails from '@/Components/ProductDetails';

const ProductPageLayout = ({ product }) => {
  const [cartOpen, setCartOpen] = useState(true);

  const handleAddToCart = (productId) => {
    Inertia.post(`/cart/${productId}/add`, {}, {
      onSuccess: (response) => {
        const { success, error } = response.data;
        if (success) {
          showModal(success, false);
        } else if (error) {
          showModal(error, true);
        }
      },
      onError: () => {
        showModal('Hubo un error al agregar el producto al carrito.', true);
      },
    });
  };


  const updateCartData = () => {
    Inertia.get('/cart', {
      onSuccess: (response) => {
        const { cartItems, cartCount, total } = response.props;
        // Actualiza los datos del carrito después de la acción
        // Es posible que necesites un state para actualizar los datos del carrito aquí si el componente no está compartiendo los datos.
        console.log('Carrito actualizado:', cartItems, cartCount, total);
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-100">
      {/* Header */}
      <header className="bg-white shadow sticky top-0 z-50">
        <div className="max-w-7xl mx-auto flex items-center justify-between p-4">
          <a href="/" className="text-red-600 font-bold text-xl">WorldExpense</a>

          <input
            type="text"
            placeholder="Buscar productos..."
            className="w-full max-w-lg border border-gray-300 rounded px-4 py-2 mx-6"
          />

          {/* Ir al checkout */}
          <a
            href="/checkout"
            className="relative bg-yellow-400 px-4 py-2 rounded hover:bg-yellow-500 transition flex items-center"
          >
            🛒 Ver carrito
          </a>
        </div>
      </header>

      {/* Contenido principal */}
      <div className="max-w-7xl mx-auto flex mt-6 px-4 gap-6">
        {/* Banner lateral */}
        <LeftBanner />

        {/* Detalles del producto */}
        <div className="flex-1">
          <ProductDetails product={product} onCartOpen={() => setCartOpen(true)} onAddToCart={handleAddToCart} />
        </div>
      </div>

      {/* Carrito lateral */}
      <CartDropdownLateral isOpen={cartOpen} onClose={() => setCartOpen(false)} />
    </div>
  );
};

export default ProductPageLayout;
