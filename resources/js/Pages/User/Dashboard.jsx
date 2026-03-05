import React, { useMemo, useState } from 'react';
import { Link, usePage, useForm } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import AvatarCreatorModal from '@/Components/avatar/AvatarCreatorModal.jsx';
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

const STATUS_LABELS = {
  pendiente_pago: 'Pendiente de pago',
  pagado: 'Pagado',
  pendiente_envio: 'Pendiente de envío',
  enviado: 'Enviado',
  entregado: 'Entregado',
  confirmado: 'Confirmado',
  cancelacion_pendiente: 'Cancelación en proceso',
  cancelado: 'Cancelado',
  devolucion_aprobada: 'Devolución aprobada',
  reembolsado: 'Reembolsado',
};

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

const MotionLink = motion(Link);

const Dashboard = () => {
  const { auth, cartItems = [], orders = [], ordersSummary = {} } = usePage().props;
  const user = auth.user;

  const [isAvatarModalOpen, setAvatarModalOpen] = useState(false);

  const { setData, patch } = useForm({
    avatar: user.avatar || '/default-avatar.png',
  });

  const cartCount = useMemo(
    () => cartItems.reduce((total, item) => total + (item.quantity || 0), 0),
    [cartItems]
  );

  const cartTotal = useMemo(
    () =>
      cartItems.reduce(
        (total, item) => total + (Number(item.price) || 0) * (item.quantity || 0),
        0
      ),
    [cartItems]
  );

  const summary = useMemo(
    () => ({
      total: ordersSummary.total ?? orders.length,
      inProgress:
        ordersSummary.inProgress ??
        orders.filter(({ status }) =>
          ['pendiente_pago', 'pagado', 'pendiente_envio'].includes(status)
        ).length,
      shipped:
        ordersSummary.shipped ??
        orders.filter(({ status }) =>
          ['enviado', 'entregado', 'confirmado'].includes(status)
        ).length,
      cancelled:
        ordersSummary.cancelled ??
        orders
          .filter(({ status }) => ['cancelacion_pendiente', 'cancelado', 'reembolsado'].includes(status))
          .length,
    }),
    [ordersSummary, orders]
  );

  const nextDelivery = useMemo(
    () => orders.find(({ status }) => ['enviado', 'entregado', 'confirmado'].includes(status)),
    [orders]
  );

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('es-MX', {
      style: 'currency',
      currency: 'MXN',
      minimumFractionDigits: 2,
    }).format(Number(amount) || 0);

  const handleAvatarChange = (avatarUrl) => {
    setData('avatar', avatarUrl);
    patch('/profile', {
      preserveScroll: true,
      onSuccess: () => setAvatarModalOpen(false),
    });
  };

  return (
    <div className="min-h-screen bg-slate-950/5">
      <Header />

      <main className="mx-auto max-w-7xl px-6 py-12 space-y-10">
        {/* Perfil y stats */}
        <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-sky-500 via-indigo-500 to-purple-500 text-white shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,white,transparent_55%)] opacity-20 mix-blend-soft-light" />
          <div className="relative flex flex-col gap-8 p-8 md:flex-row md:items-center md:justify-between">
            <div className="flex flex-1 items-start gap-6">
              <button
                type="button"
                onClick={() => setAvatarModalOpen(true)}
                className="group relative"
                title="Haz clic para cambiar tu avatar"
              >
                <img
                  src={user.avatar || '/default-avatar.png'}
                  alt="User avatar"
                  className="h-20 w-20 rounded-full border-4 border-white/50 object-cover shadow-lg transition group-hover:scale-105"
                />
                <span className="absolute bottom-0 right-0 inline-flex h-8 w-8 items-center justify-center rounded-full bg-white text-sky-600 shadow-lg">
                  <Pencil className="h-4 w-4" />
                </span>
              </button>

              <div className="space-y-4">
                <div>
                  <p className="text-sm uppercase tracking-wide text-white/70">Bienvenido de nuevo</p>
                  <h1 className="text-3xl font-semibold leading-tight">Hola, {user.name}</h1>
                  <p className="mt-2 text-sm text-white/80">
                    Gestiona tus pedidos, pagos y soporte desde tu panel principal.
                  </p>
                </div>

                <div className="flex flex-wrap items-center gap-3 text-sm text-white/80">
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1">
                    <ShoppingBag className="h-4 w-4" />
                    {summary.total} pedidos totales
                  </span>
                  <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1">
                    <ShoppingCart className="h-4 w-4" />
                    {cartCount} artículos en carrito
                  </span>
                  {user?.is_admin && (
                    <span className="inline-flex items-center gap-2 rounded-full border border-white/30 px-3 py-1">
                      <Shield className="h-4 w-4" />
                      Acceso administrador
                    </span>
                  )}
                </div>

                <div className="flex items-center gap-3 text-sm text-white/70">
                  <Clock className="h-4 w-4" />
                  {nextDelivery
                    ? `Pedido #${nextDelivery.id} ${STATUS_LABELS[nextDelivery.status] ?? nextDelivery.status}`
                    : 'Sin envíos activos por ahora.'}
                </div>
              </div>
            </div>

            <div className="grid flex-shrink-0 grid-cols-2 gap-4 md:w-72">
              <StatsCard
                icon={BarChart3}
                label="Pedidos totales"
                value={summary.total}
                hint={`${summary.cancelled} cancelados`}
              />
              <StatsCard
                icon={Truck}
                label="En camino"
                value={summary.shipped}
                hint="Incluye enviados y entregados"
              />
              <StatsCard
                icon={ShoppingCart}
                label="Carrito activo"
                value={cartCount}
                hint={`${formatCurrency(cartTotal)} estimado`}
              />
              <StatsCard
                icon={Shield}
                label="Pendientes"
                value={summary.inProgress}
                hint="Pedidos por completar"
              />
            </div>
          </div>
        </section>

        {/* Acciones rápidas y pedidos recientes */}
        <section className="grid gap-6 lg:grid-cols-12">
          <div className="space-y-6 lg:col-span-8">
            <Card title="Acciones rápidas" subtitle="Todo lo que necesitas en un par de clics.">
              <div className="grid gap-4 sm:grid-cols-2">
                {/* Acciones rápidas */}
                <QuickActionCard icon={ShoppingBag} label="Historial de pedidos" description="Consulta todos tus pedidos en un solo lugar." href="/orders" />
                <QuickActionCard icon={Truck} label="Seguimiento de envíos" description="Revisa pedidos enviados y próximos a llegar." href="/orders/shipped" />
                <QuickActionCard icon={CreditCard} label="Pagos realizados" description="Visualiza tus pagos confirmados y recientes." href="/orders/paid" />
                <QuickActionCard icon={Shield} label="Cancelaciones y reembolsos" description="Consulta pedidos cancelados o reembolsados." href="/orders/cancelled" />
                <QuickActionCard icon={ShoppingCart} label="Ir al checkout" description="Completa tu compra con los artículos actuales." href="/checkout" />
                <QuickActionCard icon={Settings} label="Preferencias de cuenta" description="Actualiza datos personales y direcciones." href="/profile" />
                <QuickActionCard icon={Search} label="Descubrir productos" description="Explora el catálogo con nuevas búsquedas." href="/search" />
                <QuickActionCard icon={Phone} label="Centro de ayuda" description="Contacta a soporte para resolver dudas." href="/contact" />
                {user?.is_admin && (
                  <QuickActionCard icon={Shield} label="Panel administrativo" description="Gestiona pedidos, productos y usuarios." href="/admin/dashboard" />
                )}
                {user?.is_admin && (
                  <QuickActionCard icon={PlusCircle} label="Agregar producto" description="Publica nuevos productos en la tienda." href="/products/add" />
                )}
              </div>
            </Card>

            <Card title="Tus pedidos recientes" subtitle="Revisa el estado y los detalles de tus últimos movimientos.">
              {orders.length > 0 ? (
                <div className="space-y-4">
                  {orders.map((order) => (
                    <OrderPreview key={order.id} order={order} formatCurrency={formatCurrency} />
                  ))}
                </div>
              ) : (
                <EmptyState
                  icon={ShoppingBag}
                  message="Todavía no tienes pedidos."
                  actionLabel="Comenzar a comprar"
                  actionHref="/search"
                />
              )}
            </Card>
          </div>

          {/* Carrito y soporte */}
          <aside className="space-y-6 lg:col-span-4">
            <Card title="Carrito de compras" subtitle="Revisa un resumen antes de finalizar.">
              <div className="flex items-start justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-700">{cartCount} artículos</p>
                  <p className="text-sm text-slate-500">
                    {cartItems.length > 0 ? 'Listo para completar tu compra.' : 'Tu carrito está vacío.'}
                  </p>
                </div>
                {cartItems.length > 0 && (
                  <Link
                    href="/checkout"
                    className="rounded-full border border-sky-200 px-3 py-1 text-sm font-medium text-sky-600 transition hover:border-sky-300 hover:text-sky-700"
                  >
                    Ir al checkout
                  </Link>
                )}
              </div>

              {cartItems.length > 0 ? (
                <div className="mt-6 space-y-4">
                  {cartItems.map((item) => (
                    <div
                      key={`${item.id ?? item.title}-${item.quantity}`}
                      className="flex items-center justify-between rounded-xl bg-slate-50 px-4 py-3"
                    >
                      <div>
                        <p className="text-sm font-semibold text-slate-800">
                          {item.title || item.name}
                        </p>
                        <p className="text-xs text-slate-500">Cantidad: {item.quantity}</p>
                      </div>
                      <p className="text-sm font-semibold text-slate-900">
                        {formatCurrency((Number(item.price) || 0) * (item.quantity || 0))}
                      </p>
                    </div>
                  ))}

                  <div className="flex items-center justify-between border-t border-slate-200 pt-4">
                    <p className="text-sm font-semibold text-slate-700">Total estimado</p>
                    <p className="text-lg font-semibold text-slate-900">{formatCurrency(cartTotal)}</p>
                  </div>
                </div>
              ) : (
                <EmptyState
                  icon={ShoppingCart}
                  message="Añade productos para verlos aquí."
                  actionLabel="Explorar catálogo"
                  actionHref="/search"
                />
              )}
            </Card>

            <Card title="¿Necesitas ayuda?" subtitle="Nuestro equipo está listo para apoyarte.">
              <div className="space-y-4 text-sm text-slate-600">
                <p>Resuelve dudas sobre pedidos, envíos o devoluciones con nuestro equipo de soporte.</p>
                <div className="flex items-center gap-3 rounded-2xl bg-slate-50 p-4">
                  <HelpCircle className="h-5 w-5 text-sky-600" />
                  <div>
                    <p className="font-semibold text-slate-800">Soporte prioritario</p>
                    <p className="text-xs text-slate-500">Respuesta máxima en 24h hábiles.</p>
                  </div>
                </div>
                <Link
                  href="/contact"
                  className="inline-flex items-center gap-2 text-sm font-medium text-sky-600 transition hover:text-sky-700"
                >
                  <Phone className="h-4 w-4" />
                  Contactar soporte
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

// -------------------------------
// Componentes auxiliares
// -------------------------------
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
    {hint && <p className="mt-1 text-xs text-white/70">{hint}</p>}
  </motion.div>
);

const QuickActionCard = ({ icon: Icon, label, description, href }) => (
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
      Ir ahora {'>'}
    </span>
  </MotionLink>
);

const OrderPreview = ({ order, formatCurrency }) => {
  const statusClass = STATUS_STYLES[order.status] ?? 'bg-slate-100 text-slate-600';
  const statusLabel = STATUS_LABELS[order.status] ?? order.status;
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
        {items.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2 text-xs text-slate-500">
            {items.slice(0, 3).map((item) => (
              <span key={`${item.id}-${item.name}`} className="rounded-full bg-slate-100 px-3 py-1">
                {item.name} x{item.quantity}
              </span>
            ))}
            {items.length > 3 && (
              <span className="text-slate-400">+{items.length - 3} mas</span>
            )}
          </div>
        )}
      </div>
      <div className="flex flex-col items-start gap-2 md:items-end">
        <div className="text-xs uppercase tracking-wide text-slate-400">Total</div>
        <div className="text-lg font-semibold text-slate-900">{formatCurrency(order.total)}</div>
        <Link
          href={`/orders/${order.id}`}
          className="text-sm font-medium text-sky-600 transition hover:text-sky-700"
        >
          Ver detalle
        </Link>
      </div>
    </motion.div>
  );
};

const Card = ({ title, subtitle, children }) => (
  <div className="rounded-3xl border border-slate-200 bg-white/95 p-6 shadow-lg shadow-slate-900/5">
    <div className="mb-6">
      <h2 className="text-lg font-semibold text-slate-900">{title}</h2>
      {subtitle && <p className="text-sm text-slate-500">{subtitle}</p>}
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
    {actionHref && (
      <Link href={actionHref} className="text-sm font-medium text-sky-600 transition hover:text-sky-700">
        {actionLabel}
      </Link>
    )}
  </div>
);

export default Dashboard;