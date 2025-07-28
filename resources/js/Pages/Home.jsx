import React, { useState, useEffect } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import CartDropdown from '@/Components/CartDropdown';
import LoginModal from '@/Components/LoginModal';
import RegistrarModal from '@/Components/RegistrarModal';
import ForgotPassword from '@/Components/ForgotPassword';
import TopBanner from '@/Components/TopBanner';
import TopNavMenu from '@/Components/TopNavMenu';
import Header from '@/Components/Header';
import ProductCard from '@/Components/ProductCard';
import RecommendationBlock from '@/Components/RecommendationBlock';
import ActiveFilters from '@/Components/ActiveFilters';
import AdvancedSearch from '@/Components/AdvancedSearch';
import ProductSkeletonCard from '@/Components/ProductSkeletonCard';
import Loader from '@/Components/Loader';
import CookieConsentModal from '@/Components/CookieConsentModal';
import CustomizeCookiesModal from '@/Components/CustomizeCookiesModal';
import UI_CONFIG from '@/config/ui.config';
import CategoryCards from '@/Components/CategoryCards';
import SidebarBanners from '@/Components/SidebarBanners';

const Home = () => {
  const { categories, products, banners, auth } = usePage().props;
  const user = auth?.user;

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

  // Estado para mostrar el bloque de recomendaciones
  const [showRecommendations, setShowRecommendations] = useState(false);

  // Detecta si el usuario ha hecho scroll más de 2 pantallas
  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 2) {
        setShowRecommendations(true);
      } else {
        setShowRecommendations(false);
      }
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Productos nuevos para el bloque de recomendaciones
  const newProducts = products
    .filter(p => p.is_new)
    .slice(0, 6);
  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const [dropdownElement, setDropdownElement] = useState(null);

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

  const modalClass = modalMessage.includes('error') ? 'bg-error' : 'bg-success';

  return (
    <div className="flex flex-col min-h-screen bg-neutral-lighter text-neutral">
      <Header />
      <TopNavMenu />

      <div className="bg-white shadow-sm border-b relative z-10">
        <div className="max-w-7xl mx-auto px-4">
          <CategoryCards categories={categories} renderDropdown={(dropdown) => setDropdownElement(dropdown)} />
        </div>
      </div>

      <div className="flex-grow">
        <div className="grid grid-cols-[1fr_1.5fr_10fr_1.5fr_1fr] gap-4 w-full max-w-[1800px] mx-auto px-2 lg:px-4">
          <div className="hidden lg:block" />

          <aside className="hidden lg:block p-4 card border-r self-start top-24 h-fit">
            <h2 className="text-lg font-semibold mb-4 text-primary">Categorías</h2>
            <ul className="space-y-2">
              <li className={`py-2 px-3 rounded cursor-pointer ${!selectedCategory ? 'bg-primary-light text-primary font-bold' : 'hover:bg-neutral-light'}`} onClick={() => setSelectedCategory(null)}>
                Todas las categorías
              </li>
              {categories.map(category => (
                <li
                  key={category.id}
                  className={`py-2 px-3 rounded cursor-pointer ${selectedCategory === category.id ? 'bg-primary-light font-semibold' : 'hover:bg-neutral-light'}`}
                  onClick={() => setSelectedCategory(category.id)}
                >
                  {category.name}
                </li>
              ))}
            </ul>
          </aside>

          <main className="p-4 sm:p-6">
            <TopBanner height="h-96" />
            <h2 className="text-3xl font-bold mb-2 text-primary-dark">Productos Destacados</h2>
            <p className="text-neutral text-sm mb-4">Descubre lo mejor de nuestra tienda</p>
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
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 sm:gap-6">
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

          <SidebarBanners banners={banners} />
          <div className="hidden lg:block" />
        </div>
      </div>

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

export default Home;
