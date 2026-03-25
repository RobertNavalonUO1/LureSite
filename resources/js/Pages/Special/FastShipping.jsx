// resources/js/Pages/FastShipping.jsx
import React, { useMemo, useState } from "react";
import { usePage, Head } from "@inertiajs/react";
import Header from "@/Components/navigation/Header.jsx";
import TopNavMenu from "@/Components/navigation/TopNavMenu.jsx";
import SidebarBanners from "@/Components/marketing/SidebarBanners.jsx";
import SpecialCategoryRail from "@/Components/catalog/SpecialCategoryRail.jsx";
import { formatCurrency, normalizePrice } from "@/utils/pricing";

const deriveOriginalPrice = (product) => {
  if (product.original_price) return normalizePrice(product.original_price);
  if (product.old_price) return normalizePrice(product.old_price);
  if (product.price && product.discount > 0) {
    const current = normalizePrice(product.price);
    const raw = current / (1 - Number(product.discount) / 100);
    return Number.isFinite(raw) ? raw : null;
  }
  return null;
};

const getDiscountFromProduct = (product) => {
  const original = deriveOriginalPrice(product);
  const current = normalizePrice(product.price);
  if (!original || original <= current) return null;
  return Math.round(((original - current) / original) * 100);
};

const deliveryLabel = (product) => {
  const value =
    product.delivery_estimate ||
    product.shipping_time ||
    product.deliveryTime ||
    product.deliveryLabel ||
    "";
  const normalized = String(value).trim();
  if (normalized) return normalized;
  return product.fast_shipping ? "Entrega en 24 h" : "Entrega en 48 h";
};

const ProductCard = ({ product, onQuickView }) => {
  const title = product.name || "Producto";
  const categoryName = product.category?.name || "Envío rápido";
  const originalPrice = deriveOriginalPrice(product);
  const discount = getDiscountFromProduct(product);
  const link =
    product.link ||
    (product.slug ? `/product/${product.slug}` : product.id ? `/product/${product.id}` : "#");

  return (
    <article className="group relative flex h-full w-full min-w-0 flex-col rounded-2xl border border-blue-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-blue-200">
      <div className="relative mb-4 flex items-center justify-center rounded-xl bg-blue-50 p-4">
        <img
          src={product.image_url || product.image || "/images/logo.png"}
          alt={title}
          className="h-32 w-full object-contain"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-blue-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
          Envío rápido
        </span>
        {discount !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow">
            -{discount}%
          </span>
        )}
      </div>
      <h2 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-blue-700">
        {title}
      </h2>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">{categoryName}</p>
      <div className="mb-4 flex items-end gap-2">
        <span className="text-xl font-bold text-blue-700">{formatCurrency(product.price)}</span>
        {originalPrice && (
          <span className="text-xs text-slate-400 line-through">{formatCurrency(originalPrice)}</span>
        )}
      </div>
      <p className="mb-4 line-clamp-3 text-sm text-slate-600">
        {product.description || "Producto con salida agil desde almacen y seguimiento disponible tras la compra."}
      </p>
      <div className="mb-4 flex items-center gap-2 text-xs font-semibold text-blue-600">
        <span className="rounded-full bg-blue-100 px-3 py-1">{deliveryLabel(product)}</span>
        <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
          Seguimiento incluido
        </span>
      </div>
      <div className="mt-auto flex items-center gap-3">
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : "_self"}
          rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex-1 rounded-full bg-blue-600 px-4 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
        >
          Ver detalles
        </a>
        <button
          type="button"
          onClick={() => onQuickView(product)}
          className="rounded-full border border-blue-200 px-4 py-2 text-sm font-semibold text-blue-600 transition-colors duration-200 hover:bg-blue-50"
        >
          Vista rápida
        </button>
      </div>
    </article>
  );
};

const QuickViewModal = ({ product, onClose }) => {
  if (!product) return null;
  const title = product.name || "Producto";
  const originalPrice = deriveOriginalPrice(product);
  const discount = getDiscountFromProduct(product);
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 px-4">
      <div className="relative w-full max-w-lg rounded-3xl bg-white p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 text-2xl font-bold text-slate-300 transition hover:text-blue-600"
          aria-label="Cerrar"
        >
          X
        </button>
        <div className="grid gap-6 sm:grid-cols-[200px_1fr]">
          <div className="rounded-2xl bg-blue-50 p-4">
            <img
              src={product.image_url || product.image || "/images/logo.png"}
              alt={title}
              className="h-48 w-full object-contain"
              loading="lazy"
            />
          </div>
          <div>
            <h2 className="text-2xl font-bold text-slate-900">{title}</h2>
            <p className="mt-2 text-sm uppercase tracking-wide text-slate-400">
              {product.category?.name || "Envío rápido"}
            </p>
            <div className="mt-4 flex items-end gap-3">
              <span className="text-2xl font-bold text-blue-700">{formatCurrency(product.price)}</span>
              {originalPrice && (
                <span className="text-sm text-slate-400 line-through">
                  {formatCurrency(originalPrice)}
                </span>
              )}
              {discount !== null && (
                <span className="rounded-full bg-rose-100 px-3 py-1 text-xs font-semibold text-rose-600">
                  -{discount}% ahorro
                </span>
              )}
            </div>
            <p className="mt-4 text-sm text-slate-600">
              {product.description ||
                "Salida prioritaria desde almacen con seguimiento y ventana de entrega estimada visible."}
            </p>
            <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-blue-600">
              <span className="rounded-full bg-blue-100 px-3 py-1">{deliveryLabel(product)}</span>
              <span className="rounded-full bg-emerald-100 px-3 py-1 text-emerald-700">
                Garantía de entrega
              </span>
            </div>
            <button
              type="button"
              className="mt-6 w-full rounded-full bg-blue-600 px-4 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-blue-700"
            >
              Añadir al carrito
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default function FastShipping() {
  const { products: productsFromPage = [], banners } = usePage().props;
  const [quickViewProduct, setQuickViewProduct] = useState(null);
  const [activeCategory, setActiveCategory] = useState("all");

  const products = Array.isArray(productsFromPage) ? productsFromPage : [];

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

  const insights = useMemo(() => {
    const total = products.length;
    const discounted = products.filter((product) => getDiscountFromProduct(product) !== null).length;
    const ultraFast = products.filter((product) => {
      const label = deliveryLabel(product).toLowerCase();
      return (
        product.delivery_hours === 24 ||
        label.includes("24") ||
        product.fast_shipping === true
      );
    }).length;

    return {
      total,
      discounted,
      ultraFast,
    };
  }, [products]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 via-white to-blue-100 text-slate-800">
      <Head title="Productos con envío rápido" />
      <Header />
      <TopNavMenu />

      <SpecialCategoryRail
        categories={categories}
        activeCategory={activeCategory}
        onCategoryChange={setActiveCategory}
        theme="blue"
        className="border-blue-100"
        style={{ top: 'calc(var(--header-sticky-height, 0px) + var(--topnav-sticky-height, 0px) - var(--header-compact-offset-active, 0px))' }}
      />

      <main className="flex-grow px-3 py-8 sm:px-4 lg:px-5">
        <div className="mx-auto grid w-full max-w-[1500px] grid-cols-1 gap-8 xl:grid-cols-[minmax(0,1fr)_18rem]">
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-3xl border border-blue-100 bg-white/70 shadow-lg">
              <div className="bg-gradient-to-r from-blue-600 via-blue-500 to-sky-500 px-6 py-8 text-white sm:px-10">
                <p className="text-sm font-semibold uppercase tracking-[0.3em]">
                  Entrega garantizada
                </p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                  Compra hoy y recibe antes de 48 horas
                </h1>
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85">
                  Productos seleccionados con envío prioritario, seguimiento en tiempo real y
                  compromiso de salida agil sobre referencias con stock ya confirmado.
                </p>
                <div className="mt-6 grid gap-6 sm:grid-cols-3">
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Productos disponibles
                    </p>
                    <p className="mt-2 text-2xl font-bold">{insights.total}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Con descuento exclusivo
                    </p>
                    <p className="mt-2 text-2xl font-bold">{insights.discounted}</p>
                  </div>
                  <div>
                    <p className="text-xs font-semibold uppercase tracking-wide text-white/70">
                      Entrega en menos de 24 h
                    </p>
                    <p className="mt-2 text-2xl font-bold">{insights.ultraFast}</p>
                  </div>
                </div>
              </div>

            </div>

            {filteredProducts.length === 0 ? (
              <div className="rounded-2xl border border-blue-100 bg-white p-10 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">Sin coincidencias</p>
                <p className="mt-2 text-sm text-slate-500">
                  Ajusta la búsqueda o selecciona otra categoría para ver más productos con envío rápido.
                </p>
              </div>
            ) : (
              <div className="grid gap-5 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4">
                {filteredProducts.map((product) => (
                  <ProductCard
                    key={product.id || product.name}
                    product={product}
                    onQuickView={setQuickViewProduct}
                  />
                ))}
              </div>
            )}
          </section>

          <aside className="space-y-6 xl:sticky xl:top-[calc(var(--header-sticky-height,0px)+var(--topnav-sticky-height,0px)-var(--header-compact-offset-active,0px)+6.5rem)] xl:self-start">
            <div className="hidden rounded-3xl border border-blue-100 bg-white/70 p-6 shadow-lg xl:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-500">Guía rápida</h2>
              <p className="mt-2 text-sm text-slate-600">
                Prioriza referencias con descuento y stock confirmado si buscas entrega inmediata sin sacrificar margen de ahorro.
              </p>
            </div>

            <div className="hidden h-full rounded-3xl border border-blue-100 bg-white/70 p-6 shadow-lg xl:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-blue-500">Patrocinado</h2>
              <SidebarBanners banners={banners?.fastShipping || banners?.default || []} />
            </div>

            <div className="block overflow-hidden rounded-3xl border border-blue-100 bg-white/70 shadow-lg xl:hidden">
              {banners?.fastShipping?.[0] && (
                <img
                  src={banners.fastShipping[0].src}
                  alt={banners.fastShipping[0].alt || "Promoción envío rápido"}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </aside>
        </div>
      </main>

      <QuickViewModal product={quickViewProduct} onClose={() => setQuickViewProduct(null)} />
    </div>
  );
}
