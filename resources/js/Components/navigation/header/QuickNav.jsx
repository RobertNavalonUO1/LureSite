import React from 'react';
import clsx from 'clsx';
import { Link, usePage } from '@inertiajs/react';
import { useI18n } from '@/i18n';

function IconHome(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 10.5 12 4l8 6.5V20a1 1 0 0 1-1 1h-5v-6H10v6H5a1 1 0 0 1-1-1v-9.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconInfo(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path d="M12 10.5V17" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
      <path d="M12 7.5h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

function IconMail(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M4 6h16v12H4V6Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m4 7 8 6 8-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function IconHelp(props) {
  return (
    <svg viewBox="0 0 24 24" fill="none" aria-hidden="true" {...props}>
      <path
        d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20Z"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="M9.5 9.2a2.7 2.7 0 0 1 5.2.9c0 2-2.1 2.2-2.1 3.8"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
      <path d="M12 17.8h.01" stroke="currentColor" strokeWidth="3" strokeLinecap="round" />
    </svg>
  );
}

const ICON_BY_HREF = {
  '/': IconHome,
  '/about': IconInfo,
  '/contact': IconMail,
  '/faq': IconHelp,
};

/**
 * @param {{
 *  isCompact?: boolean,
 *  items: Array<{ label: string, href: string }>
 * }} props
 */
export default function QuickNav({ isCompact = false, items }) {
  const { url } = usePage();
  const { t } = useI18n();

  const containerClass = clsx(
    'hidden lg:flex items-center transition-all duration-300 ease-out',
    isCompact ? 'gap-2' : 'gap-8'
  );

  const linkBase = clsx(
    'inline-flex items-center gap-2 rounded-full transition-all duration-300',
    'text-slate-700 hover:text-indigo-700 hover:bg-indigo-50 focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60'
  );

  const iconClass = clsx('shrink-0', isCompact ? 'h-5 w-5' : 'h-6 w-6');

  const iconButtonClass = clsx(linkBase, isCompact ? 'p-2.5' : 'px-2 py-2');
  const textLinkClass = clsx(linkBase, 'px-2 py-2 font-semibold text-lg');

  return (
    <nav className={containerClass} aria-label={t('header.navigation.primary_aria')}>
      {items.map((item) => {
        const Icon = ICON_BY_HREF[item.href];
        const isActive = item.href === '/' ? url === '/' : url?.startsWith(item.href);

        if (isCompact) {
          return (
            <Link
              key={item.href}
              href={item.href}
              title={item.label}
              aria-label={item.label}
              className={clsx(
                iconButtonClass,
                isActive ? 'bg-indigo-100 text-indigo-800' : 'bg-white/60'
              )}
            >
              {Icon ? <Icon className={iconClass} /> : <span className="text-sm font-semibold">{item.label[0]}</span>}
              <span className="sr-only">{item.label}</span>
            </Link>
          );
        }

        return (
          <Link
            key={item.href}
            href={item.href}
            className={clsx(textLinkClass, isActive && 'text-indigo-700')}
          >
            {item.label}
          </Link>
        );
      })}
    </nav>
  );
}
