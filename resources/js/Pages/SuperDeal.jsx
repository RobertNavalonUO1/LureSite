// Importación de librerías de React y herramientas de Inertia.js
import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage, Head } from '@inertiajs/react';

// Importación de componentes visuales y funcionales de la aplicación
import CartDropdown from '@/Components/CartDropdown';
import LoginModal from '@/Components/LoginModal';
import RegistrarModal from '@/Components/RegistrarModal';
import ForgotPassword from '@/Components/ForgotPassword';
import TopBanner from '@/Components/TopBanner';
import TopNavMenu from '@/Components/TopNavMenu';
import UI_CONFIG from '@/config/ui.config';
import CategoryCards from '@/Components/CategoryCards';
import SidebarBanners from '@/Components/SidebarBanners';
import CookieConsentModal from '@/Components/CookieConsentModal';
import CustomizeCookiesModal from '@/Components/CustomizeCookiesModal';

const SuperDeal = () => {
  const { auth, banners } = usePage().props;
  const user = auth?.user;

  // Estados para el modal de notificación (éxito o error)
  const [modalMessage, setModalMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);

  // Estados para abrir modales de autenticación
  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  // Estados para modales de cookies
  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  // Dropdown de categorías móviles
  const [dropdownElement, setDropdownElement] = useState(null);

  useEffect(() => {
    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted && UI_CONFIG.cookies.showConsentByDefault) {
      setShowCookiesModal(true);
    }
  }, []);

  // Aceptar cookies
  const handleAcceptCookies = () => {
    localStorage.setItem('cookiesAccepted', 'true');
    setShowCookiesModal(false);
  };

  // Rechazar cookies
  const handleRejectCookies = () => {
    localStorage.setItem('cookiesAccepted', 'false');
    setShowCookiesModal(false);
  };

  // Personalizar cookies
  const handleCustomize = () => {
    setShowCustomizeModal(true);
    setShowCookiesModal(false);
  };

  // Cierra sesión
  const handleLogout = () => {
    Inertia.post('/logout');
  };

  // Clase CSS para el modal de notificación según si es error o éxito
  const modalClass = modalMessage.includes('error') ? 'bg-rose-500' : 'bg-emerald-500';

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Head title="Super Deal" />
      {/* Encabezado con buscador, login/logout, y carrito */}
      <header className="bg-indigo-600 text-white py-4 px-6 shadow-md z-30">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row justify-between items-center gap-4">
          <h1 className="text-2xl font-bold tracking-tight">WorldExpense</h1>
          <nav className="flex flex-wrap items-center gap-3 text-sm">
            <a href="/about" className="hover:underline">Acerca de</a>
            <a href="/contact" className="hover:underline">Contacto</a>
            <CartDropdown />
            {user ? (
              <div className="flex items-center gap-2">
                <span className="hidden sm:inline">Hola, {user.name}</span>
                <a href="/dashboard">
                  <img src={user.avatar || user.photo_url || '/default-avatar.png'} alt="Avatar" className="w-9 h-9 rounded-full border border-white object-cover shadow" />
                </a>
                <button onClick={handleLogout} className="bg-rose-500 hover:bg-rose-600 text-white px-3 py-1 rounded transition">
                  Cerrar sesión
                </button>
              </div>
            ) : (
              <button onClick={() => setIsLoginOpen(true)} className="bg-white text-indigo-600 px-4 py-2 rounded hover:bg-indigo-100 transition">
                Iniciar Sesión
              </button>
            )}
          </nav>
        </div>
      </header>

      {/* Menú superior de navegación */}
      <TopNavMenu />

      {/* Menú de categorías horizontal (opcional, puedes quitar si no aplica) */}
      {/* <div className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <CategoryCards categories={[]} renderDropdown={(dropdown) => setDropdownElement(dropdown)} />
        </div>
      </div> */}

      {/* Contenido principal de la página Super Deal */}
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-4xl font-extrabold text-orange-600 mb-4 drop-shadow">🔥 Super Deal of the Day! 🔥</h2>
          <p className="text-lg text-gray-700 mb-6">
            Welcome to our exclusive Super Deal page! Enjoy handpicked products at unbeatable prices, available for a limited time only.
          </p>
          <div className="flex flex-col items-center space-y-4">
            {/* Ejemplo de producto destacado */}
            <div className="w-full bg-orange-50 border border-orange-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between shadow">
              <img src="/images/superdeal-product.jpg" alt="Super Deal Product" className="w-32 h-32 object-cover rounded mb-4 md:mb-0 md:mr-6" />
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-orange-700">Amazing Gadget</h3>
                <p className="text-gray-600">Top-rated, limited stock. Don't miss out!</p>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <span className="text-3xl font-extrabold text-green-600 mr-2">$19.99</span>
                <span className="text-sm line-through text-gray-400">$39.99</span>
                <button className="ml-4 px-4 py-2 bg-orange-500 text-white rounded hover:bg-orange-600 transition">Buy Now</button>
              </div>
            </div>
          </div>
          <p className="mt-8 text-gray-500 text-sm">Hurry! These deals change daily. Check back tomorrow for more surprises.</p>
        </div>
      </main>

      {/* Dropdown de categorías móviles */}
      {dropdownElement}

      {/* Modal emergente de éxito o error */}
      {isModalVisible && (
        <div className={`${modalClass} fixed bottom-10 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded-lg shadow-lg`}>
          <p className="text-sm">{modalMessage}</p>
        </div>
      )}

      {/* Modales de login, registro y recuperación */}
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

      {/* Modal de consentimiento de cookies */}
      {showCookiesModal && (
        <CookieConsentModal
          onAccept={handleAcceptCookies}
          onReject={handleRejectCookies}
          onCustomize={handleCustomize}
        />
      )}

      {/* Modal para personalización de cookies */}
      <CustomizeCookiesModal
        isOpen={showCustomizeModal}
        onClose={() => setShowCustomizeModal(false)}
        onSave={handleAcceptCookies}
      />
    </div>
  );
};

export default SuperDeal;
