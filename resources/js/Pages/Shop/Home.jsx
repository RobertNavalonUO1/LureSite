// resources/js/Pages/Home.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Link, usePage } from "@inertiajs/react";
import {
  BadgePercent,
  Flame,
  HelpCircle,
  ShieldCheck,
  Sparkles,
  Truck,
} from "lucide-react";

import LoginModal from "@/Components/auth/LoginModal.jsx";
import RegisterModal from "@/Components/auth/RegisterModal.jsx";
import ForgotPassword from "@/Components/auth/ForgotPassword.jsx";
import ProductCard from "@/Components/catalog/ProductCard.jsx";
import RecommendationBlock from "@/Components/catalog/RecommendationBlock.jsx";
import ActiveFilters from "@/Components/catalog/ActiveFilters.jsx";
import CatalogAsideLayout from "@/Components/catalog/CatalogAsideLayout.jsx";
import CatalogFilterPanel from "@/Components/catalog/CatalogFilterPanel.jsx";
import ProductSkeletonCard from "@/Components/ui/ProductSkeletonCard.jsx";
import Loader from "@/Components/ui/Loader.jsx";
import CookieConsentModal from "@/Components/cookies/CookieConsentModal.jsx";
import CustomizeCookiesModal from "@/Components/cookies/CustomizeCookiesModal.jsx";
import UI_CONFIG from "@/config/ui.config";
import CategoryCards from "@/Components/catalog/CategoryCards.jsx";
import CategoryIconBar from "@/Components/catalog/CategoryIconBar.jsx";
import SidebarBanners from "@/Components/marketing/SidebarBanners.jsx";
import TopBanner from "@/Components/marketing/TopBanner";
import AutumnShowcase from "@/Components/marketing/AutumnShowcase.jsx";
import PromoPopups from "@/Components/marketing/PromoPopups.jsx";
import StorefrontLayout from "@/Layouts/StorefrontLayout.jsx";
import { repairTextTree, useI18n } from "@/i18n";
import { CATALOG_STICKY_TOP_WITH_RAIL } from "@/config/catalogLayout.js";
import { addCartItem } from "@/utils/cartClient";

const CATEGORY_ACCENTS = [
  {
    border: "border-indigo-200",
    gradient: "from-indigo-50 via-white to-transparent",
    header: "text-indigo-700",
    chip: "bg-indigo-100 text-indigo-600",
    cta: "bg-indigo-600 text-white hover:bg-indigo-500",
  },
  {
    border: "border-emerald-200",
    gradient: "from-emerald-50 via-white to-transparent",
    header: "text-emerald-700",
    chip: "bg-emerald-100 text-emerald-600",
    cta: "bg-emerald-600 text-white hover:bg-emerald-500",
  },
  {
    border: "border-rose-200",
    gradient: "from-rose-50 via-white to-transparent",
    header: "text-rose-700",
    chip: "bg-rose-100 text-rose-600",
    cta: "bg-rose-600 text-white hover:bg-rose-500",
  },
  {
    border: "border-amber-200",
    gradient: "from-amber-50 via-white to-transparent",
    header: "text-amber-700",
    chip: "bg-amber-100 text-amber-600",
    cta: "bg-amber-500 text-slate-900 hover:bg-amber-400",
  },
];

const Home = () => {
  const {
    categories = [],
    products = [],
    campaign = {},
    banners: legacyBanners = [],
    auth,
  } = usePage().props;
  const { t } = useI18n();
  const user = auth?.user;
  const campaignBanners = useMemo(() => repairTextTree(campaign?.banners ?? {}), [campaign?.banners]);
  const fallbackLegacyBanners = useMemo(() => repairTextTree(legacyBanners ?? []), [legacyBanners]);
  const generalBanners = campaignBanners.general ?? fallbackLegacyBanners;
  const heroBanners =
    campaignBanners.hero?.length ? campaignBanners.hero : generalBanners;
  const showcaseBanners =
    campaignBanners.showcase?.length ? campaignBanners.showcase : generalBanners.slice(0, 3);
  const sidebarBanners =
    campaignBanners.sidebar?.length ? campaignBanners.sidebar : generalBanners;

  const [searchTerm, setSearchTerm] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [minPrice, setMinPrice] = useState("");
  const [maxPrice, setMaxPrice] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");
  const [favorites, setFavorites] = useState([]);

  const [modalMessage, setModalMessage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

  const [isLoading, setIsLoading] = useState(true);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [showRecommendations, setShowRecommendations] = useState(false);

  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const [dropdownElement, setDropdownElement] = useState(null);
  const [isHeaderCompact, setIsHeaderCompact] = useState(false);
  const [isInlineFiltersOpen, setIsInlineFiltersOpen] = useState(false);
  const [isAsideFiltersExpanded, setIsAsideFiltersExpanded] = useState(false);

  useEffect(() => {
    setDropdownElement(null);
  }, [isHeaderCompact]);

  useEffect(() => {
    if (!isHeaderCompact) {
      setIsInlineFiltersOpen(false);
    }
  }, [isHeaderCompact]);

  const asideQuickLinks = useMemo(
    () => [
      {
        href: "/deals/today",
        title: t('nav.deals_today'),
        subtitle: t('home.quick_link_subtitle.deals_today'),
        Icon: BadgePercent,
        accent: "from-amber-500/20 via-white to-white",
      },
      {
        href: "/superdeal",
        title: t('nav.super_deal'),
        subtitle: t('home.quick_link_subtitle.super_deal'),
        Icon: Flame,
        accent: "from-rose-500/15 via-white to-white",
      },
      {
        href: "/fast-shipping",
        title: t('nav.fast_shipping'),
        subtitle: t('home.quick_link_subtitle.fast_shipping'),
        Icon: Truck,
        accent: "from-emerald-500/15 via-white to-white",
      },
      {
        href: "/new-arrivals",
        title: t('nav.new_arrivals'),
        subtitle: t('home.quick_link_subtitle.new_arrivals'),
        Icon: Sparkles,
        accent: "from-indigo-500/15 via-white to-white",
      },
    ],
    [t]
  );

  const sortOptions = useMemo(
    () => [
      { value: 'featured', label: t('catalog.filter.sort_featured') },
      { value: 'newest', label: t('catalog.filter.sort_newest') },
      { value: 'lowest-price', label: t('catalog.filter.sort_lowest_price') },
      { value: 'highest-price', label: t('catalog.filter.sort_highest_price') },
    ],
    [t]
  );

  useEffect(() => {
    const accepted = localStorage.getItem("cookiesAccepted");
    if (!accepted && UI_CONFIG.cookies.showConsentByDefault) {
      setShowCookiesModal(true);
    }

    const loaderTimer = setTimeout(() => setIsLoading(false), UI_CONFIG.loader.delay);
    const handleScroll = () => {
      if (window.scrollY > window.innerHeight * 1.6) {
        setShowRecommendations(true);
      } else {
        setShowRecommendations(false);
      }
    };

    window.addEventListener("scroll", handleScroll);

    return () => {
      clearTimeout(loaderTimer);
      window.removeEventListener("scroll", handleScroll);
      clearTimeout(toastTimeoutRef.current);
    };
  }, []);

  const newProducts = useMemo(
    () => products.filter((product) => product.is_new).slice(0, 6),
    [products]
  );

  const handleAcceptCookies = () => {
    localStorage.setItem("cookiesAccepted", "true");
    setShowCookiesModal(false);
  };

  const handleRejectCookies = () => {
    localStorage.setItem("cookiesAccepted", "false");
    setShowCookiesModal(false);
  };

  const handleCustomize = () => {
    setShowCustomizeModal(true);
    setShowCookiesModal(false);
  };

  const toggleFavorite = (productId) => {
    setFavorites((prev) =>
      prev.includes(productId) ? prev.filter((id) => id !== productId) : [...prev, productId]
    );
  };

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const matchesSearch = term
        ? [
            product.name,
            product.description,
            product.category?.name,
            product.brand,
            product.tags?.join(" "),
          ]
            .filter(Boolean)
            .join(" ")
            .toLowerCase()
            .includes(term)
        : true;

      const categoryId =
        product.category?.id !== undefined && product.category?.id !== null
          ? String(product.category.id)
          : null;
      const categorySlug = product.category?.slug ? String(product.category.slug) : null;
      const categoryName = product.category?.name || product.category;

      const matchesCategory =
        selectedCategory === "all" ||
        categoryId === selectedCategory ||
        categorySlug === selectedCategory ||
        categoryName === selectedCategory;

      const priceValue = Number(product.price) || 0;
      const matchesMin = minPrice === "" || priceValue >= Number(minPrice);
      const matchesMax = maxPrice === "" || priceValue <= Number(maxPrice);

      return matchesSearch && matchesCategory && matchesMin && matchesMax;
    });
  }, [products, searchTerm, selectedCategory, minPrice, maxPrice]);

  const sortedProducts = useMemo(() => {
    const base = [...filteredProducts];

    switch (sortOrder) {
      case "lowest-price":
        return base.sort((a, b) => (Number(a.price) || 0) - (Number(b.price) || 0));
      case "highest-price":
        return base.sort((a, b) => (Number(b.price) || 0) - (Number(a.price) || 0));
      case "newest":
        return base.sort(
          (a, b) =>
            new Date(b.published_at || b.created_at || 0) -
            new Date(a.published_at || a.created_at || 0)
        );
      default:
        return base;
    }
  }, [filteredProducts, sortOrder]);

  const stats = useMemo(() => {
    const total = products.length;
    const discounted = products.filter((product) => product.discount || product.old_price).length;
    const fastShipping = products.filter((product) => product.fast_shipping || product.express).length;
    return { total, discounted, fastShipping };
  }, [products]);

  const trendingCategories = useMemo(() => {
    const counts = new Map();
    products.forEach((product) => {
      const categoryName = product.category?.name || "Otros";
      const rawKey =
        product.category?.id !== undefined && product.category?.id !== null
          ? product.category.id
          : product.category?.slug ?? categoryName;
      const normalizedKey = rawKey !== undefined && rawKey !== null ? String(rawKey) : categoryName;

      if (!counts.has(categoryName)) {
        counts.set(categoryName, { count: 0, key: normalizedKey });
      }

      const entry = counts.get(categoryName);
      entry.count += 1;
    });

    return Array.from(counts.entries())
      .sort(([, a], [, b]) => b.count - a.count)
      .slice(0, 6)
      .map(([name, data]) => ({ name, count: data.count, key: data.key }));
  }, [products]);

  const quickFilterOptions = useMemo(() => trendingCategories.slice(0, 4), [trendingCategories]);

  const { sections: highlightedSections, leftoverProducts } = useMemo(() => {
    if (!sortedProducts.length) {
      return { sections: [], leftoverProducts: [] };
    }

    const grouped = new Map();
    sortedProducts.forEach((product) => {
      const categoryName = product.category?.name || "Otros";
      const rawKey =
        product.category?.id !== undefined && product.category?.id !== null
          ? product.category.id
          : product.category?.slug ?? categoryName;
      const normalizedKey = rawKey !== undefined && rawKey !== null ? String(rawKey) : categoryName;

      if (!grouped.has(categoryName)) {
        grouped.set(categoryName, { key: normalizedKey, items: [] });
      }

      const bucket = grouped.get(categoryName);
      if (bucket.items.length < 4) {
        bucket.items.push(product);
      }
    });

    const entries = Array.from(grouped.entries());
    const sections = entries
      .filter(([, data]) => data.items.length > 0)
      .slice(0, CATEGORY_ACCENTS.length)
      .map(([name, data], index) => ({
        name,
        key: data.key,
        items: data.items,
        accent: CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length],
      }));

    const usedIds = new Set();
    sections.forEach((section) => {
      section.items.forEach((item) => usedIds.add(item.id));
    });

    const leftover = sortedProducts.filter((product) => !usedIds.has(product.id));

    return { sections, leftoverProducts: leftover };
  }, [sortedProducts]);

  const addToCart = (productId) => {
    addCartItem(productId)
      .then((payload) => {
        showModal(payload.message || "Producto añadido al carrito.", false);
      })
      .catch(() => {
        showModal("Hubo un error al agregar el producto al carrito.", true);
      });
  };

  const showModal = (message, isError) => {
    setModalMessage(message);
    setIsModalVisible(true);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => {
      setIsModalVisible(false);
    }, 2800);
  };

  const modalClass = modalMessage.toLowerCase().includes("error") ? "bg-rose-500" : "bg-emerald-500";
  const hasActiveFilters = Boolean(searchTerm.trim() || selectedCategory !== "all" || minPrice !== "" || maxPrice !== "");
  const activeFilterCount = [selectedCategory !== "all", minPrice !== "", maxPrice !== ""].filter(Boolean).length + (searchTerm.trim() ? 1 : 0);

  const resetFilters = () => {
    setSearchTerm("");
    setSelectedCategory("all");
    setMinPrice("");
    setMaxPrice("");
    setSortOrder("featured");
  };

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === "all") return t('catalog.filter.all_categories');

    const matched = categories.find((category) => {
      const optionValue =
        category.id !== undefined && category.id !== null
          ? String(category.id)
          : category.slug ?? category.name;

      return String(optionValue) === String(selectedCategory);
    });

    return matched?.name ?? selectedCategory;
  }, [categories, selectedCategory, t]);

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <StorefrontLayout showTopNav onCompactChange={setIsHeaderCompact} />

      <div
        className={[
          'sticky z-30 bg-transparent shadow-none transition-all duration-300',
          'h-[var(--category-rail-height)]',
        ].join(' ')}
        style={{ top: 'calc(var(--header-sticky-height, 0px) + var(--topnav-sticky-height, 0px) - var(--header-compact-offset-active, 0px))' }}
      >
        <div
          className={[
            'relative mx-auto h-full max-w-full px-2 sm:px-4 transition-all duration-300',
            isHeaderCompact ? 'py-1.5 md:py-2.5' : 'py-3 md:py-5',
          ].join(' ')}
        >
          <div className="relative h-full">
            {isHeaderCompact ? (
              <CategoryIconBar
                categories={categories}
                compact
                renderDropdown={(dropdown) => setDropdownElement(dropdown)}
              />
            ) : (
              <CategoryCards
                categories={categories}
                renderDropdown={(dropdown) => setDropdownElement(dropdown)}
              />
            )}
          </div>
        </div>
      </div>

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-[120rem] gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)]">
          <section className="space-y-8">
            <TopBanner height="h-80" banners={heroBanners} />
            <div className="lg:hidden">
              <CatalogFilterPanel
                mode="inline"
                searchTerm={searchTerm}
                setSearchTerm={setSearchTerm}
                selectedCategory={selectedCategory}
                setSelectedCategory={setSelectedCategory}
                minPrice={minPrice}
                setMinPrice={setMinPrice}
                maxPrice={maxPrice}
                setMaxPrice={setMaxPrice}
                sortOrder={sortOrder}
                setSortOrder={setSortOrder}
                categories={categories}
                quickFilterOptions={quickFilterOptions}
                activeFilterCount={activeFilterCount}
                resultCount={sortedProducts.length}
                resetFilters={resetFilters}
                selectedCategoryName={selectedCategoryName}
                isOpen={isInlineFiltersOpen}
                setIsOpen={setIsInlineFiltersOpen}
                sortOptions={sortOptions}
                searchPlaceholder={t('home.filters_search_placeholder')}
                categoryAllLabel={t('catalog.filter.all_categories')}
                renderActiveFilters={({ className }) => (
                  <ActiveFilters
                    searchTerm={searchTerm}
                    selectedCategory={selectedCategory === "all" ? null : selectedCategory}
                    minPrice={minPrice}
                    maxPrice={maxPrice}
                    categories={categories}
                    showClearAction={false}
                    className={className}
                    onClear={() => {
                      setSearchTerm("");
                      setSelectedCategory("all");
                      setMinPrice("");
                      setMaxPrice("");
                    }}
                  />
                )}
              />
            </div>
            <section id="destacados" aria-live="polite" className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Productos destacados</h2>
                  <p className="text-sm text-slate-500">
                    Una selección equilibrada de best sellers, últimas incorporaciones y oportunidades.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSortOrder("lowest-price")}
                  className="inline-flex items-center rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                >
                  Ordenar por precio
                </button>
              </div>

              {isLoading ? (
                <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {Array.from({ length: UI_CONFIG.loader.skeletonCount }).map((_, index) => (
                    <ProductSkeletonCard key={index} />
                  ))}
                </div>
              ) : sortedProducts.length === 0 ? (
                <div className="col-span-full">
                  <Loader text="No se encontraron productos que coincidan con tu búsqueda actual." />
                </div>
              ) : highlightedSections.length > 0 ? (
                <div className="space-y-10">
                  {highlightedSections.map((section) => (
                    <div
                      key={section.name}
                      className={`rounded-[28px] border ${section.accent.border} bg-white p-6 shadow-lg sm:p-7`}
                    >
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <span
                            className={`text-xs font-semibold uppercase tracking-wide ${section.accent.header}`}
                          >
                            Colección destacada
                          </span>
                          <h3 className="text-xl font-semibold text-slate-900">{section.name}</h3>
                        </div>
                        <button
                          type="button"
                          onClick={() => setSelectedCategory(section.key)}
                          className={`rounded-full px-4 py-2 text-xs font-semibold transition ${section.accent.cta}`}
                        >
                          Ver todo
                        </button>
                      </div>
                      <div className="mt-5 grid gap-6 sm:grid-cols-2 xl:grid-cols-4">
                        {section.items.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            isFavorite={favorites.includes(product.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  ))}

                  {leftoverProducts.length > 0 && (
                    <div className="space-y-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <h3 className="text-lg font-semibold text-slate-900">Más opciones para ti</h3>
                        <button
                          type="button"
                          onClick={() => setSortOrder("featured")}
                          className="rounded-full border border-slate-200 px-4 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                          Restablecer orden
                        </button>
                      </div>
                      <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                        {leftoverProducts.map((product) => (
                          <ProductCard
                            key={product.id}
                            product={product}
                            onAddToCart={addToCart}
                            isFavorite={favorites.includes(product.id)}
                            onToggleFavorite={toggleFavorite}
                          />
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ) : (
                <div className="grid justify-center gap-6 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5">
                  {sortedProducts.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      onAddToCart={addToCart}
                      isFavorite={favorites.includes(product.id)}
                      onToggleFavorite={toggleFavorite}
                    />
                  ))}
                </div>
              )}
            </section>

            <AutumnShowcase cards={showcaseBanners} campaignName={campaign?.campaign} />

            {trendingCategories.length > 0 && (
              <div className="space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <h2 className="text-lg font-semibold text-slate-900">Categorías en tendencia</h2>
                  <span className="text-xs font-semibold uppercase tracking-wide text-slate-400">
                    Actualización dinámica
                  </span>
                </div>
                <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
                  {trendingCategories.map((category, index) => {
                    const accent = CATEGORY_ACCENTS[index % CATEGORY_ACCENTS.length];
                    return (
                      <button
                        key={category.name}
                        type="button"
                        onClick={() => setSelectedCategory(category.key)}
                        className={`group flex items-center justify-between rounded-3xl border ${accent.border} bg-gradient-to-r ${accent.gradient} px-5 py-4 text-left shadow-sm transition hover:-translate-y-1 hover:shadow-lg`}
                      >
                        <div>
                          <p className={`text-xs font-semibold uppercase tracking-wide ${accent.header}`}>
                            Tendencia
                          </p>
                          <p className="mt-1 text-sm font-semibold text-slate-800">{category.name}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-semibold ${accent.chip}`}>
                          {category.count}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {showRecommendations && newProducts.length > 0 && (
              <div className="rounded-[28px] border border-indigo-100 bg-gradient-to-r from-indigo-50 via-white to-indigo-50 p-6 shadow-sm">
                <RecommendationBlock
                  title="Novedades que podrían gustarte"
                  description="Basado en artículos recién añadidos y categorías populares."
                  products={newProducts}
                  onAddToCart={addToCart}
                  onToggleFavorite={toggleFavorite}
                  favorites={favorites}
                />
              </div>
            )}
          </section>

          <aside className="relative lg:-mr-8 lg:h-full xl:-mr-10 2xl:-mr-12">
            <CatalogAsideLayout
              isExpanded={isAsideFiltersExpanded}
              stickyTop={CATALOG_STICKY_TOP_WITH_RAIL}
              edge="right"
              filterContent={
                <CatalogFilterPanel
                  mode="aside"
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  categories={categories}
                  quickFilterOptions={quickFilterOptions}
                  activeFilterCount={activeFilterCount}
                  resultCount={sortedProducts.length}
                  resetFilters={resetFilters}
                  selectedCategoryName={selectedCategoryName}
                  isOpen={isAsideFiltersExpanded}
                  setIsOpen={setIsAsideFiltersExpanded}
                  sortOptions={sortOptions}
                  searchPlaceholder={t('home.filters_search_placeholder')}
                  categoryAllLabel={t('catalog.filter.all_categories')}
                  stickyOffset={CATALOG_STICKY_TOP_WITH_RAIL}
                  edge="right"
                  renderActiveFilters={({ className }) => (
                    <ActiveFilters
                      searchTerm={searchTerm}
                      selectedCategory={selectedCategory === "all" ? null : selectedCategory}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      categories={categories}
                      showClearAction={false}
                      className={className}
                      onClear={() => {
                        setSearchTerm("");
                        setSelectedCategory("all");
                        setMinPrice("");
                        setMaxPrice("");
                      }}
                    />
                  )}
                />
              }
              secondaryContent={
                <div className="space-y-6">
                  <div className="relative z-0 grid gap-6 rounded-[32px] border border-slate-100 bg-white/90 p-6 shadow-xl sm:p-8">
                    <div className="space-y-5">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">
                        {user ? t('home.welcome_user', { name: user.name }) : t('home.welcome_guest')}
                      </p>
                      <h1 className="text-3xl font-bold text-slate-900 sm:text-4xl">
                        {t('home.hero_title')}
                      </h1>
                      <p className="text-sm leading-relaxed text-slate-600 sm:text-base">
                        {t('home.hero_subtitle')}
                      </p>
                      <div className="flex flex-wrap items-center gap-3">
                        <a
                          href="#destacados"
                          className="inline-flex items-center gap-2 rounded-full bg-slate-900 px-5 py-2.5 text-sm font-semibold text-white shadow-lg transition hover:bg-slate-800"
                        >
                          {t('home.hero_cta_primary')}
                        </a>
                        <button
                          type="button"
                          onClick={() => setSortOrder("newest")}
                          className="inline-flex items-center gap-2 rounded-full border border-slate-200 px-5 py-2.5 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100"
                        >
                          {t('home.hero_cta_secondary')}
                        </button>
                      </div>
                    </div>

                    <div className="rounded-3xl bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
                      <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/50">
                        {t('home.catalog_summary')}
                      </p>
                      <div className="mt-5 grid grid-cols-1 gap-3 text-center sm:grid-cols-3 lg:grid-cols-1 xl:grid-cols-3">
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                          <p className="text-2xl font-bold">{stats.total}</p>
                          <p className="mt-1 text-xs text-white/70">{t('home.catalog_total_products')}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                          <p className="text-2xl font-bold">{stats.discounted}</p>
                          <p className="mt-1 text-xs text-white/70">{t('home.catalog_discounted_products')}</p>
                        </div>
                        <div className="rounded-2xl border border-white/10 bg-white/10 p-4 backdrop-blur-sm">
                          <p className="text-2xl font-bold">{stats.fastShipping}</p>
                          <p className="mt-1 text-xs text-white/70">{t('home.catalog_fast_shipping_products')}</p>
                        </div>
                      </div>
                      <p className="mt-6 text-xs text-white/60">
                        {t('home.catalog_refresh_note')}
                      </p>
                    </div>
                  </div>

                  <div className="relative z-0 hidden rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm lg:block">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-indigo-500">
                      {t('home.aside_tips_title')}
                    </h3>
                    <ul className="mt-4 space-y-3 text-sm text-slate-600">
                      <li>{t('home.aside_tip_1')}</li>
                      <li>{t('home.aside_tip_2')}</li>
                      <li>{t('home.aside_tip_3')}</li>
                    </ul>
                  </div>

                  <SidebarBanners banners={sidebarBanners} />

                  <div className="relative z-0 rounded-3xl border border-slate-200 bg-white/80 p-6 shadow-sm">
                    <h3 className="text-sm font-semibold uppercase tracking-wide text-slate-700">
                      {t('home.aside_quick_access')}
                    </h3>
                    <div className="mt-4 grid gap-3">
                      {asideQuickLinks.map(({ href, title, subtitle, Icon, accent }) => (
                        <Link
                          key={href}
                          href={href}
                          className={`group flex items-center justify-between gap-4 rounded-2xl border border-slate-200 bg-gradient-to-r ${accent} p-4 transition hover:border-slate-300 hover:bg-white`}
                        >
                          <div className="flex items-center gap-3">
                            <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-slate-200 bg-white shadow-sm">
                              <Icon className="h-5 w-5 text-slate-700" aria-hidden="true" />
                            </span>
                            <div>
                              <p className="text-sm font-semibold text-slate-900">{title}</p>
                              <p className="text-xs text-slate-500">{subtitle}</p>
                            </div>
                          </div>

                          <span className="text-xs font-semibold text-slate-500 transition group-hover:text-slate-700">
                            {t('home.aside_see')}
                          </span>
                        </Link>
                      ))}
                    </div>
                  </div>

                  <div className="relative z-0 rounded-3xl border border-slate-200 bg-gradient-to-br from-slate-900 via-indigo-900 to-slate-900 p-6 text-white shadow-lg">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                          <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">{t('home.aside_safe_title')}</p>
                          <h3 className="mt-2 text-lg font-bold">{t('home.aside_safe_heading')}</h3>
                          <p className="mt-2 text-sm text-white/75">{t('home.aside_safe_body')}</p>
                      </div>
                      <span className="inline-flex h-11 w-11 items-center justify-center rounded-2xl border border-white/10 bg-white/10">
                        <ShieldCheck className="h-5 w-5 text-[#febd69]" aria-hidden="true" />
                      </span>
                    </div>

                    <div className="mt-5 grid grid-cols-2 gap-3">
                      <Link
                        href="/faq"
                        className="group inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/15"
                      >
                        <span className="inline-flex items-center gap-2">
                          <HelpCircle className="h-4 w-4 text-white/70" aria-hidden="true" />
                          {t('home.support_faq')}
                        </span>
                        <span className="text-white/60 group-hover:text-white/85">{t('home.aside_go')}</span>
                      </Link>
                      <Link
                        href="/contact"
                        className="group inline-flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3 text-sm font-semibold text-white/90 transition hover:bg-white/15"
                      >
                        <span className="inline-flex items-center gap-2">
                          <Truck className="h-4 w-4 text-white/70" aria-hidden="true" />
                          {t('home.support_contact')}
                        </span>
                        <span className="text-white/60 group-hover:text-white/85">{t('home.aside_go')}</span>
                      </Link>
                    </div>

                    <div className="mt-4 flex items-center justify-between rounded-2xl border border-white/10 bg-white/10 px-4 py-3">
                      <p className="text-xs font-semibold text-white/70">{t('home.aside_tip_label')}</p>
                      <p className="text-xs text-white/80">{t('home.aside_tip_text')}</p>
                    </div>
                  </div>
                </div>
              }
            />
          </aside>
        </div>
      </main>

      <div className="relative z-[5000]">{dropdownElement}</div>

      {isModalVisible && (
        <div
          className={`${modalClass} fixed bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 rounded-lg px-6 py-3 text-white shadow-lg max-w-[92vw] text-center break-words`}
        >
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
      <RegisterModal isOpen={isRegisterOpen} onClose={() => setIsRegisterOpen(false)} />
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

      <PromoPopups context="global" />
    </div>
  );
};

export default Home;

