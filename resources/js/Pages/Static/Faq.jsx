import React from 'react';
import { Head } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import TopNavMenu from '@/Components/navigation/TopNavMenu.jsx';

const faqs = [
  {
    question: '¿Cómo puedo crear una cuenta?',
    answer: 'Haz clic en "Iniciar Sesión" y luego selecciona "Registrarse". Completa el formulario con tus datos y sigue las instrucciones.',
  },
  {
    question: '¿Cuáles son los métodos de pago aceptados?',
    answer: 'Aceptamos tarjetas de crédito, débito y pagos electrónicos seguros.',
  },
  {
    question: '¿Cómo hago seguimiento a mi pedido?',
    answer: 'Ingresa a tu panel de usuario y selecciona "Mis pedidos" para ver el estado y detalles de tus compras.',
  },
  {
    question: '¿Puedo devolver un producto?',
    answer: 'Sí, puedes solicitar una devolución dentro de los 14 días posteriores a la recepción del producto, siempre que esté en condiciones originales.',
  },
  {
    question: '¿Cómo contacto al soporte?',
    answer: 'Puedes escribirnos desde la página de contacto o al correo soporte@limoneo.com.',
  },
];

export default function Faq() {
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col">
      <Head title="Ayuda y Preguntas Frecuentes | Limoneo" />
      <Header />
      <TopNavMenu />
      <main className="flex-grow max-w-3xl mx-auto p-6">
        <h1 className="text-3xl font-bold text-indigo-700 mb-6 text-center">Ayuda y Preguntas Frecuentes</h1>
        <div className="space-y-6">
          {faqs.map((faq, idx) => (
            <div key={idx} className="bg-white rounded-xl shadow p-5">
              <h2 className="text-lg font-semibold text-indigo-600 mb-2">{faq.question}</h2>
              <p className="text-gray-700">{faq.answer}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center text-sm text-gray-500">
          ¿No encuentras tu respuesta? <a href="/contact" className="text-indigo-600 underline">Contáctanos aquí</a>.
        </div>
      </main>
    </div>
  );
}