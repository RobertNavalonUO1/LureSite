import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import Header from '@/Components/Header';
import Footer from '@/Components/Footer';
import CategoryHero from '@/Components/CategoryHero';
import ProductCard from '@/Components/ProductCard';
import ActiveFilters from '@/Components/ActiveFilters';
import ProductSkeletonCard from '@/Components/ProductSkeletonCard';
import Loader from '@/Components/Loader';
import RecommendationBlock from '@/Components/RecommendationBlock';
import PromoPopups from '@/Components/PromoPopups';

import UI_CONFIG from '@/config/ui.config';

const CATEGORY_BACKGROUNDS = {
  electronica: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
  moda: 'bg-gradient-to-br from-pink-100 via-pink-50 to-white',
  hogar: 'bg-gradient-to-br from-yellow-100 via-yellow-50 to-white',
  deportes: 'bg-gradient-to-br from-green-100 via-green-50 to-white',
  belleza: 'bg-gradient-to-br from-purple-100 via-purple-50 to-white',
  default: 'bg-gradient-to-br from-slate-100 via-white to-white',
};

const CategoryPage = () => {
  const { category = {}, categories = [], products = [] } = usePage().props;

  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeroCondensed, setIsHeroCondensed] = useState(false);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const scrollStateRef = useRef({ hero: false, header: false });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), UI_CONFIG.loader.delay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const HERO_CONDENSE_START = 200;
    const HERO_CONDENSE_END = 120;
    const HEADER_COMPACT_START = 320;
    const HEADER_COMPACT_END = 200;

    let ticking = false;

    const evaluateScroll = () => {
      const currentScroll = window.scrollY;
      const { hero: currentHero, header: currentHeader } = scrollStateRef.current;

      let nextHero = currentHero;
      if (!currentHero && currentScroll > HERO_CONDENSE_START) {
        nextHero = true;
      } else if (currentHero && currentScroll < HERO_CONDENSE_END) {
        nextHero = false;
      }

      let nextHeader = currentHeader;
      if (!currentHeader && currentScroll > HEADER_COMPACT_START) {
        nextHeader = true;
      } else if (currentHeader && currentScroll < HEADER_COMPACT_END) {
        nextHeader = false;
      }

      if (nextHero !== currentHero) {
        scrollStateRef.current.hero = nextHero;
        setIsHeroCondensed(nextHero);
      }

      if (nextHeader !== currentHeader) {
        scrollStateRef.current.header = nextHeader;
        setIsHeaderCompact(nextHeader);
      }

      ticking = false;
    };

    const onScroll = () => {
      if (!ticking) {
        ticking = true;
        window.requestAnimationFrame(evaluateScroll);
      }
    };

    evaluateScroll();
    window.addEventListener('scroll', onScroll, { passive: true });

    return () => window.removeEventListener('scroll', onScroll);
  }, []);

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId],
    );
  };

  const addToCart = (productId) => {
    Inertia.post(`/cart/${productId}/add`, {}, {
      onSuccess: () => {},
      onError: () => {
        alert('Error al agregar el producto al carrito');
      },
    });
  };

  const backgroundClass = CATEGORY_BACKGROUNDS[category?.slug] || CATEGORY_BACKGROUNDS.default;

  const bestSellers = useMemo(
    () => (products.length > 0 ? products.slice(0, Math.min(products.length, 6)) : []),
    [products],
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <Header isCompact={isHeaderCompact} />

      <main className={`flex-1 pb-20 ${backgroundClass}`}>
        <div className="max-w-[120rem] mx-auto w-full px-2 sm:px-4 lg:px-8 space-y-10 lg:space-y-12 py-10">
          <CategoryHero
            category={category}
            productCount={products.length}
            isCondensed={isHeroCondensed}
          />

          <div className="flex flex-col lg:flex-row gap-8 lg:gap-10">
            <aside className="lg:w-64 shrink-0">
              <div className="sticky top-28 space-y-6">
                <div className="rounded-3xl border border-white/80 bg-white/90 shadow-sm p-6">
                  <h2 className="text-base font-semibold mb-4 text-slate-800">Categorias</h2>
                  <ul className="space-y-1.5 text-sm">
                    {categories.map((cat) => (
                      <li key={cat.id}>
                        <a
                          href={`/category/${cat.id}`}
                          className={`block rounded-lg px-3 py-2 font-medium transition ${
                            cat.id === category.id
                              ? 'bg-indigo-600 text-white shadow-sm'
                              : 'hover:bg-slate-100 text-slate-600'
                          }`}
                        >
                          {cat.name}
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="rounded-3xl border border-white/70 bg-indigo-600 text-white shadow-md p-6 space-y-4">
                  <h3 className="text-lg font-semibold">Necesitas ayuda</h3>
                  <p className="text-sm text-indigo-50">
                    Chat en vivo, devoluciones sin costo y seguimiento de pedidos en tiempo real.
                  </p>
                  <a
                    href="/contact"
                    className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition"
                  >
                    Hablar con soporte
                  </a>
                </div>
              </div>
            </aside>

            <section id="productos" className="flex-1 space-y-8">
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-indigo-800">{category.name}</h2>
                  <p className="text-slate-500">
                    Descubre el catalogo completo de productos seleccionados para esta categoria.
                  </p>
                </div>

                <ActiveFilters
                  selectedCategory={category.id}
                  categories={categories}
                  onClear={() => {
                    Inertia.visit('/');
                  }}
                />
              </div>

              <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {isLoading ? (
                  Array.from({ length: UI_CONFIG.loader.skeletonCount }).map((_, index) => (
                    <ProductSkeletonCard key={index} />
                  ))
                ) : products.length > 0 ? (
                  products.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))
                ) : (
                  <div className="col-span-full">
                    <Loader text="No hay productos en esta categoria." />
                  </div>
                )}
              </div>

              {bestSellers.length > 0 && (
                <section className="rounded-3xl border border-white/70 bg-white/90 shadow-md p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-slate-900">Destacados del momento</h3>
                    <a
                      href="/deals/today"
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                      Ver todas las ofertas
                    </a>
                  </div>
                  <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                    {bestSellers.map((product) => (
                      <ProductCard
                        key={`best-${product.id}`}
                        product={product}
                        onAddToCart={addToCart}
                        isFavorite={favorites.includes(product.id)}
                        onToggleFavorite={toggleFavorite}
                      />
                    ))}
                  </div>
                </section>
              )}

              <RecommendationBlock title="Continua explorando articulos sugeridos" />
            </section>
          </div>
        </div>
      </main>

      <PromoPopups context="category" />

      <Footer />
    </div>
  );
};

export default CategoryPage;
