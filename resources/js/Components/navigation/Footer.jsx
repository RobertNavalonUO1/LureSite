// src/components/Footer.jsx
import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#111827] text-white relative z-10 mt-20">
      <div className="max-w-7xl mx-auto px-6 py-16 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-12">

        {/* LOGO y descripción */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="bg-gradient-to-r from-purple-500 to-blue-500 rounded-full p-2">
              <svg
                className="w-6 h-6 text-white"
                fill="none"
                stroke="currentColor"
                strokeWidth={2}
                viewBox="0 0 24 24"
              >
                <path d="M12 2L2 7l10 5 10-5-10-5z" />
                <path d="M2 17l10 5 10-5" />
                <path d="M2 12l10 5 10-5" />
              </svg>
            </div>
            <h1 className="text-2xl font-extrabold tracking-tight">Limoneo</h1>
          </div>
          <p className="text-sm text-gray-400 leading-relaxed">
            Impulsamos tu experiencia de compra online. Productos globales, soporte local, confianza total.
          </p>
        </div>

        {/* Enlaces rápidos */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Explorar</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="/" className="hover:text-white transition">Inicio</a></li>
            <li><a href="/products" className="hover:text-white transition">Productos</a></li>
            <li><a href="/about" className="hover:text-white transition">Acerca de</a></li>
            <li><a href="/contact" className="hover:text-white transition">Contacto</a></li>
          </ul>
        </div>

        {/* Información Legal */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Legal</h2>
          <ul className="space-y-2 text-sm text-gray-300">
            <li><a href="/privacy" className="hover:text-white transition">Política de Privacidad</a></li>
            <li><a href="/terms" className="hover:text-white transition">Términos de Servicio</a></li>
            <li><a href="/cookies" className="hover:text-white transition">Política de Cookies</a></li>
          </ul>
        </div>

        {/* Redes sociales + contacto */}
        <div>
          <h2 className="text-lg font-semibold mb-4">Síguenos</h2>
          <div className="flex space-x-4 mb-6">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook"
              className="bg-white/10 p-2 rounded-full hover:bg-blue-600 transition">
              <Facebook className="w-5 h-5 text-white" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter"
              className="bg-white/10 p-2 rounded-full hover:bg-sky-500 transition">
              <Twitter className="w-5 h-5 text-white" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram"
              className="bg-white/10 p-2 rounded-full hover:bg-pink-500 transition">
              <Instagram className="w-5 h-5 text-white" />
            </a>
          </div>

          <h3 className="text-sm text-gray-400">Contáctanos</h3>
          <p className="text-sm text-gray-300">info@limoneo.com</p>
          <p className="text-sm text-gray-300">+34 123 456 789</p>
        </div>
      </div>

      {/* Línea inferior */}
      <div className="border-t border-white/10 mt-10 pt-6 text-center text-sm text-gray-500">
        &copy; {new Date().getFullYear()} Limoneo. Todos los derechos reservados.
      </div>

      {/* Decorativo de fondo */}
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none overflow-hidden">
        <div className="absolute bottom-0 left-0 w-72 h-72 bg-gradient-to-tr from-indigo-500/30 to-transparent rounded-full blur-3xl" />
        <div className="absolute top-0 right-0 w-64 h-64 bg-gradient-to-br from-blue-400/20 to-transparent rounded-full blur-2xl" />
      </div>
    </footer>
  );
};

export default Footer;
