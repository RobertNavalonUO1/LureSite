import React from 'react';
import { Link } from '@inertiajs/react';
import { Inertia } from '@inertiajs/inertia';
import { useI18n } from '@/i18n';

const CartPage = ({ cartItems, cartCount, total }) => {
  const { t } = useI18n();

  const handleRemove = (productId) => {
    Inertia.post(`/cart/${productId}/remove`);
  };

  const handleCheckout = () => {
    Inertia.post('/checkout', { cart: { items: cartItems, total } }, {
      onSuccess: () => Inertia.visit('/checkout')
    });
  };

  return (
    <div className="cart-container px-4 py-5 sm:p-6 max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">{t('shop.cart.title')}</h1>
      <div className="cart-items space-y-4">
        {cartCount > 0 ? (
          <ul className="space-y-4">
            {Object.values(cartItems).map((item) => (
              <li key={item.id} className="cart-item flex flex-col gap-4 border p-4 rounded-lg sm:flex-row sm:items-center">
                <img src={item.image_url} alt={item.name} className="w-20 h-20 object-cover rounded sm:w-24 sm:h-24" />
                <div className="flex-grow min-w-0">
                  <h3 className="text-base sm:text-lg font-semibold break-words">{item.name}</h3>
                  <p>{t('shop.cart.price')}: ${item.price}</p>
                  <p>{t('shop.cart.quantity')}: {item.quantity}</p>
                  <button
                    onClick={() => handleRemove(item.id)}
                    className="text-red-500 hover:underline mt-2 text-sm"
                  >
                    {t('shop.cart.remove')}
                  </button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-gray-500">{t('shop.cart.empty')}</p>
        )}
      </div>

      <div className="cart-summary mt-8 text-right">
        <h2 className="text-xl font-bold mb-2">{t('shop.cart.total')}: ${total}</h2>
        <button
          onClick={handleCheckout}
          className="bg-blue-600 text-white px-6 py-3 rounded hover:bg-blue-700 w-full sm:w-auto"
        >
          {t('shop.cart.checkout')}
        </button>
      </div>
    </div>
  );
};

export default CartPage;
