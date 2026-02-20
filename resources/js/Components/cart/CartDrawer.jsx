import React, { useState, useEffect, useCallback, useRef } from 'react';
import { usePage } from '@inertiajs/react';

const normaliseCartItems = (items) => {
  if (Array.isArray(items)) {
    return items;
  }

  if (items && typeof items === 'object') {
    return Object.values(items);
  }

  return [];
};

const formatTotal = (value) => {
  if (typeof value === 'number' && !Number.isNaN(value)) {
    return value.toFixed(2);
  }

  if (typeof value === 'string') {
    return value;
  }

  return '0.00';
};

const formatSubtotal = (price, quantity) => {
  const subtotal = Number(price) * Number(quantity);
  return Number.isFinite(subtotal) ? subtotal.toFixed(2) : '0.00';
};

const CartDrawer = ({ isOpen, onClose }) => {
  const {
    cartItems: initialCartItems = [],
    cartCount: initialCartCount = 0,
    total: initialTotal = '0.00',
  } = usePage().props;

  const [cartItems, setCartItems] = useState(() => normaliseCartItems(initialCartItems));
  const [cartCount, setCartCount] = useState(() => Number(initialCartCount ?? 0));
  const [total, setTotal] = useState(() => formatTotal(initialTotal));
  const [isMobile, setIsMobile] = useState(false);
  const panelRef = useRef(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setCartItems(normaliseCartItems(initialCartItems));
    setCartCount(Number(initialCartCount ?? 0));
    setTotal(formatTotal(initialTotal));
  }, [initialCartItems, initialCartCount, initialTotal]);

  useEffect(() => {
    if (!isOpen) {
      return undefined;
    }

    const handleOutsideClick = (event) => {
      if (panelRef.current && !panelRef.current.contains(event.target)) {
        onClose?.();
      }
    };

    document.addEventListener('mousedown', handleOutsideClick);
    document.addEventListener('touchstart', handleOutsideClick);

    return () => {
      document.removeEventListener('mousedown', handleOutsideClick);
      document.removeEventListener('touchstart', handleOutsideClick);
    };
  }, [isOpen, onClose]);

  const syncCartState = useCallback((payload = {}) => {
    setCartItems(normaliseCartItems(payload.cartItems));
    setCartCount(Number(payload.cartCount ?? 0));
    setTotal(formatTotal(payload.total));
  }, []);

  const fetchCartData = useCallback(async () => {
    try {
      const response = await fetch('/cart/summary', {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          'X-Requested-With': 'XMLHttpRequest',
        },
        credentials: 'same-origin',
      });

      if (!response.ok) {
        throw new Error(`Fallo ${response.status}`);
      }

      const data = await response.json();
      syncCartState(data);
    } catch (error) {
      console.error('No se pudo sincronizar el carrito', error);
    }
  }, [syncCartState]);

  useEffect(() => {
    if (isOpen) {
      fetchCartData();
    }
  }, [isOpen, fetchCartData]);

  const csrfToken = typeof document !== 'undefined'
    ? document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? ''
    : '';

  const callCartEndpoint = useCallback(
    async (endpoint) => {
      try {
        const response = await fetch(endpoint, {
          method: 'POST',
          headers: {
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            ...(csrfToken ? { 'X-CSRF-TOKEN': csrfToken } : {}),
          },
          credentials: 'same-origin',
        });

        if (!response.ok) {
          throw new Error(`Fallo ${response.status}`);
        }

        const data = await response.json();
        syncCartState(data);
      } catch (error) {
        console.error('No se pudo actualizar el carrito', error);
        fetchCartData();
      }
    },
    [csrfToken, fetchCartData, syncCartState],
  );

  const handleRemove = (productId) => callCartEndpoint(`/cart/${productId}/remove`);
  const handleIncrement = (productId) => callCartEndpoint(`/cart/${productId}/increment`);
  const handleDecrement = (productId) => callCartEndpoint(`/cart/${productId}/decrement`);

  if (!isOpen) return null;

  const sideCartClass = isMobile
    ? 'fixed inset-0 z-50 flex justify-center items-end'
    : 'fixed inset-0 z-50 flex justify-end items-stretch';

  const cartPanelClass = isMobile
    ? 'w-full max-w-full h-4/5 bg-white rounded-t-2xl shadow-2xl animate-slideUp'
    : 'w-full max-w-md h-full bg-white shadow-2xl animate-slideLeft';

  return (
    <div className={sideCartClass} style={{ zIndex: 100 }}>
      <div
        className="absolute inset-0 bg-black bg-opacity-40 transition-opacity"
        style={{ zIndex: 100 }}
        onClick={onClose}
        aria-hidden="true"
      />
      <div
        ref={panelRef}
        className={`relative flex flex-col ${cartPanelClass}`}
        style={{ zIndex: 110 }}
      >
        <div className="flex justify-between items-center p-4 border-b">
          <h2 className="text-lg font-semibold">Tu carrito</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 text-2xl font-bold px-2"
            aria-label="Cerrar carrito"
          >
            &times;
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {cartCount > 0 ? (
            <ul className="space-y-4">
              {cartItems.map((item) => (
                <li key={item.id} className="flex gap-4 items-start border-b pb-4">
                  <img src={item.image_url} alt={item.title} className="w-16 h-16 object-cover rounded" />
                  <div className="flex-1">
                    <p className="font-semibold">{item.title}</p>
                    <div className="flex items-center mt-2 gap-2">
                      <button
                        onClick={() => handleDecrement(item.id)}
                        className="bg-gray-200 px-2 rounded"
                        aria-label="Reducir cantidad"
                      >
                        -
                      </button>
                      <span>{item.quantity}</span>
                      <button
                        onClick={() => handleIncrement(item.id)}
                        className="bg-gray-200 px-2 rounded"
                        aria-label="Incrementar cantidad"
                      >
                        +
                      </button>
                    </div>
                    <p className="text-sm mt-1 font-bold">
                      ${formatSubtotal(item.price, item.quantity)}
                    </p>
                  </div>
                  <button onClick={() => handleRemove(item.id)} className="text-red-500 text-sm hover:underline">
                    Eliminar
                  </button>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-gray-500 text-center mt-8">Tu carrito esta vacio.</p>
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

export default CartDrawer;
