import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '../components/Header';
import Footer from '../components/Footer';
import { Truck, Clock, PackageCheck, MapPin, ArrowLeftCircle } from 'lucide-react';

// Define pasos del seguimiento
const progressSteps = ['Pendiente', 'Procesando', 'Enviado', 'En camino', 'Entregado'];

const getProgressStep = (status) => {
  switch (status) {
    case 'pendiente': return 0;
    case 'procesando': return 1;
    case 'enviado': return 2;
    case 'en_camino': return 3;
    case 'entregado': return 4;
    default: return 0;
  }
};

const OrderProgress = ({ currentStep }) => {
  return (
    <div className="flex justify-between items-center mt-4 overflow-x-auto">
      {progressSteps.map((step, index) => (
        <div key={index} className="flex-1 flex flex-col items-center text-center min-w-[70px]">
          <div className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs
              ${index <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'}`}>
            {index + 1}
          </div>
          <p className={`mt-1 text-[10px] sm:text-xs ${index <= currentStep ? 'text-green-600' : 'text-gray-500'}`}>
            {step}
          </p>
          {index < progressSteps.length - 1 && (
            <div className={`h-1 w-full mt-2 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`}></div>
          )}
        </div>
      ))}
    </div>
  );
};

export default function ShippedOrders() {
  const { orders } = usePage().props;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-green-500" />
            Seguimiento de Pedidos
          </h1>
          <a href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:underline">
            <ArrowLeftCircle className="w-5 h-5" /> Volver al Dashboard
          </a>
        </div>

        {orders && orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map(order => (
              <div
                key={order.id}
                className="bg-white p-6 rounded-lg shadow border-l-4 border-green-400"
              >
                <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                  <div>
                    <h2 className="text-xl font-semibold text-gray-700">Pedido #{order.id}</h2>
                    <p className="text-gray-500 text-sm">Fecha: {order.date}</p>
                  </div>
                  <a
                    href={`/orders/${order.id}`}
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                  >
                    Ver Detalles
                  </a>
                </div>

                <OrderProgress currentStep={getProgressStep(order.status)} />

                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 mt-4">
                  <div className="flex items-center gap-2">
                    <PackageCheck className="w-5 h-5 text-green-600" />
                    <span><strong>Estado:</strong> {order.status.replace('_', ' ')}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <Clock className="w-5 h-5 text-yellow-600" />
                    <span><strong>Entrega Estimada:</strong> {order.estimated_delivery}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <MapPin className="w-5 h-5 text-red-500" />
                    <span><strong>Dirección:</strong> {order.address}</span>
                  </div>
                </div>

                <div className="mt-4">
                  <h3 className="text-md font-semibold text-gray-600 mb-2">📋 Productos:</h3>
                  <ul className="space-y-1 text-sm text-gray-600 ml-4 list-disc">
                    {order.items.map(item => (
                      <li key={item.id}>
                        {item.name} – Cantidad: {item.quantity} – Precio: ${item.price}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">No hay pedidos enviados todavía.</p>
        )}
      </main>

      <Footer />
    </div>
  );
}
