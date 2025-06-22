// src/components/Footer.jsx
import React from 'react';
import { Facebook, Twitter, Instagram } from 'lucide-react';

const Footer = () => {
  return (
    <footer className="bg-[#1B1B1B] text-white py-10 px-6 mt-12">
      <div className="max-w-7xl mx-auto grid grid-cols-1 md:grid-cols-4 gap-8">
        <div>
          <h2 className="text-xl font-semibold mb-4">Contacto</h2>
          <p className="text-sm">info@example.com</p>
          <p className="text-sm">+34 123 456 789</p>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Enlaces</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="/" className="hover:underline">Inicio</a></li>
            <li><a href="/products" className="hover:underline">Productos</a></li>
            <li><a href="/about" className="hover:underline">Acerca de</a></li>
            <li><a href="/contact" className="hover:underline">Contacto</a></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Legal</h2>
          <ul className="space-y-2 text-sm">
            <li><a href="/privacy" className="hover:underline">Privacidad</a></li>
            <li><a href="/terms" className="hover:underline">Términos</a></li>
          </ul>
        </div>
        <div>
          <h2 className="text-xl font-semibold mb-4">Síguenos</h2>
          <div className="flex space-x-4">
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" aria-label="Facebook">
              <Facebook className="w-6 h-6 hover:text-blue-400 transition" />
            </a>
            <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" aria-label="Twitter">
              <Twitter className="w-6 h-6 hover:text-blue-400 transition" />
            </a>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" aria-label="Instagram">
              <Instagram className="w-6 h-6 hover:text-pink-400 transition" />
            </a>
          </div>
        </div>
      </div>
      <div className="text-center text-sm text-gray-400 mt-8">&copy; {new Date().getFullYear()} Mi Empresa. Todos los derechos reservados.</div>
    </footer>
  );
};

export default Footer;
