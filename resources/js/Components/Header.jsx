import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import CartDropdown from './CartDropdown';
import axios from 'axios';

const Header = () => {
  const { auth } = usePage().props;
  const user = auth?.user;

  const handleLogout = async () => {
    try {
      await axios.post('/logout');
      window.location.href = '/';
    } catch (error) {
      console.error('Error al cerrar sesión:', error);
    }
  };

  return (
    <header className="bg-white border-b shadow-sm sticky top-0 z-40">
      <div className="max-w-7xl mx-auto flex items-center justify-between px-6 py-4">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 text-indigo-700 font-serif text-2xl font-semibold">
          <img src="/images/logo.png" alt="WorldExpense Logo" className="w-9 h-9" />
          WorldExpense
        </Link>

        {/* Navegación */}
        <nav className="flex items-center gap-4 text-sm font-medium text-slate-700">
          <Link href="/about" className="hover:text-indigo-600 transition">Acerca</Link>
          <Link href="/contact" className="hover:text-indigo-600 transition">Contacto</Link>
          <Link href="/faq" className="hover:text-indigo-600 transition">Ayuda</Link>
          <CartDropdown />

          {user ? (
            <div className="flex items-center gap-2">
              <span className="hidden sm:inline">¡Hola, {user.name}!</span>
              <Link href="/dashboard">
                <img
                  src={user.avatar || user.photo_url || '/default-avatar.png'}
                  alt="Avatar del usuario"
                  className="w-9 h-9 rounded-full object-cover border border-white shadow-sm"
                />
              </Link>
              <button
                onClick={handleLogout}
                className="bg-rose-100 text-rose-700 px-3 py-1 rounded-full hover:bg-rose-200 transition text-sm"
              >
                Salir
              </button>
            </div>
          ) : (
            <Link
              href="/login"
              className="bg-indigo-600 text-white px-4 py-2 rounded-full hover:bg-indigo-700 transition"
            >
              Iniciar Sesión
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
};

export default Header;
