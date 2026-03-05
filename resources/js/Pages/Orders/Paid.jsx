import React from 'react';
import { usePage } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import { CreditCard, ArrowLeftCircle, XCircle, RotateCcw } from 'lucide-react';

const STATUS_INFO = {
  pagado: {
    label: 'Pagado',
    color: 'bg-purple-100 text-purple-800 border-purple-300',
    icon: <CreditCard className="w-5 h-5 text-purple-600" />,
  },
  pendiente_envio: {
    label: 'Pendiente de envío',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    icon: <CreditCard className="w-5 h-5 text-blue-600" />,
  },
  cancelacion_pendiente: {
    label: 'Cancelación en proceso',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    icon: <XCircle className="w-5 h-5 text-amber-600" />,
  },
  devolucion_aprobada: {
    label: 'Devolución aprobada',
    color: 'bg-emerald-100 text-emerald-800 border-emerald-300',
    icon: <RotateCcw className="w-5 h-5 text-emerald-600" />,
  },
  reembolsado: {
    label: 'Reembolsado',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    icon: <RotateCcw className="w-5 h-5 text-gray-600" />,
  },
};

const CANCEL_WARNING =
  'Al confirmar la solicitud iniciaremos la gestión de cancelación. El resultado se confirmará en 24-48 horas si es posible. ¿Deseas continuar?';

const PaidOrders = () => {
  const { orders, csrfToken } = usePage().props;

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
            {orders.map((order) => {
              const statusInfo = STATUS_INFO[order.status] || {
                label: order.status,
                color: 'bg-gray-100 text-gray-800 border-gray-300',
                icon: <CreditCard className="w-5 h-5 text-gray-400" />,
              };
              const refundDisabled = !['devolucion_aprobada'].includes(order.status);

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
                    <p className="font-bold text-purple-600 text-lg">${order.total}</p>
                  </div>

                  <span className={`inline-block px-3 py-1 text-sm rounded border ${statusInfo.color} mb-2`}>
                    {statusInfo.label}
                  </span>
                  <p className="text-sm text-gray-500 mb-2">Direccion: {order.address}</p>

                  <ul className="text-sm text-gray-600 list-disc ml-5 mb-4">
                    {order.items.map((item) => (
                      <li key={item.id}>
                        <a
                          href={`/product/${item.product_id}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:underline"
                        >
                          {item.name}
                        </a>{' '}
                        x{item.quantity} - ${item.price}
                      </li>
                    ))}
                  </ul>

                  <div className="flex gap-2 flex-wrap">
                    {['confirmado', 'pendiente_envio', 'pagado'].includes(order.status) && (
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
                          className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-sm flex items-center gap-1"
                        >
                          <XCircle className="w-4 h-4" /> Cancelar Pedido
                        </button>
                      </form>
                    )}

                    {order.status === 'devolucion_aprobada' && (
                      <form method="POST" action={`/orders/${order.id}/refund`}>
                        <input type="hidden" name="_token" value={csrfToken} />
                        <button
                          type="submit"
                          disabled={refundDisabled}
                          title={
                            refundDisabled
                              ? 'La solicitud de reembolso estara disponible cuando la cancelacion sea aprobada.'
                              : ''
                          }
                          className={`px-3 py-1 rounded text-sm flex items-center gap-1 text-white transition ${
                            refundDisabled
                              ? 'bg-yellow-300 cursor-not-allowed'
                              : 'bg-yellow-500 hover:bg-yellow-600'
                          }`}
                        >
                          <RotateCcw className="w-4 h-4" /> Solicitar Reembolso
                        </button>
                      </form>
                    )}
                    {order.status === 'reembolsado' && (
                      <span className="px-3 py-1 rounded text-sm bg-gray-200 text-gray-700 flex items-center gap-1">
                        <RotateCcw className="w-4 h-4" />
                        Reembolso procesado
                      </span>
                    )}
                  </div>

                  {order.status === 'cancelacion_pendiente' && (
                    <p className="mt-3 text-sm text-amber-700">
                      Tu solicitud de cancelacion esta en revision. Te confirmaremos el resultado en 24-48 horas.
                    </p>
                  )}
                  {order.status === 'devolucion_aprobada' && (
                    <p className="mt-3 text-sm text-emerald-700">
                      La devolucion fue aprobada. Solicita tu reembolso para completar el proceso.
                    </p>
                  )}
                  {order.status === 'reembolsado' && (
                    <p className="mt-3 text-sm text-slate-600">
                      El reembolso se proceso correctamente. La acreditacion puede tardar segun tu metodo de pago.
                    </p>
                  )}

                  {order.status === 'cancelacion_pendiente' && (
                    <p className="mt-3 text-sm text-amber-700">
                      Tu cancelacion esta en proceso. Te confirmaremos el resultado en un plazo estimado de 24-48 horas.
                    </p>
                  )}

                  <a
                    href={`/orders/${order.id}`}
                    className="mt-3 inline-block text-indigo-600 hover:underline text-sm"
                  >
                    Ver detalle del pedido &rarr;
                  </a>
                </div>
              );
            })}
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