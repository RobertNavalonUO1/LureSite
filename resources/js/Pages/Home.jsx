import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import CartDropdown from '@/Components/CartDropdown';
import LoginModal from '@/Components/LoginModal';
import RegistrarModal from '@/Components/RegistrarModal';
import ForgotPassword from '@/Components/ForgotPassword';
import TopBanner from '@/Components/TopBanner';
import TopNavMenu from '@/Components/TopNavMenu';

import ProductCard from '@/Components/ProductCard';
import ActiveFilters from '@/Components/ActiveFilters';
import AdvancedSearch from '@/Components/AdvancedSearch';
import ProductSkeletonCard from '@/Components/ProductSkeletonCard';
import Loader from '@/Components/Loader';

import CookieConsentModal from '@/Components/CookieConsentModal';
import CustomizeCookiesModal from '@/Components/CustomizeCookiesModal';

import UI_CONFIG from '@/config/ui.config';

const Home = () => {
  const { categories, products, auth } = usePage().props;

  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(null);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [favorites, setFavorites] = useState([]);

  const [modalMessage, setModalMessage] = useState('');
  const [isModalVisible, setIsModalVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  useEffect(() => {
    const accepted = localStorage.getItem('cookiesAccepted');
    if (!accepted && UI_CONFIG.cookies.showConsentByDefault) {
      setShowCookiesModal(true);
    }

    const timer = setTimeout(() => setIsLoading(false), UI_CONFIG.loader.delay);
    return () => clearTimeout(timer);
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

  const toggleFavorite = (productId) => {
    setFavorites(prev =>
      prev.includes(productId)
        ? prev.filter(id => id !== productId)
        : [...prev, productId]
    );
  };

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(search.toLowerCase()) &&
    (!selectedCategory || product.category.id === selectedCategory) &&
    (minPrice === '' || product.price >= parseFloat(minPrice)) &&
    (maxPrice === '' || product.price <= parseFloat(maxPrice))
  );

  const addToCart = (productId) => {
    Inertia.post(`/cart/${productId}/add`, {}, {
      onSuccess: (response) => {
        const { success, error } = response.data;
        if (success) {
          showModal(success, false);
        } else if (error) {
          showModal(error, true);
        }
      },
      onError: () => {
        showModal('Hubo un error al agregar el producto al carrito.', true);
      },
    });
  };

  const showModal = (message, isError) => {
    setModalMessage(message);
    setIsModalVisible(true);
    setTimeout(() => {
      setIsModalVisible(false);
    }, 2000);
  };

  const modalClass = modalMessage.includes('error') ? 'bg-red-500' : 'bg-green-500';

  return (
    <div className="flex flex-col min-h-screen bg-gray-50">
      {/* HEADER */}
      <header className="bg-blue-600 text-white py-4 px-6 flex flex-wrap justify-between items-center gap-4">
        <h1 className="text-2xl font-bold">WorldExpense</h1>

        <div className="flex flex-col sm:flex-row items-start sm:items-center sm:space-x-4 flex-grow mx-6 w-full sm:w-auto">
          <AdvancedSearch
            search={search}
            setSearch={setSearch}
            selectedCategory={selectedCategory}
            setSelectedCategory={setSelectedCategory}
            minPrice={minPrice}
            setMinPrice={setMinPrice}
            maxPrice={maxPrice}
            setMaxPrice={setMaxPrice}
            categories={categories}
          />
        </div>

        <nav className="flex items-center space-x-4">
          <a href="/about" className="hover:underline">Acerca de</a>
          <a href="/contact" className="hover:underline">Contacto</a>
          <CartDropdown />
          {auth.user ? (
            <a href="/dashboard" className="bg-gray-700 px-4 py-2 rounded hover:bg-gray-900">
              Perfil
            </a>
          ) : (
            <button
              onClick={() => setIsLoginOpen(true)}
              className="bg-white text-blue-600 px-4 py-2 rounded hover:bg-gray-100"
            >
              Iniciar Sesión
            </button>
          )}
        </nav>
      </header>

      <TopNavMenu />

      {/* CONTENIDO */}
      <div className="flex flex-grow">
        {/* SIDEBAR */}
        <aside className="w-64 bg-white shadow-md p-4 hidden lg:block">
          <h2 className="text-xl font-semibold mb-4">Categorías</h2>
          <ul className="space-y-1">
            <li
              className={`py-2 px-3 rounded cursor-pointer ${!selectedCategory ? 'bg-blue-100 font-bold' : 'hover:bg-gray-100'}`}
              onClick={() => setSelectedCategory(null)}
            >
              Todas las categorías
            </li>
            {categories.map(category => (
              <li
                key={category.id}
                className={`py-2 px-3 rounded cursor-pointer ${selectedCategory === category.id ? 'bg-blue-200 font-semibold' : 'hover:bg-gray-100'}`}
                onClick={() => setSelectedCategory(category.id)}
              >
                {category.name}
              </li>
            ))}
          </ul>
        </aside>

        {/* PRINCIPAL */}
        <main className="flex-grow p-6">
          <TopBanner height="h-96" />

          <h1 className="text-3xl font-bold mb-2 text-blue-800">Productos Destacados</h1>
          <p className="text-gray-500 mb-4">Descubre lo mejor de nuestra tienda</p>

          <ActiveFilters
            selectedCategory={selectedCategory}
            minPrice={minPrice}
            maxPrice={maxPrice}
            categories={categories}
            onClear={() => {
              setSelectedCategory(null);
              setMinPrice('');
              setMaxPrice('');
            }}
          />

<div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4">
            {isLoading ? (
              Array.from({ length: UI_CONFIG.loader.skeletonCount }).map((_, i) => (
                <ProductSkeletonCard key={i} />
              ))
            ) : filteredProducts.length > 0 ? (
              filteredProducts.map(product => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onAddToCart={addToCart}
                  isFavorite={favorites.includes(product.id)}
                  onToggleFavorite={toggleFavorite}
                />
              ))
            ) : (
              <Loader text="No se encontraron productos que coincidan con tu búsqueda." />
            )}
          </div>
        </main>
      </div>

      {/* MODAL DE MENSAJES */}
      {isModalVisible && (
        <div className={`${modalClass} fixed bottom-10 left-1/2 transform -translate-x-1/2 text-white p-4 rounded-lg shadow-md`}>
          <p>{modalMessage}</p>
        </div>
      )}

      {/* MODALES DE AUTENTICACIÓN */}
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

      <RegistrarModal
        isOpen={isRegisterOpen}
        onClose={() => setIsRegisterOpen(false)}
      />

      <ForgotPassword
        isOpen={isForgotPasswordOpen}
        onClose={() => setIsForgotPasswordOpen(false)}
      />

      {/* MODALES DE COOKIES */}
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

export default Home;
