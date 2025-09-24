import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import { Truck, CheckCircle, ArrowLeftCircle } from 'lucide-react';

const STATUS_INFO = {
  enviado: {
    label: 'Enviado',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    icon: <Truck className="w-5 h-5 text-indigo-600" />,
    description: 'Tu pedido ha sido enviado. Pronto lo recibirás.',
  },
  entregado: {
    label: 'Entregado',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    icon: <CheckCircle className="w-5 h-5 text-teal-600" />,
    description: 'El pedido ha sido entregado. ¡Gracias por tu compra!',
  },
  confirmado: {
    label: 'Confirmado',
    color: 'bg-green-50 text-green-700 border-green-200',
    icon: <CheckCircle className="w-5 h-5 text-green-600" />,
    description: 'Has confirmado la recepción del pedido.',
  },
};

const ShippedOrders = () => {
  const { orders } = usePage().props;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />
      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-indigo-600" />
            Pedidos Enviados / Entregados
          </h1>
          <a href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:underline">
            <ArrowLeftCircle className="w-5 h-5" /> Volver al Dashboard
          </a>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map(order => {
              const statusInfo = STATUS_INFO[order.status] || {
                label: order.status,
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                icon: <Truck className="w-5 h-5 text-gray-400" />,
                description: '',
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
                    <span className={`px-3 py-1 text-sm rounded font-medium border ${statusInfo.color}`}>
                      {statusInfo.label}
                    </span>
                  </div>
                  {statusInfo.description && (
                    <div className="mb-2 text-sm text-gray-600">{statusInfo.description}</div>
                  )}
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
                        </a> x{item.quantity} – ${item.price}
                      </li>
                    ))}
                  </ul>
                  <div className="text-right font-bold text-gray-700">
                    Total: ${order.total}
                  </div>
                  <a
                    href={`/pedidos/${order.id}`}
                    className="mt-2 inline-block text-indigo-600 hover:underline text-sm"
                  >
                    Ver detalle del pedido &rarr;
                  </a>
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">No hay pedidos enviados o entregados.</p>
        )}
      </main>
      <Footer />
    </div>
  );
};

export default ShippedOrders;