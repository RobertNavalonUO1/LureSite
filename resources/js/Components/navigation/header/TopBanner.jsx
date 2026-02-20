import React from 'react';
import clsx from 'clsx';

/**
 * @param {{
 *  isCompact?: boolean,
 *  promo: { label: string, highlight: string, suffix: string },
 *  support: { phoneDisplay: string, phoneTel: string, email: string }
 * }} props
 */
export default function TopBanner({ isCompact = false, promo, support }) {
  const outerClass = clsx(
    'hidden md:block overflow-hidden bg-gradient-to-r from-slate-900 via-indigo-900 to-slate-900 text-slate-100 text-xs transition-all duration-300',
    isCompact ? 'max-h-0 opacity-0' : 'max-h-16 opacity-100'
  );

  const innerClass = clsx(
    'max-w-full mx-auto flex flex-col md:flex-row items-center justify-between px-4 gap-2 transition-all duration-300',
    isCompact ? 'py-0' : 'py-3'
  );

  return (
    <div className={outerClass} aria-hidden={isCompact}>
      <div className={innerClass}>
        <span className="uppercase tracking-wide font-bold text-lg md:text-xl">
          {promo.label}{' '}
          <span className="text-pink-200">{promo.highlight}</span>{' '}
          {promo.suffix}
        </span>
        <div className="flex flex-col md:flex-row items-center gap-4 md:gap-6 text-base md:text-lg">
          <a href={`tel:${support.phoneTel}`} className="hover:text-indigo-200 transition font-semibold">
            Soporte 24/7 <span className="hidden sm:inline">{support.phoneDisplay}</span>
          </a>
          <a href={`mailto:${support.email}`} className="hover:text-indigo-200 transition font-semibold">
            {support.email}
          </a>
        </div>
      </div>
    </div>
  );
}
