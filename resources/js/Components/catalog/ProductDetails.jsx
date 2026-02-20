// ===============================
// Product Details Page Component
// Renovated marketplace layout (tipografía + imágenes afinadas)
// ===============================

import React, { useEffect, useMemo, useState } from "react";
import { router, usePage } from "@inertiajs/react";
import SidebarBanners from "@/Components/marketing/SidebarBanners.jsx";
import ProductReviews from "@/Components/catalog/ProductReviews.jsx";

const FALLBACK_IMAGE = "/images/placeholder-product.png";

const ProductDetails = ({
  product,
  onCartOpen,
  reviews = [],
  user,
  onReviewSubmit,
  submittingReview,
  userReview,
}) => {
  const { banners } = usePage().props;

  const colorOptions = Array.isArray(product.colors)
    ? product.colors.filter(Boolean)
    : [];
  const sizeOptions = Array.isArray(product.sizes)
    ? product.sizes.filter(Boolean)
    : [];

  const galleryImages = useMemo(() => {
    const merged = [];
    if (product.image_url) merged.push(product.image_url);
    if (Array.isArray(product.gallery)) {
      for (const image of product.gallery) {
        if (image) merged.push(image);
      }
    }
    const unique = Array.from(new Set(merged));
    return unique.length ? unique : [FALLBACK_IMAGE];
  }, [product.gallery, product.image_url]);

  const [selectedColor, setSelectedColor] = useState(colorOptions[0] || "");
  const [selectedSize, setSelectedSize] = useState(sizeOptions[0] || "");
  const [selectedImage, setSelectedImage] = useState(galleryImages[0]);
  const [quantity, setQuantity] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    setSelectedColor(colorOptions[0] || "");
    setSelectedSize(sizeOptions[0] || "");
    setQuantity(1);
  }, [product.id, colorOptions, sizeOptions]);

  useEffect(() => {
    setSelectedImage(galleryImages[0]);
  }, [galleryImages]);

  const requiresColor = colorOptions.length > 0;
  const requiresSize = sizeOptions.length > 0;

  const currencyFormatter = useMemo(
    () =>
      new Intl.NumberFormat("es-MX", {
        style: "currency",
        currency: "MXN",
        maximumFractionDigits: 2,
      }),
    []
  );

  const priceLabel = useMemo(() => {
    const price = Number(product.price) || 0;
    return currencyFormatter.format(price);
  }, [currencyFormatter, product.price]);

  const ratingValue =
    typeof product.rating === "number"
      ? product.rating.toFixed(1)
      : product.rating || "4.5";

  const addToCart = () => {
    setErrors({});

    if (product.stock === 0) return;
    if (requiresColor && !selectedColor) {
      setErrors((prev) => ({ ...prev, color: "Selecciona un color." }));
      return;
    }
    if (requiresSize && !selectedSize) {
      setErrors((prev) => ({ ...prev, size: "Selecciona un tamaño." }));
      return;
    }

    setIsLoading(true);

    router.post(
      `/cart/${product.id}/add`,
      {
        quantity: Math.max(1, Number(quantity) || 1),
        color: requiresColor ? selectedColor : null,
        size: requiresSize ? selectedSize : null,
      },
      {
        preserveScroll: true,
        onSuccess: () => {
          onCartOpen?.();
          setIsLoading(false);
        },
        onError: (serverErrors) => {
          setErrors(serverErrors || {});
          alert("Error al agregar al carrito");
          setIsLoading(false);
        },
      }
    );
  };

  const banner4 = banners?.[3]
    ? [banners[3]]
    : [
        {
          src: "/images/banner4.webp",
          alt: "Promoción destacada",
          href: "/promocion/3",
          button: "Descubrir",
        },
      ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-100 via-white to-slate-100 py-6 sm:py-10">
      <div className="mx-auto flex w-full max-w-7xl flex-col gap-8 px-4 sm:px-6 lg:flex-row lg:items-start lg:gap-12 lg:px-10">
        <main className="flex-1 space-y-8 sm:space-y-10">
          <section className="rounded-[28px] border border-slate-100 bg-white/95 p-5 shadow-2xl backdrop-blur sm:p-7">
            {/* distribución 55/45 para que la imagen respire y el texto no se desborde */}
            <div className="grid gap-8 lg:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] xl:gap-10">
              {/* Galería + principal */}
              <div className="grid gap-5 md:grid-cols-[112px_minmax(0,1fr)] lg:gap-6 lg:items-start">
                {/* Miniaturas: consistentes y clicables */}
                <div className="order-2 flex gap-3 overflow-x-auto snap-x snap-mandatory rounded-3xl border border-slate-100 bg-slate-50 p-3 md:order-1 md:h-[500px] md:flex-col md:overflow-y-auto md:px-3 md:py-4">
                  {galleryImages.map((image, index) => {
                    const isActive = selectedImage === image;
                    return (
                      <button
                        type="button"
                        key={`${image}-${index}`}
                        onClick={() => setSelectedImage(image)}
                        className={`relative flex h-[78px] w-[78px] min-h-[78px] min-w-[78px] shrink-0 snap-start items-center justify-center overflow-hidden rounded-xl border text-xs transition sm:h-[88px] sm:w-[88px] sm:min-h-[88px] sm:min-w-[88px] ${
                          isActive
                            ? "border-amber-500 shadow-lg shadow-amber-100 ring-2 ring-amber-200"
                            : "border-transparent shadow-sm hover:border-slate-300 hover:shadow"
                        }`}
                        aria-label={`Ver imagen ${index + 1}`}
                      >
                        <img
                          src={image}
                          alt={`${product.name} vista ${index + 1}`}
                          className="h-full w-full object-contain"
                        />
                      </button>
                    );
                  })}
                </div>

                {/* Imagen principal: tamaño mínimo y máximo por viewport */}
                <div className="relative order-1 overflow-hidden rounded-[24px] border border-slate-100 bg-gradient-to-br from-slate-50 to-white shadow-inner transition md:order-2">
                  <div
                    className="
                      relative mx-auto w-full
                      aspect-[4/3] sm:aspect-square
                      min-w-[300px] min-h-[300px]
                      md:min-w-[380px] md:min-h-[380px]
                      lg:min-w-[420px] lg:min-h-[420px]
                      max-h-[64vh]
                    "
                  >
                    <img
                      src={selectedImage}
                      alt={product.name}
                      className="absolute inset-0 h-full w-full object-contain p-5 sm:p-8"
                    />
                  </div>
                </div>
              </div>

              {/* Detalles */}
              <div className="flex flex-col gap-6">
                {/* Cabecera: tipografía con clamp para evitar bloques gigantes */}
                <div className="space-y-1.5">
                  <p className="text-[10px] sm:text-[11px] uppercase tracking-[0.32em] text-slate-400">
                    Marketplace oficial
                  </p>
                  <h1
                    className="
                      font-bold text-slate-900 leading-tight text-balance
                      text-[clamp(1.4rem,3vw,2.2rem)]
                    "
                  >
                    {product.name}
                  </h1>
                  <p className="text-[13px] sm:text-sm text-slate-500">
                    {product.category?.name || "Sin categoría"}
                  </p>
                </div>

                {/* Precio / stock */}
                <div className="rounded-[22px] border border-amber-200 bg-amber-50/90 p-5 shadow-inner">
                  <div className="flex flex-wrap items-end justify-between gap-4">
                    <div>
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-amber-700">
                        Precio
                      </span>
                      <p className="font-semibold text-amber-900 leading-none text-[clamp(1.8rem,3.5vw,2.6rem)]">
                        {priceLabel}
                      </p>
                    </div>
                    <span
                      className={`rounded-full px-4 py-2 text-sm font-semibold ${
                        product.stock > 0
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-rose-100 text-rose-600"
                      }`}
                    >
                      {product.stock > 0
                        ? `Disponible (${product.stock} en stock)`
                        : "Agotado temporalmente"}
                    </span>
                  </div>
                </div>

                {/* Descripción con ancho de texto confortable */}
                <div className="prose max-w-prose prose-slate text-slate-600 prose-p:my-0 prose-p:text-[15px] sm:prose-p:text-[16px]">
                  <p>
                    {product.description ||
                      "Descripción no disponible para este producto."}
                  </p>
                </div>

                {/* Variantes */}
                {requiresColor && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700">Color</h3>
                    <div className="flex flex-wrap gap-2">
                      {colorOptions.map((color) => {
                        const active = selectedColor === color;
                        return (
                          <button
                            type="button"
                            key={color}
                            onClick={() => setSelectedColor(color)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white shadow"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            }`}
                          >
                            {color}
                          </button>
                        );
                      })}
                    </div>
                    {errors.color && (
                      <p className="text-xs text-rose-600">{errors.color}</p>
                    )}
                  </div>
                )}

                {requiresSize && (
                  <div className="space-y-3">
                    <h3 className="text-sm font-semibold text-slate-700">Tamaño</h3>
                    <div className="flex flex-wrap gap-2">
                      {sizeOptions.map((size) => {
                        const active = selectedSize === size;
                        return (
                          <button
                            type="button"
                            key={size}
                            onClick={() => setSelectedSize(size)}
                            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
                              active
                                ? "border-slate-900 bg-slate-900 text-white shadow"
                                : "border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:text-slate-900"
                            }`}
                          >
                            {size}
                          </button>
                        );
                      })}
                    </div>
                    {errors.size && (
                      <p className="text-xs text-rose-600">{errors.size}</p>
                    )}
                  </div>
                )}

                {/* Info / acciones */}
                <div className="flex flex-col gap-6">
                  <div className="flex items-center gap-3">
                    <label className="text-sm font-semibold text-slate-700">Cantidad</label>
                    <input
                      type="number"
                      min="1"
                      max={product.stock || 99}
                      value={quantity}
                      onChange={(e) =>
                        setQuantity(Math.max(1, Number(e.target.value) || 1))
                      }
                      className="h-11 w-24 rounded-xl border border-slate-200 bg-white px-4 text-center text-sm font-medium text-slate-700 shadow-sm transition focus:border-amber-500 focus:outline-none focus:ring-2 focus:ring-amber-200"
                    />
                  </div>

                  <div className="flex flex-wrap gap-4 text-xs text-slate-500 sm:text-[13px]">
                    <span>SKU: {product.id}</span>
                    <span>Vendidos: {product.sold_count ?? 0}</span>
                    <span>Valoración: {ratingValue}</span>
                  </div>

                  <div className="flex flex-col gap-3 sm:flex-row sm:flex-wrap sm:items-center">
                    <button
                      type="button"
                      onClick={addToCart}
                      disabled={isLoading || product.stock === 0}
                      className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white shadow-lg transition sm:w-auto ${
                        product.stock > 0
                          ? "bg-slate-900 hover:bg-slate-800"
                          : "cursor-not-allowed bg-slate-400"
                      }`}
                    >
                      {isLoading ? "Agregando..." : "Agregar al carrito"}
                    </button>
                    <a
                      href="/"
                      className="inline-flex w-full items-center justify-center rounded-full border border-slate-200 px-6 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-100 sm:w-auto"
                    >
                      Seguir explorando
                    </a>
                  </div>

                  <div className="grid grid-cols-1 gap-3 text-sm sm:grid-cols-2">
                    <div className="rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-sm">
                      <p className="font-semibold text-slate-700">Envío flexible</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Entrega estimada entre 2 y 5 días hábiles en todo el país.
                      </p>
                    </div>
                    <div className="rounded-2xl border border-slate-100 bg-white/85 p-4 shadow-sm">
                      <p className="font-semibold text-slate-700">Garantía Marketplace</p>
                      <p className="mt-1 text-xs text-slate-500">
                        Devoluciones sin costo dentro de los primeros 30 días.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[28px] border border-slate-100 bg-white/95 p-7 shadow-xl backdrop-blur">
            <ProductReviews
              reviews={reviews}
              user={user}
              onSubmit={onReviewSubmit}
              submitting={submittingReview}
              userReview={userReview}
            />
          </section>
        </main>
      </div>
    </div>
  );
};

export default ProductDetails;