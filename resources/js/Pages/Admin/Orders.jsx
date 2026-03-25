import React, { useState } from 'react';
import { router } from '@inertiajs/react';
import OrderStatusBadge from '@/Components/orders/OrderStatusBadge.jsx';
import { formatCurrency } from '@/Components/orders/orderUi.jsx';
import { useI18n } from '@/i18n';
import Notification from './Notification';

function exportCSV(orders) {
  const headers = ['ID', 'Cliente', 'Total', 'Estado', 'Resumen', 'Tracking carrier', 'Tracking number', 'Tracking url', 'Cancelado por', 'Motivo', 'Fecha Cancelación', 'Refund Ref', 'Refund Error'];
  const rows = orders.map(o => [
    o.id, o.user?.name, o.total, o.status, o.summary_status_label || '', o.tracking_carrier || '', o.tracking_number || '', o.tracking_url || '', o.cancelled_by || '', o.cancellation_reason || '', o.cancelled_at || '', o.refund_reference_id || '', o.refund_error || ''
  ]);
  const csv = [headers, ...rows].map(r => r.join(',')).join('\n');
  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = 'pedidos.csv';
  a.click();
  URL.revokeObjectURL(url);
}

export default function Orders({ orders }) {
  const { locale, t } = useI18n();
  const [reason, setReason] = useState({});
  const [tracking, setTracking] = useState(() => Object.fromEntries(
    orders.map((order) => [order.id, {
      tracking_carrier: order.tracking_carrier || '',
      tracking_number: order.tracking_number || '',
      tracking_url: order.tracking_url || '',
    }])
  ));

  const prompt = (key) => t(`admin.orders_module.prompts.${key}`);

  const updateTrackingField = (orderId, field, value) => {
    setTracking((current) => ({
      ...current,
      [orderId]: {
        ...(current[orderId] || {}),
        [field]: value,
      },
    }));
  };

  const patchOrder = (orderId, path, data = {}, confirmMessage = null) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    router.patch(`/admin/orders/${orderId}/${path}`, data, {
      preserveScroll: true,
    });
  };

  const patchOrderItem = (orderId, itemId, path, data = {}, confirmMessage = null) => {
    if (confirmMessage && !window.confirm(confirmMessage)) {
      return;
    }

    router.patch(`/admin/orders/${orderId}/items/${itemId}/${path}`, data, {
      preserveScroll: true,
    });
  };

  const handleCancel = (order) => {
    patchOrder(
      order.id,
      'cancel',
      { reason: reason[order.id] || '' },
      prompt('cancel_order'),
    );
  };

  const handleSaveTracking = (order) => {
    patchOrder(
      order.id,
      'tracking',
      tracking[order.id] || {},
      prompt('save_tracking'),
    );
  };

  return (
    <div className="min-h-screen bg-stone-100 p-6 lg:p-8">
      <Notification />
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <h1 className="text-3xl font-semibold tracking-tight text-slate-900">{t('admin.orders_module.title')}</h1>
          <p className="mt-2 max-w-2xl text-sm text-slate-500">
            {t('admin.orders_module.subtitle')}
          </p>
        </div>
        <button
          onClick={() => exportCSV(orders)}
          className="inline-flex items-center justify-center rounded-xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          {t('admin.orders_module.export_csv')}
        </button>
      </div>

      <div className="space-y-4">
        {orders.map(order => (
          <article key={order.id} className="rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
            <div className="flex flex-col gap-4 border-b border-slate-100 pb-4 xl:flex-row xl:items-start xl:justify-between">
              <div className="space-y-3">
                <div className="flex flex-wrap items-center gap-3">
                  <h2 className="text-xl font-semibold text-slate-900">{t('orders.common.order_number', { id: order.id })}</h2>
                  <OrderStatusBadge status={order.summary_status} label={order.summary_status_label} />
                  <OrderStatusBadge status={order.status} compact />
                </div>
                <div className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-slate-500">
                  <span>{t('admin.orders_module.customer')}: {order.user?.name || t('admin.dashboard.recent_orders.no_customer')}</span>
                  <span>{t('orders.common.total')}: {formatCurrency(order.total, locale)}</span>
                  <span>{t('orders.common.date')}: {order.created_at}</span>
                  <span>{t('orders.module.summary.active_lines')}: {order.line_counts.active}</span>
                  <span>{t('orders.module.summary.affected_lines')}: {order.line_counts.affected}</span>
                </div>
                <div className="text-sm text-slate-500">
                  {t('admin.orders_module.general_reason')}: {order.cancellation_reason || t('admin.orders_module.no_general_notes')}
                </div>
              </div>

              <div className="w-full max-w-xl rounded-2xl border border-slate-200 bg-slate-50 p-4">
                <div className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">{t('admin.orders_module.actions_title')}</div>
                <div className="mb-3 grid gap-2 sm:grid-cols-3">
                  <input
                    type="text"
                    value={tracking[order.id]?.tracking_carrier || ''}
                    onChange={(event) => updateTrackingField(order.id, 'tracking_carrier', event.target.value)}
                    placeholder={t('admin.orders_module.tracking_carrier_placeholder')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                  <input
                    type="text"
                    value={tracking[order.id]?.tracking_number || ''}
                    onChange={(event) => updateTrackingField(order.id, 'tracking_number', event.target.value)}
                    placeholder={t('admin.orders_module.tracking_number_placeholder')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                  <input
                    type="url"
                    value={tracking[order.id]?.tracking_url || ''}
                    onChange={(event) => updateTrackingField(order.id, 'tracking_url', event.target.value)}
                    placeholder={t('admin.orders_module.tracking_url_placeholder')}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                </div>
                {order.tracking_url ? (
                  <div className="mb-3 text-xs text-slate-500">
                    {t('admin.orders_module.current_tracking')}: <a href={order.tracking_url} target="_blank" rel="noreferrer" className="font-medium text-sky-700 underline">{order.tracking_number || order.tracking_url}</a>
                  </div>
                ) : null}
                <div className="flex flex-wrap items-center gap-2">
                  <input
                    type="text"
                    name="reason"
                    placeholder={t('admin.orders_module.reason_placeholder')}
                    value={reason[order.id] || ''}
                    onChange={e => setReason({ ...reason, [order.id]: e.target.value })}
                    className="min-w-[220px] flex-1 rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700"
                  />
                  <button
                    type="button"
                    onClick={() => handleCancel(order)}
                    className="rounded-xl bg-rose-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-rose-400"
                  >
                    {t('admin.orders_module.cancel_eligible')}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchOrder(order.id, 'ship', tracking[order.id] || {})}
                    className="rounded-xl bg-sky-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-sky-400"
                  >
                    {t('admin.orders_module.ship_active')}
                  </button>
                  <button
                    type="button"
                    onClick={() => handleSaveTracking(order)}
                    className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                  >
                    {t('admin.orders_module.save_tracking')}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchOrder(order.id, 'deliver')}
                    className="rounded-xl bg-emerald-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-emerald-400"
                  >
                    {t('admin.orders_module.deliver_active')}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchOrder(order.id, 'approve-return', {}, prompt('approve_returns'))}
                    className="rounded-xl bg-violet-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-violet-400"
                  >
                    {t('admin.orders_module.approve_returns')}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchOrder(order.id, 'reject-return', { reason: reason[order.id] || '' }, prompt('reject_returns'))}
                    className="rounded-xl bg-amber-500 px-3 py-2 text-sm font-semibold text-white transition hover:bg-amber-400"
                  >
                    {t('admin.orders_module.reject_returns')}
                  </button>
                  <button
                    type="button"
                    onClick={() => patchOrder(order.id, 'refund', {}, prompt('process_refunds'))}
                    className="rounded-xl bg-slate-800 px-3 py-2 text-sm font-semibold text-white transition hover:bg-slate-700"
                  >
                    {t('admin.orders_module.process_refunds')}
                  </button>
                </div>
              </div>
            </div>

            <div className="mt-4 grid gap-3">
              {order.items.map(item => (
                <div key={item.id} className="rounded-2xl border border-slate-100 bg-slate-50/80 p-4">
                  <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
                    <div className="space-y-2">
                      <div className="flex flex-wrap items-center gap-3">
                        <div className="font-semibold text-slate-900">{item.name}</div>
                        <OrderStatusBadge status={item.status} label={item.status_label} compact />
                      </div>
                      <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-slate-500">
                        <span>{t('orders.common.quantity', { count: item.quantity })}</span>
                        <span>{t('orders.line.subtotal')}: {formatCurrency(item.subtotal, locale)}</span>
                        <span>{t('orders.line.refund_reference')}: {item.refund_reference_id || t('orders.common.not_available')}</span>
                      </div>
                      {item.cancellation_reason ? <div className="text-sm text-rose-700">{t('orders.line.cancellation_reason')}: {item.cancellation_reason}</div> : null}
                      {item.return_reason ? <div className="text-sm text-violet-700">{t('orders.line.return_reason')}: {item.return_reason}</div> : null}
                      {item.refund_error ? <div className="text-sm text-amber-700">{t('orders.line.notes')}: {item.refund_error}</div> : null}
                    </div>

                    <div className="flex flex-wrap items-center gap-2 xl:max-w-[360px] xl:justify-end">
                      <button
                        type="button"
                        onClick={() => patchOrderItem(order.id, item.id, 'cancel', { reason: reason[order.id] || '' }, prompt('cancel_line'))}
                        className="rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-semibold text-rose-700 transition hover:bg-rose-100"
                      >
                        {t('orders.actions.cancel_line')}
                      </button>
                      <button
                        type="button"
                        onClick={() => patchOrderItem(order.id, item.id, 'approve-return', {}, prompt('approve_item'))}
                        className="rounded-xl border border-violet-200 bg-violet-50 px-3 py-2 text-sm font-semibold text-violet-700 transition hover:bg-violet-100"
                      >
                        {t('admin.orders_module.approve_item')}
                      </button>
                      <button
                        type="button"
                        onClick={() => patchOrderItem(order.id, item.id, 'reject-return', { reason: reason[order.id] || '' }, prompt('reject_item'))}
                        className="rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-semibold text-amber-700 transition hover:bg-amber-100"
                      >
                        {t('admin.orders_module.reject_item')}
                      </button>
                      <button
                        type="button"
                        onClick={() => patchOrderItem(order.id, item.id, 'refund', {}, prompt('refund_item'))}
                        className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100"
                      >
                        {t('admin.orders_module.refund_item')}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}
