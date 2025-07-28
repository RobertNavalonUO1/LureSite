import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

const CartDropdownLateral = () => {
  const { cartItems: initialCartItems, cartCount: initialCartCount, total: initialTotal } = usePage().props;

  const [cartItems, setCartItems] = useState(initialCartItems);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [total, setTotal] = useState(initialTotal);

  const fetchCartData = () => {
    Inertia.get('/cart', {
      onSuccess: (response) => {
        const { cartItems, cartCount, total } = response.props;
        setCartItems(cartItems);
        setCartCount(cartCount);
        setTotal(total);
      },
    });
  };

  useEffect(() => {
    setCartItems(initialCartItems);
    setCartCount(initialCartCount);
    setTotal(initialTotal);
  }, [initialCartItems, initialCartCount, initialTotal]);

  const handleRemove = (productId) => {
    Inertia.post(`/cart/${productId}/remove`, {}, { onSuccess: fetchCartData });
  };

  const handleIncrement = (productId) => {
    Inertia.post(`/cart/${productId}/increment`, {}, { onSuccess: fetchCartData });
  };

  const handleDecrement = (productId) => {
    Inertia.post(`/cart/${productId}/decrement`, {}, { onSuccess: fetchCartData });
  };

  return (
    <div className="fixed top-0 right-0 h-full w-96 max-w-full bg-white shadow-lg z-50 flex flex-col">
      <div className="flex justify-between items-center p-4 border-b">
        <h2 className="text-lg font-semibold">Tu carrito</h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4">
        {cartCount > 0 ? (
          <ul className="space-y-4">
            {Object.values(cartItems).map((item) => (
              <li key={item.id} className="flex gap-4 items-start border-b pb-4">
                <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded" />
                <div className="flex-1">
                  <p className="font-semibold">{item.title}</p>
                  <div className="flex items-center mt-2 gap-2">
                    <button onClick={() => handleDecrement(item.id)} className="bg-gray-200 px-2 rounded">−</button>
                    <span>{item.quantity}</span>
                    <button onClick={() => handleIncrement(item.id)} className="bg-gray-200 px-2 rounded">+</button>
                  </div>
                  <p className="text-sm mt-1 font-bold">${(item.price * item.quantity).toFixed(2)}</p>
                </div>
                <button onClick={() => handleRemove(item.id)} className="text-red-500 text-sm hover:underline">Eliminar</button>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500 text-center mt-8">Tu carrito está vacío.</p>
        )}
      </div>

      <div className="p-4 border-t">
        <div className="flex justify-between font-semibold text-lg mb-3">
          <span>Total:</span>
          <span>${total}</span>
        </div>
        <a
          href="/checkout"
          className="block w-full text-center bg-blue-600 text-white py-3 rounded-md hover:bg-blue-700 transition"
        >
          Ir al checkout
        </a>
      </div>
    </div>
  );
};

export default CartDropdownLateral;
