import React, { useState } from 'react';
import Notification from './Notification';

export default function Coupons({ coupons }) {
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({});

  const startEdit = coupon => {
    setEditing(coupon.id);
    setForm(coupon);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Notification />
      <h1 className="text-2xl font-bold mb-6">Gestión de Cupones</h1>
      <form method="POST" action="/admin/coupons/store" className="mb-8 flex gap-4">
        <input name="code" placeholder="Código" required className="border px-2 py-1" />
        <input name="discount" type="number" step="0.01" placeholder="Descuento" required className="border px-2 py-1" />
        <select name="type" required className="border px-2 py-1">
          <option value="percent">%</option>
          <option value="fixed">€</option>
        </select>
        <input name="expires_at" type="date" className="border px-2 py-1" />
        <input name="usage_limit" type="number" min="1" placeholder="Límite de uso" className="border px-2 py-1" />
        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">Crear</button>
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
                <form method="POST" action={`/admin/coupons/${coupon.id}/delete`} style={{ display: 'inline' }}>
                  <button type="submit" className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
                </form>
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
        <form method="POST" action={`/admin/coupons/${editing}/update`} className="mt-6 bg-white p-4 rounded shadow">
          <input name="code" value={form.code} onChange={e => setForm({ ...form, code: e.target.value })} className="border px-2 py-1 mr-2" />
          <input name="discount" value={form.discount} onChange={e => setForm({ ...form, discount: e.target.value })} className="border px-2 py-1 mr-2" />
          <select name="type" value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className="border px-2 py-1 mr-2">
            <option value="percent">%</option>
            <option value="fixed">€</option>
          </select>
          <input name="expires_at" type="date" value={form.expires_at || ''} onChange={e => setForm({ ...form, expires_at: e.target.value })} className="border px-2 py-1 mr-2" />
          <input name="usage_limit" value={form.usage_limit || ''} onChange={e => setForm({ ...form, usage_limit: e.target.value })} className="border px-2 py-1 mr-2" />
          <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">Guardar cambios</button>
        </form>
      )}
    </div>
  );
}