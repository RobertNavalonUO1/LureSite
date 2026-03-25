import React, { useEffect, useMemo, useState } from 'react';
import { Head, useForm, usePage } from '@inertiajs/react';
import { loadStripe } from '@stripe/stripe-js';
import { CreditCard, MapPin, Minus, Plus, ShieldCheck } from 'lucide-react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import AddressCard from '@/Pages/Profile/components/AddressCard.jsx';
import AddressFormModal from '@/Pages/Profile/components/AddressFormModal.jsx';
import ConfirmActionModal from '@/Pages/Profile/components/ConfirmActionModal.jsx';
import ProfileToastRegion from '@/Pages/Profile/components/ProfileToastRegion.jsx';
import { useAddressBook } from '@/Pages/Profile/hooks/useAddressBook.js';
import { useToastStack } from '@/hooks/useToastStack.js';
import { useI18n } from '@/i18n';
import { decrementCartItem, incrementCartItem, normaliseCartItems, removeCartItem } from '@/utils/cartClient';

const formatAddress = (addr) => `${addr.street}, ${addr.city}, ${addr.province}, ${addr.zip_code}, ${addr.country}`;
const toNumber = (value) => Number(value ?? 0);
const localeForCurrency = (locale) => {
  switch (String(locale || 'es').slice(0, 2).toLowerCase()) {
    case 'en':
      return 'en-GB';
    case 'fr':
      return 'fr-FR';
    default:
      return 'es-ES';
  }
};

const getCsrfToken = () => document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '';

const requestJson = async (url, options = {}) => {
  const { method = 'GET', body, headers = {} } = options;
  const response = await fetch(url, {
    method,
    credentials: 'same-origin',
    headers: {
      Accept: 'application/json',
      'X-Requested-With': 'XMLHttpRequest',
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(getCsrfToken() ? { 'X-CSRF-TOKEN': getCsrfToken() } : {}),
      ...headers,
    },
    ...(body ? { body: JSON.stringify(body) } : {}),
  });

  const payload = await response.json();

  if (!response.ok) {
    throw new Error(payload?.errors?.method?.[0] || payload?.error || payload?.message || 'Request failed.');
  }

  return payload;
};

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
    locale = 'es',
  } = usePage().props;

  const { t } = useI18n();
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
      addToast({ type: 'success', title: t('profile.modern.flash_completed_title'), message: flash.success });
    }

    if (flash?.error) {
      addToast({ type: 'error', title: t('profile.modern.flash_failed_title'), message: flash.error });
    }
  }, [flash?.error, flash?.success, addToast, t]);

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

  const selectedShippingLabel = activeShippingOption?.label || checkoutShipping?.label || t('shop.checkout.shipping_select');
  const selectedShippingEta = activeShippingOption?.eta || checkoutShipping?.eta || '';

  const formatter = useMemo(
    () => new Intl.NumberFormat(localeForCurrency(locale), { style: 'currency', currency }),
    [currency, locale],
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

  const syncCheckoutSnapshot = async (fallbackItems = null) => {
    const payload = await requestJson(route('checkout.summary'));

    setItems(normaliseCartItems(payload.cartItems ?? fallbackItems ?? []));
    setCheckoutState({
      totals: payload.totals,
      coupon: payload.coupon,
      shipping: payload.shipping,
      shippingOptions: payload.shippingOptions,
    });

    return payload;
  };

  const triggerCartMutation = async (mutation, productId) => {
    if (!productId || updatingItemId) return;

    setUpdatingItemId(productId);

    try {
      const payload = await mutation(productId);
      setItems(normaliseCartItems(payload.cartItems));
      await syncCheckoutSnapshot(payload.cartItems);
    } catch (error) {
      addToast({
        type: 'error',
        title: t('shop.checkout.cart_update_failed_title'),
        message: t('shop.checkout.cart_update_failed_body'),
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
        addToast({ type: 'success', title: t('shop.checkout.coupon_applied_title'), message: t('shop.checkout.coupon_applied_body') });
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
        addToast({ type: 'info', title: t('shop.checkout.coupon_removed_title'), message: t('shop.checkout.coupon_removed_body') });
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
        const payload = await requestJson(route('checkout.shipping'), {
          method: 'POST',
          body: { method },
        });

        setCheckoutState((current) => ({
          ...current,
          totals: payload.totals,
          shipping: payload.shipping,
          shippingOptions: payload.shippingOptions,
        }));
        setActiveShippingMethod(payload.shipping?.method || method);
        addToast({ type: 'success', title: t('shop.checkout.shipping_updated_title'), message: payload.message || t('shop.checkout.shipping_updated_body') });
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
      const data = await requestJson(route('checkout.stripe'), {
        method: 'POST',
        body: { address_id: selectedAddressId },
      });

      if (data.sessionId) {
        const stripe = await loadStripe(data.stripePublicKey || import.meta.env.VITE_STRIPE_PUBLIC_KEY);
        if (!stripe) {
          throw new Error(t('shop.checkout.stripe_init_failed'));
        }

        const result = await stripe.redirectToCheckout({ sessionId: data.sessionId });
        if (result.error) {
          throw new Error(result.error.message || t('shop.checkout.stripe_redirect_failed'));
        }
      } else {
        throw new Error(data.error || t('shop.checkout.stripe_session_missing'));
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: t('shop.checkout.stripe_error_title'),
        message: error.message || t('shop.checkout.stripe_error_body'),
      });
    } finally {
      setPaymentLoading(null);
    }
  };

  const handlePayPalPayment = async () => {
    if (!canCheckout || paymentLoading) return;
    setPaymentLoading('paypal');

    try {
      const data = await requestJson(route('checkout.paypal'), {
        method: 'POST',
        body: { address_id: selectedAddressId },
      });

      if (data.approvalLink) {
        window.location.href = data.approvalLink;
      } else {
        throw new Error(data.error || t('shop.checkout.paypal_link_missing'));
      }
    } catch (error) {
      addToast({
        type: 'error',
        title: t('shop.checkout.paypal_error_title'),
        message: error.message || t('shop.checkout.paypal_error_body'),
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
      <Head title={t('shop.checkout.title')} />
      <ProfileToastRegion toasts={toasts} onDismiss={dismissToast} />

      <div className="min-h-screen bg-slate-50 text-slate-900">
        <Header />

        <main className="mx-auto flex w-full max-w-7xl flex-col gap-6 px-4 py-8 sm:px-6 lg:px-8">
          <header className="rounded-3xl border border-slate-200 bg-white px-6 py-6 shadow-sm sm:px-8">
            <p className="text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">{t('shop.checkout.kicker')}</p>
            <h1 className="mt-2 text-3xl font-semibold tracking-tight text-slate-950">{t('shop.checkout.title')}</h1>
            <p className="mt-3 max-w-3xl text-sm leading-6 text-slate-600">{t('shop.checkout.subtitle')}</p>
          </header>

          <div className="grid gap-6 xl:grid-cols-[minmax(0,1.35fr)_360px] xl:items-start">
            <section className="space-y-6">
              <div className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-sm">
                <div className="border-b border-slate-200 px-6 py-5">
                  <h2 className="text-xl font-semibold tracking-tight text-slate-950">{t('shop.checkout.summary_title')}</h2>
                  <p className="mt-1 text-sm text-slate-500">{t('shop.checkout.summary_subtitle')}</p>
                </div>

                <div className="divide-y divide-slate-100">
                  <div className="p-6 space-y-4">
                    <div className="flex items-center justify-between gap-3">
                      <h3 className="text-lg font-semibold text-slate-900">{t('shop.checkout.items_title', { count: items.length })}</h3>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">
                        {String(items.length).padStart(2, '0')}
                      </span>
                    </div>

                    {items.length === 0 ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center text-sm text-slate-500">
                        {t('shop.checkout.items_empty')}
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
                                    {item.variant ? <p className="text-xs text-slate-500">{t('shop.checkout.variant')}: {item.variant}</p> : null}
                                    <p className="text-xs text-slate-500">{t('shop.checkout.item_unit_price', { count: item.quantity, price: formatPrice(price) })}</p>
                                  </div>
                                  <span className="font-semibold text-slate-900">{formatPrice(lineTotal)}</span>
                                </div>

                                <div className="flex flex-wrap items-center justify-between gap-3">
                                  <div className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-2 py-1">
                                    <button
                                      type="button"
                                      onClick={() => handleDecrementItem(item.id)}
                                      disabled={isUpdating}
                                      aria-label={t('shop.checkout.decrement_aria', { name: item.title })}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Minus className="h-3.5 w-3.5" />
                                    </button>
                                    <span className="min-w-[2rem] text-center text-sm font-semibold text-slate-700">{item.quantity}</span>
                                    <button
                                      type="button"
                                      onClick={() => handleIncrementItem(item.id)}
                                      disabled={isUpdating}
                                      aria-label={t('shop.checkout.increment_aria', { name: item.title })}
                                      className="inline-flex h-7 w-7 items-center justify-center rounded-full text-slate-600 hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                      <Plus className="h-3.5 w-3.5" />
                                    </button>
                                  </div>

                                  <button
                                    type="button"
                                    onClick={() => handleRemoveItem(item.id)}
                                    disabled={isUpdating}
                                    className="text-xs font-semibold text-rose-600 hover:text-rose-700 disabled:cursor-not-allowed disabled:opacity-50"
                                  >
                                    {t('shop.checkout.remove')}
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
                    <h3 className="text-lg font-semibold text-slate-900">{t('shop.checkout.user_title')}</h3>
                    {isGuest ? (
                      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-700">
                        {t('shop.checkout.user_guest_warning')}
                      </div>
                    ) : (
                      <div className="grid gap-3 md:grid-cols-3">
                        <InfoCard label={t('shop.checkout.user_name')} value={`${user.name} ${user.lastname || ''}`.trim() || t('shop.checkout.product_placeholder')} />
                        <InfoCard label={t('shop.checkout.user_email')} value={user.email} />
                        <InfoCard label={t('shop.checkout.user_phone')} value={user.phone || t('shop.checkout.user_phone_missing')} />
                      </div>
                    )}
                  </div>

                  <div className="p-6 space-y-5">
                    <div className="flex flex-wrap items-start justify-between gap-3">
                      <div>
                        <h3 className="text-lg font-semibold text-slate-900">{t('shop.checkout.address_title')}</h3>
                        <p className="mt-1 text-sm text-slate-500">{t('shop.checkout.address_body')}</p>
                      </div>

                      {!isGuest ? (
                        <button
                          type="button"
                          onClick={openCreateAddress}
                          className="inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          {t('shop.checkout.address_add_new')}
                        </button>
                      ) : null}
                    </div>

                    {isGuest ? (
                      <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
                        {t('shop.checkout.address_guest_hint')}
                      </div>
                    ) : currentAddress ? (
                      <div className="rounded-[24px] border border-slate-200 bg-slate-50 p-5">
                        <div className="flex items-start gap-3">
                          <div className="rounded-2xl bg-white p-3 text-slate-700 shadow-sm ring-1 ring-slate-100">
                            <MapPin className="h-5 w-5" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{t('shop.checkout.active_address')}</p>
                            <p className="mt-2 text-base font-semibold text-slate-900">{currentAddress.street}</p>
                            <p className="mt-1 text-sm leading-6 text-slate-600">{formatAddress(currentAddress)}</p>
                          </div>
                        </div>
                      </div>
                    ) : null}

                    {!isGuest && addressBook.addresses.length > 0 ? (
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
                    ) : !isGuest ? (
                      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
                        <p className="text-base font-semibold text-slate-900">{t('shop.checkout.address_empty')}</p>
                        <p className="mt-2 text-sm leading-6 text-slate-500">{t('shop.checkout.address_empty_body')}</p>
                        <button
                          type="button"
                          onClick={openCreateAddress}
                          className="mt-5 inline-flex items-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                        >
                          {t('shop.checkout.address_add')}
                        </button>
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>
            </section>

            <aside>
              <div className="space-y-6 lg:sticky lg:top-[calc(var(--header-sticky-height,0px)+var(--topnav-sticky-height,0px)-var(--header-compact-offset-active,0px)+1.5rem)]">
                <div className="space-y-6 rounded-3xl border border-slate-200 bg-white p-6 shadow-sm">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-3">
                      <h2 className="text-lg font-semibold text-slate-900">{t('shop.checkout.summary_title')}</h2>
                      <span className="rounded-full border border-slate-200 bg-slate-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">{String(items.length).padStart(2, '0')}</span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-slate-600">
                      <span>{t('shop.checkout.subtotal')}</span>
                      <span className="font-medium text-slate-800">{formatPrice(pricing.subtotal)}</span>
                    </div>

                    {discountApplied ? (
                      <div className="flex items-center justify-between text-sm text-emerald-600">
                        <span>{checkoutCoupon?.label || t('shop.checkout.coupon_applied')}</span>
                        <div className="flex items-center gap-2">
                          <span>-{formatPrice(pricing.discount)}</span>
                          <button
                            type="button"
                            onClick={handleRemoveCoupon}
                            className="text-xs font-semibold text-emerald-700 hover:underline"
                          >
                            {t('shop.checkout.remove_coupon')}
                          </button>
                        </div>
                      </div>
                    ) : null}

                    <div className="flex items-start justify-between text-sm text-slate-600">
                      <span>
                        {t('shop.checkout.shipping')}
                        <span className="block text-xs text-slate-400">{selectedShippingLabel} · {selectedShippingEta}</span>
                      </span>
                      <span className="font-medium text-slate-800">{formatPrice(pricing.shipping)}</span>
                    </div>

                    <div className="flex items-center justify-between text-base font-semibold text-slate-900">
                      <span>{t('shop.checkout.estimated_total')}</span>
                      <span>{formatPrice(pricing.total)}</span>
                    </div>
                  </div>

                  <form onSubmit={handleApplyCoupon} className="space-y-2">
                    <label htmlFor="coupon" className="text-sm font-semibold text-slate-800">{t('shop.checkout.coupon_title')}</label>
                    <div className="flex gap-2">
                      <input
                        id="coupon"
                        name="code"
                        value={couponForm.data.code}
                        onChange={(event) => couponForm.setData('code', event.target.value.toUpperCase())}
                        placeholder={t('shop.checkout.coupon_placeholder')}
                        className="flex-1 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm uppercase tracking-wide text-slate-700 focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-500/40"
                      />
                      <button
                        type="submit"
                        disabled={couponForm.processing}
                        className="inline-flex items-center rounded-2xl bg-slate-900 px-4 py-3 text-sm font-semibold text-white hover:bg-slate-800 disabled:opacity-60"
                      >
                        {couponForm.processing ? t('shop.checkout.coupon_applying') : t('shop.checkout.coupon_apply')}
                      </button>
                    </div>
                    {couponForm.errors.code ? <p className="text-xs text-rose-600">{couponForm.errors.code}</p> : null}
                  </form>

                  <div className="space-y-3">
                    <p className="text-sm font-semibold text-slate-800">{t('shop.checkout.shipping_method')}</p>
                    <div className="space-y-3">
                      {checkoutShippingOptions.map((option) => {
                        const isActive = option.value === activeShippingMethod;

                        return (
                          <button
                            key={option.value}
                            type="button"
                            onClick={() => handleShippingChange(option.value)}
                            disabled={shippingUpdating}
                            className={`w-full rounded-[22px] border px-4 py-3 text-left transition ${isActive ? 'border-slate-400 bg-slate-50 ring-2 ring-slate-200' : 'border-slate-200 bg-white hover:border-slate-300 hover:bg-slate-50'}`}
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-sm font-semibold text-slate-800">
                                  {option.label}
                                  {option.badge ? (
                                    <span className="ml-2 inline-flex items-center rounded-full bg-slate-100 px-2 py-0.5 text-xs font-medium text-slate-700">{option.badge}</span>
                                  ) : null}
                                </p>
                                <p className="text-xs text-slate-500">{option.description} · {option.eta}</p>
                              </div>
                              <div className="text-right">
                                <span className="text-sm font-semibold text-slate-800">{formatPrice(option.cost)}</span>
                                {isActive ? <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-slate-600">{t('shop.checkout.active_badge')}</p> : null}
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
                      className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-center text-sm font-semibold text-white hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <CreditCard className="h-4 w-4" />
                      {paymentLoading === 'stripe' ? t('shop.checkout.redirecting_stripe') : t('shop.checkout.pay_with_card')}
                    </button>
                    <button
                      type="button"
                      onClick={handlePayPalPayment}
                      disabled={!canCheckout || paymentLoading === 'paypal'}
                      className="inline-flex w-full items-center justify-center rounded-2xl bg-[#ffc439] px-4 py-3 text-center text-sm font-semibold text-slate-900 hover:bg-[#ffb400] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      {paymentLoading === 'paypal' ? t('shop.checkout.redirecting_paypal') : t('shop.checkout.pay_with_paypal')}
                    </button>
                    {!canCheckout ? <p className="text-xs text-slate-500">{t('shop.checkout.payment_disabled_hint')}</p> : null}
                  </div>

                  <div className="space-y-2 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs text-slate-500">
                    <div className="flex items-start gap-3">
                      <div className="rounded-xl bg-white p-2 text-slate-700 shadow-sm">
                        <ShieldCheck className="h-4 w-4" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-700">{t('shop.checkout.security_title')}</p>
                        <ul className="mt-2 space-y-1">
                          <li>{t('shop.checkout.security_1')}</li>
                          <li>{t('shop.checkout.security_2')}</li>
                          <li>{t('shop.checkout.security_3')}</li>
                        </ul>
                      </div>
                    </div>
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
          title={t('profile.modern.address_delete_title')}
          description={addressToDelete ? t('profile.modern.address_delete_description', {
            street: addressToDelete.street,
            city: addressToDelete.city,
          }) : ''}
          confirmLabel={t('profile.modern.address_delete_confirm')}
          confirmTone="danger"
          onConfirm={handleDeleteAddress}
          processing={addressBook.busyAction === 'delete'}
        />
      </div>
    </>
  );
};

const InfoCard = ({ label, value }) => (
  <div className="rounded-[22px] border border-slate-200 bg-slate-50 px-4 py-4">
    <p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-400">{label}</p>
    <p className="mt-2 text-sm font-medium text-slate-800">{value}</p>
  </div>
);

export default Checkout;
