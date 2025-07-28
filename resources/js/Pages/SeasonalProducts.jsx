// Importación de librerías de React y herramientas de Inertia.js
import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage, Head } from '@inertiajs/react';

// Importación de componentes visuales y funcionales de la aplicación
import CartDropdown from '@/Components/CartDropdown';
import Header from '@/Components/Header';
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

const SeasonalProducts = () => {
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

      <Head title="Seasonal Products" />
      <Header />

      {/* Menú superior de navegación */}
      <TopNavMenu />

      {/* Contenido principal de la página Seasonal Products */}
      <main className="flex-grow flex flex-col items-center justify-center p-6">
        <div className="max-w-2xl w-full bg-white rounded-xl shadow-lg p-8 text-center">
          <h2 className="text-4xl font-extrabold text-pink-600 mb-4 drop-shadow">🌸 Seasonal Products</h2>
          <p className="text-lg text-gray-700 mb-6">
            Explore our special selection of seasonal products. Perfect for every time of the year!
          </p>
          <div className="flex flex-col items-center space-y-4">
            <div className="w-full bg-pink-50 border border-pink-200 rounded-lg p-4 flex flex-col md:flex-row items-center justify-between shadow">
              <img src="/images/seasonal-product.jpg" alt="Seasonal Product" className="w-32 h-32 object-cover rounded mb-4 md:mb-0 md:mr-6" />
              <div className="flex-1 text-left">
                <h3 className="text-2xl font-bold text-pink-700">Seasonal Favorite</h3>
                <p className="text-gray-600">Limited edition for the current season. Don't miss out!</p>
              </div>
              <div className="text-right mt-4 md:mt-0">
                <span className="text-3xl font-extrabold text-green-600 mr-2">$29.99</span>
                <span className="text-sm line-through text-gray-400">$54.99</span>
                <button className="ml-4 px-4 py-2 bg-pink-500 text-white rounded hover:bg-pink-600 transition">Buy Now</button>
              </div>
            </div>
          </div>
          <p className="mt-8 text-gray-500 text-sm">Check back for new seasonal picks throughout the year!</p>
        </div>
      </main>
      {dropdownElement}
      {isModalVisible && (
        <div className={`${modalClass} fixed bottom-10 left-1/2 transform -translate-x-1/2 text-white px-6 py-3 rounded-lg shadow-lg`}>
          <p className="text-sm">{modalMessage}</p>
        </div>
      )}
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

export default SeasonalProducts;
