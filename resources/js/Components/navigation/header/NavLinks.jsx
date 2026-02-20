import React from 'react';
import { Link } from '@inertiajs/react';
import clsx from 'clsx';

/**
 * @param {{
 *  isCompact?: boolean,
 *  items: Array<{ label: string, href: string }>,
 *  right?: React.ReactNode
 * }} props
 */
export default function NavLinks({ isCompact = false, items, right = null }) {
  const navClass = clsx(
    'hidden lg:flex items-center justify-between border-t border-slate-200 text-xl text-slate-700 transition-all duration-300 ease-out origin-top transform',
    isCompact ? 'py-0 opacity-0 scale-y-0 pointer-events-none' : 'py-3 opacity-100 scale-y-100 pointer-events-auto'
  );

  return (
    <nav className={navClass} aria-hidden={isCompact}>
      <div className="flex items-center gap-10">
        {items.map((item) => (
          <Link
            key={item.href}
            href={item.href}
            className="relative pb-1 transition hover:text-indigo-600 hover:after:w-full after:content-[''] after:absolute after:left-0 after:bottom-0 after:h-1 after:w-0 after:bg-indigo-600 after:transition-all"
          >
            {item.label}
          </Link>
        ))}
      </div>

      <div className="hidden lg:flex">{right}</div>
    </nav>
  );
}
