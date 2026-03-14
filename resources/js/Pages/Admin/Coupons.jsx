import React, { useState } from 'react';
import { router, useForm } from '@inertiajs/react';
import Notification from './Notification';

export default function Coupons({ coupons }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});
  const createForm = useForm({
    code: '',
    discount: '',
    type: 'percent',
    expires_at: '',
    usage_limit: '',
  });

  const handleDelete = (coupon) => {
    if (!window.confirm(`¿Eliminar el cupón ${coupon.code}?`)) {
      return;
    }

    router.delete(`/admin/coupons/${coupon.id}`, {
      preserveScroll: true,
    });
  };

  const handleUpdate = (event) => {
    event.preventDefault();

    router.patch(`/admin/coupons/${editing}`, {
      code: form.code,
      discount: form.discount,
      type: form.type,
      expires_at: form.expires_at || null,
      usage_limit: form.usage_limit || null,
    }, {
      preserveScroll: true,
      onSuccess: () => setEditing(null),
    });
  };

  const startEdit = coupon => {
    setEditing(coupon.id);
    setForm(coupon);
  };

  const handleCreate = (event) => {
    event.preventDefault();

    createForm.post('/admin/coupons/store', {
      preserveScroll: true,
      onSuccess: () => createForm.reset(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Notification />
      <h1 className="text-2xl font-bold mb-6">Gestión de Cupones</h1>
      <form onSubmit={handleCreate} className="mb-8 flex gap-4">
        <input
          name="code"
          placeholder="Código"
          required
          className="border px-2 py-1"
          value={createForm.data.code}
          onChange={(event) => createForm.setData('code', event.target.value)}
        />
        <input
          name="discount"
          type="number"
          step="0.01"
          placeholder="Descuento"
          required
          className="border px-2 py-1"
          value={createForm.data.discount}
          onChange={(event) => createForm.setData('discount', event.target.value)}
        />
        <select
          name="type"
          required
          className="border px-2 py-1"
          value={createForm.data.type}
          onChange={(event) => createForm.setData('type', event.target.value)}
        >
          <option value="percent">%</option>
          <option value="fixed">USD</option>
        </select>
        <input
          name="expires_at"
          type="date"
          className="border px-2 py-1"
          value={createForm.data.expires_at}
          onChange={(event) => createForm.setData('expires_at', event.target.value)}
        />
        <input
          name="usage_limit"
          type="number"
          min="1"
          placeholder="Límite de uso"
          className="border px-2 py-1"
          value={createForm.data.usage_limit}
          onChange={(event) => createForm.setData('usage_limit', event.target.value)}
        />
        <button type="submit" disabled={createForm.processing} className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-60">Crear</button>
      </form>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Código</th>
            <th>Descuento</th>
            <th>Tipo</th>
            <th>Expira</th>
            <th>Usos</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {coupons.map(coupon => (
            <tr key={coupon.id} className="border-b">
              <td>{coupon.id}</td>
              <td>{coupon.code}</td>
              <td>{coupon.discount}</td>
              <td>{coupon.type}</td>
              <td>{coupon.expires_at || '-'}</td>
              <td>{coupon.used_count}/{coupon.usage_limit || '-'}</td>
              <td>
                <button type="button" onClick={() => handleDelete(coupon)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
                <button
                  type="button"
                  className="bg-yellow-500 text-white px-3 py-1 rounded ml-2"
                  onClick={() => startEdit(coupon)}
                >
                  Editar
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {editing && (
        <form onSubmit={handleUpdate} className="mt-6 bg-white p-4 rounded shadow">
          <input name="code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="border px-2 py-1 mr-2" />
          <input name="discount" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="border px-2 py-1 mr-2" />
          <select name="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border px-2 py-1 mr-2">
            <option value="percent">%</option>
            <option value="fixed">USD</option>
          </select>
          <input name="expires_at" type="date" value={form.expires_at || ''} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="border px-2 py-1 mr-2" />
          <input name="usage_limit" value={form.usage_limit || ''} onChange={e => setForm({ ...form, usage_limit: e.target.value })} className="border px-2 py-1 mr-2" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Guardar cambios</button>
        </form>
      )}
    </div>
  );
}
