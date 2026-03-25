import React, { useMemo } from "react";
import { Inertia } from "@inertiajs/inertia";
import { ArrowRight, Heart, ShoppingCart } from "lucide-react";
import { useI18n } from "@/i18n";
import { formatCurrency, normalizePrice } from "@/utils/pricing";

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

const calculateDiscount = (currentPrice, previousPrice) => {
  const current = normalizePrice(currentPrice);
  const previous = normalizePrice(previousPrice);
  if (!previous || previous <= current) return null;
  return Math.round(((previous - current) / previous) * 100);
};

const ProductCard = ({ product, onAddToCart, isFavorite, onToggleFavorite }) => {
  const { t } = useI18n();

  const title = product.name || product.title || t("catalog.product_card.fallback_title");
  const thumbnail = product.image_url || product.image || "/images/logo.png";
  const categoryName = product.category?.name || product.category || t("catalog.product_card.fallback_category");

  const previousPrice = derivePreviousPrice(product);
  const discount = calculateDiscount(product.price, previousPrice);

  const ratingValue = Number(product.rating) || 4;
  const ratingCount = product.reviews_count || product.reviews || 0;

  const shippingLabel =
    product.shipping_label ||
    product.delivery_estimate ||
    (product.fast_shipping
      ? t("catalog.product_card.shipping_fast")
      : t("catalog.product_card.shipping_standard"));

  const stockStatus =
    product.stock > 10
      ? t("catalog.product_card.stock_available")
      : product.stock > 0
        ? t("catalog.product_card.last_units")
        : t("catalog.product_card.out_of_stock");

  const badgeLabel = product.badge || (product.is_new ? t("catalog.product_card.badge_new") : t("catalog.product_card.badge_fast_shipping"));

  const goToProduct = () => {
    if (product.slug) {
      Inertia.visit(`/product/${product.slug}`);
      return;
    }

    Inertia.visit(`/product/${product.id}`);
  };

  const starIcons = useMemo(() => {
    return Array.from({ length: 5 }).map((_, index) => {
      const filled = index < Math.round(ratingValue);
      return (
        <svg
          key={index}
          className={`h-4 w-4 ${filled ? "text-amber-500" : "text-slate-300"}`}
          viewBox="0 0 20 20"
          fill="currentColor"
          aria-hidden="true"
        >
          <path d="M10 15.27l5.18 3.05-1.64-5.81 4.46-3.85-5.9-.5L10 2.5l-2.1 5.66-5.9.5 4.46 3.85L4.82 18.3z" />
        </svg>
      );
    });
  }, [ratingValue]);

  return (
    <article className="group mx-auto flex h-full w-full max-w-sm flex-col overflow-hidden rounded-3xl border border-amber-100 bg-white/95 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-2xl focus-within:ring-2 focus-within:ring-amber-200">
      <div className="relative">
        <button
          type="button"
          onClick={() => onToggleFavorite(product.id)}
          className="absolute right-4 top-4 z-20 flex h-10 w-10 items-center justify-center rounded-full bg-white/95 text-slate-600 shadow-lg transition hover:scale-110 hover:text-rose-500"
          aria-label={isFavorite ? t("catalog.product_card.remove_favorite") : t("catalog.product_card.add_favorite")}
        >
          <Heart
            className={`h-5 w-5 ${isFavorite ? "fill-rose-500 text-rose-500" : ""}`}
            strokeWidth={1.6}
            fill={isFavorite ? "currentColor" : "none"}
          />
        </button>

        {(product.badge || product.is_new || product.fast_shipping) && (
          <span className="absolute left-4 top-4 z-20 rounded-full bg-amber-600 px-3 py-1 text-xs font-semibold uppercase tracking-wide text-white shadow">
            {badgeLabel}
          </span>
        )}

        <button
          type="button"
          onClick={goToProduct}
          className="block w-full"
          aria-label={t("catalog.product_card.view_details_aria", { title })}
        >
          <div className="relative aspect-[5/4] w-full overflow-hidden bg-gradient-to-br from-slate-100 via-white to-slate-100">
            <img
              src={thumbnail}
              alt={title}
              className="h-full w-full object-contain transition-transform duration-300 group-hover:scale-105"
              loading="lazy"
            />
          </div>
        </button>
      </div>

      <div className="flex flex-grow flex-col gap-3 p-5">
        <div className="space-y-1">
          <p className="text-[10px] uppercase tracking-[0.28em] text-amber-600">{categoryName}</p>
          <h3 className="min-h-[3.25rem] line-clamp-2 text-base font-semibold leading-6 text-slate-900">{title}</h3>
        </div>

        <div className="flex items-center gap-2 text-xs text-slate-500" aria-label={t("catalog.product_card.rating_aria", { rating: ratingValue.toFixed(1) })}>
          <div className="flex items-center gap-0.5 text-amber-500">{starIcons}</div>
          <span className="font-semibold text-slate-700">{ratingValue.toFixed(1)}</span>
          <span>({ratingCount})</span>
        </div>

        <div className="space-y-1">
          <div className="flex items-baseline gap-2">
            <span className="text-lg font-bold text-slate-900">{formatCurrency(product.price)}</span>
            {previousPrice ? (
              <span className="text-xs text-slate-400 line-through">{formatCurrency(previousPrice)}</span>
            ) : null}
            {discount !== null ? (
              <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-semibold text-emerald-600">
                -{discount}%
              </span>
            ) : null}
          </div>
          <p className="text-xs font-medium text-lime-700">{shippingLabel}</p>
        </div>

        <p className="min-h-[2.5rem] line-clamp-2 text-xs leading-5 text-slate-500">
          {product.short_description || product.description || t("catalog.product_card.description_fallback")}
        </p>

        <div className="mt-auto flex flex-col gap-2 sm:flex-row sm:items-center sm:gap-3">
          <button
            type="button"
            onClick={() => onAddToCart(product.id)}
            disabled={product.stock === 0}
            className={`flex w-full items-center justify-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition sm:w-auto ${
              product.stock === 0
                ? "cursor-not-allowed bg-slate-200 text-slate-500"
                : "bg-amber-600 text-white hover:bg-amber-700"
            }`}
          >
            <ShoppingCart className="h-4 w-4" />
            {product.stock === 0 ? t("catalog.product_card.sold_out") : t("catalog.product_card.add_to_cart")}
          </button>
          <button
            type="button"
            onClick={goToProduct}
            className="flex w-full items-center justify-center gap-2 rounded-full border border-amber-100 px-5 py-2.5 text-xs font-semibold text-amber-700 transition hover:border-amber-200 hover:bg-amber-50 sm:w-auto"
          >
            <ArrowRight className="h-4 w-4" />
            {t("catalog.product_card.view_details")}
          </button>
        </div>

        <span className="text-xs font-medium text-slate-500">{stockStatus}</span>
      </div>
    </article>
  );
};

export default ProductCard;
