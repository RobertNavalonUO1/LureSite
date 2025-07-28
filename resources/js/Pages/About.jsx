import React from 'react';
import { Head, usePage } from '@inertiajs/react';
import TopNavMenu from '@/Components/TopNavMenu';
import CartDropdown from '@/Components/CartDropdown';

const About = () => {
  const { auth } = usePage().props;
  const user = auth?.user;

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Head title="Acerca de | WorldExpense" />

      {/* Header principal */}
      <header className="bg-indigo-600 text-white py-4 px-6 shadow-md z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">WorldExpense</h1>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/" className="hover:underline">Inicio</a>
            <a href="/contact" className="hover:underline">Contacto</a>
            <CartDropdown />
            {user && (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Hola, {user.name}</span>
                <a href="/dashboard">
                  <img
                    src={user.avatar || user.photo_url || '/default-avatar.png'}
                    alt="Avatar del usuario"
                    className="w-9 h-9 rounded-full border border-white object-cover shadow"
                  />
                </a>
              </div>
            )}
          </nav>
        </div>
      </header>

      <TopNavMenu />

      {/* Contenido principal */}
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-4xl font-extrabold text-indigo-700 mb-4 drop-shadow">Acerca de WorldExpense</h2>
          <p className="text-lg text-gray-700 mb-6">
            WorldExpense es una plataforma dedicada a ofrecerte los mejores productos del mercado, con una experiencia de usuario intuitiva, rápida y segura.
            Nuestro objetivo es facilitar tu proceso de compra, brindando transparencia, confianza y una atención personalizada.
          </p>

          <section className="my-6 text-left">
            <h3 className="text-2xl font-bold text-indigo-600 mb-2">¿Por qué elegirnos?</h3>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li><span className="font-semibold">Navegación clara:</span> Menús y filtros accesibles para encontrar lo que buscas fácilmente.</li>
              <li><span className="font-semibold">Proceso de compra simple:</span> Carrito y checkout optimizados para minimizar pasos y errores.</li>
              <li><span className="font-semibold">Seguridad y privacidad:</span> Tus datos están protegidos y nunca se comparten con terceros.</li>
              <li><span className="font-semibold">Soporte rápido:</span> Atención al cliente disponible para resolver tus dudas.</li>
              <li><span className="font-semibold">Ofertas y novedades:</span> Acceso a promociones exclusivas y productos recién llegados.</li>
            </ul>
          </section>

          <section className="my-6 text-left bg-indigo-50 border-l-4 border-indigo-400 p-4 rounded">
            <h4 className="font-bold text-indigo-700 mb-1">Nota UX:</h4>
            <p className="text-indigo-800 text-sm">
              Esta página ha sido diseñada siguiendo principios de usabilidad y accesibilidad: contraste de colores, tipografía legible, estructura clara y navegación consistente.
              Nuestro objetivo es que cualquier usuario, sin importar su experiencia digital, pueda comprar de forma cómoda y segura.
            </p>
          </section>

          <p className="text-gray-500 text-sm mt-8">
            Gracias por confiar en WorldExpense. ¡Tu satisfacción es nuestra prioridad!
          </p>
        </div>
      </main>
    </div>
  );
};

export default About;
