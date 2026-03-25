import React from 'react';
import { getOrderStatusMeta } from '@/Components/orders/orderUi.jsx';
import { useI18n } from '@/i18n';

const OrderStatusBadge = ({ status, label, compact = false }) => {
  const { t } = useI18n();
  const meta = getOrderStatusMeta(status);
  const Icon = meta.icon;
  const spacingClass = compact ? 'px-2.5 py-1' : 'px-3 py-1.5';
  const iconClass = compact ? 'h-3.5 w-3.5' : 'h-4 w-4';
  const translated = status ? t(`orders.status.${status}`) : '';
  const resolvedLabel = translated && translated !== `orders.status.${status}` ? translated : (label || meta.label);

  return (
    <span className={`inline-flex items-center gap-2 rounded-full border text-xs font-semibold ${spacingClass} ${meta.classes}`}>
      <Icon className={iconClass} />
      <span>{resolvedLabel}</span>
    </span>
  );
};

export default OrderStatusBadge;