import React from 'react';
import { Link, usePage } from '@inertiajs/react';
import UserDropdown from './UserDropdown';
import CartDropdown from './CartDropdown';

const Header = () => {
  const { auth } = usePage().props;
  const user = auth.user;

  return (
    <header className="bg-blue-600 text-white shadow-md sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex items-center justify-between h-16">
        {/* Logo */}
        <div className="text-xl font-bold tracking-tight">
          <Link href="/" className="text-white hover:text-gray-100 transition">
            WorldExpense
          </Link>
        </div>

        {/* Navegación */}
        <nav className="hidden md:flex items-center gap-6 text-sm font-medium">
          <Link href="/" className="hover:text-gray-200 transition">Inicio</Link>
          <Link href="/about" className="hover:text-gray-200 transition">Acerca de</Link>
          <Link href="/contact" className="hover:text-gray-200 transition">Contacto</Link>
        </nav>

        {/* Acciones usuario */}
        <div className="flex items-center gap-4">
          <CartDropdown />

          {user ? (
            <UserDropdown user={user} />
          ) : (
            <Link
              href="/login"
              className="bg-white text-blue-600 px-4 py-2 rounded-md hover:bg-blue-100 transition text-sm font-semibold"
            >
              Iniciar sesión
            </Link>
          )}
        </div>
      </div>
    </header>
  );
};

export default Header;
