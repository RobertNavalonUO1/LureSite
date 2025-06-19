import React from 'react';
import Header from '../Components/Header';
import Footer from '../Components/Footer';

const Contact = () => {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />
            <main className="flex-grow bg-gray-100 p-6">
                <h1 className="text-4xl font-bold text-center">Contacto</h1>
                <p className="mt-4 text-center">Envíanos un mensaje si tienes alguna consulta.</p>
            </main>
            <Footer />
        </div>
    );
};

export default Contact;
