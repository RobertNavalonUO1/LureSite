import React from 'react';
import clsx from 'clsx';

/**
 * @typedef {{
 *  id: number,
 *  name: string,
 *  email?: string,
 *  avatar?: string,
 *  photo_url?: string
 * }} AuthUser
 */

/**
 * @param {{
 *  isCompact?: boolean,
 *  user: AuthUser,
 *  onGoDashboard: () => void,
 *  onLogout: () => void
 * }} props
 */
export default function UserPanel({ isCompact = false, user, onGoDashboard, onLogout }) {
  const firstName = user?.name ? user.name.split(' ')[0] : '';

  const wrapperClass = clsx(
    'flex items-center gap-3 rounded-full border border-slate-200 bg-white/80 shadow-md transition cursor-pointer',
    'hover:bg-indigo-50 hover:shadow-lg focus:outline-none focus-visible:ring-2 focus-visible:ring-indigo-400/60',
    isCompact ? 'px-3 py-1.5' : 'px-4 py-2'
  );

  const avatarClass = clsx(
    'rounded-full object-cover shadow',
    isCompact ? 'w-10 h-10 border border-white' : 'w-12 h-12 border-2 border-white shadow-lg'
  );

  const logoutClass = clsx(
    'hidden md:inline-flex shrink-0 rounded-full border border-rose-300 bg-rose-100 text-rose-700 hover:bg-rose-200 transition',
    isCompact
      ? 'items-center px-3 py-1 text-xs font-semibold uppercase tracking-wide'
      : 'px-5 py-2 text-base font-bold uppercase tracking-wide'
  );

  const logoutIconClass = clsx(
    'inline-flex items-center justify-center rounded-full border border-rose-200 bg-rose-50 text-rose-700 transition',
    'hover:bg-rose-100 hover:border-rose-300 focus:outline-none focus-visible:ring-2 focus-visible:ring-rose-300/60',
    isCompact ? 'h-9 w-9' : 'hidden'
  );

  return (
    <div
      className={wrapperClass}
      role="link"
      tabIndex={0}
      aria-label="Ir al panel de usuario"
      onClick={onGoDashboard}
      onKeyDown={(e) => {
        if (e.key === 'Enter' || e.key === ' ' || e.key === 'Spacebar') {
          e.preventDefault();
          onGoDashboard();
        }
      }}
    >
      <img
        src={user.avatar || user.photo_url || '/default-avatar.png'}
        alt="Avatar del usuario"
        className={avatarClass}
      />

      {isCompact ? (
        <span className="hidden sm:inline text-sm font-semibold text-slate-700">Perfil</span>
      ) : (
        <div className="hidden sm:flex flex-col leading-tight">
          <span className={clsx(isCompact ? 'text-sm' : 'text-lg', 'font-semibold text-slate-700')}>
            Hola, {firstName || 'invitado'}
          </span>
          {user.email && <span className="text-xs text-slate-500">{user.email}</span>}
        </div>
      )}

      {isCompact ? (
        <button
          type="button"
          aria-label="Salir"
          title="Salir"
          onClick={(e) => {
            e.stopPropagation();
            onLogout();
          }}
          className={logoutIconClass}
        >
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path
              d="M10 7V6a2 2 0 0 1 2-2h7v16h-7a2 2 0 0 1-2-2v-1"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
            <path
              d="M4 12h9m0 0-3-3m3 3-3 3"
              stroke="currentColor"
              strokeWidth="1.8"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </button>
      ) : (
        <button
          onClick={(e) => {
            e.stopPropagation();
            onLogout();
          }}
          className={logoutClass}
        >
          Salir
        </button>
      )}
    </div>
  );
}
