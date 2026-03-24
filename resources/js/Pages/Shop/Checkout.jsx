import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { loadStripe } from '@stripe/stripe-js';
import { CheckCircle2, CreditCard, MapPin, PackageCheck, ShieldCheck, Truck } from 'lucide-react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import AddressCard from '@/Pages/Profile/components/AddressCard.jsx';
import AddressFormModal from '@/Pages/Profile/components/AddressFormModal.jsx';
import ConfirmActionModal from '@/Pages/Profile/components/ConfirmActionModal.jsx';
import ProfileToastRegion from '@/Pages/Profile/components/ProfileToastRegion.jsx';
import { useAddressBook } from '@/Pages/Profile/hooks/useAddressBook.js';
import { useToastStack } from '@/hooks/useToastStack.js';
import { decrementCartItem, incrementCartItem, normaliseCartItems, removeCartItem } from '@/utils/cartClient';

const formatAddress = (addr) => `${addr.street}, ${addr.city}, ${addr.province}, ${addr.zip_code}, ${addr.country}`;
const toNumber = (value) => Number(value ?? 0);

const Checkout = () => {
  const {
    cartItems: initialCartItems = [],
    totals = { subtotal: 0, discount: 0, shipping: 0, total: 0 },
    coupon = { code: '', label: null, amount: 0 },
    shipping = {},
    shippingOptions = [],
    currency = 'EUR',
    auth,
    addresses = [],
    defaultAddressId,
    flash,
  } = usePage().props;

  const { toasts, addToast, dismissToast } = useToastStack();
  const user = auth?.user ?? null;
  const isGuest = !user;
  const initialSelectedAddressId = user?.default_address_id || defaultAddressId || addresses[0]?.id || null;

  const [checkoutState, setCheckoutState] = useState(() => ({
    totals,
    coupon,
    shipping,
    shippingOptions,
  }));
  const [items, setItems] = useState(() => normaliseCartItems(initialCartItems));
  const [paymentLoading, setPaymentLoading] = useState(null);
  const [shippingUpdating, setShippingUpdating] = useState(false);
  const [updatingItemId, setUpdatingItemId] = useState(null);
  const [selectedAddressId, setSelectedAddressId] = useState(initialSelectedAddressId);
  const [addressModalState, setAddressModalState] = useState({ open: false, mode: 'create', address: null });
  const [addressToDelete, setAddressToDelete] = useState(null);
  const [activeShippingMethod, setActiveShippingMethod] = useState(shipping?.method || shippingOptions[0]?.value || 'standard');

  const checkoutTotals = checkoutState.totals ?? { subtotal: 0, discount: 0, shipping: 0, total: 0 };
  const checkoutCoupon = checkoutState.coupon ?? { code: '', label: null, amount: 0 };
  const checkoutShipping = checkoutState.shipping ?? {};
  const checkoutShippingOptions = checkoutState.shippingOptions ?? [];

  const addressBook = useAddressBook({
    initialAddresses: addresses,
    initialDefaultAddressId: user?.default_address_id || defaultAddressId,
    onToast: addToast,
  });

  useEffect(() => {
    setItems(normaliseCartItems(initialCartItems));
  }, [initialCartItems]);

  useEffect(() => {
    setCheckoutState({
      totals,
      coupon,
      shipping,
      shippingOptions,
    });
  }, [coupon, shipping, shippingOptions, totals]);

  useEffect(() => {
    if (flash?.success) {
      addToast({ type: 'success', title: 'Operacion completada', message: flash.success });
    }

    if (flash?.error) {
      addToast({ type: 'error', title: 'No se pudo completar', message: flash.error });
    }
  }, [flash?.error, flash?.success, addToast]);

  useEffect(() => {
    const nextAddresses = addressBook.addresses;
    const fallback = addressBook.defaultAddressId || nextAddresses[0]?.id || null;

    if (!nextAddresses.length) {
      setSelectedAddressId(null);
      return;
    }

    if (!selectedAddressId || !nextAddresses.some((addr) => Number(addr.id) === Number(selectedAddressId))) {
      setSelectedAddressId(fallback);
    }
  }, [addressBook.addresses, addressBook.defaultAddressId, selectedAddressId]);

  useEffect(() => {
    setActiveShippingMethod(checkoutShipping?.method || checkoutShippingOptions[0]?.value || 'standard');
  }, [checkoutShipping?.method, checkoutShippingOptions]);

  const currentAddress = useMemo(
    () => addressBook.addresses.find((addr) => Number(addr.id) === Number(selectedAddressId)) || null,
    [addressBook.addresses, selectedAddressId],
  );

  const activeShippingOption = useMemo(
    () => checkoutShippingOptions.find((option) => option.value === activeShippingMethod) || checkoutShippingOptions[0] || null,
    [activeShippingMethod, checkoutShippingOptions],
  );

  const pricing = useMemo(() => {
    const subtotal = toNumber(checkoutTotals.subtotal);
    const discount = toNumber(checkoutTotals.discount);
    const shippingCost = activeShippingOption ? toNumber(activeShippingOption.cost) : toNumber(checkoutTotals.shipping ?? checkoutShipping?.cost);
    const total = Math.max(0, subtotal - discount + shippingCost);

    return {
      subtotal,
      discount,
      shipping: shippingCost,
      total,
    };
  }, [activeShippingOption, checkoutShipping?.cost, checkoutTotals.discount, checkoutTotals.shipping, checkoutTotals.subtotal]);

  const selectedShippingLabel = activeShippingOption?.label || checkoutShipping?.label || 'Selecciona un metodo';
  const selectedShippingEta = activeShippingOption?.eta || checkoutShipping?.eta || '';

  const formatter = useMemo(
    () => new Intl.NumberFormat('es-ES', { style: 'currency', currency }),
    [currency],
  );

  const formatPrice = (value) => formatter.format(Number(value ?? 0));

  const couponForm = useForm({ code: checkoutCoupon?.code || '' });
  useEffect(() => {
    couponForm.setData('code', checkoutCoupon?.code || '');
  }, [checkoutCoupon?.code]);

  const shippingForm = useForm({ method: checkoutShipping?.method || checkoutShippingOptions[0]?.value || 'standard' });
  useEffect(() => {
    shippingForm.setData('method', checkoutShipping?.method || checkoutShippingOptions[0]?.value || 'standard');
  }, [checkoutShipping?.method, checkoutShippingOptions]);

  const canCheckout = !isGuest && Boolean(selectedAddressId) && addressBook.addresses.length > 0 && items.length > 0;
  const discountApplied = pricing.discount > 0;

  const syncCheckoutSnapshot = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  const triggerCartMutation = async (mutation, productId) => {
    if (!productId || updatingItemId) return;

    setUpdatingItemId(productId);

    try {
      const payload = await mutation(productId);
      setItems(normaliseCartItems(payload.cartItems));
      syncCheckoutSnapshot();
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Carrito no actualizado',
        message: 'No se pudo actualizar la cantidad del producto. Intentalo de nuevo.',
      });
    } finally {
      setUpdatingItemId(null);
    }
  };

  const handleIncrementItem = (productId) => triggerCartMutation(incrementCartItem, productId);
  const handleDecrementItem = (productId) => triggerCartMutation(decrementCartItem, productId);
  const handleRemoveItem = (productId) => triggerCartMutation(removeCartItem, productId);

  const handleApplyCoupon = (event) => {
    event.preventDefault();
    couponForm.post(route('checkout.coupon'), {
      preserveScroll: true,
      preserveState: true,
      only: ['totals', 'coupon', 'shipping', 'shippingOptions'],
      onSuccess: () => {
        addToast({ type: 'success', title: 'Cupon aplicado', message: 'El resumen del pedido se ha actualizado.' });
      },
    });
  };

  const handleRemoveCoupon = () => {
    couponForm.setData('code', '');
    couponForm.post(route('checkout.coupon'), {
      preserveScroll: true,
      preserveState: true,
      only: ['totals', 'coupon', 'shipping', 'shippingOptions'],
      onSuccess: () => {
        addToast({ type: 'info', title: 'Cupon eliminado', message: 'Se recalculo el total del pedido.' });
      },
    });
  };

  const handleShippingChange = (method) => {
    const previousMethod = activeShippingMethod;

    if (method === activeShippingMethod || shippingUpdating) {
      return;
    }

    shippingForm.clearErrors();
    shippingForm.setData('method', method);
    setActiveShippingMethod(method);

    const updateShipping = async () => {
      setShippingUpdating(true);

      try {
        const response = await fetch(route('checkout.shipping'), {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            Accept: 'application/json',
            'X-Requested-With': 'XMLHttpRequest',
            'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]').content,
          },
          body: JSON.stringify({ method }),
        });

        const payload = await response.json();

        if (!response.ok) {
          throw new Error(payload?.errors?.method?.[0] || payload?.message || 'No se pudo actualizar el envio.');
        }

        setCheckoutState((current) => ({
          ...current,
          totals: payload.totals,
          shipping: payload.shipping,
          shippingOptions: payload.shippingOptions,
        }));
        setActiveShippingMethod(payload.shipping?.method || method);
        addToast({ type: 'success', title: 'Envio actualizado', message: payload.message || 'La seleccion se guardo correctamente.' });
      } catch (error) {
        shippingForm.setError('method', error.message);
        setActiveShippingMethod(previousMethod);
      } finally {
        setShippingUpdating(false);
      }
    };

    updateShipping();
  };

  const handleStripePayment = async () => {
    if (!canCheckout || paymentLoading) return;
    setPaymentLoading('stripe');

    try {
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
        const stripe = await loadStripe(data.stripePublicKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY);
        if (!stripe) {
          throw new Error('No se pudo inicializar Stripe.');
        }

        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) {
          throw new Error(result.error.message || 'Stripe no pudo continuar con el pago.');
        }
      } else {
        throw new Error(data.error || 'No se recibio la sesion de Stripe.');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al iniciar Stripe',
        message: error.message || 'No se pudo abrir la pasarela de pago.',
      });
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
        throw new Error(data.error || 'No se recibio el enlace de aprobacion de PayPal.');
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: 'Error al iniciar PayPal',
        message: error.message || 'No se pudo redirigir a PayPal.',
      });
    } finally {
      setPaymentLoading(null);
    }
  };

  const openCreateAddress = () => {
    setAddressModalState({ open: true, mode: 'create', address: null });
  };

  const openEditAddress = (address) => {
    setAddressModalState({ open: true, mode: 'edit', address });
  };

  const closeAddressModal = () => {
    setAddressModalState({ open: false, mode: 'create', address: null });
  };

  const handleAddressSubmit = async (payload) => {
    const address = addressModalState.mode === 'edit' && addressModalState.address
      ? await addressBook.updateAddress(addressModalState.address.id, payload)
      : await addressBook.createAddress(payload);

    if (address?.id) {
      setSelectedAddressId(address.id);
    }

    closeAddressModal();
  };

  const handleDeleteAddress = async () => {
    if (!addressToDelete) return;

    const deletedId = addressToDelete.id;
    await addressBook.deleteAddress(deletedId);
    setAddressToDelete(null);

    if (Number(selectedAddressId) === Number(deletedId)) {
      setSelectedAddressId(null);
    }
  };

  return (
    <>
      <Head title="Checkout" />

      <div className="min-h-screen bg-[radial-gradient(circle_at_top_left,_rgba(56,189,248,0.10),_transparent_28%),linear-gradient(180deg,_#f8fafc_0%,_#eef2ff_34%,_#f8fafc_100%)] text-slate-900">
        <ProfileToastRegion toasts={toasts} onDismiss={dismissToast} />
        <Header />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 py-8 sm:px-6 lg:px-8 lg:py-10">
          <header className="overflow-hidden rounded-[32px] border border-white/70 bg-[linear-gradient(135deg,_rgba(15,23,42,0.96),_rgba(30,41,59,0.92)_48%,_rgba(2,132,199,0.78)_100%)] px-6 py-7 text-white shadow-[0_30px_90px_-50px_rgba(2,6,23,0.75)] sm:px-8 sm:py-9">
            <div className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(280px,0.8fr)] lg:items-end">
              <div className="space-y-3">
                <p className="text-xs font-semibold uppercase tracking-[0.28em] text-sky-200">Checkout profesional</p>
                <h1 className="max-w-3xl text-3xl font-semibold tracking-tight sm:text-4xl">Confirma tu pedido con una direccion consistente y un total que responde al instante.</h1>
                <p className="max-w-2xl text-sm leading-6 text-slate-200 sm:text-base">
                  Todo el flujo queda sincronizado: direccion, cupon, metodo de envio y total estimado antes de redirigir a Stripe o PayPal.
                </p>
              </div>

              <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                <SummaryPill icon={PackageCheck} label="Articulos" value={String(items.length).padStart(2, '0')} />
                <SummaryPill icon={Truck} label="Envio activo" value={selectedShippingLabel} />
                <SummaryPill icon={CreditCard} label="Total" value={formatPrice(pricing.total)} />
              </div>
            </div>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px]">
            <section className="space-y-6">
              <div className="overflow-hidden rounded-[28px] border border-white/60 bg-white/90 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
                <div className="bg-[linear-gradient(135deg,_#0f172a,_#1e293b_46%,_#0369a1)] px-6 py-5 text-white">
                  <h2 className="text-xl font-semibold tracking-tight">Resumen operativo del pedido</h2>
                  <p className="mt-1 text-sm text-slate-200">Carrito, contacto, direccion y garantias en una sola vista antes del pago.</p>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">Articulos del pedido</h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {items.length} linea(s)
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        Tu carrito esta vacio. Agrega productos antes de continuar con el pago.
                      </div>
                    ) : (
                      <ul className="space-y-4">
                        {items.map((item) => {
                          const price = Number(item.price) || 0;
                          const lineTotal = price * (item.quantity || 0);
                          const isUpdating = updatingItemId === item.id;

                          return (
                            <li key={`${item.id}-${item.title}`} className="flex items-start gap-4 rounded-[24px] border border-slate-100 bg-slate-50/80 p-4">
                              <img
                                src={item.image_url || 'https://via.placeholder.com/80x80.png?text=Producto'}
                                alt={item.title}
                                className="h-16 w-16 rounded-2xl border border-slate-200 bg-white object-cover"
                              />
                              <div className="flex-1 space-y-3">
                                <div className="flex items-start justify-between gap-4">
                                  <div className="space-y-1">
                                    <p className="font-semibold text-slate-800">{item.title}</p>
                                    {item.variant ? <p className="text-xs text-slate-500">Variante: {item.variant}</p> : null}
                                    <p className="text-xs text-slate-500">{item.quantity} x {formatPrice(price)} cada uno</p>
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
                                    <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
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
                    <h3 className="text-lg font-semibold text-slate-900">Datos del usuario</h3>
                    {isGuest ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        Debes iniciar sesion para completar el proceso de compra.
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-3">
                        <InfoCard label="Cliente" value={`${user.name} ${user.lastname || ''}`.trim() || 'Sin nombre'} />
                        <InfoCard label="Email" value={user.email} />
                        <InfoCard label="Telefono" value={user.phone || 'No disponible'} />
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">Direccion de envio</h3>
                        <p className="mt-1 text-sm text-slate-500">Misma experiencia que en el perfil: editar, marcar por defecto, borrar y anadir nuevas direcciones.</p>
                      </div>

                      {!isGuest ? (
                        <button
                          type="button"
                          onClick={openCreateAddress}
                          className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Anadir nueva direccion
                        </button>
                      ) : null}
                    </div>

                    {isGuest ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        Inicia sesion o crea una cuenta para gestionar tus direcciones y completar el checkout.
                      </div>
                    ) : currentAddress ? (
                      <div className="rounded-[24px] border border-sky-200 bg-sky-50/80 p-5">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-white p-3 text-sky-700 shadow-sm ring-1 ring-sky-100">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-sky-700">Direccion activa para este pedido</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">{currentAddress.street}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{formatAddress(currentAddress)}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {addressBook.addresses.length > 0 ? (
                      <div className="grid gap-4 lg:grid-cols-2">
                        {addressBook.addresses.map((address) => {
                          const isBusy = Number(addressBook.busyAddressId) === Number(address.id);

                          return (
                            <AddressCard
                              key={address.id}
                              address={address}
                              isBusy={isBusy}
                              isSettingDefault={isBusy && addressBook.busyAction === 'default'}
                              onEdit={() => openEditAddress(address)}
                              onDelete={() => setAddressToDelete(address)}
                              onSetDefault={async () => {
                                await addressBook.markAsDefault(address.id);
                                setSelectedAddressId(address.id);
                              }}
                              selected={Number(address.id) === Number(selectedAddressId)}
                              onSelect={() => setSelectedAddressId(address.id)}
                            />
                          );
                        })}
                      </div>
                    ) : (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="text-base font-semibold text-slate-900">No tienes direcciones guardadas</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">Anade tu primera direccion para desbloquear el pago y el calculo final del pedido.</p>
                        <button
                          type="button"
                          onClick={openCreateAddress}
                          className="mt-5 inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          Anadir direccion
                        </button>
                      </div>
                    )}
                  </div>

                  <div className="space-y-4 bg-slate-50 p-6">
                    <h3 className="text-lg font-semibold text-slate-900">Cobertura y garantias</h3>
                    <div className="grid gap-3 md:grid-cols-2">
                      <BenefitCard icon={Truck} title="Entrega con seguimiento" body="Cada modalidad muestra plazo estimado y coste antes de pagar." />
                      <BenefitCard icon={ShieldCheck} title="Pago protegido" body="Stripe y PayPal se lanzan con validacion previa de direccion y sesion." />
                      <BenefitCard icon={PackageCheck} title="Trazabilidad del pedido" body="Se registran referencias de pago, envio y descuento sobre la orden." />
                      <BenefitCard icon={CheckCircle2} title="Direcciones unificadas" body="La gestion de direcciones usa el mismo flujo que el perfil." />
                    </div>
                  </div>
                </div>
              </div>
            </section>

            <aside>
              <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-sticky-height,0px)+var(--topnav-sticky-height,0px)-var(--header-compact-offset-active,0px)+1.5rem)]">
                <div className="space-y-6 rounded-[28px] border border-white/60 bg-white/95 p-6 shadow-[0_24px_80px_-48px_rgba(15,23,42,0.35)] backdrop-blur">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">Resumen financiero</h2>
                      <span className="rounded-full bg-slate-950 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-white">Live</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>Subtotal</span>
                      <span className="font-medium text-slate-800">{formatPrice(pricing.subtotal)}</span>
                    </div>

                    {discountApplied ? (
                      <div className="flex items-center justify-between text-sm text-emerald-600">
                        <span>{checkoutCoupon?.label || 'Cupon aplicado'}</span>
                        <div className="flex items-center gap-2">
                          <span>-{formatPrice(pricing.discount)}</span>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            Quitar
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-start justify-between text-sm text-slate-600">
                      <span>
                        Envio
                        <span className="block text-xs text-slate-400">{selectedShippingLabel} · {selectedShippingEta}</span>
                      </span>
                      <span className="font-medium text-slate-800">{formatPrice(pricing.shipping)}</span>
                    </div>

                    <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                      <span>Total estimado</span>
                      <span>{formatPrice(pricing.total)}</span>
                    </div>

                    <p className="text-xs text-slate-400">El total reacciona en cuanto cambias el metodo de envio y queda sincronizado con la sesion del checkout.</p>
                  </div>

                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label htmlFor="coupon" className="text-sm font-semibold text-slate-800">¿Tienes un cupon?</label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        name="code"
                        value={couponForm.data.code}
                        onChange={(event) => couponForm.setData('code', event.target.value.toUpperCase())}
                        placeholder="Ingresa codigo"
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase tracking-wide text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      />
                      <button
                        type="submit"
                        disabled={couponForm.processing}
                        className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {couponForm.processing ? 'Aplicando...' : 'Aplicar'}
                      </button>
                    </div>
                    {couponForm.errors.code ? <p className="text-xs text-rose-600">{couponForm.errors.code}</p> : null}
                  </form>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">Metodo de envio</p>
                    <div className="space-y-3">
                      {checkoutShippingOptions.map((option) => {
                        const isActive = option.value === activeShippingMethod;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleShippingChange(option.value)}
                            disabled={shippingUpdating}
                            className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${isActive ? 'border-sky-400 bg-sky-50 ring-2 ring-sky-200' : 'border-slate-200 bg-white hover:border-sky-200 hover:bg-sky-50/40'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {option.label}
                                  {option.badge ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-sky-100 px-2 py-0.5 text-xs font-medium text-sky-700">{option.badge}</span>
                                  ) : null}
                                </p>
                                <p className="text-xs text-slate-500">{option.description} · {option.eta}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-800">{formatPrice(option.cost)}</span>
                                {isActive ? <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">Activo</p> : null}
                              </div>
                            </div>
                          </button>
                        );
                      })}
                    </div>
                    {shippingForm.errors.method ? <p className="text-xs text-rose-600">{shippingForm.errors.method}</p> : null}
                  </div>

                  <div className="space-y-3">
                    <button
                      type="button"
                      onClick={handleStripePayment}
                      disabled={!canCheckout || paymentLoading === 'stripe'}
                      className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white shadow-lg shadow-slate-900/20 hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {paymentLoading === 'stripe' ? 'Redirigiendo a Stripe...' : 'Pagar con tarjeta (Stripe)'}
                    </button>
                    <button
                      type="button"
                      onClick={handlePayPalPayment}
                      disabled={!canCheckout || paymentLoading === 'paypal'}
                      className="w-full rounded-2xl bg-[#ffc439] px-4 py-3 text-center text-sm font-semibold text-slate-900 shadow-lg shadow-amber-400/40 hover:bg-[#ffb400] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {paymentLoading === 'paypal' ? 'Redirigiendo a PayPal...' : 'Pagar con PayPal'}
                    </button>
                    {!canCheckout ? <p className="text-xs text-slate-500">Necesitas una direccion seleccionada y al menos un articulo para continuar con el pago.</p> : null}
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    <p className="font-semibold text-slate-700">Seguridad y privacidad</p>
                    <ul className="space-y-1">
                      <li>✓ Datos cifrados y verificacion en dos pasos.</li>
                      <li>✓ Revision administrativa de incidencias y trazabilidad del reembolso cuando aplica.</li>
                      <li>✓ Operaciones auditadas por proveedores externos.</li>
                    </ul>
                  </div>
                </div>
              </div>
            </aside>
          </div>
        </main>

        <Footer />

        <AddressFormModal
          show={addressModalState.open}
          mode={addressModalState.mode}
          address={addressModalState.address}
          onClose={closeAddressModal}
          onSubmit={handleAddressSubmit}
        />

        <ConfirmActionModal
          show={Boolean(addressToDelete)}
          onClose={() => setAddressToDelete(null)}
          title="Eliminar direccion"
          description={addressToDelete ? `Se eliminara ${addressToDelete.street}, ${addressToDelete.city}.` : ''}
          confirmLabel="Eliminar"
          confirmTone="danger"
          onConfirm={handleDeleteAddress}
          processing={addressBook.busyAction === 'delete'}
        />
      </div>
    </>
  );
};

const SummaryPill = ({ icon: Icon, label, value }) => (
  <div className="rounded-[22px] border border-white/15 bg-white/10 px-4 py-4 backdrop-blur">
    <div className="flex items-center gap-3">
      <div className="rounded-2xl bg-white/12 p-2.5 text-sky-100">
        <Icon className="h-4 w-4" />
      </div>
      <div className="min-w-0">
        <p className="text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-300">{label}</p>
        <p className="mt-1 truncate text-sm font-semibold text-white">{value}</p>
      </div>
    </div>
  </div>
);

const InfoCard = ({ label, value }) => (
  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
  </div>
);

const BenefitCard = ({ icon: Icon, title, body }) => (
  <div className="rounded-[22px] border border-slate-200 bg-white px-4 py-4 shadow-sm">
    <div className="flex items-start gap-3">
      <div className="rounded-2xl bg-slate-950 p-2.5 text-white">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="text-sm font-semibold text-slate-900">{title}</p>
        <p className="mt-1 text-sm leading-6 text-slate-500">{body}</p>
      </div>
    </div>
  </div>
);

export default Checkout;
