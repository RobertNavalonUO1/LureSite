import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Inertia } from '@inertiajs/inertia';
import { usePage } from '@inertiajs/react';

import Footer from '@/Components/navigation/Footer.jsx';
import CategoryHero from '@/Components/catalog/CategoryHero.jsx';
import ProductCard from '@/Components/catalog/ProductCard.jsx';
import ActiveFilters from '@/Components/catalog/ActiveFilters.jsx';
import CatalogAsideLayout from '@/Components/catalog/CatalogAsideLayout.jsx';
import CatalogFilterPanel from '@/Components/catalog/CatalogFilterPanel.jsx';
import ProductSkeletonCard from '@/Components/ui/ProductSkeletonCard.jsx';
import Loader from '@/Components/ui/Loader.jsx';
import RecommendationBlock from '@/Components/catalog/RecommendationBlock.jsx';
import StorefrontLayout from '@/Layouts/StorefrontLayout.jsx';
import PromoPopups from '@/Components/marketing/PromoPopups.jsx';

import UI_CONFIG from '@/config/ui.config';
import { CATALOG_STICKY_TOP } from '@/config/catalogLayout.js';
import { useI18n } from '@/i18n';
import { addCartItem } from '@/utils/cartClient';

const CATEGORY_BACKGROUNDS = {
  electronica: 'bg-gradient-to-br from-blue-100 via-blue-50 to-white',
  moda: 'bg-gradient-to-br from-pink-100 via-pink-50 to-white',
  hogar: 'bg-gradient-to-br from-yellow-100 via-yellow-50 to-white',
  deportes: 'bg-gradient-to-br from-green-100 via-green-50 to-white',
  belleza: 'bg-gradient-to-br from-purple-100 via-purple-50 to-white',
  default: 'bg-gradient-to-br from-slate-100 via-white to-white',
};

const resolveCategoryValue = (category) =>
  category?.id !== undefined && category?.id !== null
    ? String(category.id)
    : category?.slug ?? category?.name ?? 'all';

const resolveCategoryHref = (category) => `/categoria/${category?.slug ?? category?.id ?? ''}`;

const CategoryPage = () => {
  const { category = {}, categories = [], products = [] } = usePage().props;
  const { t } = useI18n();

  const [favorites, setFavorites] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isHeroCondensed, setIsHeroCondensed] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState(resolveCategoryValue(category));
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [sortOrder, setSortOrder] = useState('featured');
  const [isInlineFiltersOpen, setIsInlineFiltersOpen] = useState(false);
  const [isAsideFiltersExpanded, setIsAsideFiltersExpanded] = useState(false);
  const scrollStateRef = useRef({ hero: false });

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), UI_CONFIG.loader.delay);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return undefined;

    const HERO_CONDENSE_START = 200;
    const HERO_CONDENSE_END = 120;

    let ticking = false;

    const evaluateScroll = () => {
      const currentScroll = window.scrollY;
      const { hero: currentHero } = scrollStateRef.current;

      let nextHero = currentHero;
      if (!currentHero && currentScroll > HERO_CONDENSE_START) {
        nextHero = true;
      } else if (currentHero && currentScroll < HERO_CONDENSE_END) {
        nextHero = false;
      }

      if (nextHero !== currentHero) {
        scrollStateRef.current.hero = nextHero;
        setIsHeroCondensed(nextHero);
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
    addCartItem(productId).catch(() => {
        alert(t('shop.category.add_to_cart_error'));
    });
  };

  const sortOptions = useMemo(
    () => [
      { value: 'featured', label: t('catalog.filter.sort_featured') },
      { value: 'newest', label: t('catalog.filter.sort_newest') },
      { value: 'lowest-price', label: t('catalog.filter.sort_lowest_price') },
      { value: 'highest-price', label: t('catalog.filter.sort_highest_price') },
    ],
    [t],
  );

  const backgroundClass = CATEGORY_BACKGROUNDS[category?.slug] || CATEGORY_BACKGROUNDS.default;

  const currentCategoryValue = useMemo(() => resolveCategoryValue(category), [category]);

  useEffect(() => {
    setSelectedCategory(currentCategoryValue);
    setIsInlineFiltersOpen(false);
  }, [currentCategoryValue]);

  const handleCategorySelection = (nextValue) => {
    setSelectedCategory(nextValue);

    if (String(nextValue) === String(currentCategoryValue)) {
      return;
    }

    const nextCategory = categories.find(
      (item) => String(resolveCategoryValue(item)) === String(nextValue),
    );

    if (nextCategory) {
      Inertia.visit(resolveCategoryHref(nextCategory));
    }
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();

    return products.filter((product) => {
      const matchesSearch = term
        ? [product.name, product.description, product.brand, product.tags?.join(' ')]
            .filter(Boolean)
            .join(' ')
            .toLowerCase()
            .includes(term)
        : true;

      const priceValue = Number(product.price) || 0;
      const matchesMin = minPrice === '' || priceValue >= Number(minPrice);
      const matchesMax = maxPrice === '' || priceValue <= Number(maxPrice);

      return matchesSearch && matchesMin && matchesMax;
    });
  }, [products, searchTerm, minPrice, maxPrice]);

  const sortedProducts = useMemo(() => {
    const base = [...filteredProducts];

    switch (sortOrder) {
      case 'lowest-price':
        return base.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case 'highest-price':
        return base.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case 'newest':
        return base.sort(
          (a, b) =>
            new Date(b.published_at || b.created_at || 0) - new Date(a.published_at || a.created_at || 0),
        );
      default:
        return base;
    }
  }, [filteredProducts, sortOrder]);

  const activeFilterCount = [Boolean(searchTerm.trim()), Boolean(minPrice), Boolean(maxPrice)].filter(Boolean).length;

  const resetFilters = () => {
    setSearchTerm('');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('featured');
    setIsInlineFiltersOpen(false);
  };

  const bestSellers = useMemo(
    () => (sortedProducts.length > 0 ? sortedProducts.slice(0, Math.min(sortedProducts.length, 6)) : []),
    [sortedProducts],
  );

  return (
    <div className="flex flex-col min-h-screen bg-slate-50 text-slate-800">
      <StorefrontLayout showTopNav />

      <main className={`flex-1 pb-20 ${backgroundClass}`}>
        <div className="max-w-[120rem] mx-auto w-full px-2 sm:px-4 lg:px-8 space-y-10 lg:space-y-12 py-10">
          <CategoryHero
            category={category}
            productCount={products.length}
            isCondensed={isHeroCondensed}
          />

          <div className="grid gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)] lg:gap-10">
            <aside className="order-2 lg:order-2 lg:-mr-8 lg:h-full xl:-mr-10 2xl:-mr-12">
              <div className="lg:hidden">
                <CatalogFilterPanel
                  mode="inline"
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={handleCategorySelection}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  categories={categories}
                  quickFilterOptions={[]}
                  activeFilterCount={activeFilterCount}
                  resultCount={sortedProducts.length}
                  resetFilters={resetFilters}
                  selectedCategoryName={category.name}
                  isOpen={isInlineFiltersOpen}
                  setIsOpen={setIsInlineFiltersOpen}
                  sortOptions={sortOptions}
                  searchPlaceholder={t('catalog.filter.search_within_category')}
                  categoryAllLabel={t('catalog.filter.all_categories')}
                  renderActiveFilters={({ className }) => (
                    <ActiveFilters
                      searchTerm={searchTerm}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      categories={categories}
                      showClearAction={false}
                      className={className}
                      onClear={resetFilters}
                    />
                  )}
                />
              </div>

              <CatalogAsideLayout
                isExpanded={isAsideFiltersExpanded}
                stickyTop={CATALOG_STICKY_TOP}
                edge="right"
                filterContent={
                  <CatalogFilterPanel
                    mode="aside"
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={handleCategorySelection}
                    minPrice={minPrice}
                    setMinPrice={setMinPrice}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    categories={categories}
                    quickFilterOptions={[]}
                    activeFilterCount={activeFilterCount}
                    resultCount={sortedProducts.length}
                    resetFilters={resetFilters}
                    selectedCategoryName={category.name}
                    isOpen={isAsideFiltersExpanded}
                    setIsOpen={setIsAsideFiltersExpanded}
                    sortOptions={sortOptions}
                    searchPlaceholder={t('catalog.filter.search_within_category')}
                    categoryAllLabel={t('catalog.filter.all_categories')}
                    stickyOffset={CATALOG_STICKY_TOP}
                    edge="right"
                    renderActiveFilters={({ className }) => (
                      <ActiveFilters
                        searchTerm={searchTerm}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        categories={categories}
                        showClearAction={false}
                        className={className}
                        onClear={resetFilters}
                      />
                    )}
                  />
                }
                secondaryContent={
                  <div className="relative z-0 rounded-3xl border border-white/70 bg-indigo-600 text-white shadow-md p-6 space-y-4">
                    <h3 className="text-lg font-semibold">{t('shop.category.help_title')}</h3>
                    <p className="text-sm text-indigo-50">
                      {t('shop.category.help_body')}
                    </p>
                    <a
                      href="/contact"
                      className="inline-flex items-center justify-center rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-700 hover:bg-indigo-50 transition"
                    >
                      {t('shop.category.help_cta')}
                    </a>
                  </div>
                }
              />
            </aside>

            <section id="productos" className="order-1 flex-1 space-y-8 lg:order-1">
              <div className="space-y-4">
                <div>
                  <h2 className="text-3xl sm:text-4xl font-bold text-indigo-800">{category.name}</h2>
                  <p className="text-slate-500">
                    {t('shop.category.description')}
                  </p>
                </div>

                <ActiveFilters
                  searchTerm={searchTerm}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  categories={categories}
                  onClear={resetFilters}
                />
              </div>

              <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                {isLoading ? (
                  Array.from({ length: UI_CONFIG.loader.skeletonCount }).map((_, index) => (
                    <ProductSkeletonCard key={index} />
                  ))
                ) : sortedProducts.length > 0 ? (
                  sortedProducts.map((product) => (
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
                    <Loader text={t('shop.category.empty')} />
                  </div>
                )}
              </div>

              {bestSellers.length > 0 && (
                <section className="rounded-3xl border border-white/70 bg-white/90 shadow-md p-6 space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-2xl font-semibold text-slate-900">{t('shop.category.featured_title')}</h3>
                    <a
                      href="/deals/today"
                      className="text-sm font-semibold text-indigo-600 hover:text-indigo-700 transition"
                    >
                      {t('shop.category.view_all_deals')}
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

              <RecommendationBlock title={t('shop.category.recommendations_title')} />
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




