import React from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import { useI18n } from '@/i18n';

/**
 * @param {{
 *  open: boolean,
 *  search: string,
 *  onSearchChange: (value: string) => void,
 *  onSearchSubmit: (e: React.FormEvent) => void,
 *  items: Array<{ label: string, href: string }>,
 *  user: any,
 *  onLogout: () => void,
 *  onClose: () => void
 * }} props
 */
export default function MobileMenu({
  open,
  search,
  onSearchChange,
  onSearchSubmit,
  items,
  user,
  onLogout,
  onClose,
}) {
  if (!open) return null;

  const { locale, locales } = usePage().props;
  const { t } = useI18n();
  const currentLocale = locale || 'es';
  const availableLocales = Array.isArray(locales) && locales.length ? locales : ['es', 'en', 'fr'];

  const handleLocaleChange = (event) => {
    const nextLocale = event.target.value;
    router.post(route('locale.update'), { locale: nextLocale }, { preserveScroll: true, preserveState: true });
  };

  return (
    <div className="lg:hidden border-t border-slate-200 pb-4">
      <form onSubmit={onSearchSubmit} className="px-2 pt-4">
        <input
          type="search"
          value={search}
          onChange={(e) => onSearchChange(e.target.value)}
          placeholder={t('common.search_placeholder')}
          className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-lg shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/60 transition"
        />
      </form>

      <div className="flex flex-col gap-3 px-2 pt-4 text-xl text-slate-700">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="rounded-xl bg-white/80 px-5 py-4 shadow hover:bg-indigo-50 transition font-semibold"
            onClick={onClose}
          >
            {item.label}
          </Link>
        ))}

        {!user && (
          <Link
            href="/register"
            className="rounded-xl border border-indigo-300 bg-indigo-50 px-5 py-4 text-center font-bold text-indigo-700 hover:bg-indigo-100 transition"
            onClick={onClose}
          >
            {t('auth.register')}
          </Link>
        )}

        {user && (
          <button
            onClick={() => {
              onClose();
              onLogout();
            }}
            className="rounded-xl border border-rose-300 bg-rose-100 px-5 py-4 text-left font-bold text-rose-700 hover:bg-rose-200 transition"
          >
            {t('auth.logout')}
          </button>
        )}

        <div className="pt-2">
          <label className="block text-sm font-semibold text-slate-600 mb-2">{t('common.language')}</label>
          <select
            aria-label={t('common.change_language')}
            value={currentLocale}
            onChange={handleLocaleChange}
            className="w-full rounded-xl border border-slate-200 bg-white px-5 py-4 text-lg shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/60 transition"
          >
            {availableLocales.map((value) => (
              <option key={value} value={value}>
                {value.toUpperCase()}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
}
