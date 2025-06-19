import React from 'react';
import { Head } from '@inertiajs/react';

const Layout = ({ children }) => {
    return (
        <div className="flex flex-col min-h-screen bg-gray-50">
            <Head>
                <title>Mi Aplicación</title>
            </Head>
            <header className="bg-blue-600 text-white py-4 px-6">
                <h1 className="text-xl font-bold">Mi Aplicación</h1>
            </header>
            <main className="flex-grow p-6">
                {children}
            </main>
            <footer className="bg-gray-800 text-white py-4 text-center">
                <p>&copy; 2023 Mi Aplicación. Todos los derechos reservados.</p>
            </footer>
        </div>
    );
};

export default Layout;
