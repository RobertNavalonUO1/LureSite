import React, { useMemo } from 'react';
import OrdersDashboardLayout from '@/Layouts/OrdersDashboardLayout.jsx';
import OrderListCard from '@/Components/orders/OrderListCard.jsx';
import { useI18n } from '@/i18n';

const OrdersIndex = ({ orders = [], filters = [], activeFilter = 'all' }) => {
  const { t } = useI18n();
  const heroStats = useMemo(() => {
    const aggregate = orders.reduce(
      (carry, order) => {
        carry.totalOrders += 1;
        carry.activeLines += order.line_counts.active;
        carry.affectedLines += order.line_counts.affected;
        carry.cancelledLines += order.line_counts.cancelled;
        return carry;
      },
      {
        totalOrders: 0,
        activeLines: 0,
        affectedLines: 0,
        cancelledLines: 0,
      }
    );

    return [
      { label: t('orders.module.stats.orders'), value: aggregate.totalOrders },
      { label: t('orders.module.stats.active_lines'), value: aggregate.activeLines },
      { label: t('orders.module.stats.affected_lines'), value: aggregate.affectedLines },
      { label: t('orders.module.stats.cancelled_lines'), value: aggregate.cancelledLines },
    ];
  }, [orders, t]);

  return (
    <OrdersDashboardLayout
      title={t('orders.module.title')}
      subtitle={t('orders.module.subtitle')}
      filters={filters}
      activeFilter={activeFilter}
      heroStats={heroStats}
    >
      {orders.length > 0 ? (
        <div className="space-y-4">
          {orders.map((order) => (
            <OrderListCard key={order.id} order={order} />
          ))}
        </div>
      ) : (
        <div className="rounded-[1.75rem] border border-dashed border-slate-300 bg-slate-50 p-10 text-center text-slate-500">
          {t('orders.module.empty_filtered')}
        </div>
      )}
    </OrdersDashboardLayout>
  );
};

export default OrdersIndex;
