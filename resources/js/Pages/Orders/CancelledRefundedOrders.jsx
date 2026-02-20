import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import { XCircle, RotateCcw, ArrowLeftCircle, Clock } from 'lucide-react';

const STATUS_INFO = {
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-300',
    icon: <XCircle className="w-5 h-5 text-red-600" />,
  },
  cancelacion_pendiente: {
    label: 'Cancelacion en proceso',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: <Clock className="w-5 h-5 text-amber-600" />,
  },
  devolucion_aprobada: {
    label: 'Devolucion aprobada',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: <RotateCcw className="w-5 h-5 text-emerald-600" />,
  },
  reembolsado: {
    label: 'Reembolsado',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: <RotateCcw className="w-5 h-5 text-gray-600" />,
  },
};

const CancelledRefundedOrders = () => {
  const { orders } = usePage().props;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <XCircle className="w-6 h-6 text-red-600" />
            Pedidos Cancelados / Reembolsados
          </h1>
          <a href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:underline">
            <ArrowLeftCircle className="w-5 h-5" /> Volver
          </a>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map(order => {
              const statusInfo = STATUS_INFO[order.status] || {
                label: order.status,
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                icon: <XCircle className="w-5 h-5 text-gray-400" />,
              };
              return (
                <div key={order.id} className={`bg-white p-6 rounded shadow border-l-4 ${statusInfo.color}`}>
                  <div className="flex justify-between items-center mb-2">
                    <div>
                      <p className="text-lg font-semibold text-gray-700 flex items-center gap-2">
                        {statusInfo.icon}
                        Pedido #{order.id}
                      </p>
                      <p className="text-sm text-gray-500">Fecha: {order.date}</p>
                    </div>
                    <span className={`px-3 py-1 text-sm rounded border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  <ul className="text-sm text-gray-600 list-disc ml-5 mb-2">
                    {order.items.map(item => (
                      <li key={item.id}>
                        <a
                          href={`/product/${item.product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.name}
                        </a>{' '}
                        x{item.quantity} – ${item.price}
                      </li>
                    ))}
                  </ul>
                  <div className="text-right font-bold text-gray-700">
                    Total: ${order.total}
                  </div>
                  {order.status === 'cancelacion_pendiente' && (
                    <p className="mt-2 text-sm text-amber-700">
                      Tu solicitud de cancelacion esta en revision. Recibiras confirmacion en 24-48 horas.
                    </p>
                  )}
                  {order.status === 'devolucion_aprobada' && (
                    <p className="mt-2 text-sm text-emerald-700">
                      La devolucion fue aprobada. Si aun no lo has hecho, solicita tu reembolso desde la seccion de
                      pedidos pagados.
                    </p>
                  )}
                  {order.status === 'reembolsado' && (
                    <p className="mt-2 text-sm text-slate-600">
                      El reembolso se proceso correctamente. Puede tardar unos minutos en reflejarse segun tu metodo de
                      pago.
                    </p>
                  )}
                  <a
                    href={`/orders/${order.id}`}
                    className="mt-2 inline-block text-indigo-600 hover:underline text-sm"
                  >
                    Ver detalle del pedido &rarr;
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No hay pedidos cancelados ni reembolsados.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default CancelledRefundedOrders;