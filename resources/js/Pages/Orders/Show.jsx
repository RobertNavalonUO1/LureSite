import React, { useState } from 'react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import { Link, usePage } from '@inertiajs/react';
import { XCircle, RotateCcw } from 'lucide-react';

const STATUS_INFO = {
  pendiente_pago: {
    label: 'Pendiente de pago',
    color: 'bg-yellow-100 text-yellow-800 border-yellow-300',
    description: 'Tu pedido esta pendiente de pago. Realiza el pago para continuar.',
  },
  pagado: {
    label: 'Pagado',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'El pedido ha sido pagado y esta en proceso.',
  },
  pendiente_envio: {
    label: 'Pendiente de envio',
    color: 'bg-blue-100 text-blue-800 border-blue-300',
    description: 'Tu pedido esta pendiente de ser enviado.',
  },
  enviado: {
    label: 'Enviado',
    color: 'bg-indigo-100 text-indigo-800 border-indigo-300',
    description: 'Tu pedido ha sido enviado. Pronto lo recibiras.',
  },
  entregado: {
    label: 'Entregado',
    color: 'bg-teal-100 text-teal-800 border-teal-300',
    description: 'El pedido ha sido entregado. Gracias por tu compra.',
  },
  confirmado: {
    label: 'Confirmado',
    color: 'bg-green-50 text-green-700 border-green-200',
    description: 'Has confirmado la recepcion del pedido.',
  },
  cancelacion_pendiente: {
    label: 'Cancelacion en proceso',
    color: 'bg-amber-100 text-amber-800 border-amber-300',
    description: 'Tu cancelacion esta en revision. Recibiras respuesta en 24-48 horas.',
  },
  cancelado: {
    label: 'Cancelado',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'El pedido ha sido cancelado.',
  },
  reembolsado: {
    label: 'Reembolsado',
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: 'El pedido ha sido reembolsado.',
  },
  fallido: {
    label: 'Pago fallido',
    color: 'bg-red-50 text-red-700 border-red-200',
    description: 'El pago ha fallado. Intenta nuevamente.',
  },
  devolucion_solicitada: {
    label: 'Devolucion solicitada',
    color: 'bg-orange-100 text-orange-800 border-orange-300',
    description: 'Has solicitado la devolucion de este pedido.',
  },
  devolucion_aprobada: {
    label: 'Devolucion aprobada',
    color: 'bg-green-100 text-green-800 border-green-300',
    description: 'La devolucion ha sido aprobada.',
  },
  devolucion_rechazada: {
    label: 'Devolucion rechazada',
    color: 'bg-red-100 text-red-800 border-red-300',
    description: 'La devolucion ha sido rechazada.',
  },
};

const ProductPopup = ({ product, onClick }) => (
  <div
    className="w-[300px] h-[300px] bg-white rounded-xl shadow-lg border p-4 flex flex-col items-center justify-center cursor-pointer"
    onClick={onClick}
    tabIndex={0}
    role="button"
  >
    <img src={product.image_url} alt={product.name} className="w-24 h-24 object-contain mb-2 rounded" />
    <div className="font-bold text-lg text-slate-800 mb-1">{product.name}</div>
    <div className="text-sm text-gray-500 mb-1">{product.category?.name || 'Sin categoria'}</div>
    <div className="text-rose-600 font-semibold text-xl mb-2">${product.price}</div>
    <div className={`text-sm font-medium mb-2 ${product.stock > 0 ? 'text-green-600' : 'text-red-500'}`}>
      {product.stock > 0 ? `En stock: ${product.stock}` : 'Agotado'}
    </div>
    <div className="text-xs text-gray-400 mb-2">SKU: {product.id} · Vendidos: {product.sold_count || 0}</div>
    <div className="text-center mt-2">
      <span className="text-indigo-600 underline cursor-pointer">Ver producto &rarr;</span>
    </div>
  </div>
);

const OrderShow = ({ order }) => {
  const { csrfToken } = usePage().props;
  const [hoveredProductId, setHoveredProductId] = useState(null);
  const [popupItem, setPopupItem] = useState(null);

  const handleMouseEnter = (item) => {
    setHoveredProductId(item.id);
    setPopupItem(item);
  };

  const handleMouseLeave = () => {
    setHoveredProductId(null);
    setPopupItem(null);
  };

  const handleProductRowClick = (item) => {
    if (item.product_id) {
      window.open(`/product/${item.product_id}`, '_blank');
    }
  };

  const statusInfo = STATUS_INFO[order.status] || {
    label: order.status,
    color: 'bg-gray-100 text-gray-800 border-gray-300',
    description: '',
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Header />
      <main className="flex-grow max-w-2xl mx-auto p-6 relative">
        <Link href="/orders" className="text-indigo-600 hover:underline mb-4 block">
          &larr; Volver a pedidos
        </Link>

        <h1 className="text-2xl font-bold text-blue-700 mb-2">Pedido #{order.id}</h1>

        <div className={`mb-4 px-4 py-3 rounded border ${statusInfo.color}`}>
          <span className="font-semibold">{statusInfo.label}</span>
          {statusInfo.description && <span className="block text-sm mt-1">{statusInfo.description}</span>}
          <span className="ml-4 text-gray-600">Fecha: {order.date}</span>
        </div>

        <h2 className="text-lg font-semibold mb-2">Articulos</h2>

        <div className="flex">
          <ul className="divide-y divide-gray-100 mb-4 flex-1">
            {order.items.map((item) => (
              <li
                key={item.id}
                className="py-3 flex items-center gap-4 cursor-pointer hover:bg-blue-50 transition"
                onMouseEnter={() => handleMouseEnter(item)}
                onMouseLeave={handleMouseLeave}
                onClick={() => handleProductRowClick(item)}
              >
                {item.image_url && (
                  <img src={item.image_url} alt={item.name} className="w-16 h-16 object-cover rounded" />
                )}
                <div className="flex-1">
                  <div className="font-medium">{item.name}</div>
                  <div className="text-sm text-gray-500">Cantidad: {item.quantity}</div>
                </div>
                <div className="font-bold text-blue-700">${(item.price * item.quantity).toFixed(2)}</div>
              </li>
            ))}
          </ul>

          {hoveredProductId && popupItem && popupItem.product && (
            <div className="fixed z-50 top-1/2 right-8 transform -translate-y-1/2" style={{ minWidth: 260 }}>
              <ProductPopup product={popupItem.product} onClick={() => handleProductRowClick(popupItem)} />
            </div>
          )}
        </div>

        <div className="text-right font-bold text-xl text-blue-700 mt-6">
          Total: ${parseFloat(order.total).toFixed(2)}
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          {order.can_cancel && (
            <Link
              href={`/orders/${order.id}/cancel`}
              className="inline-flex items-center gap-2 rounded-lg border border-red-200 px-4 py-2 text-sm font-medium text-red-600 transition hover:bg-red-50"
            >
              <XCircle className="w-4 h-4" />
              Solicitar cancelacion
            </Link>
          )}

          {order.can_refund && (
            <form method="POST" action={`/orders/${order.id}/refund`}>
              <input type="hidden" name="_token" value={csrfToken} />
              <button
                type="submit"
                className="inline-flex items-center gap-2 rounded-lg bg-yellow-500 px-4 py-2 text-sm font-medium text-white transition hover:bg-yellow-600"
              >
                <RotateCcw className="w-4 h-4" />
                Solicitar reembolso
              </button>
            </form>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default OrderShow;