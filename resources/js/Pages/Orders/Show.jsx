import React, { useMemo } from 'react';
import { Link, router } from '@inertiajs/react';
import { CheckCircle2, ChevronLeft, RotateCcw, XCircle } from 'lucide-react';
import OrdersDashboardLayout from '@/Layouts/OrdersDashboardLayout.jsx';
import OrderStatusBadge from '@/Components/orders/OrderStatusBadge.jsx';
import OrderLineItemCard from '@/Components/orders/OrderLineItemCard.jsx';
import { formatCurrency } from '@/Components/orders/orderUi.jsx';
import { useI18n } from '@/i18n';

const OrderShow = ({ order }) => {
  const { locale, t } = useI18n();
  const heroStats = useMemo(
    () => [
      { label: t('orders.module.stats.lines'), value: order.line_counts.total },
      { label: t('orders.module.stats.active_lines'), value: order.line_counts.active },
      { label: t('orders.module.stats.affected_lines'), value: order.line_counts.affected },
      { label: t('orders.module.stats.active_value'), value: formatCurrency(order.active_total, locale) },
    ],
    [locale, order, t]
  );

  const confirmAction = (message, callback) => {
    if (window.confirm(message)) {
      callback();
    }
  };

  return (
    <OrdersDashboardLayout
      title={t('orders.common.order_number', { id: order.id })}
      subtitle={t('orders.detail.subtitle')}
      filters={[
        { key: 'all', label: 'Todos', href: '/orders', count: null },
        { key: 'paid', label: 'Activos', href: '/orders/paid', count: null },
        { key: 'shipped', label: 'Seguimiento', href: '/orders/shipped', count: null },
        { key: 'cancelled', label: 'Incidencias', href: '/orders/cancelled', count: null },
      ].map((filter) => ({ ...filter, count: filter.count ?? '' }))}
      activeFilter="all"
      heroStats={heroStats}
    >
      <div className="space-y-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <Link href="/orders" className="inline-flex items-center gap-2 text-sm font-medium text-slate-500 transition hover:text-slate-900">
            <ChevronLeft className="h-4 w-4" />
            {t('orders.show.back')}
          </Link>
          <div className="flex flex-wrap items-center gap-3">
            <OrderStatusBadge status={order.summary_status} label={order.summary_status_label} />
            <OrderStatusBadge status={order.status} label={order.status_label} compact />
          </div>
        </div>

        <section className="grid gap-5 xl:grid-cols-[minmax(0,1fr)_320px]">
          <div className="space-y-4 rounded-[1.75rem] border border-slate-200 bg-slate-50/70 p-5">
            <div className="grid gap-4 border-b border-slate-200 pb-4 sm:grid-cols-2 xl:grid-cols-4">
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.common.date')}</div>
                <div className="mt-2 text-sm text-slate-700">{order.date}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.common.address')}</div>
                <div className="mt-2 text-sm text-slate-700">{order.address}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.module.summary.total_order')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(order.total, locale)}</div>
              </div>
              <div>
                <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('orders.module.stats.active_value')}</div>
                <div className="mt-2 text-sm font-semibold text-slate-900">{formatCurrency(order.active_total, locale)}</div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <SummaryMetric label={t('orders.module.summary.active_lines')} value={order.line_counts.active} help={t('orders.module.summary.active_lines_help')} />
              <SummaryMetric label={t('orders.module.summary.cancelled_lines')} value={order.line_counts.cancelled} help={t('orders.module.summary.cancelled_lines_help')} />
              <SummaryMetric label={t('orders.module.summary.pending_review')} value={order.line_counts.cancellation_requested + order.line_counts.refund_requested} help={t('orders.module.summary.pending_review_help')} />
              <SummaryMetric label={t('orders.module.summary.refunded_lines')} value={order.line_counts.refunded} help={t('orders.module.summary.refunded_lines_help')} />
            </div>
          </div>

          <aside className="space-y-3 rounded-[1.75rem] border border-slate-200 bg-slate-950 p-5 text-white">
            <div>
              <div className="text-xs font-semibold uppercase tracking-[0.18em] text-white/50">{t('orders.detail.operational_summary')}</div>
              <div className="mt-2 text-lg font-semibold">{order.summary_status_label}</div>
              <p className="mt-2 text-sm leading-6 text-white/70">
                {t('orders.detail.operational_summary_body')}
              </p>
            </div>

            {order.can_cancel ? (
              <button
                type="button"
                onClick={() =>
                  confirmAction(t('orders.prompts.group_cancel'), () => {
                    router.post(`/orders/${order.id}/cancel`, {}, { preserveScroll: true });
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-rose-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-400"
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
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-violet-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-violet-400"
              >
                <RotateCcw className="h-4 w-4" />
                {t('orders.actions.grouped_refund')}
              </button>
            ) : null}

            {order.status === 'entregado' ? (
              <button
                type="button"
                onClick={() =>
                  confirmAction(t('orders.prompts.confirm_reception'), () => {
                    router.post(`/orders/${order.id}/confirm`, {}, { preserveScroll: true });
                  })
                }
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl border border-white/15 bg-white/10 px-4 py-3 text-sm font-semibold text-white transition hover:bg-white/15"
              >
                <CheckCircle2 className="h-4 w-4" />
                {t('orders.actions.confirm_reception')}
              </button>
            ) : null}
          </aside>
        </section>

        <section className="space-y-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h2 className="text-xl font-semibold text-slate-900">{t('orders.detail.lines_title')}</h2>
              <p className="mt-1 text-sm text-slate-500">{t('orders.detail.lines_subtitle')}</p>
            </div>
          </div>

          <div className="space-y-3">
            {order.items.map((item) => (
              <OrderLineItemCard key={item.id} orderId={order.id} item={item} detailed />
            ))}
          </div>
        </section>
      </div>
    </OrdersDashboardLayout>
  );
};

const SummaryMetric = ({ label, value, help }) => (
  <div className="rounded-2xl border border-slate-200 bg-white px-4 py-3">
    <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{label}</div>
    <div className="mt-2 text-2xl font-semibold text-slate-900">{value}</div>
    <div className="mt-1 text-xs text-slate-500">{help}</div>
  </div>
);

export default OrderShow;
