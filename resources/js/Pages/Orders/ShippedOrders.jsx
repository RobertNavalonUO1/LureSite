import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import { Truck, Clock, PackageCheck, MapPin, ArrowLeftCircle, XCircle, RotateCcw } from 'lucide-react';

const progressSteps = ['Pago recibido', 'Preparando envio', 'Enviado', 'Entregado'];

const STATUS_DETAILS = {
  pagado: {
    label: 'Pagado',
    progress: 0,
    allowCancel: true,
    note: 'Tu pago fue recibido y estamos preparando el pedido.',
  },
  cancelacion_pendiente: {
    label: 'Cancelacion pendiente',
    progress: 0,
    allowCancel: false,
    allowRefund: false,
    highlight: 'Tu solicitud de cancelacion esta en revision. Te confirmaremos el resultado en 24-48 horas.',
  },
  pendiente_envio: {
    label: 'Pendiente de envio',
    progress: 1,
    allowCancel: true,
    note: 'Estamos preparando tu paquete para el envio.',
  },
  enviado: {
    label: 'Enviado',
    progress: 2,
    note: 'Tu pedido ya salio del almacen.',
  },
  entregado: {
    label: 'Entregado',
    progress: 3,
    note: 'El pedido fue entregado en la direccion indicada.',
    allowConfirm: true,
  },
  confirmado: {
    label: 'Confirmado',
    progress: 3,
    note: 'Confirmaste la recepcion del pedido.',
  },
  devolucion_aprobada: {
    label: 'Devolucion aprobada',
    progress: 3,
    allowRefund: true,
    note: 'La devolucion fue aprobada. Puedes solicitar el reembolso.',
  },
  reembolsado: {
    label: 'Reembolsado',
    progress: 3,
    note: 'El reembolso fue procesado correctamente.',
    showRefundInfo: true,
  },
};

const CANCEL_WARNING =
  'Al confirmar la solicitud iniciaremos la gestion de cancelacion. El resultado se confirmara en 24-48 horas si es posible. Deseas continuar?';

const getProgressStep = (status, fallback) => {
  const detail = STATUS_DETAILS[status];
  if (detail && typeof detail.progress === 'number') {
    return detail.progress;
  }
  return typeof fallback === 'number' ? fallback : 0;
};

const OrderProgress = ({ currentStep }) => (
  <div className="flex justify-between items-center mt-4 overflow-x-auto">
    {progressSteps.map((step, index) => (
      <div key={step} className="flex-1 flex flex-col items-center text-center min-w-[70px]">
        <div
          className={`w-6 h-6 rounded-full flex items-center justify-center font-bold text-xs ${
            index <= currentStep ? 'bg-green-500 text-white' : 'bg-gray-300 text-gray-600'
          }`}
        >
          {index + 1}
        </div>
        <p className={`mt-1 text-[10px] sm:text-xs ${index <= currentStep ? 'text-green-600' : 'text-gray-500'}`}>
          {step}
        </p>
        {index < progressSteps.length - 1 && (
          <div className={`h-1 w-full mt-2 ${index < currentStep ? 'bg-green-500' : 'bg-gray-300'}`} />
        )}
      </div>
    ))}
  </div>
);

export default function ShippedOrders() {
  const { orders = [], csrfToken } = usePage().props;

  return (
    <div className="min-h-screen bg-gradient-to-br from-white to-gray-100">
      <Header />

      <main className="max-w-6xl mx-auto px-4 py-10">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-3xl font-bold text-gray-800 flex items-center gap-2">
            <Truck className="w-6 h-6 text-green-500" />
            Seguimiento de pedidos
          </h1>
          <a href="/dashboard" className="flex items-center gap-1 text-blue-600 hover:underline">
            <ArrowLeftCircle className="w-5 h-5" /> Volver al dashboard
          </a>
        </div>

        {orders.length > 0 ? (
          <div className="space-y-6">
            {orders.map((order) => {
              const detail = STATUS_DETAILS[order.status] || {};
              const progressStep = getProgressStep(order.status, order.progress_step);
              const statusLabel =
                detail.label ??
                order.status_label ??
                order.status.replace('_', ' ').replace(/\b\w/g, (char) => char.toUpperCase());
              const items = Array.isArray(order.items) ? order.items : [];
              const canCancel = Boolean(detail.allowCancel);
              const canConfirm = Boolean(detail.allowConfirm);
              const canRefund = Boolean(detail.allowRefund);

              return (
                <div key={order.id} className="bg-white p-6 rounded-lg shadow border-l-4 border-green-400">
                  <div className="flex flex-col sm:flex-row justify-between sm:items-center mb-4 gap-2">
                    <div>
                      <h2 className="text-xl font-semibold text-gray-700">Pedido #{order.id}</h2>
                      <p className="text-gray-500 text-sm">Fecha: {order.date ?? 'Sin fecha'}</p>
                    </div>
                    <a
                      href={`/orders/${order.id}`}
                      className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 transition"
                    >
                      Ver detalles
                    </a>
                  </div>

                  <OrderProgress currentStep={progressStep} />

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-700 mt-4">
                    <div className="flex items-center gap-2">
                      <PackageCheck className="w-5 h-5 text-green-600" />
                      <span>
                        <strong>Estado:</strong> {statusLabel}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-5 h-5 text-yellow-600" />
                      <span>
                        <strong>Entrega estimada:</strong> {order.estimated_delivery ?? 'Pendiente'}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-red-500" />
                      <span>
                        <strong>Direccion:</strong> {order.address ?? 'No registrada'}
                      </span>
                    </div>
                  </div>

                  <div className="mt-4">
                    <h3 className="text-md font-semibold text-gray-600 mb-2">Productos:</h3>
                    <ul className="space-y-1 text-sm text-gray-600 ml-4 list-disc">
                      {items.map((item) => (
                        <li key={item.id}>
                          {item.name} - Cantidad: {item.quantity} - Precio: ${Number(item.price ?? 0).toFixed(2)}
                        </li>
                      ))}
                    </ul>
                  </div>

                  <div className="mt-6 flex flex-wrap gap-3 items-start">
                    {canConfirm && (
                      <form method="POST" action={`/orders/${order.id}/confirm`}>
                        <input type="hidden" name="_token" value={csrfToken} />
                        <button
                          type="submit"
                          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 transition"
                        >
                          Confirmar recepcion
                        </button>
                      </form>
                    )}

                    {canCancel && (
                      <form
                        method="POST"
                        action={`/orders/${order.id}/cancel`}
                        onSubmit={(event) => {
                          if (!window.confirm(CANCEL_WARNING)) {
                            event.preventDefault();
                          }
                        }}
                      >
                        <input type="hidden" name="_token" value={csrfToken} />
                        <button
                          type="submit"
                          className="bg-red-500 hover:bg-red-600 text-white px-4 py-2 rounded text-sm flex items-center gap-2"
                        >
                          <XCircle className="w-4 h-4" /> Cancelar pedido
                        </button>
                      </form>
                    )}

                    {canRefund && (
                      <form method="POST" action={`/orders/${order.id}/refund`}>
                        <input type="hidden" name="_token" value={csrfToken} />
                        <button
                          type="submit"
                          className="px-4 py-2 rounded text-sm flex items-center gap-2 text-white transition bg-yellow-500 hover:bg-yellow-600"
                        >
                          <RotateCcw className="w-4 h-4" /> Solicitar reembolso
                        </button>
                      </form>
                    )}
                  </div>

                  {detail.highlight && (
                    <p className="mt-4 text-sm text-amber-700">{detail.highlight}</p>
                  )}

                  {detail.note && !detail.highlight && (
                    <p className="mt-4 text-sm text-slate-600">{detail.note}</p>
                  )}
                </div>
              );
            })}
          </div>
        ) : (
          <p className="text-center text-gray-500 text-lg">No hay pedidos disponibles.</p>
        )}
      </main>

      <Footer />
    </div>
  );
}