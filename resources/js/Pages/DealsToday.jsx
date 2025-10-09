// resources/js/Pages/DealsToday.jsx
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

const SkeletonCard = () => (
  <div className="w-full max-w-xs rounded-2xl bg-white/80 p-4 border border-orange-100 shadow-sm animate-pulse">
    <div className="h-32 w-full rounded-xl bg-orange-100" />
    <div className="mt-5 h-4 w-3/4 bg-orange-100 rounded" />
    <div className="mt-3 h-3 w-1/2 bg-orange-100 rounded" />
    <div className="mt-6 h-10 w-full bg-orange-100 rounded-lg" />
  </div>
);

const DealCard = ({ offer }) => {
  const title = offer.title || offer.name || "Oferta destacada";
  const categoryName = offer.category?.name || "Oferta especial";
  const discount = getDiscountPercentage(offer.price, offer.old_price);
  const link =
    offer.link ||
    (offer.slug ? `/product/${offer.slug}` : offer.id ? `/product/${offer.id}` : "#");

  return (
    <article className="group relative flex w-full max-w-xs flex-col rounded-2xl border border-orange-100 bg-white p-5 text-left shadow-sm transition duration-200 hover:-translate-y-1 hover:shadow-lg focus-within:ring-2 focus-within:ring-orange-200">
      <div className="relative mb-4 flex items-center justify-center rounded-xl bg-orange-50 p-4">
        <img
          src={offer.image || "/images/logo.png"}
          alt={title}
          className="h-32 w-full object-contain"
          loading="lazy"
        />
        <span className="absolute left-3 top-3 rounded-full bg-orange-500 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
          Oferta hoy
        </span>
        {discount !== null && (
          <span className="absolute right-3 top-3 rounded-full bg-rose-500 px-3 py-1 text-xs font-semibold text-white shadow">
            -{discount}%
          </span>
        )}
      </div>
      <h2 className="mb-2 line-clamp-2 text-base font-semibold text-slate-900 group-hover:text-orange-600">
        {title}
      </h2>
      <p className="mb-3 text-xs uppercase tracking-wide text-slate-400">{categoryName}</p>
      <div className="mb-4 flex items-end gap-2">
        <span className="text-xl font-bold text-orange-600">{formatCurrency(offer.price)}</span>
        {offer.old_price && (
          <span className="text-xs text-slate-400 line-through">{formatCurrency(offer.old_price)}</span>
        )}
      </div>
      <p className="mb-6 line-clamp-3 text-sm text-slate-600">
        {offer.short_description || "Descuento exclusivo por tiempo limitado."}
      </p>
      <div className="mt-auto flex items-center justify-between gap-3">
        <a
          href={link}
          target={link.startsWith("http") ? "_blank" : "_self"}
          rel={link.startsWith("http") ? "noopener noreferrer" : undefined}
          className="flex-1 rounded-full bg-orange-500 px-4 py-2 text-center text-sm font-semibold text-white transition-colors duration-200 hover:bg-orange-600"
        >
          Comprar ahora
        </a>
        <span className="rounded-full bg-orange-100 px-3 py-1 text-xs font-medium text-orange-700">
          Stock limitado
        </span>
      </div>
    </article>
  );
};

export default function DealsToday() {
  const { banners } = usePage().props;
  const [offers, setOffers] = useState([]);
  const [status, setStatus] = useState("loading");
  const [error, setError] = useState("");
  const controllerRef = useRef(null);

  const loadOffers = async () => {
    try {
      controllerRef.current?.abort();
      const controller = new AbortController();
      controllerRef.current = controller;

      setStatus("loading");
      setError("");

      const response = await fetch("/api/deals-today", { signal: controller.signal });
      if (!response.ok) {
        throw new Error("No pudimos recuperar las ofertas.");
      }

      const data = await response.json();
      setOffers(Array.isArray(data) ? data : []);
      setStatus("ready");
    } catch (err) {
      if (err.name === "AbortError") return;
      console.error(err);
      setStatus("error");
      setError("No pudimos cargar las ofertas hoy. Intenta de nuevo en unos segundos.");
    }
  };

  useEffect(() => {
    loadOffers();
    return () => controllerRef.current?.abort();
  }, []);

  const insights = useMemo(() => {
    if (!offers.length) {
      return { topDiscount: 0, topTitle: "", averageDiscount: 0, total: 0 };
    }

    const discountable = offers
      .map((offer) => {
        const discount = getDiscountPercentage(offer.price, offer.old_price);
        if (discount === null) return null;
        return {
          discount,
          title: offer.title || offer.name || "Oferta destacada",
        };
      })
      .filter(Boolean);

    let topDiscount = 0;
    let topTitle = "";
    let sumDiscount = 0;

    discountable.forEach((item) => {
      sumDiscount += item.discount;
      if (item.discount > topDiscount) {
        topDiscount = item.discount;
        topTitle = item.title;
      }
    });

    const averageDiscount = discountable.length ? Math.round(sumDiscount / discountable.length) : 0;

    return {
      topDiscount,
      topTitle,
      averageDiscount,
      total: offers.length,
    };
  }, [offers]);

  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-b from-orange-50 via-white to-amber-100 text-slate-800">
      <Head title="Ofertas destacadas de hoy" />
      <Header />
      <TopNavMenu />

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-7xl grid-cols-1 gap-10 lg:grid-cols-[5fr_2fr]">
          <section className="flex flex-col gap-6">
            <div className="overflow-hidden rounded-3xl border border-orange-100 bg-white/70 shadow-lg">
              <div className="bg-gradient-to-r from-orange-500 via-orange-400 to-amber-400 px-6 py-8 text-white sm:px-10">
                <p className="text-sm font-semibold uppercase tracking-[0.3em]">Solo por hoy</p>
                <h1 className="mt-2 text-3xl font-black sm:text-4xl">Las ofertas que no te puedes perder</h1>
                <p className="mt-4 max-w-2xl text-base sm:text-lg text-white/85">
                  Seleccionamos los mejores precios del dia para que ahorres sin renunciar a tus imprescindibles.
                </p>
                <div className="mt-6 flex flex-wrap items-center gap-4">
                  <button
                    type="button"
                    onClick={loadOffers}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-sm font-semibold text-orange-600 shadow transition hover:bg-orange-50"
                  >
                    Recargar ofertas
                  </button>
                  <span className="rounded-full bg-white/20 px-4 py-2 text-sm font-medium">
                    Actualizado cada hora
                  </span>
                </div>
              </div>

              <dl className="grid gap-4 px-6 py-6 sm:grid-cols-3 sm:px-10">
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-orange-500">Mejor descuento</dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">
                    {insights.topDiscount ? `-${insights.topDiscount}%` : "Sin datos"}
                  </dd>
                  <p className="mt-1 text-xs text-slate-500">
                    {insights.topTitle || "A la espera de nuevas ofertas"}
                  </p>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-orange-500">Ahorro medio</dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">
                    {insights.averageDiscount ? `-${insights.averageDiscount}%` : "Sin datos"}
                  </dd>
                  <p className="mt-1 text-xs text-slate-500">Calculado sobre ofertas activas</p>
                </div>
                <div>
                  <dt className="text-xs font-semibold uppercase tracking-wide text-orange-500">Ofertas activas</dt>
                  <dd className="mt-2 text-2xl font-bold text-slate-900">{insights.total}</dd>
                  <p className="mt-1 text-xs text-slate-500">Seleccionadas por el equipo</p>
                </div>
              </dl>
            </div>

            <div aria-live="polite">
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
                    onClick={loadOffers}
                    className="rounded-full bg-rose-500 px-4 py-2 text-sm font-semibold text-white shadow hover:bg-rose-600"
                  >
                    Intentar de nuevo
                  </button>
                </div>
              )}

              {status === "ready" && offers.length === 0 && (
                <div className="rounded-2xl border border-orange-100 bg-white p-10 text-center shadow-sm">
                  <p className="text-lg font-semibold text-slate-900">Vuelve mas tarde</p>
                  <p className="mt-2 text-sm text-slate-500">
                    No hay ofertas activas en este momento, pero publicamos novedades a diario.
                  </p>
                </div>
              )}

              {status === "ready" && offers.length > 0 && (
                <div className="grid justify-center gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {offers.map((offer) => (
                    <DealCard key={offer.id || offer.title} offer={offer} />
                  ))}
                </div>
              )}
            </div>

            <p className="text-center text-sm text-slate-500">
              Los precios cambian constantemente. Guarda tus favoritos y vuelve pronto para seguir ahorrando.
            </p>
          </section>

          <aside className="space-y-6">
            <div className="hidden h-full rounded-3xl border border-orange-100 bg-white/70 p-6 shadow-lg lg:block">
              <h2 className="text-sm font-semibold uppercase tracking-wide text-orange-500">Patrocinado</h2>
              <SidebarBanners banners={banners?.dealsToday || banners?.default || []} />
            </div>

            <div className="block overflow-hidden rounded-3xl border border-orange-100 bg-white/70 shadow-lg lg:hidden">
              {banners?.dealsToday?.[0] && (
                <img
                  src={banners.dealsToday[0].src}
                  alt={banners.dealsToday[0].alt || "Promocion destacada"}
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
}
