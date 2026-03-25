// resources/js/Pages/SeasonalProducts.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { usePage, Head } from "@inertiajs/react";
import Header from "@/Components/navigation/Header.jsx";
import TopNavMenu from "@/Components/navigation/TopNavMenu.jsx";
import SidebarBanners from "@/Components/marketing/SidebarBanners.jsx";
import SpecialCategoryRail from "@/Components/catalog/SpecialCategoryRail.jsx";
import LoginModal from "@/Components/auth/LoginModal.jsx";
import RegisterModal from "@/Components/auth/RegisterModal.jsx";
import ForgotPassword from "@/Components/auth/ForgotPassword.jsx";
import CookieConsentModal from "@/Components/cookies/CookieConsentModal.jsx";
import CustomizeCookiesModal from "@/Components/cookies/CustomizeCookiesModal.jsx";
import UI_CONFIG from "@/config/ui.config";
import { formatCurrency, normalizePrice } from "@/utils/pricing";
import { acceptAllCookies, hasSavedCookieConsent, rejectOptionalCookies, saveCustomCookieSelection } from "@/utils/cookieConsent";

const getDiscountPercentage = (currentPrice, previousPrice) => {
  const current = normalizePrice(currentPrice);
  const previous = normalizePrice(previousPrice);
  if (!previous || previous <= current) return null;
  return Math.round(((previous - current) / previous) * 100);
};

const derivePreviousPrice = (product) => {
  if (product.old_price) return normalizePrice(product.old_price);
  if (product.original_price) return normalizePrice(product.original_price);
  if (product.regular_price) return normalizePrice(product.regular_price);
  if (product.price && product.discount > 0) {
    const current = normalizePrice(product.price);
    const raw = current / (1 - Number(product.discount) / 100);
    return Number.isFinite(raw) ? raw : null;
  }
  return null;
};

const SeasonalCard = ({ product }) => {
  const title = product.name || product.title || "Producto de temporada";
  const categoryName = product.category?.name || "Coleccion de temporada";
  const seasonLabel = product.season?.name || product.season || "Temporada actual";
  const previousPrice = derivePreviousPrice(product);
  const discount = getDiscountPercentage(product.price, previousPrice);
  const link =
    product.link ||
    (product.slug ? `/product/${product.slug}` : product.id ? `/product/${product.id}` : "#");

  return (
    <article className="group relative flex h-full w-full min-w-0 flex-col rounded-2xl border border-lime-200 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-lime-200">
      <div className="relative mb-4 flex items-center justify-center rounded-xl bg-lime-50 p-4">
        <img
          src={product.image_url || product.image || "/images/logo.png"}
          alt={title}
          className="h-32 w-full object-contain"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-lime-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
          {seasonLabel}
        </span>
        {discount !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow">
            -{discount}%
          </span>
        )}
      </div>
      <h2 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-lime-700">
        {title}
      </h2>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">{categoryName}</p>
      <div className="mb-4 flex items-end gap-2">
        <span className="text-xl font-bold text-emerald-700">{formatCurrency(product.price)}</span>
        {previousPrice && (
          <span className="text-xs text-slate-400 line-through">{formatCurrency(previousPrice)}</span>
        )}
      </div>
      <p className="mb-6 line-clamp-3 text-sm text-slate-600">
        {product.description ||
          "Seleccion vigente para la temporada, con disponibilidad actualizada y rotacion comercial activa."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : "_self"}
          rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex-1 rounded-full bg-lime-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-lime-700"
        >
          Ver producto
        </a>
        <span className="rounded-full bg-lime-100 px-3 py-1 text-xs font-medium text-lime-700">
          Stock limitado
        </span>
      </div>
    </article>
  );
};

const SeasonalProducts = () => {
  const { auth, banners } = usePage().props;
  const user = auth?.user;

  const [modalMessage, setModalMessage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);

  const [isLoginOpen, setIsLoginOpen] = useState(false);
  const [isRegisterOpen, setIsRegisterOpen] = useState(false);
  const [isForgotPasswordOpen, setIsForgotPasswordOpen] = useState(false);

  const [showCookiesModal, setShowCookiesModal] = useState(false);
  const [showCustomizeModal, setShowCustomizeModal] = useState(false);

  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const controllerRef = useRef(null);

  const [activeCategory, setActiveCategory] = useState("all");
  const [sortOrder, setSortOrder] = useState("featured");

  useEffect(() => {
    if (!hasSavedCookieConsent() && UI_CONFIG.cookies.showConsentByDefault) {
      setShowCookiesModal(true);
    }
  }, []);

  useEffect(() => {
    if (!isModalVisible) return undefined;
    const timeout = setTimeout(() => setIsModalVisible(false), 4000);
    return () => clearTimeout(timeout);
  }, [isModalVisible]);

  const loadProducts = async () => {
    try {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("loading");
      setError("");

      const response = await fetch("/api/seasonal-products", { signal: controller.signal });
      if (!response.ok) {
        throw new Error("No pudimos recuperar los productos de temporada.");
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("error");
      setError("No pudimos cargar los productos de temporada en este momento.");
      setModalMessage("Error al cargar los productos. Vuelve a intentarlo en unos segundos.");
      setIsModalVisible(true);
    }
  };

  useEffect(() => {
    loadProducts();
    return () => controllerRef.current?.abort();
  }, []);

  const handleAcceptCookies = () => {
    acceptAllCookies();
    setShowCookiesModal(false);
    setShowCustomizeModal(false);
  };

  const handleRejectCookies = () => {
    rejectOptionalCookies();
    setShowCookiesModal(false);
    setShowCustomizeModal(false);
  };

  const handleSaveCookiePreferences = (settings) => {
    saveCustomCookieSelection(settings);
    setShowCustomizeModal(false);
    setShowCookiesModal(false);
  };

  const handleCustomize = () => {
    setShowCustomizeModal(true);
    setShowCookiesModal(false);
  };

  const handleLogout = () => {
    Inertia.post("/logout");
  };

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((product) => {
      if (product.category?.name) set.add(product.category.name);
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(
    () =>
      products.filter((product) => {
        const categoryName = product.category?.name || product.category;
        return activeCategory === "all" || categoryName === activeCategory;
      }),
    [products, activeCategory]
  );

  const sortedProducts = useMemo(() => {
    const base = [...filteredProducts];
    if (sortOrder === "lowest-price") {
      return base.sort(
        (a, b) => normalizePrice(a.price) - normalizePrice(b.price)
      );
    }
    if (sortOrder === "highest-discount") {
      return base.sort(
        (a, b) =>
          (getDiscountPercentage(b.price, derivePreviousPrice(b)) || 0) -
          (getDiscountPercentage(a.price, derivePreviousPrice(a)) || 0)
      );
    }
    return base;
  }, [filteredProducts, sortOrder]);

  const insights = useMemo(() => {
    const total = products.length;
    const discounted = products.filter(
      (product) => getDiscountPercentage(product.price, derivePreviousPrice(product)) !== null
    ).length;
    const newArrivals = products.filter((product) => product.is_new || product.badge === "new").length;

    return {
      total,
      discounted,
      newArrivals,
    };
  }, [products]);

  const modalClass = modalMessage.includes("error") ? "bg-rose-500" : "bg-emerald-500";

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-green-50 via-white to-lime-100 text-slate-800">
      <Head title="Productos de temporada" />
      <Header user={user} onLogout={handleLogout} />
      <TopNavMenu />

      <SpecialCategoryRail
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        theme="lime"
        className="border-lime-200"
        style={{ top: 'calc(var(--header-sticky-height, 0px) + var(--topnav-sticky-height, 0px) - var(--header-compact-offset-active, 0px))' }}
        controls={
          <select
            value={sortOrder}
            onChange={(event) => setSortOrder(event.target.value)}
            className="rounded-full border border-lime-200 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-lime-300 focus:outline-none focus:ring-2 focus:ring-lime-200"
          >
            <option value="featured">Destacados</option>
            <option value="lowest-price">Precio mas bajo</option>
            <option value="highest-discount">Mayor descuento</option>
          </select>
        }
      />

      <main className="flex-grow px-3 py-8 sm:px-4 lg:px-5">
        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-3xl border border-lime-200 bg-white/70 shadow-lg">
              <div className="bg-gradient-to-r from-lime-600 via-emerald-500 to-green-500 px-6 py-8 text-white sm:px-10">
                <p className="text-sm font-semibold uppercase tracking-[0.3em]">
                  Temporada en tendencia
                </p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                  Productos de temporada con disponibilidad y precio en operacion
                </h1>
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85">
                  Agrupamos las referencias estacionales que siguen activas en catalogo para que encuentres colecciones oportunas sin navegar todo el inventario.
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Productos activos
                    </p>
                    <p className="mt-2 text-2xl font-bold">{insights.total}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Ofertas con descuento
                    </p>
                    <p className="mt-2 text-2xl font-bold">{insights.discounted}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Nuevas incorporaciones
                    </p>
                    <p className="mt-2 text-2xl font-bold">{insights.newArrivals}</p>
                  </div>
                </div>
              </div>

            </div>

            <div aria-live="polite">
              {status === "loading" && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <div key={index} className="w-full rounded-2xl border border-lime-200 bg-white/80 p-4 shadow-sm animate-pulse">
                      <div className="h-32 w-full rounded-xl bg-lime-100" />
                      <div className="mt-5 h-4 w-3/4 bg-lime-100 rounded" />
                      <div className="mt-3 h-3 w-1/2 bg-lime-100 rounded" />
                      <div className="mt-6 h-10 w-full bg-lime-100 rounded-lg" />
                    </div>
                  ))}
                </div>
              )}

              {status === "error" && (
                <div className="flex flex-col items-center justify-center gap-4 rounded-2xl border border-rose-100 bg-rose-50 p-8 text-center text-rose-600">
                  <p className="text-lg font-semibold">Ups, algo ha fallado</p>
                  <p className="max-w-md text-sm text-rose-500">{error}</p>
                  <button
                    type="button"
                    onClick={loadProducts}
                    className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-600"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}

              {status === "ready" && sortedProducts.length === 0 && (
                <div className="rounded-2xl border border-lime-200 bg-white p-10 text-center shadow-sm">
                  <p className="text-lg font-semibold text-slate-900">Sin coincidencias</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Ajusta filtros o busqueda para descubrir mas productos de temporada.
                  </p>
                </div>
              )}

              {status === "ready" && sortedProducts.length > 0 && (
                <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                  {sortedProducts.map((product) => (
                    <SeasonalCard key={product.id || product.name} product={product} />
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              La seleccion cambia cuando rota la temporada o cuando una referencia deja de tener stock operativo.
            </p>
          </section>

          <aside className="space-y-6 xl:sticky xl:top-[calc(var(--header-sticky-height,0px)+var(--topnav-sticky-height,0px)-var(--header-compact-offset-active,0px)+6.5rem)] xl:self-start">
            <div className="hidden rounded-3xl border border-lime-200 bg-white/70 p-6 shadow-lg xl:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-lime-600">Guía rápida</h2>
              <p className="mt-2 text-sm text-slate-600">
                Combina colecciones en tendencia con nuevas incorporaciones para mantener variedad sin perder relevancia estacional.
              </p>
            </div>

            <div className="hidden h-full rounded-3xl border border-lime-200 bg-white/70 p-6 shadow-lg xl:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-lime-600">Patrocinado</h2>
              <SidebarBanners banners={banners?.seasonal || banners?.default || []} />
            </div>

            <div className="block overflow-hidden rounded-3xl border border-lime-200 bg-white/70 shadow-lg xl:hidden">
              {banners?.seasonal?.[0] && (
                <img
                  src={banners.seasonal[0].src}
                  alt={banners.seasonal[0].alt || "Promocion de temporada"}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </aside>
        </div>
      </main>

      {isModalVisible && modalMessage && (
        <div className={`${modalClass} fixed bottom-10 left-1/2 -translate-x-1/2 rounded-lg px-6 py-3 text-white shadow-lg`}>
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
        onSave={handleSaveCookiePreferences}
      />
    </div>
  );
};

export default SeasonalProducts;
