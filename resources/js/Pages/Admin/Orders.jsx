import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import Notification from './Notification';

function exportCSV(orders) {
  const headers = ['ID', 'Cliente', 'Total', 'Estado', 'Cancelado por', 'Motivo', 'Fecha Cancelación', 'Refund Ref', 'Refund Error'];
  const rows = orders.map(o => [
    o.id, o.user?.name, o.total, o.status, o.cancelled_by || '', o.cancellation_reason || '', o.cancelled_at || '', o.refund_reference_id || '', o.refund_error || ''
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

  const patchOrder = (orderId, path, data = {}, confirmMessage = null) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    router.patch(`/admin/orders/${orderId}/${path}`, data, {
      preserveScroll: true,
    });
  };

  const handleCancel = (order) => {
    patchOrder(
      order.id,
      'cancel',
      { reason: reason[order.id] || '' },
      '¿Seguro que quieres cancelar este pedido desde administración?',
    );
  };

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
            <th>Refund</th>
            <th>Error refund</th>
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
              <td>{order.refund_reference_id || '-'}</td>
              <td className="max-w-xs text-xs text-red-700">{order.refund_error || '-'}</td>
              <td>
                {['pendiente_pago', 'pagado', 'pendiente_envio', 'cancelacion_pendiente'].includes(order.status) && !order.cancelled_at && (
                  <div className="flex flex-wrap items-center gap-2">
                    <input
                      type="text"
                      name="reason"
                      placeholder="Motivo"
                      value={reason[order.id] || ''}
                      onChange={e => setReason({ ...reason, [order.id]: e.target.value })}
                      className="border px-2 py-1 mr-2"
                    />
                    <button
                      type="button"
                      onClick={() => handleCancel(order)}
                      className="bg-red-500 text-white px-3 py-1 rounded"
                    >
                      Cancelar
                    </button>
                  </div>
                )}
                {order.status === 'pagado' && (
                  <button
                    type="button"
                    onClick={() => patchOrder(order.id, 'ship')}
                    className="bg-blue-500 text-white px-3 py-1 rounded ml-2"
                  >
                    Marcar Enviado
                  </button>
                )}
                {order.status === 'enviado' && (
                  <button
                    type="button"
                    onClick={() => patchOrder(order.id, 'deliver')}
                    className="bg-green-500 text-white px-3 py-1 rounded ml-2"
                  >
                    Marcar Entregado
                  </button>
                )}
                {order.status === 'devolucion_solicitada' && (
                  <div className="flex flex-wrap gap-2">
                    <button
                      type="button"
                      onClick={() => patchOrder(order.id, 'approve-return', {}, '¿Aprobar esta devolución?')}
                      className="bg-emerald-600 text-white px-3 py-1 rounded"
                    >
                      Aprobar devolución
                    </button>
                    <button
                      type="button"
                      onClick={() => patchOrder(order.id, 'reject-return', {}, '¿Rechazar esta devolución?')}
                      className="bg-amber-500 text-white px-3 py-1 rounded"
                    >
                      Rechazar devolución
                    </button>
                  </div>
                )}
                {order.status === 'devolucion_aprobada' && (
                  <div className="flex flex-col gap-2">
                    <button
                      type="button"
                      onClick={() => patchOrder(order.id, 'refund', {}, '¿Intentar procesar el reembolso con el proveedor de pago?')}
                      className="bg-slate-700 text-white px-3 py-1 rounded"
                    >
                      Procesar reembolso
                    </button>
                    {order.refund_error && (
                      <span className="text-xs text-amber-700">
                        Último error registrado. Puedes reintentar cuando la configuración o el proveedor estén disponibles.
                      </span>
                    )}
                  </div>
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
