import React, { useMemo, useState } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import AvatarCreatorModal from '@/Components/avatar/AvatarCreatorModal.jsx';
import ProfileAvatar from '@/Components/avatar/ProfileAvatar.jsx';
import { useI18n } from '@/i18n';
import {
  ShoppingBag,
  Truck,
  CreditCard,
  Settings,
  ShoppingCart,
  PlusCircle,
  Phone,
  Search,
  Pencil,
  Shield,
  BarChart3,
  Clock,
  HelpCircle,
} from 'lucide-react';
import { motion } from 'framer-motion';

const STATUS_STYLES = {
  pendiente_pago: 'bg-amber-100 text-amber-700',
  pagado: 'bg-emerald-100 text-emerald-600',
  pendiente_envio: 'bg-sky-100 text-sky-600',
  enviado: 'bg-blue-100 text-blue-600',
  entregado: 'bg-emerald-100 text-emerald-600',
  confirmado: 'bg-emerald-100 text-emerald-600',
  cancelacion_pendiente: 'bg-amber-100 text-amber-700',
  cancelado: 'bg-rose-100 text-rose-600',
  devolucion_aprobada: 'bg-emerald-100 text-emerald-600',
  reembolsado: 'bg-purple-100 text-purple-600',
};

const INTL_LOCALE = {
  es: 'es-ES',
  en: 'en-US',
  fr: 'fr-FR',
};

const MotionLink = motion(Link);

const getStatusLabel = (t, status) => {
  const translated = t(`orders.status.${status}`);
  return translated === `orders.status.${status}` ? status : translated;
};

const Dashboard = () => {
  const { auth, cartItems = [], orders = [], ordersSummary = {} } = usePage().props;
  const { locale, t } = useI18n();
  const user = auth.user;

  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState(user.avatar || null);

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + (item.quantity || 0), 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () => cartItems.reduce((total, item) => total + (Number(item.price) || 0) * (item.quantity || 0), 0),
    [cartItems]
  );

  const summary = useMemo(
    () => ({
      total: ordersSummary.total ?? orders.length,
      inProgress:
        ordersSummary.inProgress ??
        orders.filter(({ status }) => ['pendiente_pago', 'pagado', 'pendiente_envio'].includes(status)).length,
      shipped:
        ordersSummary.shipped ??
        orders.filter(({ status }) => ['enviado', 'entregado', 'confirmado'].includes(status)).length,
      cancelled:
        ordersSummary.cancelled ??
        orders.filter(({ status }) => ['cancelacion_pendiente', 'cancelado', 'reembolsado'].includes(status)).length,
    }),
    [ordersSummary, orders]
  );

  const nextDelivery = useMemo(
    () => orders.find(({ status }) => ['enviado', 'entregado', 'confirmado'].includes(status)),
    [orders]
  );

  const quickActions = useMemo(() => {
    const actions = [
      {
        icon: ShoppingBag,
        label: t('dashboard.qa_orders_history_label'),
        description: t('dashboard.qa_orders_history_desc'),
        href: '/orders',
      },
      {
        icon: Truck,
        label: t('dashboard.qa_shipping_tracking_label'),
        description: t('dashboard.qa_shipping_tracking_desc'),
        href: '/orders/shipped',
      },
      {
        icon: CreditCard,
        label: t('dashboard.qa_paid_label'),
        description: t('dashboard.qa_paid_desc'),
        href: '/orders/paid',
      },
      {
        icon: Shield,
        label: t('dashboard.qa_cancellations_label'),
        description: t('dashboard.qa_cancellations_desc'),
        href: '/orders/cancelled',
      },
      {
        icon: ShoppingCart,
        label: t('dashboard.qa_checkout_label'),
        description: t('dashboard.qa_checkout_desc'),
        href: '/checkout',
      },
      {
        icon: Settings,
        label: t('dashboard.qa_preferences_label'),
        description: t('dashboard.qa_preferences_desc'),
        href: '/profile',
      },
      {
        icon: Search,
        label: t('dashboard.qa_discover_label'),
        description: t('dashboard.qa_discover_desc'),
        href: '/search',
      },
      {
        icon: Phone,
        label: t('dashboard.qa_help_center_label'),
        description: t('dashboard.qa_help_center_desc'),
        href: '/contact',
      },
    ];

    if (user?.is_admin) {
      actions.push(
        {
          icon: Shield,
          label: t('dashboard.qa_admin_panel_label'),
          description: t('dashboard.qa_admin_panel_desc'),
          href: '/admin/dashboard',
        },
        {
          icon: PlusCircle,
          label: t('dashboard.qa_add_product_label'),
          description: t('dashboard.qa_add_product_desc'),
          href: '/products/add',
        }
      );
    }

    return actions;
  }, [t, user?.is_admin]);

  const formatCurrency = (amount) =>
    new Intl.NumberFormat(INTL_LOCALE[locale] || INTL_LOCALE.es, {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0);

  const handleAvatarChange = (nextAvatarUrl) => {
    setAvatarUrl(nextAvatarUrl);
    setAvatarModalOpen(false);
  };

  return (
    <div className="min-h-screen bg-slate-950/5">
      <Head title={t('dashboard.title')} />
      <Header />

      <main className="mx-auto max-w-7xl space-y-10 px-6 py-12">
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,white,transparent_55%)] opacity-20 mix-blend-soft-light" />
          <div className="relative flex flex-col gap-8 p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-start gap-6">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="group relative"
                title={t('dashboard.avatar_change_title')}
              >
                <ProfileAvatar
                  user={user}
                  src={avatarUrl}
                  alt={t('dashboard.avatar_alt')}
                  className="h-20 w-20 rounded-full border-4 border-white/50 object-cover shadow-lg transition group-hover:scale-105"
                />
                <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sky-600 shadow-lg">
                  <Pencil className="h-4 w-4" />
                </span>
              </button>

              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/70">{t('dashboard.welcome_back')}</p>
                  <h1 className="text-3xl font-semibold leading-tight">{t('dashboard.greeting', { name: user.name })}</h1>
                  <p className="mt-2 text-sm text-white/80">{t('dashboard.intro')}</p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1">
                    <ShoppingBag className="h-4 w-4" />
                    {t('dashboard.total_orders', { count: summary.total })}
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1">
                    <ShoppingCart className="h-4 w-4" />
                    {t('dashboard.cart_items', { count: cartCount })}
                  </span>
                  {user?.is_admin ? (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1">
                      <Shield className="h-4 w-4" />
                      {t('dashboard.admin_access')}
                    </span>
                  ) : null}
                </div>

                <div className="flex items-center gap-3 text-sm text-white/70">
                  <Clock className="h-4 w-4" />
                  {nextDelivery
                    ? t('dashboard.next_delivery', {
                        id: nextDelivery.id,
                        status: getStatusLabel(t, nextDelivery.status),
                      })
                    : t('dashboard.no_active_shipments')}
                </div>
              </div>
            </div>

            <div className="grid flex-shrink-0 grid-cols-2 gap-4 md:w-72">
              <StatsCard
                icon={BarChart3}
                label={t('dashboard.stats_total_orders')}
                value={summary.total}
                hint={t('dashboard.stats_cancelled_hint', { count: summary.cancelled })}
              />
              <StatsCard
                icon={Truck}
                label={t('dashboard.stats_on_the_way')}
                value={summary.shipped}
                hint={t('dashboard.stats_on_the_way_hint')}
              />
              <StatsCard
                icon={ShoppingCart}
                label={t('dashboard.stats_active_cart')}
                value={cartCount}
                hint={t('dashboard.stats_estimated_hint', { amount: formatCurrency(cartTotal) })}
              />
              <StatsCard
                icon={Shield}
                label={t('dashboard.stats_pending')}
                value={summary.inProgress}
                hint={t('dashboard.stats_pending_hint')}
              />
            </div>
          </div>
        </section>

        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card title={t('dashboard.quick_actions_title')} subtitle={t('dashboard.quick_actions_subtitle')}>
              <div className="grid gap-4 sm:grid-cols-2">
                {quickActions.map((action) => (
                  <QuickActionCard key={action.href} {...action} ctaLabel={t('dashboard.go_now')} />
                ))}
              </div>
            </Card>

            <Card title={t('dashboard.recent_orders_title')} subtitle={t('dashboard.recent_orders_subtitle')}>
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderPreview
                      key={order.id}
                      order={order}
                      formatCurrency={formatCurrency}
                      statusLabel={getStatusLabel(t, order.status)}
                      moreItemsLabel={t('dashboard.more_items', { count: Math.max(order.items.length - 3, 0) })}
                      totalLabel={t('dashboard.order_total_label')}
                      viewDetailsLabel={t('dashboard.view_details')}
                    />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShoppingBag}
                  message={t('dashboard.no_orders_message')}
                  actionLabel={t('dashboard.no_orders_action')}
                  actionHref="/search"
                />
              )}
            </Card>
          </div>

          <aside className="space-y-6 lg:col-span-4">
            <Card title={t('dashboard.cart_title')} subtitle={t('dashboard.cart_subtitle')}>
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p className="text-sm font-medium text-slate-700">{t('dashboard.cart_count', { count: cartCount })}</p>
                  <p className="text-sm text-slate-500">
                    {cartItems.length > 0 ? t('dashboard.cart_ready') : t('dashboard.cart_empty')}
                  </p>
                </div>
                {cartItems.length > 0 ? (
                  <Link
                    href="/checkout"
                    className="rounded-full border border-sky-200 px-3 py-1 text-sm font-medium text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                  >
                    {t('dashboard.go_checkout')}
                  </Link>
                ) : null}
              </div>

              {cartItems.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.id ?? item.title}-${item.quantity}`}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">{item.title || item.name}</p>
                        <p className="text-xs text-slate-500">
                          {t('dashboard.quantity', { count: item.quantity })}
                        </p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency((Number(item.price) || 0) * (item.quantity || 0))}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-700">{t('dashboard.estimated_total')}</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(cartTotal)}</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={ShoppingCart}
                  message={t('dashboard.empty_cart_message')}
                  actionLabel={t('dashboard.empty_cart_action')}
                  actionHref="/search"
                />
              )}
            </Card>

            <Card title={t('dashboard.help_title')} subtitle={t('dashboard.help_subtitle')}>
              <div className="space-y-4 text-sm text-slate-600">
                <p>{t('dashboard.help_body')}</p>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <HelpCircle className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="font-semibold text-slate-800">{t('dashboard.priority_support')}</p>
                    <p className="text-xs text-slate-500">{t('dashboard.priority_support_desc')}</p>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 transition hover:text-sky-700"
                >
                  <Phone className="h-4 w-4" />
                  {t('dashboard.contact_support')}
                </Link>
              </div>
            </Card>
          </aside>
        </section>
      </main>

      <Footer />
      <AvatarCreatorModal
        isOpen={isAvatarModalOpen}
        onClose={() => setAvatarModalOpen(false)}
        onSelect={handleAvatarChange}
      />
    </div>
  );
};

const StatsCard = ({ icon: Icon, label, value, hint }) => (
  <motion.div
    whileHover={{ scale: 1.03 }}
    className="rounded-2xl border border-white/30 bg-white/15 p-4 text-left backdrop-blur"
  >
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-white/20 text-white">
      <Icon className="h-5 w-5" />
    </span>
    <p className="mt-3 text-xs uppercase tracking-wide text-white/70">{label}</p>
    <p className="text-2xl font-semibold text-white">{value}</p>
    {hint ? <p className="mt-1 text-xs text-white/70">{hint}</p> : null}
  </motion.div>
);

const QuickActionCard = ({ icon: Icon, label, description, href, ctaLabel }) => (
  <MotionLink
    whileHover={{ y: -4, scale: 1.01 }}
    href={href}
    className="group relative flex flex-col gap-3 rounded-2xl border border-slate-200 bg-white/90 p-5 text-left shadow-sm transition hover:border-sky-200 hover:shadow-lg"
  >
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-sky-100 text-sky-600 transition group-hover:bg-sky-600 group-hover:text-white">
      <Icon className="h-5 w-5" />
    </span>
    <div>
      <p className="text-base font-semibold text-slate-900">{label}</p>
      <p className="mt-1 text-sm text-slate-500">{description}</p>
    </div>
    <span className="mt-auto text-sm font-medium text-sky-600 transition group-hover:text-sky-700">
      {ctaLabel}
    </span>
  </MotionLink>
);

const OrderPreview = ({ order, formatCurrency, statusLabel, moreItemsLabel, totalLabel, viewDetailsLabel }) => {
  const statusClass = STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-600';
  const items = Array.isArray(order.items) ? order.items : [];

  return (
    <motion.div
      whileHover={{ scale: 1.01 }}
      className="flex flex-col gap-4 rounded-2xl border border-slate-200 bg-white/95 p-5 shadow-sm md:flex-row md:items-center md:justify-between"
    >
      <div className="flex-1">
        <div className="flex items-center gap-2">
          <span className={`inline-flex items-center rounded-full px-3 py-1 text-xs font-medium ${statusClass}`}>
            {statusLabel}
          </span>
          <span className="text-sm text-slate-400">#{order.id}</span>
        </div>
        <p className="mt-2 text-sm text-slate-500">{order.date}</p>
        {items.length > 0 ? (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {items.slice(0, 3).map((item) => (
              <span key={`${item.id}-${item.name}`} className="rounded-full bg-slate-100 px-3 py-1">
                {item.name} x{item.quantity}
              </span>
            ))}
            {items.length > 3 ? (
              <span className="text-slate-400">{moreItemsLabel}</span>
            ) : null}
          </div>
        ) : null}
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="text-xs uppercase tracking-wide text-slate-400">{totalLabel}</div>
        <div className="text-lg font-semibold text-slate-900">{formatCurrency(order.total)}</div>
        <Link href={`/orders/${order.id}`} className="text-sm font-medium text-sky-600 transition hover:text-sky-700">
          {viewDetailsLabel}
        </Link>
      </div>
    </motion.div>
  );
};

const Card = ({ title, subtitle, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5">
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle ? <p className="text-sm text-slate-500">{subtitle}</p> : null}
    </div>
    {children}
  </div>
);

const EmptyState = ({ icon: Icon, message, actionLabel, actionHref }) => (
  <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-slate-200 p-8 text-center">
    <span className="inline-flex h-10 w-10 items-center justify-center rounded-full bg-slate-100 text-slate-400">
      <Icon className="h-5 w-5" />
    </span>
    <p className="text-sm text-slate-500">{message}</p>
    {actionHref ? (
      <Link href={actionHref} className="text-sm font-medium text-sky-600 transition hover:text-sky-700">
        {actionLabel}
      </Link>
    ) : null}
  </div>
);

export default Dashboard;
