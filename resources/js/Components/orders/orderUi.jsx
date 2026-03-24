import {
  AlertCircle,
  BadgeDollarSign,
  Ban,
  Box,
  Boxes,
  CircleDollarSign,
  Clock3,
  CreditCard,
  PackageCheck,
  Receipt,
  RotateCcw,
  Truck,
} from 'lucide-react';

export const ORDER_STATUS_META = {
  pendiente_pago: {
    label: 'Pendiente de pago',
    classes: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Clock3,
  },
  pagado: {
    label: 'Pagado',
    classes: 'border-emerald-200 bg-emerald-50 text-emerald-700',
    icon: CircleDollarSign,
  },
  pendiente_envio: {
    label: 'Pendiente de envio',
    classes: 'border-sky-200 bg-sky-50 text-sky-700',
    icon: Box,
  },
  enviado: {
    label: 'Enviado',
    classes: 'border-blue-200 bg-blue-50 text-blue-700',
    icon: Truck,
  },
  entregado: {
    label: 'Entregado',
    classes: 'border-cyan-200 bg-cyan-50 text-cyan-700',
    icon: PackageCheck,
  },
  confirmado: {
    label: 'Confirmado',
    classes: 'border-teal-200 bg-teal-50 text-teal-700',
    icon: PackageCheck,
  },
  cancelacion_pendiente: {
    label: 'Cancelacion en revision',
    classes: 'border-orange-200 bg-orange-50 text-orange-700',
    icon: AlertCircle,
  },
  cancelado: {
    label: 'Cancelado',
    classes: 'border-rose-200 bg-rose-50 text-rose-700',
    icon: Ban,
  },
  devolucion_solicitada: {
    label: 'Devolucion solicitada',
    classes: 'border-fuchsia-200 bg-fuchsia-50 text-fuchsia-700',
    icon: RotateCcw,
  },
  devolucion_aprobada: {
    label: 'Devolucion aprobada',
    classes: 'border-violet-200 bg-violet-50 text-violet-700',
    icon: BadgeDollarSign,
  },
  devolucion_rechazada: {
    label: 'Devolucion rechazada',
    classes: 'border-red-200 bg-red-50 text-red-700',
    icon: AlertCircle,
  },
  reembolsado: {
    label: 'Reembolsado',
    classes: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: Receipt,
  },
  parcialmente_cancelado: {
    label: 'Parcialmente cancelado',
    classes: 'border-amber-200 bg-amber-50 text-amber-700',
    icon: Boxes,
  },
  parcialmente_reembolsado: {
    label: 'Parcialmente reembolsado',
    classes: 'border-violet-200 bg-violet-50 text-violet-700',
    icon: Boxes,
  },
};

export const ORDER_FILTER_META = {
  all: {
    labelKey: 'orders.module.filters.all.label',
    shortLabelKey: 'orders.module.filters.all.short',
    icon: Boxes,
    descriptionKey: 'orders.module.filters.all.description',
  },
  paid: {
    labelKey: 'orders.module.filters.paid.label',
    shortLabelKey: 'orders.module.filters.paid.short',
    icon: CreditCard,
    descriptionKey: 'orders.module.filters.paid.description',
  },
  shipped: {
    labelKey: 'orders.module.filters.shipped.label',
    shortLabelKey: 'orders.module.filters.shipped.short',
    icon: Truck,
    descriptionKey: 'orders.module.filters.shipped.description',
  },
  cancelled: {
    labelKey: 'orders.module.filters.cancelled.label',
    shortLabelKey: 'orders.module.filters.cancelled.short',
    icon: Ban,
    descriptionKey: 'orders.module.filters.cancelled.description',
  },
};

const INTL_LOCALE = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
};

export function getOrderStatusMeta(status) {
  return ORDER_STATUS_META[status] || {
    label: status || 'Sin estado',
    classes: 'border-slate-200 bg-slate-100 text-slate-700',
    icon: Receipt,
  };
}

export function formatCurrency(amount, locale = 'es') {
  return new Intl.NumberFormat(INTL_LOCALE[locale] || INTL_LOCALE.es, {
    style: 'currency',
    currency: 'EUR',
    minimumFractionDigits: 2,
  }).format(Number(amount) || 0);
}