import React, { useEffect, useMemo, useRef, useState } from "react";
import { Inertia } from "@inertiajs/inertia";
import { usePage, Head } from "@inertiajs/react";

import Header from "@/Components/navigation/Header.jsx";
import LoginModal from "@/Components/auth/LoginModal.jsx";
import RegisterModal from "@/Components/auth/RegisterModal.jsx";
import ForgotPassword from "@/Components/auth/ForgotPassword.jsx";
import TopNavMenu from "@/Components/navigation/TopNavMenu.jsx";
import CookieConsentModal from "@/Components/cookies/CookieConsentModal.jsx";
import CustomizeCookiesModal from "@/Components/cookies/CustomizeCookiesModal.jsx";
import UI_CONFIG from "@/config/ui.config";

const currencyFormatter = new Intl.NumberFormat("es-ES", {
  style: "currency",
  currency: "EUR",
  maximumFractionDigits: 2,
});

const normalizePrice = (value) => {
  if (value === null || value === undefined || value === "") return 0;
  if (typeof value === "number" && Number.isFinite(value)) return value;
  const sanitized = String(value).trim().replace(/[^\d,.-]/g, "");
  const normalized = sanitized.replace(/,/g, ".");
  const parsed = Number.parseFloat(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
};

const formatCurrency = (value) => currencyFormatter.format(normalizePrice(value));

const getDiscountPercentage = (currentPrice, previousPrice) => {
  const current = normalizePrice(currentPrice);
  const previous = normalizePrice(previousPrice);
  if (!previous || previous <= current) return null;
  return Math.round(((previous - current) / previous) * 100);
};

const derivePreviousPrice = (product) => {
  if (product.original_price) return normalizePrice(product.original_price);
  if (product.old_price) return normalizePrice(product.old_price);
  if (product.regular_price) return normalizePrice(product.regular_price);
  if (product.price && product.discount > 0) {
    const current = normalizePrice(product.price);
    const raw = current / (1 - Number(product.discount) / 100);
    return Number.isFinite(raw) ? raw : null;
  }
  return null;
};

const SkeletonCard = () => (
  <div className="w-full max-w-xs rounded-2xl border border-indigo-100 bg-white/80 p-4 shadow-sm animate-pulse">
    <div className="h-36 w-full rounded-xl bg-indigo-100" />
    <div className="mt-5 h-4 w-3/4 rounded bg-indigo-100" />
    <div className="mt-3 h-3 w-1/2 rounded bg-indigo-100" />
    <div className="mt-6 h-10 w-full rounded-lg bg-indigo-100" />
  </div>
);

const ProductCard = ({ product, onAddToCart }) => {
  const title = product.name || product.title || "Nuevo producto";
  const previousPrice = derivePreviousPrice(product);
  const discount = getDiscountPercentage(product.price, previousPrice);
  const link =
    product.link ||
    (product.slug ? `/product/${product.slug}` : product.id ? `/product/${product.id}` : "#");

  return (
    <article className="group relative flex w-full max-w-xs flex-col rounded-2xl border border-indigo-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-indigo-200">
      <div className="relative mb-4 flex items-center justify-center overflow-hidden rounded-xl bg-indigo-50 p-4">
        <img
          src={product.image || product.image_url || "/images/logo.png"}
          alt={title}
          className="h-40 w-full object-contain"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-indigo-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
          Nuevo
        </span>
        {discount !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-emerald-500 px-3 py-1 text-xs font-semibold text-white shadow">
            -{discount}%
          </span>
        )}
      </div>
      <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-indigo-600">
        {title}
      </h3>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
        {product.category?.name || product.category || "Colección"}
      </p>
      <div className="mb-4 flex items-end gap-2">
        <span className="text-xl font-bold text-emerald-600">{formatCurrency(product.price)}</span>
        {previousPrice && (
          <span className="text-xs text-slate-400 line-through">{formatCurrency(previousPrice)}</span>
        )}
      </div>
      <p className="mb-6 line-clamp-3 text-sm text-slate-600">
        {product.short_description ||
          product.description ||
          "Edición limitada con disponibilidad exclusiva durante esta temporada."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : "_self"}
          rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex-1 rounded-full bg-indigo-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-indigo-700"
        >
          Ver detalle
        </a>
        <button
          type="button"
          onClick={() => onAddToCart(product)}
          className="rounded-full border border-indigo-200 px-4 py-2 text-sm font-semibold text-indigo-600 transition-colors duration-200 hover:bg-indigo-50"
        >
          Añadir
        </button>
      </div>
    </article>
  );
};

const NewArrivals = () => {
  const { auth } = usePage().props;
  const user = auth?.user;

  const [modalMessage, setModalMessage] = useState("");
  const [isModalVisible, setIsModalVisible] = useState(false);
  const toastTimeoutRef = useRef(null);

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
  const [searchTerm, setSearchTerm] = useState("");
  const [sortOrder, setSortOrder] = useState("featured");

  useEffect(() => {
    const accepted = localStorage.getItem("cookiesAccepted");
    if (!accepted && UI_CONFIG.cookies.showConsentByDefault) {
      setShowCookiesModal(true);
    }
  }, []);

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

  const handleLogout = () => {
    Inertia.post("/logout");
  };

  const loadProducts = async () => {
    try {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("loading");
      setError("");

      const response = await fetch("/api/new-arrivals", { signal: controller.signal });
      if (!response.ok) {
        throw new Error("No pudimos recuperar las novedades.");
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("error");
      setError("No pudimos cargar las novedades en este momento. Intenta nuevamente en unos segundos.");
    }
  };

  useEffect(() => {
    loadProducts();
    return () => controllerRef.current?.abort();
  }, []);

  useEffect(() => {
    if (!isModalVisible) return undefined;
    const timeout = setTimeout(() => setIsModalVisible(false), 3200);
    return () => clearTimeout(timeout);
  }, [isModalVisible]);

  const handleAddToCart = (product) => {
    setIsModalVisible(true);
    setModalMessage(`"${product.name || product.title}" se añadió al carrito.`);
    clearTimeout(toastTimeoutRef.current);
    toastTimeoutRef.current = setTimeout(() => setIsModalVisible(false), 3200);
  };

  const categories = useMemo(() => {
    const set = new Set();
    products.forEach((product) => {
      if (product.category?.name) {
        set.add(product.category.name);
      } else if (typeof product.category === "string") {
        set.add(product.category);
      }
    });
    return Array.from(set);
  }, [products]);

  const filteredProducts = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    return products.filter((product) => {
      const categoryName =
        product.category?.name || (typeof product.category === "string" ? product.category : "");
      const matchesCategory = activeCategory === "all" || categoryName === activeCategory;
      if (!matchesCategory) return false;

      if (!term) return true;

      const haystack = [product.name, product.title, categoryName, product.description]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(term);
    });
  }, [products, activeCategory, searchTerm]);

  const sortedProducts = useMemo(() => {
    const base = [...filteredProducts];

    if (sortOrder === "lowest-price") {
      return base.sort((a, b) => normalizePrice(a.price) - normalizePrice(b.price));
    }

    if (sortOrder === "highest-discount") {
      return base.sort(
        (a, b) =>
          (getDiscountPercentage(b.price, derivePreviousPrice(b)) || 0) -
          (getDiscountPercentage(a.price, derivePreviousPrice(a)) || 0)
      );
    }

    if (sortOrder === "newest") {
      return base.sort((a, b) => {
        const dateA = new Date(a.published_at || a.created_at || 0).getTime();
        const dateB = new Date(b.published_at || b.created_at || 0).getTime();
        return dateB - dateA;
      });
    }

    return base;
  }, [filteredProducts, sortOrder]);

  const insights = useMemo(() => {
    const total = products.length;
    const discounted = products.filter(
      (product) => getDiscountPercentage(product.price, derivePreviousPrice(product)) !== null
    ).length;
    const limited = products.filter((product) => product.limited || product.stock === "limited").length;

    return {
      total,
      discounted,
      limited,
    };
  }, [products]);

  const modalClass = useMemo(
    () => (modalMessage.toLowerCase().includes("error") ? "bg-rose-500" : "bg-emerald-500"),
    [modalMessage]
  );

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-white via-indigo-50 to-white text-slate-800">
      <Head title="Novedades | Limoneo" />

      <Header user={user} onLogout={handleLogout} />
      <TopNavMenu />

      <div
        className="sticky z-30 border-b border-indigo-100 bg-white/85 shadow-sm backdrop-blur"
        style={{ top: 'calc(var(--header-sticky-height, 0px) + var(--topnav-sticky-height, 0px))' }}
      >
        <div className="mx-auto w-full max-w-7xl px-4 sm:px-6 lg:px-8 py-3">
          <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <div className="flex flex-wrap items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
              <button
                type="button"
                onClick={() => setActiveCategory("all")}
                className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                  activeCategory === "all"
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                }`}
              >
                Todas las categorías
              </button>
              {categories.map((category) => (
                <button
                  key={category}
                  type="button"
                  onClick={() => setActiveCategory(category)}
                  className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === category
                      ? "bg-indigo-600 text-white shadow"
                      : "bg-indigo-50 text-indigo-600 hover:bg-indigo-100"
                  }`}
                >
                  {category}
                </button>
              ))}
            </div>

            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row sm:items-center">
              <div className="relative sm:w-64">
                <input
                  type="search"
                  value={searchTerm}
                  onChange={(event) => setSearchTerm(event.target.value)}
                  className="w-full rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm text-slate-700 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  placeholder="Buscar por nombre o categoría"
                />
              </div>
              <select
                value={sortOrder}
                onChange={(event) => setSortOrder(event.target.value)}
                className="rounded-full border border-indigo-100 bg-white px-4 py-2 text-sm font-semibold text-slate-600 shadow-sm focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-200"
              >
                <option value="featured">Destacados</option>
                <option value="newest">Más recientes</option>
                <option value="lowest-price">Precio más bajo</option>
                <option value="highest-discount">Mayor descuento</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[5fr_2fr]">
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 shadow-lg">
              <div className="bg-gradient-to-r from-indigo-600 via-indigo-500 to-purple-500 px-6 py-8 text-white sm:px-10">
                <p className="text-sm font-semibold uppercase tracking-[0.3em]">Nuevas incorporaciones</p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                  Descubre lo último en tecnología, moda y lifestyle
                </h1>
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85">
                  Seleccionamos semanalmente productos con stock limitado, descuentos exclusivos y disponibilidad inmediata.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={loadProducts}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-indigo-600 shadow transition hover:bg-indigo-50"
                  >
                    Recargar novedades
                  </button>
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                    Actualización semanal
                  </span>
                </div>
              </div>

              <dl className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    Productos nuevos
                  </dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">{insights.total}</dd>
                  <p className="mt-1 text-xs text-slate-500">Detectados esta semana</p>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    Con descuento exclusivo
                  </dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">{insights.discounted}</dd>
                  <p className="mt-1 text-xs text-slate-500">Sobre precio original</p>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-indigo-500">
                    Stock limitado
                  </dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">{insights.limited}</dd>
                  <p className="mt-1 text-xs text-slate-500">Últimas unidades</p>
                </div>
              </dl>

            </div>

            <section aria-live="polite">
              {status === "loading" && (
                <div className="flex flex-wrap justify-center gap-6">
                  {Array.from({ length: 6 }).map((_, index) => (
                    <SkeletonCard key={index} />
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
                <div className="rounded-2xl border border-indigo-100 bg-white p-10 text-center shadow-sm">
                  <p className="text-lg font-semibold text-slate-900">Sin coincidencias</p>
                  <p className="mt-2 text-sm text-slate-500">
                    Ajusta filtros o búsqueda para descubrir más novedades disponibles.
                  </p>
                </div>
              )}

              {status === "ready" && sortedProducts.length > 0 && (
                <div className="grid justify-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {sortedProducts.map((product) => (
                    <ProductCard key={product.id || product.name} product={product} onAddToCart={handleAddToCart} />
                  ))}
                </div>
              )}
            </section>

            <p className="text-center text-sm text-slate-500">
              ¿Quieres estar al día? Suscríbete a nuestro boletín y recibe novedades antes que nadie.
            </p>
          </section>

          <aside className="space-y-6">
            <div className="hidden rounded-3xl border border-indigo-100 bg-white/70 p-6 shadow-lg lg:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-indigo-500">Consejo</h2>
              <p className="mt-2 text-sm text-slate-600">
                Añade tus favoritos al carrito para recibir alertas cuando el stock esté por agotarse.
              </p>
            </div>

            <div className="block overflow-hidden rounded-3xl border border-indigo-100 bg-white/70 shadow-lg lg:hidden">
              <img
                src="/images/banners/new-arrivals-mobile.jpg"
                alt="Novedades destacadas"
                className="h-40 w-full object-cover"
                loading="lazy"
              />
            </div>
          </aside>
        </div>
      </main>

      {isModalVisible && (
        <div className={`${modalClass} fixed bottom-8 left-1/2 -translate-x-1/2 rounded-lg px-6 py-3 text-white shadow-lg`}>
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
    </div>
  );
};

export default NewArrivals;