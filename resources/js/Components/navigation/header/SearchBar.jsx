import React from 'react';
import clsx from 'clsx';

/**
 * @param {{
 *  isCompact?: boolean,
 *  value: string,
 *  onChange: (value: string) => void,
 *  onSubmit: (e: React.FormEvent) => void,
 *  placeholder?: string
 * }} props
 */
export default function SearchBar({
  isCompact = false,
  value,
  onChange,
  onSubmit,
  placeholder = 'Buscar productos, categorías o marcas',
  submitLabel = 'Buscar',
}) {
  const formClass = clsx(
    'hidden transition-all duration-300 ease-out',
    isCompact ? 'md:flex flex-1' : 'lg:flex flex-1'
  );

  const wrapperClass = clsx(
    'relative w-full transition-all duration-300 ease-out',
    isCompact
      ? 'max-w-[12rem] sm:max-w-[14rem] md:max-w-[32rem] focus-within:max-w-[36rem]'
      : 'max-w-xl'
  );

  const inputClass = clsx(
    'w-full rounded-full border border-slate-200 text-slate-700 shadow-md focus:border-indigo-500 focus:ring-2 focus:ring-indigo-400/60 transition-all duration-300',
    isCompact ? 'bg-white/60 px-4 pr-14 py-2 text-sm' : 'bg-white/80 px-6 pr-20 py-4 text-xl'
  );

  const buttonClass = clsx(
    'absolute flex items-center justify-center rounded-full bg-indigo-600 text-white hover:bg-indigo-700 transition',
    isCompact ? 'inset-y-1 right-1 px-3 py-1.5 text-xs font-semibold' : 'inset-y-2 right-2 px-8 py-3 text-lg font-bold uppercase tracking-wide'
  );

  return (
    <form onSubmit={onSubmit} className={formClass}>
      <div className={wrapperClass}>
        <input
          type="search"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={inputClass}
        />
        <button type="submit" className={buttonClass}>
          {isCompact ? (
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
              <path
                d="m21 21-4.3-4.3m1.8-5.2a7 7 0 1 1-14 0 7 7 0 0 1 14 0Z"
                stroke="currentColor"
                strokeWidth="1.8"
                strokeLinecap="round"
              />
            </svg>
          ) : (
            submitLabel
          )}
        </button>
      </div>
    </form>
  );
}
