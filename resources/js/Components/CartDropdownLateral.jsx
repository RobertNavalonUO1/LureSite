import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

const CartDropdownLateral = ({ isOpen, onClose }) => {
  const { cartItems: initialCartItems, cartCount: initialCartCount, total: initialTotal } = usePage().props;

  const [cartItems, setCartItems] = useState(initialCartItems);
  const [cartCount, setCartCount] = useState(initialCartCount);
  const [total, setTotal] = useState(initialTotal);
  const [isMobile, setIsMobile] = useState(false);

  // Detecta si es móvil
  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Sincroniza props con estado
  useEffect(() => {
    setCartItems(initialCartItems);
    setCartCount(initialCartCount);
    setTotal(initialTotal);
  }, [initialCartItems, initialCartCount, initialTotal]);

  // Cierra al pulsar fondo oscuro
  const handleBackdropClick = (e) => {
    if (e.target === e.currentTarget) {
      onClose?.();
    }
  };

  const handleRemove = (productId) => {
    Inertia.post(`/cart/${productId}/remove`, {}, { onSuccess: fetchCartData });
  };

  const handleIncrement = (productId) => {
    Inertia.post(`/cart/${productId}/increment`, {}, { onSuccess: fetchCartData });
  };

  const handleDecrement = (productId) => {
    Inertia.post(`/cart/${productId}/decrement`, {}, { onSuccess: fetchCartData });
  };

  // Refresca datos del carrito tras cambios
  const fetchCartData = () => {
    Inertia.get('/cart', {
      onSuccess: (response) => {
        const { cartItems, cartCount, total } = response.props;
        setCartItems(cartItems);
        setCartCount(cartCount);
        setTotal(total);
      },
      preserveState: true,
      replace: true,
    });
  };

  // Oculta el carrito si no está abierto
  if (!isOpen) return null;

  // Estilos responsivos
  const sideCartClass = isMobile
    ? "fixed inset-0 z-50 flex justify-center items-end"
    : "fixed inset-0 z-50 flex justify-end items-stretch";

  const cartPanelClass = isMobile
    ? "w-full max-w-full h-4/5 bg-white rounded-t-2xl shadow-2xl animate-slideUp"
    : "w-full max-w-md h-full bg-white shadow-2xl animate-slideLeft";

  return (
    <div className={sideCartClass} style={{ zIndex: 100 }} onClick={handleBackdropClick}>
      {/* Fondo oscuro, ahora con pointer-events-auto */}
      <div
        className="absolute inset-0 bg-black bg-opacity-40 transition-opacity"
        style={{ zIndex: 100 }}
      />
      {/* Panel lateral o inferior */}
      <div
        className={`relative flex flex-col ${cartPanelClass}`}
        style={{ zIndex: 110 }}
        onClick={e => e.stopPropagation()}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Tu carrito</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-2"
            aria-label="Cerrar carrito"
          >
            ×
          </button>
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
      {/* Animaciones para mobile */}
      <style>
        {`
          @keyframes slideUp { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .animate-slideUp { animation: slideUp 0.25s cubic-bezier(.4,0,.2,1); }
          @keyframes slideLeft { from { transform: translateX(100%); } to { transform: translateX(0); } }
          .animate-slideLeft { animation: slideLeft 0.25s cubic-bezier(.4,0,.2,1); }
        `}
      </style>
    </div>
  );
};

export default CartDropdownLateral;
