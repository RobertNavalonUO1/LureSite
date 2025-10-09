import React, { useState } from 'react';
import Notification from './Notification';

function exportCSV(orders) {
  const headers = ['ID', 'Cliente', 'Total', 'Estado', 'Cancelado por', 'Motivo', 'Fecha Cancelación'];
  const rows = orders.map(o => [
    o.id, o.user?.name, o.total, o.status, o.cancelled_by || '', o.cancellation_reason || '', o.cancelled_at || ''
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pedidos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Orders({ orders }) {
  const [reason, setReason] = useState({});

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Notification />
      <h1 className="text-2xl font-bold mb-6">Gestión de Pedidos</h1>
      <button
        onClick={() => exportCSV(orders)}
        className="bg-blue-600 text-white px-4 py-2 rounded mb-4"
      >
        Exportar CSV
      </button>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Cliente</th>
            <th>Total</th>
            <th>Estado</th>
            <th>Cancelado por</th>
            <th>Motivo</th>
            <th>Fecha Cancelación</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {orders.map(order => (
            <tr key={order.id} className="border-b">
              <td>{order.id}</td>
              <td>{order.user?.name}</td>
              <td>${order.total}</td>
              <td>{order.status}</td>
              <td>{order.cancelled_by || '-'}</td>
              <td>{order.cancellation_reason || '-'}</td>
              <td>{order.cancelled_at || '-'}</td>
              <td>
                {['pendiente_pago', 'pagado', 'pendiente_envio', 'cancelacion_pendiente'].includes(order.status) && !order.cancelled_at && (
                  <form method="POST" action={`/admin/orders/${order.id}/cancel`}>
                    <input
                      type="text"
                      name="reason"
                      placeholder="Motivo"
                      value={reason[order.id] || ''}
                      onChange={e => setReason({ ...reason, [order.id]: e.target.value })}
                      className="border px-2 py-1 mr-2"
                    />
                    <button type="submit" className="bg-red-500 text-white px-3 py-1 rounded">Cancelar</button>
                  </form>
                )}
                {order.status === 'pagado' && (
                  <form method="POST" action={`/admin/orders/${order.id}/mark-shipped`}>
                    <button type="submit" className="bg-blue-500 text-white px-3 py-1 rounded ml-2">Marcar Enviado</button>
                  </form>
                )}
                {order.status === 'enviado' && (
                  <form method="POST" action={`/admin/orders/${order.id}/mark-delivered`}>
                    <button type="submit" className="bg-green-500 text-white px-3 py-1 rounded ml-2">Marcar Entregado</button>
                  </form>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
