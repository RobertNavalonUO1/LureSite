import React from 'react';
import clsx from 'clsx';
import { Link, usePage } from '@inertiajs/react';

import CartDropdown from '@/Components/cart/CartDropdown.jsx';
import site from '@/config/site';
import { goToDashboard, goToSearch, logout } from '@/utils/navigation';

import TopBanner from './header/TopBanner';
import Brand from './header/Brand';
import QuickNav from './header/QuickNav';
import SearchBar from './header/SearchBar';
import UserPanel from './header/UserPanel';
import MobileMenu from './header/MobileMenu';

const Header = ({ isCompact: isCompactProp = false }) => {
  const { auth } = usePage().props;
  const user = auth?.user;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const [isScrolledCompact, setIsScrolledCompact] = React.useState(false);
  const headerRef = React.useRef(null);

  React.useEffect(() => {
    if (isCompactProp) return;

    let ticking = false;

    // Hysteresis to avoid infinite toggling when header height changes near the threshold.
    // Enter compact after scrolling past ENTER_Y, exit only when going back above EXIT_Y.
    const ENTER_Y = 120;
    const EXIT_Y = 60;

    const update = () => {
      const y = window.scrollY;
      setIsScrolledCompact((prev) => {
        if (prev) return y > EXIT_Y;
        return y > ENTER_Y;
      });
      ticking = false;
    };

    const onScroll = () => {
      if (ticking) return;
      ticking = true;
      window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener('scroll', onScroll, { passive: true });
    return () => window.removeEventListener('scroll', onScroll);
  }, [isCompactProp]);

  const isCompact = isCompactProp || isScrolledCompact;

  React.useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    if (isCompact) {
      root.dataset.headerCompact = '1';
    } else {
      delete root.dataset.headerCompact;
    }

    window.dispatchEvent(new CustomEvent('header:compact', { detail: { compact: isCompact } }));
  }, [isCompact]);

  React.useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    const updateHeight = () => {
      const height = headerRef.current?.offsetHeight ?? 0;
      root.style.setProperty('--header-sticky-height', `${height}px`);
    };

    updateHeight();

    const observer = new ResizeObserver(updateHeight);
    if (headerRef.current) observer.observe(headerRef.current);
    window.addEventListener('resize', updateHeight);

    return () => {
      observer.disconnect();
      window.removeEventListener('resize', updateHeight);
    };
  }, [isCompact, mobileOpen]);

  const styles = {
    header: clsx(
      'sticky top-0 z-50 backdrop-blur transition-all duration-300',
      isCompact
        ? 'bg-white/70 shadow-lg border-b border-slate-200/70'
        : 'bg-white/90 border-b border-slate-200 shadow-sm'
    ),
    mainPadding: isCompact ? 'py-3' : 'py-5',
    loginButton: clsx(
      'inline-flex items-center rounded-full bg-indigo-600 text-white shadow-md hover:bg-indigo-700 transition',
      isCompact ? 'px-5 py-2 text-sm font-semibold' : 'px-5 py-2.5 text-base font-bold sm:px-8 sm:py-3 sm:text-xl'
    ),
    menuButton:
      'lg:hidden inline-flex items-center justify-center rounded-full border border-slate-200 bg-white/80 p-3 text-slate-700 shadow-md hover:bg-white transition',
  };

  const handleLogout = () => {
    logout();
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    goToSearch(search);
    setMobileOpen(false);
  };

  return (
    <header ref={headerRef} className={styles.header}>
      <TopBanner isCompact={isCompact} promo={site.promo} support={site.support} />

      <div className="max-w-full mx-auto px-2 sm:px-4">
        <div
          className={clsx('flex flex-wrap items-center justify-between gap-4 transition-all duration-300', styles.mainPadding)}
        >
          <div className="flex items-center gap-4">
            <Brand isCompact={isCompact} brand={site.brand} />
            <QuickNav isCompact={isCompact} items={site.navigation} />
          </div>

          <SearchBar isCompact={isCompact} value={search} onChange={setSearch} onSubmit={handleSearchSubmit} />

          <div className="flex items-center gap-2 sm:gap-4">
            <CartDropdown />

            {user ? (
              <UserPanel
                isCompact={isCompact}
                user={user}
                onGoDashboard={() => goToDashboard()}
                onLogout={handleLogout}
              />
            ) : (
              <Link href="/login" className={styles.loginButton}>
                Iniciar sesion
              </Link>
            )}

            <button
              type="button"
              onClick={() => setMobileOpen((open) => !open)}
              className={styles.menuButton}
              aria-expanded={mobileOpen}
              aria-label="Abrir menu"
            >
              <svg className="h-8 w-8" viewBox="0 0 20 20" fill="none">
                <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
              </svg>
            </button>
          </div>
        </div>

        <MobileMenu
          open={mobileOpen}
          search={search}
          onSearchChange={setSearch}
          onSearchSubmit={handleSearchSubmit}
          items={site.navigation}
          user={user}
          onLogout={handleLogout}
          onClose={() => setMobileOpen(false)}
        />
      </div>
    </header>
  );
};

export default Header;