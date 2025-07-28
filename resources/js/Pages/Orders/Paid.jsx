import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '@/components/Header';
import Footer from '@/components/Footer';
import { CreditCard, ArrowLeftCircle } from 'lucide-react';

const PaidOrders = () => {
  const { orders } = usePage().props;

  return (
    <div className="min-h-screen bg-gray-50">
      <Header />

      <main className="max-w-5xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <CreditCard className="w-6 h-6 text-purple-600" />
            Pedidos Pagados
          </h1>
          <a href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:underline">
            <ArrowLeftCircle className="w-5 h-5" /> Volver
          </a>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map(order => (
              <div key={order.id} className="bg-white p-6 rounded shadow border-l-4 border-purple-500">
                <div className="flex justify-between items-center mb-2">
                  <div>
                    <p className="text-lg font-semibold text-gray-700">Pedido #{order.id}</p>
                    <p className="text-sm text-gray-500">Fecha: {order.date}</p>
                  </div>
                  <p className="font-bold text-purple-600 text-lg">${order.total}</p>
                </div>

                <p className="text-sm text-gray-500 mb-1">Estado: {order.status}</p>
                <p className="text-sm text-gray-500 mb-2">Dirección: {order.address}</p>

                <ul className="text-sm text-gray-600 list-disc ml-5 mb-4">
                  {order.items.map(item => (
                    <li key={item.id}>{item.name} x{item.quantity} – ${item.price}</li>
                  ))}
                </ul>

                <div className="flex gap-2">
                  {['pendiente_envio', 'pagado'].includes(order.status) && (
                    <form method="POST" action={`/orders/${order.id}/cancel`}>
                      <button
                        type="submit"
                        className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Cancelar Pedido
                      </button>
                    </form>
                  )}
                  {order.status === 'pagado' && (
                    <form method="POST" action={`/orders/${order.id}/refund`}>
                      <button
                        type="submit"
                        className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-sm"
                      >
                        Solicitar Reembolso
                      </button>
                    </form>
                  )}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-gray-500 text-center">No hay pedidos pagados por ahora.</p>
        )}
      </main>

      <Footer />
    </div>
  );
};

export default PaidOrders;
