import React from 'react';
import { Link, router } from '@inertiajs/react';
import { Eye, ExternalLink, RotateCcw, XCircle } from 'lucide-react';
import OrderStatusBadge from '@/Components/orders/OrderStatusBadge.jsx';
import { formatCurrency } from '@/Components/orders/orderUi.jsx';
import { useI18n } from '@/i18n';

const OrderListCard = ({ order }) => {
  const { locale, t } = useI18n();
  const confirmAction = (message, callback) => {
    if (window.confirm(message)) {
      callback();
    }
  };

  const previewItems = order.items.slice(0, 3);

  return (
    <article className="rounded-[1.5rem] border border-slate-200 bg-white p-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl">
      <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-start xl:justify-between">
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-3">
            <Link href={`/orders/${order.id}`} className="text-xl font-semibold tracking-tight text-slate-900 hover:text-sky-700">
              {t('orders.common.order_number', { id: order.id })}
            </Link>
            <OrderStatusBadge status={order.summary_status} label={order.summary_status_label} />
          </div>
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm text-slate-500">
            <span>{t('orders.common.date')}: {order.date}</span>
            <span>{t('orders.module.summary.active_lines')}: {order.line_counts.active}</span>
            <span>{t('orders.module.summary.affected_lines')}: {order.line_counts.affected}</span>
            {order.estimated_delivery ? <span>{t('orders.common.estimated_delivery')}: {order.estimated_delivery}</span> : null}
          </div>
          <p className="max-w-2xl text-sm leading-6 text-slate-500">{order.address}</p>
        </div>

        <div className="grid min-w-[240px] grid-cols-2 gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-3 text-sm">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.module.summary.total_order')}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(order.total, locale)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.module.summary.active_value')}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(order.active_total, locale)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.module.summary.affected_value')}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{formatCurrency(order.affected_total, locale)}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.module.summary.cancelled_lines')}</div>
            <div className="mt-1 text-lg font-semibold text-slate-900">{order.line_counts.cancelled}</div>
          </div>
        </div>
      </div>

      <div className="mt-4 grid gap-3 xl:grid-cols-[minmax(0,1fr)_220px]">
        <div className="space-y-3">
          {previewItems.map((item) => (
            <div key={item.id} className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50/70 p-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <div className="h-14 w-14 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
                  {item.image_url ? (
                    <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
                  ) : (
                    <div className="flex h-full items-center justify-center text-xs text-slate-400">{t('orders.line.no_image')}</div>
                  )}
                </div>
                <div className="min-w-0">
                  <div className="truncate font-medium text-slate-900">{item.name}</div>
                  <div className="mt-1 text-sm text-slate-500">
                    {t('orders.module.summary.units', { count: item.quantity })} · {formatCurrency(item.subtotal, locale)}
                  </div>
                </div>
              </div>
              <OrderStatusBadge status={item.status} label={item.status_label} compact />
            </div>
          ))}
          {order.items.length > previewItems.length ? (
            <div className="text-sm text-slate-500">{t('orders.module.more_lines', { count: order.items.length - previewItems.length })}</div>
          ) : null}
        </div>

        <div className="flex flex-col gap-3 rounded-2xl border border-slate-100 bg-slate-50 p-4">
          <Link href={`/orders/${order.id}`} className="inline-flex items-center justify-center gap-2 rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800">
            <Eye className="h-4 w-4" />
            {t('orders.common.view_details')}
          </Link>

          {order.tracking_url ? (
            <a href={order.tracking_url} target="_blank" rel="noreferrer" className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm font-semibold text-sky-700 transition hover:bg-sky-100">
              <ExternalLink className="h-4 w-4" />
              {t('orders.common.external_tracking')}
            </a>
          ) : null}

          {order.can_cancel ? (
            <button
              type="button"
              onClick={() =>
                confirmAction(t('orders.prompts.group_cancel'), () => {
                  router.post(`/orders/${order.id}/cancel`, {}, { preserveScroll: true });
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <XCircle className="h-4 w-4" />
              {t('orders.actions.grouped_cancel')}
            </button>
          ) : null}

          {order.can_refund ? (
            <button
              type="button"
              onClick={() =>
                confirmAction(t('orders.prompts.group_refund'), () => {
                  router.post(`/orders/${order.id}/refund`, {}, { preserveScroll: true });
                })
              }
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-4 py-3 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              <RotateCcw className="h-4 w-4" />
              {t('orders.actions.grouped_refund')}
            </button>
          ) : null}
        </div>
      </div>
    </article>
  );
};

export default OrderListCard;