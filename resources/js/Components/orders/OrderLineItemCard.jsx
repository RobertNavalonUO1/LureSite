import React from 'react';
import { Link, router } from '@inertiajs/react';
import { ExternalLink, RotateCcw, XCircle } from 'lucide-react';
import OrderStatusBadge from '@/Components/orders/OrderStatusBadge.jsx';
import { formatCurrency } from '@/Components/orders/orderUi.jsx';
import { useI18n } from '@/i18n';

const OrderLineItemCard = ({ orderId, item, detailed = false }) => {
  const { locale, t } = useI18n();
  const runAction = (message, url) => {
    if (!window.confirm(message)) {
      return;
    }

    router.post(url, {}, { preserveScroll: true });
  };

  return (
    <div className="rounded-[1.35rem] border border-slate-200 bg-slate-50/80 p-4">
      <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div className="flex min-w-0 gap-4">
          <div className="h-20 w-20 overflow-hidden rounded-2xl bg-white ring-1 ring-slate-200">
            {item.image_url ? (
              <img src={item.image_url} alt={item.name} className="h-full w-full object-cover" />
            ) : (
              <div className="flex h-full items-center justify-center text-xs text-slate-400">{t('orders.line.no_image')}</div>
            )}
          </div>

          <div className="min-w-0 space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <div className="truncate text-base font-semibold text-slate-900">{item.name}</div>
              <OrderStatusBadge status={item.status} label={item.status_label} compact />
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
              <span>{t('orders.common.quantity', { count: item.quantity })}</span>
              <span>{t('orders.line.unit_price')}: {formatCurrency(item.price, locale)}</span>
              <span>{t('orders.line.subtotal')}: {formatCurrency(item.subtotal, locale)}</span>
            </div>

            {item.cancellation_reason ? <p className="text-sm text-rose-700">{t('orders.line.cancellation_reason')}: {item.cancellation_reason}</p> : null}
            {item.return_reason ? <p className="text-sm text-violet-700">{t('orders.line.return_reason')}: {item.return_reason}</p> : null}
            {item.refund_error ? <p className="text-sm text-amber-700">{t('orders.line.notes')}: {item.refund_error}</p> : null}
            {item.refunded_at ? <p className="text-sm text-slate-500">{t('orders.line.refunded_at')}: {item.refunded_at}</p> : null}
          </div>
        </div>

        <div className="flex w-full flex-col gap-2 lg:w-56">
          {item.product_id ? (
            <Link
              href={`/product/${item.product_id}`}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:border-sky-200 hover:text-sky-700"
            >
              <ExternalLink className="h-4 w-4" />
              {t('orders.product.view_product')}
            </Link>
          ) : null}

          {item.can_cancel ? (
            <button
              type="button"
              onClick={() => runAction(t('orders.prompts.line_cancel'), `/orders/${orderId}/items/${item.id}/cancel`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
            >
              <XCircle className="h-4 w-4" />
              {t('orders.actions.cancel_line')}
            </button>
          ) : null}

          {item.can_refund ? (
            <button
              type="button"
              onClick={() => runAction(t('orders.prompts.line_refund'), `/orders/${orderId}/items/${item.id}/refund`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
            >
              <RotateCcw className="h-4 w-4" />
              {t('orders.actions.refund_line')}
            </button>
          ) : null}
        </div>
      </div>

      {detailed ? (
        <div className="mt-4 grid gap-3 border-t border-slate-200 pt-4 text-sm text-slate-500 sm:grid-cols-2 xl:grid-cols-4">
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.line.technical_status')}</div>
            <div className="mt-1 text-slate-700">{item.status}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.line.cancelled_by')}</div>
            <div className="mt-1 text-slate-700">{item.cancelled_by || t('orders.common.not_available')}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.line.cancelled_at')}</div>
            <div className="mt-1 text-slate-700">{item.cancelled_at || t('orders.common.not_available')}</div>
          </div>
          <div>
            <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.line.refund_reference')}</div>
            <div className="mt-1 break-all text-slate-700">{item.refund_reference_id || t('orders.common.not_available')}</div>
          </div>
        </div>
      ) : null}
    </div>
  );
};

export default OrderLineItemCard;