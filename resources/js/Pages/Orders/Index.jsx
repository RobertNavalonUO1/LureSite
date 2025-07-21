import React from 'react';
import Header from '@/Components/Header';
import Footer from '@/Components/Footer';

const OrdersIndex = ({ orders }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow max-w-4xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-blue-700 mb-6">Mis Pedidos</h1>

        {orders.length > 0 ? (
          <div className="space-y-4">
            {orders.map(order => (
              <div key={order.id} className="bg-white shadow p-4 rounded-md border-l-4 border-blue-500">
                <div className="flex justify-between items-center mb-2">
                  <h2 className="text-lg font-semibold">Pedido #{order.id}</h2>
                  <span className="text-sm text-gray-600">Fecha: {order.date}</span>
                </div>
                <ul className="text-sm text-gray-700 mb-2">
                  {order.items.map(item => (
                    <li key={item.id} className="flex justify-between">
                      <span>{item.name} x{item.quantity}</span>
                      <span>${(item.price * item.quantity).toFixed(2)}</span>
                    </li>
                  ))}
                </ul>
                <div className="flex justify-between items-center">
                  <span className="font-bold text-blue-600">Total: ${order.total}</span>
                  <span className="text-sm text-gray-500 capitalize">Estado: {order.status}</span>
                </div>
              </div>
            ))}
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
