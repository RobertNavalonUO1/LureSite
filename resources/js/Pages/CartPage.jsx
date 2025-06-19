import React from 'react';
import { Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';

const CartPage = ({ cartItems, cartCount, total }) => {
  const handleRemove = (productId) => {
    Inertia.post(`/cart/${productId}/remove`);
  };

  const handleCheckout = () => {
    Inertia.post('/checkout', { cart: { items: cartItems, total } }, {
      onSuccess: () => Inertia.visit('/checkout')
    });
  };

  return (
    <div className="cart-container p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Carrito de Compras</h1>
      <div className="cart-items space-y-4">
        {cartCount > 0 ? (
          <ul className="space-y-4">
            {Object.values(cartItems).map((item) => (
              <li key={item.id} className="cart-item flex items-center gap-4 border p-4 rounded-lg">
                <img src={item.image_url} alt={item.name} className="w-24 h-24 object-cover rounded" />
                <div className="flex-grow">
                  <h3 className="text-lg font-semibold">{item.name}</h3>
                  <p>Precio: ${item.price}</p>
                  <p>Cantidad: {item.quantity}</p>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 hover:underline mt-2 text-sm"
                  >
                    Eliminar
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">El carrito está vacío</p>
        )}
      </div>

      <div className="cart-summary mt-8 text-right">
        <h2 className="text-xl font-bold mb-2">Total: ${total}</h2>
        <button
          onClick={handleCheckout}
          className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700"
        >
          Ir a Checkout
        </button>
      </div>
    </div>
  );
};

export default CartPage;
