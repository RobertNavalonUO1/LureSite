import React, { useState } from 'react';
import { usePage, useForm } from '@inertiajs/react';
import LoginModal from '@/Components/LoginModal';

export default function Checkout() {
  const {
    cartItems,
    total,
    auth: { user },
    addresses,
    defaultAddressId,
  } = usePage().props;

  const hasAddress = addresses && addresses.length > 0;
  const isGuest = !user;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [useGuestForm, setUseGuestForm] = useState(isGuest);

  const { data, setData, post, processing, errors } = useForm({
    street: '',
    city: '',
    province: '',
    zip_code: '',
    country: '',
  });

  const handleGuestAddressSubmit = (e) => {
    e.preventDefault();
    post(route('checkout.guest_address'));
  };

  const shouldShowActionPrompt = (!user && !useGuestForm) || (user && !hasAddress);

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      <h3 className="text-xl font-semibold mb-2">Resumen del pedido</h3>
      <ul className="mb-4">
        {cartItems.map((item) => (
          <li key={item.id} className="flex justify-between border-b py-2">
            <span>
              {item.title} x {item.quantity}
            </span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
        <li className="flex justify-between font-bold mt-2">
          <span>Total:</span>
          <span>${parseFloat(total).toFixed(2)}</span>
        </li>
      </ul>

      {user && (
        <div className="bg-gray-50 p-4 rounded shadow mb-4">
          <h3 className="text-lg font-semibold mb-2">Datos del Usuario</h3>
          <p><strong>Nombre:</strong> {user.name}</p>
          <p><strong>Email:</strong> {user.email}</p>
          <p><strong>Teléfono:</strong> {user.phone ?? 'No disponible'}</p>
        </div>
      )}

      {user && hasAddress && (
        <div>
          <h3 className="text-xl font-semibold mb-2">Direcciones</h3>
          <ul>
            {addresses.map((addr) => (
              <li key={addr.id} className="mb-1">
                {addr.street}, {addr.city}, {addr.province}, {addr.zip_code}, {addr.country}
                {addr.id === defaultAddressId && (
                  <span className="ml-2 text-sm text-green-600">(Predeterminada)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {useGuestForm && (
        <div className="mt-6">
          <h3 className="text-xl font-semibold mb-2">Dirección de Envío (Invitado)</h3>
          <form onSubmit={handleGuestAddressSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <input
                placeholder="Calle"
                value={data.street}
                onChange={(e) => setData('street', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Ciudad"
                value={data.city}
                onChange={(e) => setData('city', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Provincia"
                value={data.province}
                onChange={(e) => setData('province', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="Código Postal"
                value={data.zip_code}
                onChange={(e) => setData('zip_code', e.target.value)}
                className="border p-2 rounded"
              />
              <input
                placeholder="País"
                value={data.country}
                onChange={(e) => setData('country', e.target.value)}
                className="border p-2 rounded"
              />
            </div>
            <button
              type="submit"
              className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded"
              disabled={processing}
            >
              Guardar Dirección
            </button>
          </form>
        </div>
      )}

      {shouldShowActionPrompt && (
        <div className="mt-6 bg-yellow-100 border border-yellow-300 p-4 rounded text-center text-sm text-gray-800">
          <p className="mb-2">Inicia sesión y añade una dirección para continuar con el pago.</p>
          <div className="flex justify-center gap-4">
            {!user && (
              <button
                onClick={() => setShowLoginModal(true)}
                className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
              >
                Iniciar sesión
              </button>
            )}
            {!useGuestForm && (
              <button
                onClick={() => setUseGuestForm(true)}
                className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300"
              >
                Comprar como invitado
              </button>
            )}
          </div>
        </div>
      )}

      <LoginModal
        isOpen={showLoginModal}
        onClose={() => setShowLoginModal(false)}
        onRegister={() => {
          setShowLoginModal(false);
          window.location.href = '/register';
        }}
        onForgot={() => {
          setShowLoginModal(false);
          window.location.href = '/forgot-password';
        }}
      />
    </div>
  );
}
