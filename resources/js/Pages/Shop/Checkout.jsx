import React, { useEffect, useMemo, useState } from 'react';
import { useForm, usePage } from '@inertiajs/react';
import { loadStripe } from '@stripe/stripe-js';
import { Inertia } from '@inertiajs/inertia';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import AddressModal from '@/Components/checkout/AddressModal.jsx';

const stripePromise = loadStripe(import.meta.env.VITE_STRIPE_PUBLIC_KEY);

const formatAddress = (addr) => `${addr.street}, ${addr.city}, ${addr.province}, ${addr.zip_code}, ${addr.country}`;

const Checkout = () => {
  const {
    cartItems: initialCartItems = [],
    totals = { subtotal: 0, discount: 0, shipping: 0, total: 0 },
    coupon = { code: '', label: null, amount: 0 },
    shipping = {},
    shippingOptions = [],
    currency = 'USD',
    auth,
    addresses = [],
    defaultAddressId,
  } = usePage().props;

  const items = useMemo(() => (Array.isArray(initialCartItems) ? initialCartItems : Object.values(initialCartItems)), [initialCartItems]);
  const user = auth?.user ?? null;
  const isGuest = !user;

  const [isAddressModalOpen, setIsAddressModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState('create');
  const [selectedAddress, setSelectedAddress] = useState(null);
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [updatingItemId, setUpdatingItemId] = useState(null);

  const [selectedAddressId, setSelectedAddressId] = useState(
    user?.default_address_id || defaultAddressId || addresses[0]?.id || null,
  );

  useEffect(() => {
    const fallback = user?.default_address_id || defaultAddressId || addresses[0]?.id || null;
    if (!addresses.length) {
      setSelectedAddressId(null);
      return;
    }
    if (!selectedAddressId || !addresses.some((addr) => addr.id === selectedAddressId)) {
      setSelectedAddressId(fallback);
    }
  }, [addresses, defaultAddressId, user?.default_address_id]);

  const currentAddress = useMemo(
    () => addresses.find((addr) => addr.id === selectedAddressId) || null,
    [addresses, selectedAddressId],
  );

  const formatter = useMemo(
    () => new Intl.NumberFormat('es-ES', { style: 'currency', currency }),
    [currency],
  );

  const formatPrice = (value) => formatter.format(Number(value ?? 0));

  const couponForm = useForm({ code: coupon?.code || '' });
  useEffect(() => {
    couponForm.setData('code', coupon?.code || '');
  }, [coupon?.code]);

  const shippingForm = useForm({ method: shipping?.method || shippingOptions[0]?.value || 'standard' });
  useEffect(() => {
    shippingForm.setData('method', shipping?.method || shippingOptions[0]?.value || 'standard');
  }, [shipping?.method, shippingOptions]);

  const canCheckout = !isGuest && Boolean(selectedAddressId) && addresses.length > 0 && items.length > 0;

  const triggerCartMutation = (routeName, productId) => {
    if (!productId || updatingItemId) return;
    setUpdatingItemId(productId);

    Inertia.post(route(routeName, { productId }), {}, {
      preserveScroll: true,
      onSuccess: () => {
        Inertia.reload({
          only: ['cartItems', 'totals', 'coupon', 'shipping', 'shippingOptions'],
          preserveScroll: true,
        });
      },
      onFinish: () => {
        setUpdatingItemId(null);
      },
    });
  };

  const handleIncrementItem = (productId) => triggerCartMutation('cart.increment', productId);
  const handleDecrementItem = (productId) => triggerCartMutation('cart.decrement', productId);
  const handleRemoveItem = (productId) => triggerCartMutation('cart.remove', productId);

  const handleApplyCoupon = (event) => {
    event.preventDefault();
    couponForm.post(route('checkout.coupon'), {
      preserveScroll: true,
      onSuccess: () => {
        Inertia.reload({ only: ['totals', 'coupon', 'shipping', 'shippingOptions'], preserveScroll: true });
      },
    });
  };

  const handleRemoveCoupon = () => {
    couponForm.setData('code', '');
    couponForm.post(route('checkout.coupon'), {
      preserveScroll: true,
      onSuccess: () => {
        Inertia.reload({ only: ['totals', 'coupon', 'shipping', 'shippingOptions'], preserveScroll: true });
      },
    });
  };

  const handleShippingChange = (method) => {
    shippingForm.setData('method', method);
    shippingForm.post(route('checkout.shipping'), {
      preserveScroll: true,
      onSuccess: () => {
        Inertia.reload({ only: ['totals', 'shipping', 'shippingOptions'], preserveScroll: true });
      },
    });
  };

  const handleStripePayment = async () => {
    if (!canCheckout || paymentLoading) return;
    setPaymentLoading('stripe');

    try {
      const stripe = await stripePromise;
      const response = await fetch(route('checkout.stripe'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ address_id: selectedAddressId }),
      });

      const data = await response.json();
      if (data.sessionId) {
        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) {
          console.error(result.error.message);
        }
      } else {
        console.error('No se recibi� sessionId:', data.error);
      }
    } catch (error) {
      console.error('Error al iniciar el pago con Stripe:', error);
    } finally {
      setPaymentLoading(null);
    }
  };

  const handlePayPalPayment = async () => {
    if (!canCheckout || paymentLoading) return;
    setPaymentLoading('paypal');

    try {
      const response = await fetch(route('checkout.paypal'), {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
        },
        body: JSON.stringify({ address_id: selectedAddressId }),
      });

      const data = await response.json();
      if (data.approvalLink) {
        window.location.href = data.approvalLink;
      } else {
        console.error('No se recibi� approvalLink:', data.error);
      }
    } catch (error) {
      console.error('Error al iniciar el pago con PayPal:', error);
    } finally {
      setPaymentLoading(null);
    }
  };

  const openCreateAddress = () => {
    setModalMode('create');
    setSelectedAddress(null);
    setIsAddressModalOpen(true);
  };

  const openEditAddress = (address) => {
    setModalMode('edit');
    setSelectedAddress({ ...address, make_default: address.id === (user?.default_address_id || defaultAddressId) });
    setIsAddressModalOpen(true);
  };

  const handleAddressSaved = () => {
    setIsAddressModalOpen(false);
    setSelectedAddress(null);
    setModalMode('create');
    Inertia.reload({
      only: ['addresses', 'defaultAddressId', 'shipping', 'shippingOptions', 'totals'],
      preserveScroll: true,
    });
  };

  const shippingMethod = shipping?.method;
  const discountApplied = Number(totals.discount ?? 0) > 0;

  return (
    <div className="bg-slate-50 min-h-screen text-slate-900">
      <Header />

      <main className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-10 space-y-8">
        <header className="space-y-2">
          <p className="text-sm font-semibold text-indigo-600 uppercase tracking-wider">Proceso de compra</p>
          <h1 className="text-3xl sm:text-4xl font-bold text-slate-900">Checkout</h1>
          <p className="text-slate-500 max-w-2xl">Revisa tu pedido, confirma tus datos y selecciona la mejor opci�n de env�o antes de completar el pago.</p>
        </header>

        <div className="grid gap-6 lg:grid-cols-3">
          <section className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-3xl border border-slate-100 shadow-xl overflow-hidden">
              <div className="px-6 py-5 bg-gradient-to-r from-indigo-600 to-sky-500 text-white">
                <h2 className="text-xl font-semibold">Resumen del pedido</h2>
                <p className="text-sm text-indigo-100">Incluye tus art�culos, datos de contacto, direcci�n y beneficios de env�o.</p>
              </div>

              <div className="divide-y divide-slate-100">
                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Art�culos ({items.length})</h3>
                  {items.length === 0 ? (
                    <p className="text-sm text-slate-500">Tu carrito est� vac�o. Agrega productos para continuar.</p>
                  ) : (
                    <ul className="space-y-4">
                      {items.map((item) => {
                        const price = Number(item.price) || 0;
                        const lineTotal = price * (item.quantity || 0);
                        const isUpdating = updatingItemId === item.id;

                        return (
                          <li key={`${item.id}-${item.title}`} className="flex items-start gap-4">
                            <img
                              src={item.image_url || 'https://via.placeholder.com/80x80.png?text=Producto'}
                              alt={item.title}
                              className="h-16 w-16 rounded-xl object-cover border border-slate-100"
                            />
                            <div className="flex-1 space-y-3">
                              <div className="flex items-start justify-between gap-4">
                                <div className="space-y-1">
                                  <p className="font-semibold text-slate-800">{item.title}</p>
                                  {item.variant && (
                                    <p className="text-xs text-slate-500">Variante: {item.variant}</p>
                                  )}
                                  <p className="text-xs text-slate-500">
                                    {item.quantity} x {formatPrice(price)} cada uno
                                  </p>
                                </div>
                                <span className="font-semibold text-slate-900">{formatPrice(lineTotal)}</span>
                              </div>
                              <div className="flex flex-wrap items-center justify-between gap-3">
                                <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                                  <button
                                    type="button"
                                    onClick={() => handleDecrementItem(item.id)}
                                    disabled={isUpdating}
                                    aria-label={`Reducir cantidad de ${item.title}`}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    &minus;
                                  </button>
                                  <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-700">
                                    {item.quantity}
                                  </span>
                                  <button
                                    type="button"
                                    onClick={() => handleIncrementItem(item.id)}
                                    disabled={isUpdating}
                                    aria-label={`Incrementar cantidad de ${item.title}`}
                                    className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    +
                                  </button>
                                </div>
                                <button
                                  type="button"
                                  onClick={() => handleRemoveItem(item.id)}
                                  disabled={isUpdating}
                                  className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                >
                                  Eliminar
                                </button>
                              </div>
                            </div>
                          </li>
                        );
                      })}
                    </ul>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Datos del usuario</h3>
                  {isGuest ? (
                    <div className="rounded-2xl border border-amber-200 bg-amber-50 text-amber-700 p-4">
                      <p className="text-sm">Debes iniciar sesi�n para completar el proceso de compra.</p>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 space-y-1 text-sm text-slate-700">
                      <p><span className="font-semibold text-slate-900">Nombre:</span> {user.name} {user.lastname}</p>
                      <p><span className="font-semibold text-slate-900">Email:</span> {user.email}</p>
                      <p><span className="font-semibold text-slate-900">Tel�fono:</span> {user.phone || 'No disponible'}</p>
                    </div>
                  )}
                </div>

                <div className="p-6 space-y-4">
                  <h3 className="text-lg font-semibold text-slate-800">Direcci�n de env�o</h3>
                  {isGuest ? (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                      <p>Inicia sesi�n o crea una cuenta para gestionar tus direcciones.</p>
                    </div>
                  ) : addresses.length > 0 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <select
                          value={selectedAddressId ?? ''}
                          onChange={(event) => setSelectedAddressId(Number(event.target.value))}
                          className="w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                        >
                          {addresses.map((addr) => (
                            <option key={addr.id} value={addr.id}>
                              {formatAddress(addr)}
                            </option>
                          ))}
                        </select>
                        <p className="text-xs text-slate-500">
                          <span className="font-semibold text-slate-600">Seleccionada:</span>{' '}
                          {currentAddress ? formatAddress(currentAddress) : 'Ninguna'}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        {currentAddress && (
                          <button
                            type="button"
                            onClick={() => openEditAddress(currentAddress)}
                            className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-xs font-medium text-slate-700 hover:bg-slate-100"
                          >
                            Editar direcci�n seleccionada
                          </button>
                        )}
                        <button
                          type="button"
                          onClick={openCreateAddress}
                          className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                        >
                          A�adir nueva direcci�n
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600 space-y-3">
                      <p>No tienes direcciones guardadas.</p>
                      <button
                        type="button"
                        onClick={openCreateAddress}
                        className="inline-flex items-center rounded-full bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700"
                      >
                        A�adir direcci�n
                      </button>
                    </div>
                  )}
                </div>

                <div className="p-6 bg-slate-50 space-y-3">
                  <h3 className="text-lg font-semibold text-slate-800">Beneficios de tu compra</h3>
                  <ul className="grid gap-3 sm:grid-cols-2 text-sm text-slate-600">
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-indigo-600">??</span>
                      <span>Entrega fiable con seguimiento en todas las modalidades disponibles.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-indigo-600">??</span>
                      <span>Pagos seguros con protecci�n contra fraudes y encriptaci�n avanzada.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-indigo-600">??</span>
                      <span>Soporte 24/7 para resolver dudas y gestionar incidencias.</span>
                    </li>
                    <li className="flex items-start gap-3">
                      <span className="mt-0.5 text-indigo-600">??</span>
                      <span>M�ltiples m�todos de pago, incluidos Stripe y PayPal.</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </section>

          <aside className="lg:col-span-1">
            <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-sticky-height,0px)+var(--topnav-sticky-height,0px)+1.5rem)]">
              <div className="bg-white rounded-3xl border border-slate-100 shadow-xl p-6 space-y-6">
                <div className="space-y-3">
                  <div className="flex items-center justify-between text-sm text-slate-600">
                    <span>Subtotal</span>
                    <span className="font-medium text-slate-800">{formatPrice(totals.subtotal)}</span>
                  </div>
                  {discountApplied && (
                    <div className="flex items-center justify-between text-sm text-emerald-600">
                      <span>{coupon?.label || 'Cup�n aplicado'}</span>
                      <div className="flex items-center gap-2">
                        <span>-{formatPrice(totals.discount)}</span>
                        <button
                          type="button"
                          onClick={handleRemoveCoupon}
                          className="text-xs font-semibold text-emerald-700 hover:underline"
                        >
                          Quitar
                        </button>
                      </div>
                    </div>
                  )}
                  <div className="flex items-start justify-between text-sm text-slate-600">
                    <span>
                      Env�o
                      <span className="block text-xs text-slate-400">
                        {shipping?.label || 'Selecciona un m�todo'} � {shipping?.eta || ''}
                      </span>
                    </span>
                    <span className="font-medium text-slate-800">{formatPrice(totals.shipping)}</span>
                  </div>
                  <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                    <span>Total estimado</span>
                    <span>{formatPrice(totals.total)}</span>
                  </div>
                  <p className="text-xs text-slate-400">Incluye impuestos aplicables. Los cargos finales reflejar�n el m�todo de env�o seleccionado.</p>
                </div>

                <form onSubmit={handleApplyCoupon} className="space-y-2">
                  <label htmlFor="coupon" className="text-sm font-semibold text-slate-800">�Tienes un cup�n?</label>
                  <div className="flex gap-2">
                    <input
                      id="coupon"
                      name="code"
                      value={couponForm.data.code}
                      onChange={(event) => couponForm.setData('code', event.target.value.toUpperCase())}
                      placeholder="Ingrese c�digo"
                      className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700 uppercase tracking-wide focus:border-indigo-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/40"
                    />
                    <button
                      type="submit"
                      disabled={couponForm.processing}
                      className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                    >
                      {couponForm.processing ? 'Aplicando�' : 'Aplicar'}
                    </button>
                  </div>
                  {couponForm.errors.code && (
                    <p className="text-xs text-rose-600">{couponForm.errors.code}</p>
                  )}
                </form>

                <div className="space-y-3">
                  <p className="text-sm font-semibold text-slate-800">M�todo de env�o</p>
                  <div className="space-y-3">
                    {shippingOptions.map((option) => {
                      const isActive = option.value === shippingMethod;
                      return (
                        <button
                          key={option.value}
                          type="button"
                          onClick={() => handleShippingChange(option.value)}
                          disabled={shippingForm.processing}
                          className={`w-full text-left rounded-2xl border px-4 py-3 transition ${isActive ? 'border-indigo-500 bg-indigo-50 ring-2 ring-indigo-500/40' : 'border-slate-200 bg-white hover:border-indigo-200 hover:bg-indigo-50/40'}`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <p className="text-sm font-semibold text-slate-800">
                                {option.label}
                                {option.badge && (
                                  <span className="ml-2 inline-flex items-center rounded-full bg-indigo-100 px-2 py-0.5 text-xs font-medium text-indigo-700">{option.badge}</span>
                                )}
                              </p>
                              <p className="text-xs text-slate-500">{option.description} � {option.eta}</p>
                            </div>
                            <span className="text-sm font-semibold text-slate-800">{formatPrice(option.cost)}</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {shippingForm.errors.method && (
                    <p className="text-xs text-rose-600">{shippingForm.errors.method}</p>
                  )}
                </div>

                <div className="space-y-3">
                  <button
                    type="button"
                    onClick={handleStripePayment}
                    disabled={!canCheckout || paymentLoading === 'stripe'}
                    className="w-full rounded-2xl bg-indigo-600 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-indigo-500/30 hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentLoading === 'stripe' ? 'Redirigiendo a Stripe�' : 'Pagar con tarjeta (Stripe)'}
                  </button>
                  <button
                    type="button"
                    onClick={handlePayPalPayment}
                    disabled={!canCheckout || paymentLoading === 'paypal'}
                    className="w-full rounded-2xl bg-[#ffc439] px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-amber-400/40 hover:bg-[#ffb400] disabled:cursor-not-allowed disabled:opacity-60"
                  >
                    {paymentLoading === 'paypal' ? 'Redirigiendo a PayPal�' : 'Pagar con PayPal'}
                  </button>
                  {!canCheckout && (
                    <p className="text-xs text-slate-500">Necesitas una direcci�n v�lida para continuar con el pago.</p>
                  )}
                </div>

                <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                  <p className="font-semibold text-slate-700">Seguridad y privacidad</p>
                  <ul className="space-y-1">
                    <li>? Datos cifrados y verificaci�n en dos pasos.</li>
                    <li>? Protecci�n al comprador y reembolsos garantizados.</li>
                    <li>? Operaciones auditadas por proveedores externos.</li>
                  </ul>
                </div>
              </div>
            </div>
          </aside>
        </div>
      </main>

      <Footer />

      {isAddressModalOpen && (
        <AddressModal
          closeModal={() => setIsAddressModalOpen(false)}
          onAddressSaved={handleAddressSaved}
          mode={modalMode}
          initialValues={selectedAddress}
        />
      )}
    </div>
  );
};

export default Checkout;
