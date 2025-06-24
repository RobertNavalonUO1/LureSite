import React, { useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { Pencil, Trash2, Save, Plus, Camera } from 'lucide-react';
import countryData from '../utils/countries';
import Header from '../components/Header';
import Footer from '../components/Footer';
import AvatarCreatorModal from '../components/AvatarCreatorModal'; // ✅ Importar modal

export default function EditProfile() {
  const { auth, addresses, paymentMethods } = usePage().props;
  const user = auth.user;

  const { data, setData, patch, processing, errors } = useForm({
    name: user.name,
    lastname: user.lastname ?? '',
    email: user.email,
    phone: user.phone || '',
    phone_prefix: '+34',
    payment_method: paymentMethods?.default || 'stripe',
    avatar: user.avatar || '', // ✅ avatar
  });

  const [editingField, setEditingField] = useState(null);
  const [editingAddressId, setEditingAddressId] = useState(null);
  const [localAddresses, setLocalAddresses] = useState(addresses);
  const [showModal, setShowModal] = useState(false);
  const [avatarModalOpen, setAvatarModalOpen] = useState(false); // ✅ Modal Avatar
  const [newAddress, setNewAddress] = useState({
    street: '', city: '', province: '', zip_code: '', country: 'España'
  });

  const handleProfileSubmit = (e) => {
    e.preventDefault();
    patch(route('profile.update'), {
      onSuccess: () => alert('Perfil actualizado correctamente'),
    });
  };

  const toggleEdit = (field) => {
    setEditingField(field === editingField ? null : field);
  };

  const updateAddress = (id, field, value) => {
    setLocalAddresses(prev =>
      prev.map(addr => addr.id === id ? { ...addr, [field]: value } : addr)
    );
  };

  const saveAddress = (addr) => {
    fetch(`/addresses/${addr.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify(addr),
    }).then(() => alert('Dirección actualizada.'));
  };

  const deleteAddress = (id) => {
    if (localAddresses.length <= 1) {
      alert("Debes tener al menos una dirección.");
      return;
    }

    if (confirm("¿Estás seguro de eliminar esta dirección?")) {
      fetch(`/addresses/${id}`, {
        method: 'DELETE',
        headers: {
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
      }).then(() => {
        setLocalAddresses(prev => prev.filter(a => a.id !== id));
      });
    }
  };

  const addNewAddress = () => {
    fetch('/addresses/store', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
      },
      body: JSON.stringify(newAddress),
    }).then(async res => {
      const json = await res.json();
      if (json?.newAddress) {
        setLocalAddresses([...localAddresses, json.newAddress]);
        setNewAddress({ street: '', city: '', province: '', zip_code: '', country: 'España' });
        setShowModal(false);
      }
    });
  };

  const handleAvatarSelect = (avatarUrl) => {
    setData('avatar', avatarUrl);
    setAvatarModalOpen(false);
  };

  return (
    <div className="bg-gray-100 min-h-screen">
      <Header />

      <div className="max-w-5xl mx-auto p-6 bg-white rounded shadow mt-8">
        <h2 className="text-3xl font-bold mb-6">Editar Perfil</h2>

        {/* ✅ Sección de avatar */}
        <div className="flex items-center space-x-4 mb-6">
          <img
            src={data.avatar || '/default-avatar.png'}
            alt="Avatar"
            className="w-20 h-20 rounded-full border object-cover"
          />
          <button
            onClick={() => setAvatarModalOpen(true)}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
          >
            <Camera className="mr-2" size={18} />
            Cambiar Avatar
          </button>
        </div>

        <form onSubmit={handleProfileSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {['name', 'lastname', 'email'].map((field) => (
            <div key={field} className="relative">
              <label className="block text-gray-700 font-medium mb-1 capitalize">{field}</label>
              {editingField === field ? (
                <input
                  type="text"
                  value={data[field]}
                  onChange={(e) => setData(field, e.target.value)}
                  className="w-full border p-2 rounded"
                />
              ) : (
                <p className="bg-gray-50 border px-3 py-2 rounded">{data[field]}</p>
              )}
              <button
                type="button"
                className="absolute top-8 right-3 text-blue-600"
                onClick={() => toggleEdit(field)}
              >
                <Pencil size={18} />
              </button>
              {errors[field] && <p className="text-red-500 text-sm mt-1">{errors[field]}</p>}
            </div>
          ))}

          <div className="col-span-2">
            <label className="block font-medium mb-1">Teléfono</label>
            <div className="flex">
              <select
                value={data.phone_prefix}
                onChange={(e) => setData('phone_prefix', e.target.value)}
                className="border p-2 rounded-l bg-white"
              >
                {countryData.map((c) => (
                  <option key={c.code} value={c.dial_code}>
                    {c.flag} {c.name} ({c.dial_code})
                  </option>
                ))}
              </select>
              <input
                type="tel"
                value={data.phone}
                onChange={(e) => setData('phone', e.target.value)}
                className="border p-2 rounded-r w-full"
                placeholder="Número de móvil"
              />
            </div>
            {errors.phone && <p className="text-red-500 text-sm mt-1">{errors.phone}</p>}
          </div>

          <div className="col-span-2">
            <label className="block font-medium">Método de pago preferido</label>
            <select
              value={data.payment_method}
              onChange={(e) => setData('payment_method', e.target.value)}
              className="w-full border p-2 rounded"
            >
              {paymentMethods.available.map((method) => (
                <option key={method} value={method}>
                  {method === 'stripe' ? 'Tarjeta (Stripe)' : 'PayPal'}
                </option>
              ))}
            </select>
          </div>

          <div className="col-span-2 text-right">
            <button
              type="submit"
              disabled={processing}
              className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
            >
              Guardar Cambios
            </button>
          </div>
        </form>

        <hr className="my-8" />

        <div className="flex justify-between items-center mb-4">
          <h3 className="text-2xl font-semibold">Mis Direcciones</h3>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 bg-green-600 text-white px-3 py-2 rounded hover:bg-green-700"
          >
            <Plus size={18} /> Nueva Dirección
          </button>
        </div>

        <div className="grid md:grid-cols-2 gap-6">
          {localAddresses.map((addr) => (
            <div key={addr.id} className="bg-gray-50 p-4 rounded shadow relative">
              {['street', 'city', 'province', 'zip_code', 'country'].map((field) => (
                <div key={field} className="mb-2">
                  {editingAddressId === addr.id ? (
                    <input
                      type="text"
                      value={addr[field]}
                      onChange={(e) => updateAddress(addr.id, field, e.target.value)}
                      className="w-full border p-2 rounded"
                    />
                  ) : (
                    <p className="text-gray-700">{addr[field]}</p>
                  )}
                </div>
              ))}

              <div className="flex justify-end gap-3 mt-2">
                {editingAddressId === addr.id ? (
                  <button
                    onClick={() => {
                      saveAddress(addr);
                      setEditingAddressId(null);
                    }}
                    className="bg-blue-500 text-white px-3 py-1 rounded hover:bg-blue-600"
                  >
                    <Save size={16} className="inline mr-1" /> Guardar
                  </button>
                ) : (
                  <button
                    onClick={() => setEditingAddressId(addr.id)}
                    className="text-blue-600 hover:underline"
                  >
                    <Pencil size={16} />
                  </button>
                )}

                <button
                  onClick={() => deleteAddress(addr.id)}
                  className="text-red-600 hover:underline"
                >
                  <Trash2 size={16} />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-50 z-50">
          <div className="bg-white p-6 rounded shadow-md w-full max-w-md">
            <h3 className="text-xl font-bold mb-4">Agregar Dirección</h3>
            {['street', 'city', 'province', 'zip_code', 'country'].map(field => (
              <input
                key={field}
                type="text"
                value={newAddress[field]}
                onChange={(e) => setNewAddress({ ...newAddress, [field]: e.target.value })}
                className="w-full border p-2 rounded mb-2"
                placeholder={field}
              />
            ))}
            <div className="flex justify-end gap-2 mt-4">
              <button onClick={() => setShowModal(false)} className="px-3 py-1 bg-gray-300 rounded">
                Cancelar
              </button>
              <button onClick={addNewAddress} className="px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700">
                Guardar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ✅ Modal para crear avatar */}
      <AvatarCreatorModal
        isOpen={avatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSelect={handleAvatarSelect}
      />

      <Footer />
    </div>
  );
}
