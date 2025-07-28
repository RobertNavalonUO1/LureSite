import React, { useState, useEffect, useMemo } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage, Head } from '@inertiajs/react';

import CartDropdown from '@/Components/CartDropdown';
import Header from '@/Components/Header';
import LoginModal from '@/Components/LoginModal';
import RegistrarModal from '@/Components/RegistrarModal';
import ForgotPassword from '@/Components/ForgotPassword';
import TopNavMenu from '@/Components/TopNavMenu';
import CookieConsentModal from '@/Components/CookieConsentModal';
import CustomizeCookiesModal from '@/Components/CustomizeCookiesModal';
import UI_CONFIG from '@/config/ui.config';

const NewArrivals = () => {
  const { auth } = usePage().props;
  const user = auth?.user;

  const [modalMessage, setModalMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const [selectedCategory, setSelectedCategory] = useState('all');

  useEffect(() => {
    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted && UI_CONFIG.cookies.showConsentByDefault) {
      setShowCookiesModal(true);
    }
  }, []);

  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setShowCookiesModal(false);
  };

  const handleRejectCookies = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setShowCookiesModal(false);
  };

  const handleCustomize = () => {
    setShowCustomizeModal(true);
    setShowCookiesModal(false);
  };

  const handleLogout = () => {
    Inertia.post('/logout');
  };

  const modalClass = useMemo(() => (
    modalMessage.includes('error') ? 'bg-rose-500' : 'bg-emerald-500'
  ), [modalMessage]);

  const products = [
    {
      id: 1,
      name: 'Auriculares Bluetooth Pro',
      price: 34.99,
      original: 59.99,
      image: '/images/new-arrival-product.jpg',
      category: 'tech'
    },
    {
      id: 2,
      name: 'Camisa Urbana Premium',
      price: 24.99,
      original: 39.99,
      image: '/images/shirt.jpg',
      category: 'fashion'
    }
  ];

  const filteredProducts = selectedCategory === 'all'
    ? products
    : products.filter(p => p.category === selectedCategory);

  const handleAddToCart = (product) => {
    setModalMessage(`🛒 “${product.name}” añadido al carrito`);
    setIsModalVisible(true);
    setTimeout(() => setIsModalVisible(false), 3000);
  };

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-white via-indigo-50 to-white text-slate-800">
        <Head title="Novedades | WorldExpense" />

        <Header />

      <TopNavMenu />

      {/* Filtro de categorías */}
      <section className="bg-indigo-50 py-4 px-6">
        <div className="max-w-7xl mx-auto flex gap-4 overflow-x-auto">
          {['all', 'tech', 'fashion'].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-4 py-2 rounded-full text-sm border ${
                selectedCategory === cat
                  ? 'bg-indigo-600 text-white'
                  : 'text-gray-700 hover:bg-gray-200'
              }`}
            >
              {cat === 'all' ? 'Todos' : cat === 'tech' ? 'Tecnología' : 'Moda'}
            </button>
          ))}
        </div>
      </section>

      {/* Contenido principal */}
      <main className="flex-grow px-6 py-10 max-w-7xl mx-auto">
        <h2 className="text-3xl font-bold text-indigo-700 mb-6">🆕 Novedades de la semana</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {filteredProducts.map(product => (
            <div key={product.id} className="bg-white rounded-2xl border border-gray-100 shadow hover:shadow-lg transition transform hover:-translate-y-1 p-5 flex flex-col">
              <img
                src={product.image}
                alt={product.name}
                className="rounded-xl h-48 w-full object-cover mb-4"
              />
              <h3 className="text-lg font-semibold text-slate-800">{product.name}</h3>
              <p className="text-sm text-gray-500 mt-1">¡Nuevo! Stock limitado</p>
              <div className="mt-3 flex items-center gap-2">
                <span className="text-xl font-bold text-emerald-600">${product.price}</span>
                <span className="line-through text-gray-400 text-sm">${product.original}</span>
              </div>
              <button
                onClick={() => handleAddToCart(product)}
                className="mt-auto w-full bg-emerald-500 hover:bg-emerald-600 text-white font-medium py-2 rounded-full transition"
              >
                Añadir al carrito
              </button>
            </div>
          ))}
        </div>

        <p className="mt-10 text-center text-sm text-gray-500">
          ¿Quieres estar al tanto? <a href="/newsletter" className="text-indigo-600 underline">Suscríbete a nuestras novedades</a>.
        </p>
      </main>

      {/* Modal flotante */}
      {isModalVisible && (
        <div className={`${modalClass} fixed bottom-8 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded shadow-lg z-50`}>
          <p className="text-sm">{modalMessage}</p>
        </div>
      )}

      {/* Modales */}
      <LoginModal
        isOpen={isLoginOpen}
        onClose={() => setIsLoginOpen(false)}
        onRegister={() => {
          setIsLoginOpen(false);
          setIsRegisterOpen(true);
        }}
        onForgot={() => {
          setIsLoginOpen(false);
          setIsForgotPasswordOpen(true);
        }}
      />
      <RegistrarModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
      <ForgotPassword isOpen={isForgotPasswordOpen} onClose={() => setIsForgotPasswordOpen(false)} />
      {showCookiesModal && (
        <CookieConsentModal
          onAccept={handleAcceptCookies}
          onReject={handleRejectCookies}
          onCustomize={handleCustomize}
        />
      )}
      <CustomizeCookiesModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onSave={handleAcceptCookies}
      />
    </div>
  );
};

export default NewArrivals;
