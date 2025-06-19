import React from 'react';
import { Link } from '@inertiajs/react';


const Header = () => {
    return (
        <header className="bg-blue-600 text-white py-4 shadow-md">
            <div className="container mx-auto flex justify-between items-center">
                <div className="text-2xl font-semibold">
                    <Link href="/" className="text-white">Mi Aplicación</Link>
                </div>
                <nav>
                    <ul className="flex space-x-6">
                        <li><Link href="/" className="hover:text-gray-200">Inicio</Link></li>
                        <li><Link href="/about" className="hover:text-gray-200">Acerca de</Link></li>
                        <li><Link href="/contact" className="hover:text-gray-200">Contacto</Link></li>
                    </ul>
                </nav>
            </div>
        </header>
    );
};

export default Header;
