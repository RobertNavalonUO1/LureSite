import React from 'react';
import { Link } from '@inertiajs/react';
import clsx from 'clsx';

/**
 * @param {{
 *  isCompact?: boolean,
 *  brand: { name: string, logoSrc: string, logoAlt: string }
 * }} props
 */
export default function Brand({ isCompact = false, brand }) {
  const logoImageClass = clsx(
    'object-contain drop-shadow-sm',
    isCompact ? 'h-12 w-12' : 'h-16 w-16 sm:h-20 sm:w-20'
  );

  const logoTextClass = clsx(
    'hidden sm:block tracking-tight text-slate-900 transition-all duration-300',
    isCompact ? 'text-xl font-semibold' : 'text-3xl sm:text-4xl font-extrabold'
  );

  const linkClass = clsx(
    'flex items-center gap-3 tracking-tight text-slate-900',
    isCompact ? 'text-2xl font-bold' : 'text-4xl sm:text-5xl font-extrabold'
  );

  return (
    <Link href="/" className={linkClass}>
      <img src={brand.logoSrc} alt={brand.logoAlt} className={logoImageClass} />
      <span className={logoTextClass}>
        <span className="block text-slate-900">{brand.name}</span>
        <span className="storefront-kicker hidden text-[10px] font-semibold uppercase tracking-[0.34em] md:block">
          storefront
        </span>
      </span>
    </Link>
  );
}
