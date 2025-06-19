import React, { useState } from 'react';
import { usePage, useForm } from '@inertiajs/react';

export default function Checkout() {
  const { cartItems, total, user, addresses, defaultAddressId } = usePage().props;
  const [useGuestForm, setUseGuestForm] = useState(!user);
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

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h2 className="text-2xl font-bold mb-4">Checkout</h2>

      <h3 className="text-xl font-semibold mb-2">Resumen del Carrito</h3>
      <ul className="mb-4">
        {cartItems.map(item => (
          <li key={item.id} className="flex justify-between border-b py-2">
            <span>{item.title} x {item.quantity}</span>
            <span>${(item.price * item.quantity).toFixed(2)}</span>
          </li>
        ))}
        <li className="flex justify-between font-bold mt-2">
          <span>Total:</span>
          <span>${parseFloat(total).toFixed(2)}</span>
        </li>
      </ul>

      {user ? (
        <div>
          <h3 className="text-xl font-semibold mb-2">Direcciones</h3>
          <ul>
            {addresses.map(addr => (
              <li key={addr.id}>
                {addr.street}, {addr.city}, {addr.province}, {addr.zip_code}, {addr.country}
                {addr.id === defaultAddressId && <span className="ml-2 text-sm text-green-600">(Predeterminada)</span>}
              </li>
            ))}
          </ul>
        </div>
      ) : (
        <div>
          <h3 className="text-xl font-semibold mb-2">Dirección de Envío (Invitado)</h3>
          <form onSubmit={handleGuestAddressSubmit}>
            <div className="grid grid-cols-2 gap-4">
              <input placeholder="Calle" value={data.street} onChange={(e) => setData('street', e.target.value)} />
              <input placeholder="Ciudad" value={data.city} onChange={(e) => setData('city', e.target.value)} />
              <input placeholder="Provincia" value={data.province} onChange={(e) => setData('province', e.target.value)} />
              <input placeholder="Código Postal" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} />
              <input placeholder="País" value={data.country} onChange={(e) => setData('country', e.target.value)} />
            </div>
            <button type="submit" className="mt-4 bg-blue-600 text-white px-4 py-2 rounded">
              Guardar Dirección
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
