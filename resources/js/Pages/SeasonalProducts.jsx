// Importación de librerías de React y herramientas de Inertia.js
import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage, Head } from '@inertiajs/react';

// Importación de componentes visuales y funcionales de la aplicación
import Header from '@/Components/Header';
import TopNavMenu from '@/Components/TopNavMenu';
import SidebarBanners from '@/Components/SidebarBanners';
import LoginModal from '@/Components/LoginModal';
import RegistrarModal from '@/Components/RegistrarModal';
import ForgotPassword from '@/Components/ForgotPassword';
import CookieConsentModal from '@/Components/CookieConsentModal';
import CustomizeCookiesModal from '@/Components/CustomizeCookiesModal';
import UI_CONFIG from '@/config/ui.config';

function SeasonalCard({ product }) {
  return (
    <div
      className="bg-gradient-to-br from-green-50 via-white to-lime-100 rounded-2xl shadow-md p-4 flex flex-col hover:shadow-xl transition group border border-lime-200 relative"
      style={{ width: 220, minHeight: 340, maxWidth: 220 }}
    >
      <div className="relative mb-3">
        <img
          src={product.image_url || "/images/logo.png"}
          alt={product.name}
          className="h-32 w-full object-contain rounded-lg bg-lime-50"
          style={{ minHeight: 128, maxHeight: 128 }}
        />
        <span className="absolute top-2 left-2 bg-lime-600 text-white text-xs px-2 py-1 rounded font-bold shadow">
          🌱 Temporada
        </span>
        {product.discount > 0 && (
          <span className="absolute top-2 right-2 bg-green-500 text-white text-xs px-2 py-1 rounded font-bold shadow">
            -{product.discount}%
          </span>
        )}
      </div>
      <h2 className="font-semibold text-base mb-1 group-hover:text-lime-700 transition line-clamp-2">{product.name}</h2>
      <p className="text-gray-500 text-xs mb-2">{product.category?.name}</p>
      <div className="flex items-center gap-2 mb-2">
        <span className="text-green-700 font-bold text-lg">
          {product.price} €
        </span>
        {product.discount > 0 && (
          <span className="line-through text-gray-400 text-xs">
            {(product.price * (1 - product.discount / 100)).toFixed(2)} €
          </span>
        )}
      </div>
      <div className="flex gap-2 mt-auto">
        <a
          href={product.link || "#"}
          className="flex-1 bg-lime-600 text-white rounded-lg py-2 px-2 text-xs font-semibold transition-all duration-200 hover:bg-lime-700 text-center"
          target="_blank"
          rel="noopener noreferrer"
        >
          Ver producto
        </a>
      </div>
    </div>
  );
}

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

  // Estado para productos de temporada
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted && UI_CONFIG.cookies.showConsentByDefault) {
      setShowCookiesModal(true);
    }
  }, []);

  useEffect(() => {
    fetch("/api/seasonal-products")
      .then((res) => res.json())
      .then((data) => {
        setProducts(data);
        setLoading(false);
      })
      .catch(() => setLoading(false));
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
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-green-50 via-white to-lime-100 text-slate-800">
      <Head title="Productos de Temporada" />
      <Header />
      <TopNavMenu />

      <main className="flex-grow flex flex-col items-center justify-center p-4 sm:p-6">
        <div className="w-full max-w-7xl mx-auto grid grid-cols-1 lg:grid-cols-[5fr_2fr] gap-8">
          {/* Contenido principal */}
          <div>
            <div className="bg-white rounded-2xl shadow-lg p-4 sm:p-8 text-center border border-lime-200">
              <h1 className="text-3xl md:text-4xl font-extrabold mb-4 flex items-center gap-2 justify-center text-lime-700 drop-shadow">
                🌱 Productos de Temporada
              </h1>
              <p className="mb-8 text-gray-700 text-lg">
                Descubre productos seleccionados especialmente para esta temporada. <span className="text-lime-600 font-semibold">¡Aprovecha las novedades y ofertas exclusivas!</span>
              </p>
              {loading ? (
                <div className="text-center py-12 text-gray-500">Cargando productos de temporada...</div>
              ) : products.length === 0 ? (
                <div className="text-center py-12 text-gray-500">No hay productos de temporada disponibles.</div>
              ) : (
                <div className="flex flex-wrap justify-center gap-6">
                  {products.map((product) => (
                    <SeasonalCard key={product.id} product={product} />
                  ))}
                </div>
              )}
            </div>
            <p className="mt-8 text-center text-gray-500 text-sm">
              🌿 ¡No te pierdas las tendencias de la temporada! Vuelve pronto para descubrir más novedades.
            </p>
          </div>
          {/* Banners laterales, menos prominentes en móvil */}
          <aside className="mt-4 lg:mt-0">
            <div className="hidden lg:block">
              <SidebarBanners banners={banners?.seasonal || banners?.default || []} />
            </div>
            <div className="block lg:hidden mb-4">
              {/* Banner solo visible en móvil/tablet, más pequeño */}
              {banners?.seasonal?.[0] && (
                <img
                  src={banners.seasonal[0].src}
                  alt={banners.seasonal[0].alt || "Banner"}
                  className="rounded-xl shadow-md w-full max-h-32 object-cover"
                />
              )}
            </div>
          </aside>
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
