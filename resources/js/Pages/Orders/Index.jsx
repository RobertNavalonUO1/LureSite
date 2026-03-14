import React from 'react';
import { Link } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';

// Traducción y estilos para cada estado
const STATUS_INFO = {
  pendiente_pago: {
    label: 'Pendiente de pago',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
  },
  pagado: {
    label: 'Pagado',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  pendiente_envio: {
    label: 'Pendiente de envío',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
  },
  enviado: {
    label: 'Enviado',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
  },
  entregado: {
    label: 'Entregado',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
  },
  confirmado: {
    label: 'Confirmado',
    color: 'bg-green-50 text-green-700 border-green-200',
  },
  cancelacion_pendiente: {
    label: 'Cancelacion en proceso',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-300',
  },
  reembolsado: {
    label: 'Reembolsado',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
  },
  fallido: {
    label: 'Pago fallido',
    color: 'bg-red-50 text-red-700 border-red-200',
  },
  devolucion_solicitada: {
    label: 'Devolución solicitada',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
  },
  devolucion_aprobada: {
    label: 'Devolución aprobada',
    color: 'bg-green-100 text-green-800 border-green-300',
  },
  devolucion_rechazada: {
    label: 'Devolución rechazada',
    color: 'bg-red-100 text-red-800 border-red-300',
  },
};

const OrdersIndex = ({ orders }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Mis Pedidos</h1>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => {
              const statusInfo = STATUS_INFO[order.status] || {
                label: order.status,
                color: 'bg-gray-100 text-gray-800 border-gray-300',
              };
              return (
                <div key={order.id} className={`bg-white shadow p-4 rounded-md border-l-4 ${statusInfo.color}`}>
                  <div className="flex justify-between items-center mb-2">
                    <h2 className="text-lg font-semibold">
                      <Link
                        href={`/orders/${order.id}`}
                        className="text-blue-700 hover:underline"
                      >
                        Pedido #{order.id}
                      </Link>
                    </h2>
                    <span className="text-sm text-gray-600">Fecha: {order.date}</span>
                  </div>
                  <ul className="text-sm text-gray-700 mb-2">
                    {order.items.slice(0, 2).map(item => (
                      <li key={item.id}>
                        <Link
                          href={`/product/${item.product_id}`}
                          className="flex justify-between hover:bg-blue-50 rounded px-2 py-1 transition"
                        >
                          <span>{item.name} x{item.quantity}</span>
                          <span>${(item.price * item.quantity).toFixed(2)}</span>
                        </Link>
                      </li>
                    ))}
                    {order.items.length > 2 && (
                      <li className="text-xs text-gray-400">...y {order.items.length - 2} más</li>
                    )}
                  </ul>
                  <div className="flex justify-between items-center">
                    <span className="font-bold text-blue-600">Total: ${order.total}</span>
                    <span className={`text-sm font-semibold px-2 py-1 rounded border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                    <Link
                      href={`/orders/${order.id}`}
                      className="ml-4 text-sm text-indigo-600 hover:underline font-medium"
                    >
                      Ver detalle
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-gray-500">No tienes pedidos todavía.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default OrdersIndex;
