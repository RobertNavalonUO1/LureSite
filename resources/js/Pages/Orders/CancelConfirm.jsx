import React, { useState } from 'react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import { Link, usePage } from '@inertiajs/react';
import { AlertTriangle, XCircle, ArrowLeftCircle } from 'lucide-react';

const CancelConfirm = () => {
  const { order, csrfToken } = usePage().props;
  const [reason, setReason] = useState('');

  if (!order) {
    return null;
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <Header />

      <main className="max-w-4xl mx-auto px-4 py-10 space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-bold text-slate-800 flex items-center gap-2">
            <AlertTriangle className="w-6 h-6 text-amber-500" />
            Confirmar cancelacion
          </h1>
          <Link href="/orders" className="flex items-center gap-1 text-sky-600 hover:underline">
            <ArrowLeftCircle className="w-5 h-5" />
            Volver a mis pedidos
          </Link>
        </div>

        <section className="rounded-xl border border-amber-200 bg-white p-6 shadow-sm">
          <p className="text-sm text-amber-700">
            Al confirmar la cancelacion iniciaremos el proceso de revision. Te enviaremos la resolucion en un plazo
            estimado de 24-48 horas. Mientras tanto es posible que el pedido siga apareciendo como activo.
          </p>
        </section>

        <section className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm space-y-4">
          <div>
            <h2 className="text-xl font-semibold text-slate-800">Resumen del pedido #{order.id}</h2>
            <p className="text-sm text-slate-500">
              Fecha: {order.date ?? 'Sin fecha'} · Estado actual: {order.status}
            </p>
          </div>

          <ul className="space-y-2 text-sm text-slate-600">
            {order.items.map((item) => (
              <li key={item.id} className="flex items-center justify-between">
                <span>
                  {item.name} &times; {item.quantity}
                </span>
                <span>${Number(item.price ?? 0).toFixed(2)}</span>
              </li>
            ))}
          </ul>

          <div className="flex justify-end text-sm font-semibold text-slate-700">
            Total: ${Number(order.total ?? 0).toFixed(2)}
          </div>
        </section>

        <form method="POST" action={`/orders/${order.id}/cancel`} className="space-y-4 rounded-xl bg-white p-6 shadow-sm border border-slate-200">
          <input type="hidden" name="_token" value={csrfToken} />
          <label className="block text-sm font-medium text-slate-700">
            Motivo (opcional)
            <textarea
              name="reason"
              value={reason}
              onChange={(event) => setReason(event.target.value)}
              placeholder="Cuéntanos el motivo para ayudarte a mejorar la experiencia"
              className="mt-1 w-full rounded-lg border border-slate-200 p-3 text-sm text-slate-700 focus:border-sky-400 focus:outline-none focus:ring-1 focus:ring-sky-400"
              rows={3}
              maxLength={500}
            />
          </label>

          <div className="flex flex-wrap gap-3">
            <Link
              href={`/orders/${order.id}`}
              className="flex items-center gap-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-600 hover:bg-slate-100"
            >
              <ArrowLeftCircle className="w-4 h-4" />
              Revisar pedido
            </Link>

            <button
              type="submit"
              className="inline-flex items-center gap-2 rounded-lg bg-red-600 px-5 py-2 text-sm font-semibold text-white transition hover:bg-red-700"
            >
              <XCircle className="w-4 h-4" />
              Confirmar cancelacion
            </button>
          </div>
        </form>
      </main>

      <Footer />
    </div>
  );
};

export default CancelConfirm;
