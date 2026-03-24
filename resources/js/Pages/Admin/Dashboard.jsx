import React from 'react';
import { Link } from '@inertiajs/react';

const formatNumber = (value) =>
  new Intl.NumberFormat('es-ES', { maximumFractionDigits: 0 }).format(value ?? 0);

const formatCurrency = (value, currency) => {
  if (!currency) {
    return formatNumber(value);
  }

  try {
    return new Intl.NumberFormat('es-ES', {
      style: 'currency',
      currency,
      maximumFractionDigits: 0,
    }).format(value ?? 0);
  } catch (error) {
    return `${formatNumber(value)} ${currency}`;
  }
};

const formatPercent = (value) => `${Number(value ?? 0).toFixed(1)}%`;

const statusStyles = {
  pendiente: 'bg-amber-100 text-amber-700',
  en_proceso: 'bg-sky-100 text-sky-700',
  completado: 'bg-emerald-100 text-emerald-700',
  enviado: 'bg-indigo-100 text-indigo-700',
  cancelado: 'bg-rose-100 text-rose-700',
  default: 'bg-slate-100 text-slate-700',
};

export default function Dashboard({
  ordersCount = 0,
  usersCount = 0,
  productsCount = 0,
  pendingOrders = 0,
  monthlyRevenue = 0,
  avgOrderValue = 0,
  newCustomers = 0,
  conversionRate = 0,
  supportTickets = 0,
  topProducts = [],
  recentOrders = [],
  alerts = [],
  activity = [],
  lastUpdated = null,
  currency = 'EUR',
  refundMetrics = { requested: 0, approved: 0, failed: 0, refunded: 0 },
}) {
  const formattedDate = lastUpdated
    ? new Date(lastUpdated).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      })
    : new Date().toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'long',
        year: 'numeric',
      });

  const quickActions = [
    {
      label: 'Crear producto',
      href: '/admin/products/create',
      color: 'bg-indigo-600 hover:bg-indigo-500',
    },
    {
      label: 'Generar cupón',
      href: '/admin/coupons/create',
      color: 'bg-blue-600 hover:bg-blue-500',
    },
    {
      label: 'Ver inventario',
      href: '/admin/products',
      color: 'bg-emerald-600 hover:bg-emerald-500',
    },
  ];

  const summaryCards = [
    {
      label: 'Pedidos totales',
      value: formatNumber(ordersCount),
      helper: pendingOrders ? `${formatNumber(pendingOrders)} pendientes` : 'Sin pendientes',
      href: '/admin/orders',
    },
    {
      label: 'Usuarios activos',
      value: formatNumber(usersCount),
      helper: newCustomers
        ? `${formatNumber(newCustomers)} nuevos este mes`
        : 'Crecimiento estable',
      href: '/admin/users',
    },
    {
      label: 'Productos publicados',
      value: formatNumber(productsCount),
      helper: 'Revisar catálogo',
      href: '/admin/products',
    },
    {
      label: 'Postventa activa',
      value: formatNumber(supportTickets),
      helper: refundMetrics.failed
        ? `${formatNumber(refundMetrics.failed)} reembolsos con error`
        : supportTickets
          ? 'Revisar devoluciones y reembolsos'
          : 'Sin incidencias abiertas',
      href: '/admin/logs',
    },
  ];

  const refundHighlights = [
    {
      title: 'Solicitudes de devolución',
      value: formatNumber(refundMetrics.requested),
      helper: 'Pendientes de revisión administrativa',
    },
    {
      title: 'Devoluciones aprobadas',
      value: formatNumber(refundMetrics.approved),
      helper: 'Listas para intentar reembolso',
    },
    {
      title: 'Reembolsos con error',
      value: formatNumber(refundMetrics.failed),
      helper: 'Necesitan reintento o revisión de configuración',
    },
    {
      title: 'Pedidos reembolsados',
      value: formatNumber(refundMetrics.refunded),
      helper: 'Confirmados contra proveedor de pago',
    },
  ];

  const performanceHighlights = [
    {
      title: 'Ingresos del mes',
      value: formatCurrency(monthlyRevenue, currency),
      helper: 'Comparado con el mes anterior',
    },
    {
      title: 'Ticket promedio',
      value: formatCurrency(avgOrderValue, currency),
      helper: 'Valor medio por pedido',
    },
    {
      title: 'Conversión',
      value: formatPercent(conversionRate),
      helper: 'Tasa global del sitio',
    },
  ];

  const unresolvedAlerts = alerts.filter((alert) => alert?.type !== 'resolved');

  const timeline = activity.length
    ? activity
    : [
        {
          id: 'default-1',
          title: 'Sin actividad reciente',
          description:
            'Aquí aparecerán movimientos del equipo y del sistema.',
        },
      ];

  return (
    <div className="min-h-screen bg-slate-950/5 py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-10 px-6">
        <header className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <p className="text-sm uppercase tracking-wide text-slate-500">
              Panel de control
            </p>
            <h1 className="text-3xl font-semibold text-slate-900">
              Bienvenido de nuevo
            </h1>
            <p className="text-slate-500">
              Monitorea la salud del negocio, toma decisiones y actúa rápidamente.
            </p>
          </div>
          <div className="flex items-center gap-3 rounded-xl border border-slate-200 bg-white px-5 py-4 shadow-sm">
            <div className="flex flex-col text-right">
              <span className="text-xs uppercase tracking-wide text-slate-400">
                Última actualización
              </span>
              <span className="text-sm font-medium text-slate-700">
                {formattedDate}
              </span>
            </div>
            <Link
              href="/admin/settings"
              className="rounded-full bg-slate-900 px-3 py-2 text-xs font-semibold uppercase tracking-wide text-white"
            >
              Ajustes
            </Link>
          </div>
        </header>

        <section className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
          {summaryCards.map((card) => (
            <Link
              key={card.label}
              href={card.href}
              className="group relative overflow-hidden rounded-2xl border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-1 hover:shadow-lg"
            >
              <span className="text-xs uppercase tracking-wide text-slate-400">
                {card.label}
              </span>
              <div className="mt-3 flex items-baseline gap-2">
                <span className="text-3xl font-semibold text-slate-900">
                  {card.value}
                </span>
                {card.helper && (
                  <span className="text-xs text-slate-400">{card.helper}</span>
                )}
              </div>
              <span className="mt-4 inline-flex items-center text-xs font-semibold text-indigo-600">
                Ver detalles
                <svg
                  className="ml-1 h-3 w-3 transition group-hover:translate-x-1"
                  viewBox="0 0 12 12"
                  fill="none"
                >
                  <path
                    d="M4 2l4 4-4 4"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </span>
            </Link>
          ))}
        </section>

        <section className="grid gap-6 lg:grid-cols-3">
          <div className="flex flex-col gap-6 lg:col-span-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Rendimiento comercial
                </h2>
                <span className="text-xs text-slate-400">Últimos 30 días</span>
              </div>
              <div className="mt-6 grid gap-6 md:grid-cols-3">
                {performanceHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {item.title}
                    </span>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {item.value}
                    </p>
                    <span className="text-xs text-slate-400">{item.helper}</span>
                  </div>
                ))}
              </div>
              <div className="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-4">
                {refundHighlights.map((item) => (
                  <div
                    key={item.title}
                    className="rounded-xl border border-slate-100 bg-slate-50/80 p-4"
                  >
                    <span className="text-xs uppercase tracking-wide text-slate-500">
                      {item.title}
                    </span>
                    <p className="mt-2 text-2xl font-semibold text-slate-900">
                      {item.value}
                    </p>
                    <span className="text-xs text-slate-400">{item.helper}</span>
                  </div>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <div className="flex items-center justify-between">
                <h2 className="text-lg font-semibold text-slate-900">
                  Pedidos recientes
                </h2>
                <Link
                  href="/admin/orders"
                  className="text-xs font-semibold uppercase tracking-wide text-indigo-600"
                >
                  Ver todos
                </Link>
              </div>
              {recentOrders.length === 0 ? (
                <p className="mt-6 text-sm text-slate-500">
                  Sin pedidos recientes. Invita a tu equipo a crear promociones o
                  lanzar campañas.
                </p>
              ) : (
                <table className="mt-6 w-full table-auto text-left">
                  <thead className="text-xs uppercase text-slate-400">
                    <tr>
                      <th className="pb-2">Pedido</th>
                      <th className="pb-2">Cliente</th>
                      <th className="pb-2">Estado</th>
                      <th className="pb-2 text-right">Total</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 text-sm text-slate-600">
                    {recentOrders.map((order) => (
                      <tr key={order.id ?? order.code}>
                        <td className="py-3 font-medium text-slate-900">
                          {order.code ?? `#${order.id}`}
                        </td>
                        <td className="py-3">{order.customer ?? 'Sin cliente'}</td>
                        <td className="py-3">
                          <span
                            className={`inline-flex rounded-full px-2.5 py-1 text-xs font-semibold ${
                              statusStyles[order.status?.toLowerCase()] ??
                              statusStyles.default
                            }`}
                          >
                            {order.status ?? 'Sin estado'}
                          </span>
                        </td>
                        <td className="py-3 text-right font-medium text-slate-900">
                          {formatCurrency(order.total, currency)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Acciones rápidas
              </h2>
              <p className="mt-2 text-sm text-slate-500">
                Atajos frecuentes para acelerar operaciones.
              </p>
              <div className="mt-4 flex flex-col gap-3">
                {quickActions.map((action) => (
                  <Link
                    key={action.label}
                    href={action.href}
                    className={`rounded-xl px-4 py-3 text-sm font-semibold text-white transition ${action.color}`}
                  >
                    {action.label}
                  </Link>
                ))}
              </div>
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Productos destacados
              </h2>
              {topProducts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Agrega tus productos con mejor rendimiento para hacerles
                  seguimiento desde aquí.
                </p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {topProducts.map((product) => (
                    <li key={product.id ?? product.name}>
                      <div className="flex items-center justify-between">
                        <span className="font-medium text-slate-900">
                          {product.name}
                        </span>
                        <span className="text-xs uppercase tracking-wide text-slate-400">
                          {formatNumber(product.units)} uds
                        </span>
                      </div>
                      <div className="mt-1 text-xs text-slate-400">
                        {formatCurrency(product.revenue, currency)} en ventas
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">Alertas</h2>
              {unresolvedAlerts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">
                  Todo en orden. No hay alertas pendientes.
                </p>
              ) : (
                <ul className="mt-4 space-y-3 text-sm text-slate-600">
                  {unresolvedAlerts.map((alert) => (
                    <li
                      key={alert.id ?? alert.message}
                      className="flex items-start gap-3 rounded-xl bg-amber-50 p-4"
                    >
                      <span className="mt-1 h-2.5 w-2.5 rounded-full bg-amber-500" />
                      <div>
                        <p className="font-semibold text-amber-700">
                          {alert.title ?? 'Alerta'}
                        </p>
                        <p className="text-xs text-amber-600">
                          {alert.message}
                        </p>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-sm">
              <h2 className="text-lg font-semibold text-slate-900">
                Actividad del equipo
              </h2>
              <ul className="mt-4 space-y-4 text-sm text-slate-600">
                {timeline.map((item) => (
                  <li key={item.id} className="flex gap-3">
                    <span className="mt-1 h-2.5 w-2.5 rounded-full bg-indigo-500" />
                    <div>
                      <p className="font-semibold text-slate-900">
                        {item.title}
                      </p>
                      <p className="text-xs text-slate-500">
                        {item.description}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
