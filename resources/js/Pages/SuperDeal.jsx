// resources/js/Pages/SuperDeal.jsx
import React, { useEffect, useMemo, useRef, useState } from "react";
import { usePage, Head } from "@inertiajs/react";
import Header from "@/Components/Header";
import TopNavMenu from "@/Components/TopNavMenu";
import SidebarBanners from "@/Components/SidebarBanners";

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

const FeaturedDealCard = ({ product }) => {
  const title = product.title || product.name || "Super deal destacado";
  const previousPrice = derivePreviousPrice(product);
  const discount = getDiscountPercentage(product.price, previousPrice);
  const link =
    product.link ||
    (product.slug ? `/product/${product.slug}` : product.id ? `/product/${product.id}` : "#");

  return (
    <article className="relative grid gap-6 overflow-hidden rounded-3xl border border-orange-200 bg-gradient-to-br from-orange-50 via-white to-amber-100 p-6 shadow-lg transition duration-200 hover:-translate-y-1 hover:shadow-xl lg:grid-cols-[1.4fr_1fr]">
      <div>
        <span className="inline-flex items-center gap-2 rounded-full bg-orange-500 px-4 py-2 text-xs font-semibold uppercase tracking-wide text-white shadow">
          Super deal del dia
        </span>
        <h2 className="mt-4 text-3xl font-black text-slate-900 lg:text-4xl">{title}</h2>
        <p className="mt-4 max-w-xl text-sm text-slate-600">
          {product.description ||
            "Aprovecha esta oportunidad limitada con envio rapido, garantia extendida y soporte prioritario."}
        </p>
        <div className="mt-6 flex flex-wrap items-center gap-4">
          <span className="text-3xl font-bold text-orange-600">{formatCurrency(product.price)}</span>
          {previousPrice && (
            <span className="text-sm text-slate-400 line-through">{formatCurrency(previousPrice)}</span>
          )}
          {discount !== null && (
            <span className="rounded-full bg-rose-100 px-4 py-2 text-xs font-semibold text-rose-600">
              -{discount}% ahorro
            </span>
          )}
        </div>
        <div className="mt-6 flex flex-wrap items-center gap-3">
          <a
            href={link}
            target={link.startsWith("http") ? "_blank" : "_self"}
            rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
            className="rounded-full bg-orange-500 px-6 py-3 text-sm font-semibold text-white transition-colors duration-200 hover:bg-orange-600"
          >
            Comprar ahora
          </a>
          <span className="rounded-full bg-white/70 px-4 py-2 text-xs font-semibold text-orange-600 shadow">
            Oferta expira pronto
          </span>
        </div>
      </div>
      <div className="relative flex items-center justify-center rounded-2xl bg-white/70 p-6">
        <img
          src={product.image || product.image_url || "/images/logo.png"}
          alt={title}
          className="h-64 w-full max-w-md object-contain"
          loading="lazy"
        />
        <div className="absolute left-6 top-6 rounded-2xl bg-white/80 p-4 text-center shadow-lg">
          <p className="text-xs font-semibold uppercase tracking-wide text-orange-500">Quedan</p>
          <p className="mt-1 text-2xl font-bold text-orange-600">
            {product.remaining_units || "Pocas"} unidades
          </p>
        </div>
      </div>
    </article>
  );
};

const DealCard = ({ product }) => {
  const title = product.title || product.name || "Super deal";
  const previousPrice = derivePreviousPrice(product);
  const discount = getDiscountPercentage(product.price, previousPrice);
  const link =
    product.link ||
    (product.slug ? `/product/${product.slug}` : product.id ? `/product/${product.id}` : "#");

  return (
    <article className="group relative flex w-full max-w-xs flex-col rounded-2xl border border-orange-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-orange-200">
      <div className="relative mb-4 flex items-center justify-center rounded-xl bg-orange-50 p-4">
        <img
          src={product.image || product.image_url || "/images/logo.png"}
          alt={title}
          className="h-32 w-full object-contain"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
          Super deal
        </span>
        {discount !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow">
            -{discount}%
          </span>
        )}
      </div>
      <h3 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-orange-600">
        {title}
      </h3>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">
        {product.category?.name || "Oferta exclusiva"}
      </p>
      <div className="mb-4 flex items-end gap-2">
        <span className="text-xl font-bold text-orange-600">{formatCurrency(product.price)}</span>
        {previousPrice && (
          <span className="text-xs text-slate-400 line-through">{formatCurrency(previousPrice)}</span>
        )}
      </div>
      <p className="mb-6 line-clamp-3 text-sm text-slate-600">
        {product.short_description || "Descuento exclusivo solo por tiempo limitado."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : "_self"}
          rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex-1 rounded-full bg-orange-500 px-4 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-orange-600"
        >
          Ver oferta
        </a>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
          Tiempo limitado
        </span>
      </div>
    </article>
  );
};

const SuperDeal = () => {
  const { banners } = usePage().props;
  const [products, setProducts] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const controllerRef = useRef(null);

  const loadProducts = async () => {
    try {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("loading");
      setError("");

      const response = await fetch("/api/superdeals", { signal: controller.signal });
      if (!response.ok) {
        throw new Error("No pudimos recuperar los super deals.");
      }

      const data = await response.json();
      setProducts(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("error");
      setError("No pudimos cargar los super deals. Intenta nuevamente en unos segundos.");
    }
  };

  useEffect(() => {
    loadProducts();
    return () => controllerRef.current?.abort();
  }, []);

  const { featured, regular } = useMemo(() => {
    if (!products.length) {
      return { featured: null, regular: [] };
    }

    const sorted = [...products].sort(
      (a, b) =>
        (getDiscountPercentage(b.price, derivePreviousPrice(b)) || 0) -
        (getDiscountPercentage(a.price, derivePreviousPrice(a)) || 0)
    );

    return {
      featured: sorted[0],
      regular: sorted.slice(1),
    };
  }, [products]);

  const insights = useMemo(() => {
    const total = products.length;
    const discounted = products.filter(
      (product) => getDiscountPercentage(product.price, derivePreviousPrice(product)) !== null
    ).length;
    const averageDiscount = products.length
      ? Math.round(
          products.reduce((sum, product) => {
            const discount = getDiscountPercentage(product.price, derivePreviousPrice(product));
            return sum + (discount || 0);
          }, 0) / products.length
        )
      : 0;

    return {
      total,
      discounted,
      averageDiscount,
    };
  }, [products]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 via-white to-yellow-100 text-slate-800">
      <Head title="Super deals" />
      <Header />
      <TopNavMenu />

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[5fr_2fr]">
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-3xl border border-orange-200 bg-white/70 shadow-lg">
              <div className="bg-gradient-to-r from-orange-600 via-orange-500 to-amber-500 px-6 py-8 text-white sm:px-10">
                <p className="text-sm font-semibold uppercase tracking-[0.3em]">Super deals</p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">
                  Descuentos irrepetibles en productos premium
                </h1>
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85">
                  Cada super deal esta seleccionado por nuestro equipo para ofrecerte el mejor precio del mercado con garantia total.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={loadProducts}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow transition hover:bg-orange-50"
                  >
                    Recargar super deals
                  </button>
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                    Nuevas ofertas cada dia
                  </span>
                </div>
              </div>

              <dl className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-orange-500">Deals activos</dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">{insights.total}</dd>
                  <p className="mt-1 text-xs text-slate-500">Actualizados a diario</p>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-orange-500">Con descuento</dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">{insights.discounted}</dd>
                  <p className="mt-1 text-xs text-slate-500">Incluye envio prioritario</p>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-orange-500">Ahorro medio</dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">
                    {insights.averageDiscount ? `-${insights.averageDiscount}%` : "Sin datos"}
                  </dd>
                  <p className="mt-1 text-xs text-slate-500">Sobre el precio original</p>
                </div>
              </dl>
            </div>

            {status === "loading" && (
              <div className="flex flex-wrap justify-center gap-6">
                {Array.from({ length: 4 }).map((_, index) => (
                  <div
                    key={index}
                    className="w-full max-w-xl rounded-3xl border border-orange-200 bg-white/70 p-6 shadow-lg animate-pulse"
                  >
                    <div className="h-40 w-full rounded-2xl bg-orange-100" />
                    <div className="mt-6 h-5 w-3/4 bg-orange-100 rounded" />
                    <div className="mt-3 h-4 w-1/2 bg-orange-100 rounded" />
                    <div className="mt-8 h-10 w-full bg-orange-100 rounded-lg" />
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

            {status === "ready" && !featured && (
              <div className="rounded-2xl border border-orange-200 bg-white p-10 text-center shadow-sm">
                <p className="text-lg font-semibold text-slate-900">Super deals no disponibles</p>
                <p className="mt-2 text-sm text-slate-500">
                  Estamos preparando nuevas ofertas. Vuelve pronto para descubrir precios irrepetibles.
                </p>
              </div>
            )}

            {status === "ready" && featured && (
              <>
                <FeaturedDealCard product={featured} />
                {regular.length > 0 && (
                  <div className="grid justify-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
                    {regular.map((product) => (
                      <DealCard key={product.id || product.title} product={product} />
                    ))}
                  </div>
                )}
              </>
            )}
          </section>

          <aside className="space-y-6">
            <div className="hidden h-full rounded-3xl border border-orange-200 bg-white/70 p-6 shadow-lg lg:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Patrocinado</h2>
              <SidebarBanners banners={banners?.superDeal || banners?.default || []} />
            </div>

            <div className="block overflow-hidden rounded-3xl border border-orange-200 bg-white/70 shadow-lg lg:hidden">
              {banners?.superDeal?.[0] && (
                <img
                  src={banners.superDeal[0].src}
                  alt={banners.superDeal[0].alt || "Promocion super deal"}
                  className="h-40 w-full object-cover"
                  loading="lazy"
                />
              )}
            </div>
          </aside>
        </div>
      </main>
    </div>
  );
};

export default SuperDeal;
