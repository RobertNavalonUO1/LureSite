import React, { useState } from 'react';
import { usePage, Inertia } from '@inertiajs/react';
import Header from '../components/Header';
import Footer from '../components/Footer';

const STATUS_OPTIONS = [
  { value: '', label: 'Todos' },
  { value: 'pendiente_envio', label: 'Pendiente de envío' },
  { value: 'enviado', label: 'Enviado' },
  { value: 'entregado', label: 'Entregado' },
  { value: 'confirmado', label: 'Confirmado' },
];

export default function AdminOrders() {
  const { orders } = usePage().props;
  const [statusFilter, setStatusFilter] = useState('');

  const handleUpdate = (orderId, action) => {
    Inertia.post(`/admin/orders/${orderId}/${action}`, {}, { preserveScroll: true });
  };

  const filteredOrders = statusFilter
    ? orders.filter(order => order.status === statusFilter)
    : orders;

  return (
    <div className="min-h-screen bg-gray-100">
      <Header />

      <main className="max-w-7xl mx-auto px-6 py-12">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800">📦 Gestión de Pedidos</h1>

          <select
            className="border px-3 py-2 rounded text-sm"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            {STATUS_OPTIONS.map(option => (
              <option key={option.value} value={option.value}>{option.label}</option>
            ))}
          </select>
        </div>

        {filteredOrders.length === 0 ? (
          <p className="text-gray-600">No hay pedidos con este estado.</p>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-white rounded shadow">
              <thead>
                <tr className="bg-gray-200 text-left text-sm uppercase text-gray-600">
                  <th className="p-4">#ID</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Correo</th>
                  <th className="p-4">Total</th>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4">Acciones</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map(order => (
                  <tr key={order.id} className="border-t hover:bg-gray-50">
                    <td className="p-4 font-semibold">#{order.id}</td>
                    <td className="p-4">{order.user}</td>
                    <td className="p-4">{order.email}</td>
                    <td className="p-4">${order.total}</td>
                    <td className="p-4">{order.date}</td>
                    <td className="p-4 capitalize text-sm">
                      <span className="inline-block px-2 py-1 rounded-full text-white text-xs bg-blue-500">
                        {order.status.replace('_', ' ')}
                      </span>
                    </td>
                    <td className="p-4 space-x-2">
                      {order.status === 'pendiente_envio' && (
                        <button
                          onClick={() => handleUpdate(order.id, 'mark-shipped')}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Marcar Enviado
                        </button>
                      )}
                      {order.status === 'enviado' && (
                        <button
                          onClick={() => handleUpdate(order.id, 'mark-delivered')}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Marcar Entregado
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
