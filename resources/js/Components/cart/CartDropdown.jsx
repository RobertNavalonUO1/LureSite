import React, { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Link, usePage } from '@inertiajs/react';
import { useI18n } from '@/i18n';
import { ArrowRight, Minus, Plus, ShieldCheck, ShoppingBag, Trash2, X } from 'lucide-react';
import {
    decrementCartItem,
    fetchCartSummary,
    formatCartTotal,
    incrementCartItem,
    normaliseCartItems,
    removeCartItem,
    subscribeToCartAdditions,
    subscribeToCartUpdates,
} from '@/utils/cartClient';

const CartDropdown = () => {
    const { props, url } = usePage();
    const { locale, t } = useI18n();
    const {
        cartItems: initialCartItems,
        cartCount: initialCartCount,
        total: initialTotal,
    } = props;
    const containerRef = useRef(null);
    const dropdownRef = useRef(null);

    const [isDropdownVisible, setIsDropdownVisible] = useState(false);

    const [cartItems, setCartItems] = useState(() => normaliseCartItems(initialCartItems));
    const [cartCount, setCartCount] = useState(() => Number(initialCartCount ?? 0));
    const [total, setTotal] = useState(() => formatCartTotal(initialTotal));
    const [dropdownPosition, setDropdownPosition] = useState({ top: 0, left: 8 });
    const [busyItemId, setBusyItemId] = useState(null);
    const [justAddedItem, setJustAddedItem] = useState(null);
    const [isAddToastVisible, setIsAddToastVisible] = useState(false);
    const [badgePulse, setBadgePulse] = useState(false);
    const addToastTimeoutRef = useRef(null);
    const addToastHideTimeoutRef = useRef(null);

    const currencyFormatter = useMemo(() => new Intl.NumberFormat(
        locale === 'fr' ? 'fr-FR' : locale === 'en' ? 'en-US' : 'es-ES',
        {
            style: 'currency',
            currency: 'EUR',
            minimumFractionDigits: 2,
        },
    ), [locale]);

    const formattedTotal = useMemo(
        () => currencyFormatter.format(Number(total) || 0),
        [currencyFormatter, total],
    );

    const syncCartState = useCallback((payload = {}) => {
        setCartItems(normaliseCartItems(payload.cartItems));
        setCartCount(Number(payload.cartCount ?? 0));
        setTotal(formatCartTotal(payload.total));
    }, []);

    useEffect(() => {
        syncCartState({
            cartItems: initialCartItems,
            cartCount: initialCartCount,
            total: initialTotal,
        });
    }, [initialCartItems, initialCartCount, initialTotal, syncCartState]);

    useEffect(() => subscribeToCartUpdates(syncCartState), [syncCartState]);

    useEffect(() => subscribeToCartAdditions((item) => {
        setJustAddedItem(item);
        setBadgePulse(true);
        setIsAddToastVisible(true);

        window.clearTimeout(addToastTimeoutRef.current);
        window.clearTimeout(addToastHideTimeoutRef.current);

        addToastTimeoutRef.current = window.setTimeout(() => {
            setIsAddToastVisible(false);
            addToastHideTimeoutRef.current = window.setTimeout(() => {
                setJustAddedItem(null);
            }, 240);
        }, 2600);

        window.setTimeout(() => {
            setBadgePulse(false);
        }, 720);
    }), []);

    useEffect(() => () => {
        window.clearTimeout(addToastTimeoutRef.current);
        window.clearTimeout(addToastHideTimeoutRef.current);
    }, []);

    useEffect(() => {
        setIsDropdownVisible(false);
    }, [url]);

    const updateDropdownPosition = () => {
        if (!containerRef.current || typeof window === 'undefined') {
            return;
        }

        const rect = containerRef.current.getBoundingClientRect();
        const panelWidth = dropdownRef.current?.offsetWidth
            ?? Math.min(window.innerWidth - 16, window.innerWidth < 640 ? window.innerWidth * 0.94 : 420);
        const maxLeft = Math.max(8, window.innerWidth - panelWidth - 8);
        const alignedLeft = rect.right - panelWidth;

        setDropdownPosition({
            top: rect.bottom + 8,
            left: Math.min(Math.max(alignedLeft, 8), maxLeft),
        });
    };

    const toggleDropdown = (forceOpen = null) => {
        setIsDropdownVisible(prev => (forceOpen !== null ? forceOpen : !prev));
    };

    const handleClickOutside = (event) => {
        if (containerRef.current?.contains(event.target) || dropdownRef.current?.contains(event.target)) {
            return;
        }

        setIsDropdownVisible(false);
    };

    useEffect(() => {
        if (isDropdownVisible) {
            document.addEventListener("mousedown", handleClickOutside);
        } else {
            document.removeEventListener("mousedown", handleClickOutside);
        }
        return () => {
            document.removeEventListener("mousedown", handleClickOutside);
        };
    }, [isDropdownVisible]);

    useEffect(() => {
        if (!isDropdownVisible) {
            return undefined;
        }

        fetchCartSummary().catch((error) => {
            console.error('No se pudo sincronizar el carrito', error);
        });

        updateDropdownPosition();

        const syncPosition = () => {
            updateDropdownPosition();
        };

        window.addEventListener('resize', syncPosition);
        window.addEventListener('scroll', syncPosition, true);

        const frameId = window.requestAnimationFrame(syncPosition);

        return () => {
            window.cancelAnimationFrame(frameId);
            window.removeEventListener('resize', syncPosition);
            window.removeEventListener('scroll', syncPosition, true);
        };
    }, [isDropdownVisible, cartCount]);

    const handleRemove = async (productId) => {
        try {
            setBusyItemId(productId);
            await removeCartItem(productId);
            toggleDropdown(true);
        } catch (error) {
            console.error('No se pudo eliminar del carrito', error);
        } finally {
            setBusyItemId(null);
        }
    };

    const handleIncrement = async (productId) => {
        try {
            setBusyItemId(productId);
            await incrementCartItem(productId);
            toggleDropdown(true);
        } catch (error) {
            console.error('No se pudo incrementar el carrito', error);
        } finally {
            setBusyItemId(null);
        }
    };

    const handleDecrement = async (productId) => {
        try {
            setBusyItemId(productId);
            await decrementCartItem(productId);
            toggleDropdown(true);
        } catch (error) {
            console.error('No se pudo reducir el carrito', error);
        } finally {
            setBusyItemId(null);
        }
    };

    return (
        <div className="relative" ref={containerRef}>
            <button
                onClick={() => toggleDropdown()}
                className="bg-yellow-500 px-3 py-2 rounded-lg hover:bg-yellow-600 flex items-center gap-2 transition duration-300 ease-in-out transform hover:scale-105 sm:px-4"
            >
                <span aria-hidden="true">🛒</span>
                <span className="hidden sm:inline">{t('header.cart.view')}</span>
                {cartCount > 0 && (
                    <span className={`ml-2 inline-flex min-w-6 items-center justify-center rounded-full bg-red-500 px-2 text-sm font-semibold text-white transition-transform duration-300 ${badgePulse ? 'scale-125 shadow-[0_0_0_8px_rgba(239,68,68,0.14)]' : 'scale-100'}`}>
                        {cartCount}
                    </span>
                )}
            </button>
            {justAddedItem && typeof document !== 'undefined' && createPortal(
                <div
                    className={`fixed right-4 top-[calc(var(--header-sticky-height-expanded,5rem)+1rem)] z-[10000] w-[min(92vw,24rem)] transition-all duration-300 ${isAddToastVisible ? 'translate-y-0 opacity-100' : '-translate-y-3 opacity-0'}`}
                >
                    <div className="overflow-hidden rounded-[26px] border border-emerald-200/80 bg-white/95 shadow-[0_28px_80px_-24px_rgba(15,23,42,0.35)] backdrop-blur-xl">
                        <div className="bg-[linear-gradient(135deg,_rgba(16,185,129,0.18),_rgba(14,165,233,0.08)_52%,_rgba(255,255,255,0.9))] px-4 py-3">
                            <p className="text-[11px] font-semibold uppercase tracking-[0.24em] text-emerald-700">{t('shop.cart.added_badge')}</p>
                            <p className="mt-1 text-sm font-medium text-slate-700">{justAddedItem.message || t('shop.cart.added_message')}</p>
                        </div>
                        <div className="flex items-center gap-4 px-4 py-4">
                            <img
                                src={justAddedItem.image_url_full || justAddedItem.image_url || '/images/logo.png'}
                                alt={justAddedItem.title}
                                className="h-16 w-16 rounded-2xl border border-slate-200 bg-slate-50 object-cover"
                                onError={(event) => {
                                    event.currentTarget.src = '/images/logo.png';
                                }}
                            />
                            <div className="min-w-0 flex-1">
                                <p className="text-sm font-semibold text-slate-900 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                                    {justAddedItem.title || t('shop.cart.added_fallback_title')}
                                </p>
                                <p className="mt-1 text-xs text-slate-500">
                                    {t('shop.cart.added_quantity', { count: justAddedItem.quantity || 1 })}
                                </p>
                                <p className="mt-2 text-sm font-semibold text-slate-900">
                                    {currencyFormatter.format(Number(justAddedItem.price) || 0)}
                                </p>
                            </div>
                            <Link
                                href="/checkout"
                                className="inline-flex h-10 items-center justify-center rounded-2xl bg-slate-950 px-4 text-sm font-semibold text-white transition hover:bg-slate-800"
                            >
                                {t('shop.cart.checkout')}
                            </Link>
                        </div>
                    </div>
                </div>,
                document.body
            )}
            {isDropdownVisible && typeof document !== 'undefined' && createPortal(
                <div
                    ref={dropdownRef}
                    className="fixed z-[9999] w-[min(94vw,26rem)] overflow-hidden rounded-[28px] border border-slate-200/80 bg-white/95 shadow-[0_28px_80px_-28px_rgba(15,23,42,0.45)] backdrop-blur-xl"
                    style={{
                        top: `${dropdownPosition.top}px`,
                        left: `${dropdownPosition.left}px`,
                    }}
                >
                    {cartCount > 0 ? (
                        <div className="flex max-h-[min(78vh,38rem)] flex-col">
                            <div className="border-b border-slate-200 bg-[linear-gradient(135deg,_rgba(37,99,235,0.08),_rgba(14,165,233,0.03)_45%,_transparent)] px-5 pb-4 pt-5">
                                <div className="flex items-start justify-between gap-4">
                                    <div>
                                        <div className="inline-flex items-center gap-2 rounded-full border border-sky-200 bg-sky-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-sky-700">
                                            <ShoppingBag className="h-3.5 w-3.5" />
                                            {t('shop.cart.summary_badge')}
                                        </div>
                                        <h3 className="mt-3 text-lg font-semibold text-slate-950">{t('shop.cart.title')}</h3>
                                        <p className="mt-1 text-sm text-slate-500">
                                            {t('shop.cart.items_count', { count: cartCount })}
                                        </p>
                                    </div>

                                    <button
                                        type="button"
                                        onClick={() => setIsDropdownVisible(false)}
                                        className="inline-flex h-10 w-10 items-center justify-center rounded-full border border-slate-200 bg-white text-slate-500 transition hover:border-slate-300 hover:text-slate-700"
                                        aria-label={t('common.close_notification')}
                                    >
                                        <X className="h-4 w-4" />
                                    </button>
                                </div>
                            </div>

                            <ul className="flex-1 space-y-3 overflow-y-auto px-4 py-4">
                                {cartItems.map((item) => (
                                    <li key={item.id} className="rounded-2xl border border-slate-200 bg-white p-3 shadow-sm transition hover:border-slate-300 hover:shadow-md">
                                        <div className="flex items-start gap-3">
                                            <img
                                                src={item.image_url_full || item.image_url || '/images/logo.png'}
                                                alt={item.title}
                                                className="h-16 w-16 flex-shrink-0 rounded-2xl border border-slate-200 object-cover bg-slate-50"
                                                onError={(event) => {
                                                    event.currentTarget.src = '/images/logo.png';
                                                }}
                                            />

                                            <div className="min-w-0 flex-1">
                                                <div className="flex items-start justify-between gap-3">
                                                    <div className="min-w-0">
                                                        <p className="text-sm font-semibold leading-5 text-slate-900 [display:-webkit-box] [-webkit-line-clamp:2] [-webkit-box-orient:vertical] overflow-hidden">
                                                            {item.title}
                                                        </p>
                                                        <p className="mt-1 text-xs text-slate-500">
                                                            {currencyFormatter.format(Number(item.price) || 0)} {t('shop.cart.unit_suffix')}
                                                        </p>
                                                    </div>

                                                    <button
                                                        type="button"
                                                        onClick={() => handleRemove(item.id)}
                                                        disabled={busyItemId === item.id}
                                                        className="inline-flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-xl border border-rose-200 bg-rose-50 text-rose-600 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
                                                        aria-label={t('shop.cart.remove_item', { name: item.title })}
                                                    >
                                                        <Trash2 className="h-4 w-4" />
                                                    </button>
                                                </div>

                                                <div className="mt-3 flex items-end justify-between gap-3">
                                                    <div className="inline-flex items-center rounded-2xl border border-slate-200 bg-slate-50 p-1 shadow-inner">
                                                        <button
                                                            type="button"
                                                            onClick={() => handleDecrement(item.id)}
                                                            disabled={busyItemId === item.id}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                                            aria-label={t('shop.cart.decrement_item', { name: item.title })}
                                                        >
                                                            <Minus className="h-4 w-4" />
                                                        </button>
                                                        <div className="min-w-10 text-center text-sm font-semibold text-slate-800">
                                                            {item.quantity}
                                                        </div>
                                                        <button
                                                            type="button"
                                                            onClick={() => handleIncrement(item.id)}
                                                            disabled={busyItemId === item.id}
                                                            className="inline-flex h-9 w-9 items-center justify-center rounded-xl text-slate-700 transition hover:bg-white disabled:cursor-not-allowed disabled:opacity-60"
                                                            aria-label={t('shop.cart.increment_item', { name: item.title })}
                                                        >
                                                            <Plus className="h-4 w-4" />
                                                        </button>
                                                    </div>

                                                    <div className="text-right">
                                                        <p className="text-[11px] font-medium uppercase tracking-[0.18em] text-slate-400">
                                                            {t('shop.cart.subtotal')}
                                                        </p>
                                                        <p className="mt-1 text-base font-semibold text-slate-950">
                                                            {currencyFormatter.format((Number(item.price) || 0) * (item.quantity || 0))}
                                                        </p>
                                                    </div>
                                                </div>
                                            </div>
                                        </div>
                                    </li>
                                ))}
                            </ul>

                            <div className="border-t border-slate-200 bg-white/95 px-5 pb-5 pt-4 backdrop-blur">
                                <div className="flex items-center justify-between gap-4">
                                    <div>
                                        <p className="text-xs font-medium uppercase tracking-[0.2em] text-slate-400">{t('shop.cart.total')}</p>
                                        <p className="mt-1 text-2xl font-semibold tracking-tight text-slate-950">{formattedTotal}</p>
                                    </div>
                                    <div className="hidden items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-2 text-xs font-semibold text-emerald-700 sm:inline-flex">
                                        <ShieldCheck className="h-4 w-4" />
                                        {t('shop.cart.secure_checkout')}
                                    </div>
                                </div>

                                <div className="mt-4 grid gap-3">
                                    <Link
                                        href="/checkout"
                                        className="inline-flex w-full items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3.5 text-sm font-semibold text-white transition hover:bg-slate-800"
                                    >
                                        <span>{t('shop.cart.checkout')}</span>
                                        <ArrowRight className="h-4 w-4" />
                                    </Link>

                                    <Link
                                        href="/search"
                                        className="inline-flex w-full items-center justify-center rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                                        onClick={() => setIsDropdownVisible(false)}
                                    >
                                        {t('shop.cart.continue_shopping')}
                                    </Link>
                                </div>
                            </div>
                        </div>
                    ) : (
                        <div className="flex flex-col items-center px-6 py-10 text-center">
                            <div className="flex h-16 w-16 items-center justify-center rounded-full bg-slate-100 text-slate-400">
                                <ShoppingBag className="h-7 w-7" />
                            </div>
                            <h3 className="mt-5 text-lg font-semibold text-slate-900">{t('shop.cart.empty_title')}</h3>
                            <p className="mt-2 max-w-xs text-sm leading-6 text-slate-500">
                                {t('shop.cart.empty_body')}
                            </p>
                            <Link
                                href="/search"
                                className="mt-6 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
                                onClick={() => setIsDropdownVisible(false)}
                            >
                                {t('shop.cart.continue_shopping')}
                                <ArrowRight className="h-4 w-4" />
                            </Link>
                        </div>
                    )}
                </div>,
                document.body
            )}
        </div>
    );
};

export default CartDropdown;
