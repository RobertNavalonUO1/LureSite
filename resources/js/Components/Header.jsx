import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import CartDropdown from './CartDropdown';
import axios from 'axios';

const Header = ({ isCompact = false }) => {
  const { auth } = usePage().props;
  const user = auth?.user;
  const userFirstName = user?.name ? user.name.split(' ')[0] : '';
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');

  const navigation = [
    { label: 'Inicio', href: '/' },
    { label: 'Acerca', href: '/about' },
    { label: 'Contacto', href: '/contact' },
    { label: 'Ayuda', href: '/faq' },
  ];

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesion:', error);
    }
  };

  const handleSearch = (event) => {
    event.preventDefault();
    const trimmed = search.trim();
    if (!trimmed) return;
    window.location.href = `/search?query=${encodeURIComponent(trimmed)}`;
  };

  const headerClassName = [
    'sticky top-0 z-50 backdrop-blur transition-all duration-300',
    isCompact ? 'bg-white/95 shadow-lg border-b border-slate-200' : 'bg-white/85 border-b border-slate-200 shadow-sm',
  ].join(' ');

  const mainPadding = isCompact ? 'py-3' : 'py-5';
  const logoImageClass = isCompact
    ? 'w-10 h-10 rounded-full shadow-md'
    : 'w-14 h-14 sm:w-16 sm:h-16 rounded-full shadow-lg';
  const logoTextClass = isCompact
    ? 'hidden sm:block text-xl font-semibold tracking-tight text-slate-900 transition-all duration-300'
    : 'hidden sm:block text-3xl sm:text-4xl font-extrabold tracking-tight text-slate-900 transition-all duration-300';

  const searchFormClass = isCompact
    ? 'hidden md:flex flex-1 max-w-md'
    : 'hidden lg:flex flex-1 max-w-xl';

  const searchInputClass = [
    'w-full rounded-full border border-slate-200 bg-white/80 px-6 pr-20 text-slate-700 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/60 transition',
    isCompact ? 'py-2.5 text-base' : 'py-4 text-xl',
  ].join(' ');

  const searchButtonClass = [
    'absolute flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition',
    isCompact ? 'inset-y-1 right-1 px-5 py-2 text-sm font-semibold' : 'inset-y-2 right-2 px-8 py-3 text-lg font-bold uppercase tracking-wide',
  ].join(' ');

  const userWrapperClass = [
    'flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 shadow-md transition',
    isCompact ? 'px-3 py-1.5' : 'px-4 py-2',
  ].join(' ');

  const topBannerOuterClass = [
    'hidden md:block overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-slate-100 text-xs transition-all duration-300',
    isCompact ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100',
  ].join(' ');

  const topBannerInnerClass = [
    'max-w-full mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-2 transition-all duration-300',
    isCompact ? 'py-0' : 'py-3',
  ].join(' ');

  const navClassName = [
    'hidden lg:flex items-center justify-between border-t border-slate-200 text-xl text-slate-700 transition-all duration-300 ease-out origin-top transform',
    isCompact ? 'py-0 opacity-0 scale-y-0 pointer-events-none' : 'py-3 opacity-100 scale-y-100 pointer-events-auto',
  ].join(' ');

  return (
    <header className={headerClassName}>
      <div className={topBannerOuterClass} aria-hidden={isCompact}>
        <div className={topBannerInnerClass}>
          <span className="uppercase tracking-wide font-bold text-lg md:text-xl">
            Oferta del dia: <span className="text-pink-200">envios gratis</span> en compras mayores a $50
          </span>
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-base md:text-lg">
            <a href="tel:+521800000000" className="hover:text-indigo-200 transition font-semibold">
              Soporte 24/7 <span className="hidden sm:inline">+52 1 800 000 0000</span>
            </a>
            <a href="mailto:contacto@worldexpense.com" className="hover:text-indigo-200 transition font-semibold">
              contacto@worldexpense.com
            </a>
          </div>
        </div>
      </div>

      <div className="max-w-full mx-auto px-2 sm:px-4">
        <div className={`flex flex-wrap items-center justify-between gap-4 transition-all duration-300 ${mainPadding}`}>
          <Link
            href="/"
            className={`flex items-center gap-3 ${isCompact ? 'text-2xl font-bold' : 'text-4xl sm:text-5xl font-extrabold'} tracking-tight text-slate-900`}
          >
            <img src="/images/logo.png" alt="WorldExpense" className={logoImageClass} />
            <span className={logoTextClass}>WorldExpense</span>
          </Link>

          <form onSubmit={handleSearch} className={searchFormClass}>
            <div className="relative w-full">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar productos, categorias o marcas"
                className={searchInputClass}
              />
              <button type="submit" className={searchButtonClass}>
                Buscar
              </button>
            </div>
          </form>

          <div className="flex items-center gap-4">
            <div className={isCompact ? 'md:hidden' : 'lg:hidden'}>
              <CartDropdown />
            </div>

            {user ? (
              <div className={userWrapperClass}>
                <Link href="/dashboard" className="block">
                  <img
                    src={user.avatar || user.photo_url || '/default-avatar.png'}
                    alt="Avatar del usuario"
                    className={isCompact ? 'w-10 h-10 rounded-full object-cover border border-white shadow' : 'w-12 h-12 rounded-full object-cover border-2 border-white shadow-lg'}
                  />
                </Link>
                <div className="hidden sm:flex flex-col leading-tight">
                  <span className={isCompact ? 'text-sm font-semibold text-slate-700' : 'text-lg font-semibold text-slate-700'}>
                    Hola, {userFirstName || 'invitado'}
                  </span>
                  {user.email && (
                    <span className="text-xs text-slate-500">{user.email}</span>
                  )}
                </div>
                {!isCompact && (
                  <button
                    onClick={handleLogout}
                    className="hidden md:inline-flex shrink-0 rounded-full border border-rose-300 bg-rose-100 px-5 py-2 text-base font-bold uppercase tracking-wide text-rose-700 hover:bg-rose-200 transition"
                  >
                    Salir
                  </button>
                )}
                {isCompact && (
                  <button
                    onClick={handleLogout}
                    className="hidden md:inline-flex items-center rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-rose-700 hover:bg-rose-200 transition"
                  >
                    Salir
                  </button>
                )}
              </div>
            ) : (
              <Link
                href="/login"
                className={`inline-flex items-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition ${isCompact ? 'px-5 py-2 text-sm font-semibold' : 'px-8 py-3 text-xl font-bold'}`}
              >
                Iniciar sesion
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className="lg:hidden inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-3 text-slate-700 shadow-md hover:bg-white transition"
              aria-expanded={mobileOpen}
              aria-label="Abrir menu"
            >
              <svg className="h-8 w-8" viewBox="0 0 20 20" fill="none">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <nav className={navClassName} aria-hidden={isCompact}>
          <div className="flex items-center gap-10">
            {navigation.map((item) => (
              <Link
                key={item.href}
                href={item.href}
                className="relative pb-1 transition hover:text-indigo-600 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-1 after:w-0 after:bg-indigo-600 after:transition-all"
              >
                {item.label}
              </Link>
            ))}
          </div>
          <div className="hidden lg:flex">
            <CartDropdown />
          </div>
        </nav>

        {mobileOpen && (
          <div className="lg:hidden border-t border-slate-200 pb-4">
            <form onSubmit={handleSearch} className="px-2 pt-4">
              <input
                type="search"
                value={search}
                onChange={(event) => setSearch(event.target.value)}
                placeholder="Buscar..."
                className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-lg shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/60 transition"
              />
            </form>
            <div className="flex flex-col gap-3 px-2 pt-4 text-xl text-slate-700">
              {navigation.map((item) => (
                <Link
                  key={item.href}
                  href={item.href}
                  className="rounded-xl bg-white/80 px-5 py-4 shadow hover:bg-indigo-50 transition font-semibold"
                  onClick={() => setMobileOpen(false)}
                >
                  {item.label}
                </Link>
              ))}
              {!user && (
                <Link
                  href="/register"
                  className="rounded-xl border border-indigo-300 bg-indigo-50 px-5 py-4 text-center font-bold text-indigo-700 hover:bg-indigo-100 transition"
                  onClick={() => setMobileOpen(false)}
                >
                  Crear cuenta
                </Link>
              )}
              {user && (
                <button
                  onClick={handleLogout}
                  className="rounded-xl border border-rose-300 bg-rose-100 px-5 py-4 text-left font-bold text-rose-700 hover:bg-rose-200 transition"
                >
                  Salir
                </button>
              )}
            </div>
          </div>
        )}
      </div>
    </header>
  );
};

export default Header;
