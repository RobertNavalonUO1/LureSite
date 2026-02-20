import React, { useEffect, useState } from 'react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import { useForm, usePage, Head } from '@inertiajs/react';

const Contact = () => {
  const { flash } = usePage().props;
  const [showFlash, setShowFlash] = useState(!!flash?.message);

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    if (flash?.message) {
      setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [flash]);

  const handleSubmit = (e) => {
    e.preventDefault();
    post('/contact', {
      onSuccess: () => reset(),
    });
  };

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      <Head title="Contacto" />
      <Header />
      <main className="flex-grow p-6 max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold text-center text-blue-700">Contacto</h1>
        <p className="mt-2 text-center text-gray-600">¿Tienes preguntas o sugerencias? ¡Estamos aquí para ayudarte!</p>

        {showFlash && (
          <div className="mt-4 bg-green-100 border border-green-400 text-green-700 px-4 py-3 rounded text-sm shadow">
            {flash.message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="bg-white rounded-lg shadow p-6 mt-6 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Nombre</label>
            <input
              type="text"
              value={data.name}
              onChange={e => setData('name', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2"
              required
            />
            {errors.name && <p className="text-sm text-red-600">{errors.name}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Correo electrónico</label>
            <input
              type="email"
              value={data.email}
              onChange={e => setData('email', e.target.value)}
              className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2"
              required
            />
            {errors.email && <p className="text-sm text-red-600">{errors.email}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">Mensaje</label>
            <textarea
              value={data.message}
              onChange={e => setData('message', e.target.value)}
              rows="5"
              className="mt-1 w-full rounded-md border border-gray-300 px-4 py-2"
              required
            />
            {errors.message && <p className="text-sm text-red-600">{errors.message}</p>}
          </div>

          <div className="text-right">
            <button
              type="submit"
              disabled={processing}
              className="bg-blue-600 text-white px-6 py-2 rounded hover:bg-blue-700 transition"
            >
              Enviar
            </button>
          </div>
        </form>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;