import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { Ban, RotateCcw, ArrowLeftCircle } from 'lucide-react';

const CancelledRefundedOrders = () => {
  const { orders } = usePage().props;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Ban className="w-6 h-6 text-red-500" />
            Pedidos Cancelados / Reembolsados
          </h1>
          <a href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:underline">
            <ArrowLeftCircle className="w-5 h-5" /> Volver al Dashboard
          </a>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded shadow border-l-4 border-red-400">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">Pedido #{order.id}</p>
                    <p className="text-sm text-gray-500">Fecha: {order.date}</p>
                  </div>
                  <span className={`px-3 py-1 text-sm rounded font-medium 
                    ${order.status === 'cancelado' ? 'bg-red-100 text-red-600' : 'bg-yellow-100 text-yellow-700'}`}>
                    {order.status.replace('_', ' ')}
                  </span>
                </div>

                <p className="text-sm text-gray-500 mb-1">Dirección: {order.address}</p>

                <ul className="text-sm text-gray-600 list-disc ml-5 mb-2">
                  {order.items.map(item => (
                    <li key={item.id}>{item.name} x{item.quantity} – ${item.price}</li>
                  ))}
                </ul>

                <div className="text-right font-bold text-gray-700">
                  Total: ${order.total}
                </div>

                {order.status === 'reembolso_pendiente' && (
                  <div className="mt-4 text-yellow-700 text-sm flex items-center gap-2">
                    <RotateCcw className="w-4 h-4" /> Reembolso en proceso. Te notificaremos por correo.
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">No hay pedidos cancelados o reembolsados.</p>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default CancelledRefundedOrders;
