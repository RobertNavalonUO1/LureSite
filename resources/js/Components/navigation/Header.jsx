import React from 'react';
import clsx from 'clsx';
import { Link, router, usePage } from '@inertiajs/react';

import CartDropdown from '@/Components/cart/CartDropdown.jsx';
import site from '@/config/site';
import { goToDashboard, goToSearch, logout } from '@/utils/navigation';

import TopBanner from './header/TopBanner';
import Brand from './header/Brand';
import QuickNav from './header/QuickNav';
import SearchBar from './header/SearchBar';
import UserPanel from './header/UserPanel';
import MobileMenu from './header/MobileMenu';
import { useI18n } from '@/i18n';
import useScrollCompact from '@/hooks/useScrollCompact.js';

const Header = ({ isCompact: isCompactProp }) => {
  const { auth, locale, locales } = usePage().props;
  const { t } = useI18n();
  const user = auth?.user;
  const [mobileOpen, setMobileOpen] = React.useState(false);
  const [search, setSearch] = React.useState('');
  const autoCompact = useScrollCompact({ disabled: typeof isCompactProp === 'boolean' });
  const isCompact = typeof isCompactProp === 'boolean' ? isCompactProp : autoCompact;

  React.useEffect(() => {
    const root = document.documentElement;
    if (!root) return;

    root.style.setProperty(
      '--header-sticky-height',
      'var(--header-sticky-height-expanded)'
    );

    root.style.setProperty(
      '--header-compact-offset-active',
      isCompact ? 'var(--header-compact-offset)' : '0px'
    );
  }, [isCompact]);

  React.useEffect(() => {
    return () => {
      const root = document.documentElement;
      if (!root) return;
      root.style.setProperty('--header-sticky-height', 'var(--header-sticky-height-expanded)');
      root.style.setProperty('--header-compact-offset-active', '0px');
    };
  }, []);

  const styles = {
    header: clsx(
      'sticky top-0 z-50 backdrop-blur transition-all duration-300',
      isCompact
        ? 'border-b border-amber-100/80 bg-[rgba(255,251,235,0.8)] shadow-lg'
        : 'border-b border-amber-100 bg-[rgba(255,253,247,0.92)] shadow-sm'
    ),
    rowPadding: isCompact ? 'py-2 md:py-2.5' : 'py-2.5 md:py-3',
    rowScale: isCompact ? 'scale-[0.98] md:scale-[0.96]' : 'scale-100',
    rowGap: isCompact ? 'gap-2 md:gap-3' : 'gap-3 md:gap-4',
    rowWrap: isCompact ? 'flex-nowrap' : 'flex-wrap',
    sideGap: isCompact ? 'gap-2 md:gap-3' : 'gap-3 md:gap-4',
    loginButton: clsx(
      'inline-flex items-center rounded-full bg-amber-600 text-white shadow-md transition hover:bg-amber-700',
      isCompact
        ? 'px-4 py-2 text-sm font-semibold sm:px-5 sm:py-2.5 sm:text-base'
        : 'px-5 py-2.5 text-base font-bold sm:px-7 sm:py-2.5 sm:text-lg'
    ),
    menuButton: clsx(
      'lg:hidden inline-flex items-center justify-center rounded-full border border-amber-100 bg-white/90 text-slate-700 shadow-md hover:bg-white transition',
      isCompact ? 'p-2.5' : 'p-3'
    ),
    localeSelect: clsx(
      'hidden sm:block rounded-full border border-amber-100 bg-white/90 text-slate-700 shadow-sm hover:bg-white transition',
      isCompact ? 'px-2.5 py-1.5 text-xs font-semibold' : 'px-3 py-2 text-sm font-semibold'
    ),
  };

  const handleLogout = () => {
    logout();
  };

  const currentLocale = locale || 'es';
  const availableLocales = Array.isArray(locales) && locales.length ? locales : ['es', 'en', 'fr'];
  const localizedPromo = React.useMemo(() => ({
    label: t(site.promo.labelKey),
    highlight: t(site.promo.highlightKey),
    suffix: t(site.promo.suffixKey),
  }), [t]);
  const localizedSupport = React.useMemo(() => ({
    primaryLabel: t(site.support.primaryLabelKey),
    primaryHref: site.support.primaryHref,
    secondaryLabel: t(site.support.secondaryLabelKey),
    secondaryHref: site.support.secondaryHref,
  }), [t]);
  const localizedNavigation = React.useMemo(() => (
    site.navigation.map((item) => ({
      ...item,
      label: t(item.labelKey),
    }))
  ), [t]);

  const handleLocaleChange = (event) => {
    const nextLocale = event.target.value;
    router.post(route('locale.update'), { locale: nextLocale }, { preserveScroll: true, preserveState: true });
  };

  const handleSearchSubmit = (event) => {
    event.preventDefault();
    goToSearch(search);
    setMobileOpen(false);
  };

  return (
    <header className={styles.header} style={{ overflowAnchor: 'none' }}>
      <div className="relative h-[var(--header-sticky-height-expanded)] overflow-hidden">
        {!isCompact ? (
          <div className="absolute inset-x-0 top-0 hidden h-12 transition-all duration-300 md:block">
            <TopBanner isCompact={false} promo={localizedPromo} support={localizedSupport} />
          </div>
        ) : null}

        <div
          className={clsx(
            'absolute inset-x-0 top-0 mx-auto max-w-full transition-all duration-300 will-change-transform',
            isCompact ? 'px-2 sm:px-3' : 'px-2 sm:px-4',
            isCompact
              ? 'h-[var(--header-sticky-height-compact)]'
              : 'h-full md:top-12 md:h-[calc(var(--header-sticky-height-expanded)-3rem)]'
          )}
        >
          <div
            className={clsx(
              'flex h-full min-h-0 items-center justify-between transition-all duration-300 will-change-transform origin-top',
              styles.rowPadding,
              styles.rowGap,
              styles.rowWrap,
              styles.rowScale
            )}
          >
            <div className={clsx('flex min-w-0 shrink-0 items-center', styles.sideGap)}>
              <Brand isCompact={isCompact} brand={site.brand} />
              <QuickNav isCompact={isCompact} items={localizedNavigation} />
            </div>

            <SearchBar
              isCompact={isCompact}
              value={search}
              onChange={setSearch}
              onSubmit={handleSearchSubmit}
              placeholder={t('header.search_placeholder')}
              submitLabel={t('header.search_submit')}
            />

            <div className={clsx('flex shrink-0 items-center', styles.sideGap)}>
              <CartDropdown />

              <select
                aria-label={t('common.change_language')}
                value={currentLocale}
                onChange={handleLocaleChange}
                className={styles.localeSelect}
              >
                {availableLocales.map((value) => (
                  <option key={value} value={value}>
                    {value.toUpperCase()}
                  </option>
                ))}
              </select>

              {user ? (
                <UserPanel
                  isCompact={isCompact}
                  user={user}
                  onGoDashboard={() => goToDashboard()}
                  onLogout={handleLogout}
                />
              ) : (
                <Link href="/login" className={styles.loginButton}>
                  {t('auth.login')}
                </Link>
              )}

              <button
                type="button"
                onClick={() => setMobileOpen((open) => !open)}
                className={styles.menuButton}
                aria-expanded={mobileOpen}
                aria-label={t('common.open_menu')}
              >
                <svg className="h-8 w-8" viewBox="0 0 20 20" fill="none">
                  <path d="M3 6h14M3 10h14M3 14h14" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>

      <MobileMenu
        open={mobileOpen}
        search={search}
        onSearchChange={setSearch}
        onSearchSubmit={handleSearchSubmit}
        items={localizedNavigation}
        user={user}
        onLogout={handleLogout}
        onClose={() => setMobileOpen(false)}
      />
    </header>
  );
};

export default Header;
