import React, { useMemo, useState } from 'react';
import { usePage, useForm, router } from '@inertiajs/react';
import LoginModal from '@/Components/auth/LoginModal.jsx';
import AddressModal from '@/Components/checkout/AddressModal.jsx';

export default function Checkout() {
  const [showAddressModal, setShowAddressModal] = useState(false);
  const [modalMode, setModalMode] = useState('create'); // 'create' | 'edit'
  const [selectedAddress, setSelectedAddress] = useState(null);

  const { cartItems, total, auth: { user }, addresses, defaultAddressId } = usePage().props;

  const hasAddress = Array.isArray(addresses) && addresses.length > 0;
  const isGuest = !user;

  const [showLoginModal, setShowLoginModal] = useState(false);
  const [useGuestForm, setUseGuestForm] = useState(isGuest);

  const { data, setData, post, processing, errors, setError, clearErrors } = useForm({
    street: '',
    city: '',
    province: '',
    zip_code: '',
    country: '',
  });

  const handleAddressAdded = () => {
    setShowAddressModal(false);
    setSelectedAddress(null);
    setModalMode('create');
    router.reload({ only: ['addresses', 'defaultAddressId'], preserveScroll: true });
  };

  const handleGuestAddressSubmit = (e) => {
    e.preventDefault();
    const clientErrors = {};
    if (!data.street?.trim()) clientErrors.street = 'La calle es requerida';
    if (!data.city?.trim()) clientErrors.city = 'La ciudad es requerida';
    if (!data.province?.trim()) clientErrors.province = 'La provincia es requerida';
    if (!data.country?.trim()) clientErrors.country = 'El país es requerido';
    if (!data.zip_code?.trim()) clientErrors.zip_code = 'El código postal es requerido';
    if (Object.keys(clientErrors).length > 0) {
      Object.entries(clientErrors).forEach(([k, v]) => setError(k, v));
      return;
    }
    clearErrors();
    post(route('checkout.guest_address'), { preserveScroll: true });
  };

  const shouldShowActionPrompt = useMemo(
    () => (!user && !useGuestForm) || (user && !hasAddress),
    [user, useGuestForm, hasAddress]
  );

  const setAsDefault = (addrId) => {
    const putTo = typeof route === 'function' ? route('addresses.default', addrId) : `/addresses/${addrId}/default`;
    router.put(putTo, {}, {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ['addresses', 'defaultAddressId'], preserveScroll: true }),
    });
  };

  const deleteAddress = (addrId) => {
    if (!confirm('¿Eliminar esta dirección?')) return;
    const delTo = typeof route === 'function' ? route('addresses.destroy', addrId) : `/addresses/${addrId}`;
    router.delete(delTo, {
      preserveScroll: true,
      onSuccess: () => router.reload({ only: ['addresses', 'defaultAddressId'], preserveScroll: true }),
    });
  };

  const openCreateAddress = () => { setModalMode('create'); setSelectedAddress(null); setShowAddressModal(true); };
  const openEditAddress = (addr) => { setModalMode('edit'); setSelectedAddress(addr); setShowAddressModal(true); };

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
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xl font-semibold">Direcciones</h3>
            <button onClick={openCreateAddress} className="text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Agregar dirección</button>
          </div>
          <ul>
            {addresses.map((addr) => (
              <li key={addr.id} className="mb-2 p-3 border rounded flex items-center justify-between">
                <div>
                  {addr.street}, {addr.city}, {addr.province}, {addr.zip_code}, {addr.country}
                  {addr.id === defaultAddressId && (
                    <span className="ml-2 text-sm text-green-600">(Predeterminada)</span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => openEditAddress(addr)} className="text-xs px-3 py-1 rounded border border-gray-300 hover:bg-gray-50">Editar</button>
                  {addr.id !== defaultAddressId && (
                    <button onClick={() => setAsDefault(addr.id)} className="text-xs px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Hacer predeterminada</button>
                  )}
                  <button onClick={() => deleteAddress(addr.id)} className="text-xs px-3 py-1 rounded bg-red-600 text-white hover:bg-red-700">Eliminar</button>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}

      {!user && useGuestForm && (
        <div className="mt-6">
          <h3 className="text-lg font-semibold mb-2">Dirección de envío</h3>
          <form onSubmit={handleGuestAddressSubmit}>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <input placeholder="Calle" value={data.street} onChange={(e) => setData('street', e.target.value)} className={`w-full border p-2 rounded ${errors.street ? 'border-red-400' : 'border-gray-300'}`} aria-invalid={Boolean(errors.street)} aria-describedby={errors.street ? 'street-error' : undefined} autoComplete="address-line1" />
                {errors.street && <p id="street-error" className="mt-1 text-red-500 text-sm">{errors.street}</p>}
              </div>
              <div>
                <input placeholder="Ciudad" value={data.city} onChange={(e) => setData('city', e.target.value)} className={`w-full border p-2 rounded ${errors.city ? 'border-red-400' : 'border-gray-300'}`} aria-invalid={Boolean(errors.city)} aria-describedby={errors.city ? 'city-error' : undefined} autoComplete="address-level2" />
                {errors.city && <p id="city-error" className="mt-1 text-red-500 text-sm">{errors.city}</p>}
              </div>
              <div>
                <input placeholder="Provincia" value={data.province} onChange={(e) => setData('province', e.target.value)} className={`w-full border p-2 rounded ${errors.province ? 'border-red-400' : 'border-gray-300'}`} aria-invalid={Boolean(errors.province)} aria-describedby={errors.province ? 'province-error' : undefined} autoComplete="address-level1" />
                {errors.province && <p id="province-error" className="mt-1 text-red-500 text-sm">{errors.province}</p>}
              </div>
              <div>
                <input placeholder="Código Postal" value={data.zip_code} onChange={(e) => setData('zip_code', e.target.value)} className={`w-full border p-2 rounded ${errors.zip_code ? 'border-red-400' : 'border-gray-300'}`} aria-invalid={Boolean(errors.zip_code)} aria-describedby={errors.zip_code ? 'zip-error' : undefined} autoComplete="postal-code" />
                {errors.zip_code && <p id="zip-error" className="mt-1 text-red-500 text-sm">{errors.zip_code}</p>}
              </div>
              <div>
                <input placeholder="País" value={data.country} onChange={(e) => setData('country', e.target.value)} className={`w-full border p-2 rounded ${errors.country ? 'border-red-400' : 'border-gray-300'}`} aria-invalid={Boolean(errors.country)} aria-describedby={errors.country ? 'country-error' : undefined} autoComplete="country-name" />
                {errors.country && <p id="country-error" className="mt-1 text-red-500 text-sm">{errors.country}</p>}
              </div>
            </div>
            <button type="submit" className="mt-4 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" disabled={processing}>
              {processing ? 'Guardando…' : 'Guardar Dirección'}
            </button>
          </form>
        </div>
      )}

      {shouldShowActionPrompt && (!user ? (
        <div className="mt-6 bg-yellow-100 border border-yellow-300 p-4 rounded text-center text-sm text-gray-800">
          <p className="mb-2">Inicia sesión y añade una dirección para continuar con el pago.</p>
          <div className="flex justify-center gap-4">
            {!user && (
              <button onClick={() => setShowLoginModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700">
                Iniciar sesión
              </button>
            )}
            {!useGuestForm && (
              <button onClick={() => setUseGuestForm(true)} className="bg-gray-200 px-4 py-2 rounded hover:bg-gray-300">
                Comprar como invitado
              </button>
            )}
          </div>
        </div>
      ) : (
        <div className="mt-6 bg-blue-50 border border-blue-200 p-4 rounded">
          <div className="flex items-center justify-between">
            <h4 className="font-medium text-blue-800">No tienes direcciones</h4>
            <button onClick={openCreateAddress} className="text-sm px-3 py-1 rounded bg-indigo-600 text-white hover:bg-indigo-700">Agregar dirección</button>
          </div>
        </div>
      ))}

      {showLoginModal && (
        <LoginModal
          isOpen={showLoginModal}
          onClose={() => setShowLoginModal(false)}
          onRegister={() => { setShowLoginModal(false); window.location.href = '/register'; }}
          onForgot={() => { setShowLoginModal(false); window.location.href = '/forgot-password'; }}
        />
      )}

      {showAddressModal && (
        <AddressModal
          closeModal={() => setShowAddressModal(false)}
          onAddressSaved={handleAddressAdded}
          mode={modalMode}
          initialValues={selectedAddress}
        />
      )}
    </div>
  );
}