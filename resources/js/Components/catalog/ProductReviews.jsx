import React, { useMemo, useState } from "react";
import { Star } from "lucide-react";

const StarRating = ({ rating, setRating, editable = false, size = "md" }) => {
  const sizeClasses =
    size === "lg"
      ? "h-7 w-7"
      : size === "sm"
      ? "h-4 w-4"
      : "h-5 w-5";

  return (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((value) => {
        const active = value <= rating;
        const buttonProps = editable
          ? {
              role: "radio",
              "aria-checked": active,
              onClick: () => setRating(value),
            }
          : {};

        return (
          <button
            key={value}
            type="button"
            disabled={!editable}
            tabIndex={editable ? 0 : -1}
            className={`rounded-full transition ${
              editable
                ? "focus:outline-none focus:ring-2 focus:ring-amber-300"
                : ""
            } ${editable ? "hover:text-amber-500" : ""}`}
            aria-label={`Puntuacion ${value} estrella${value > 1 ? "s" : ""}`}
            {...buttonProps}
          >
            <Star
              className={`${sizeClasses} ${
                active ? "text-amber-500" : "text-slate-300"
              }`}
              strokeWidth={1.5}
              fill={active ? "currentColor" : "transparent"}
            />
          </button>
        );
      })}
    </div>
  );
};

const RatingRow = ({ label, value, percentage }) => (
  <div className="flex items-center gap-3 text-sm text-slate-500">
    <span className="w-10 text-right font-medium text-slate-600">{label}</span>
    <div className="relative h-2 flex-1 overflow-hidden rounded-full bg-slate-200">
      <span
        className="absolute inset-y-0 left-0 rounded-full bg-amber-400 transition-[width]"
        style={{ width: `${percentage}%` }}
      />
    </div>
    <span className="w-10 text-right text-xs font-semibold text-slate-500">
      {value}
    </span>
  </div>
);

const ProductReviews = ({
  reviews = [],
  user,
  onSubmit,
  submitting,
  userReview,
}) => {
  const [rating, setRating] = useState(userReview?.rating || 5);
  const [comment, setComment] = useState(userReview?.comment || "");

  const averageRating = useMemo(() => {
    if (!reviews.length) return 5;
    const total = reviews.reduce((sum, review) => sum + Number(review.rating), 0);
    return Math.round((total / reviews.length) * 10) / 10;
  }, [reviews]);

  const distribution = useMemo(() => {
    const total = reviews.length || 1;
    return [5, 4, 3, 2, 1].map((value) => {
      const count = reviews.filter((review) => Number(review.rating) === value).length;
      return {
        label: `${value} estrellas`,
        count,
        percentage: Math.round((count / total) * 100),
      };
    });
  }, [reviews]);

  const handleSubmit = (event) => {
    event.preventDefault();
    if (onSubmit) onSubmit({ rating, comment });
  };

  return (
    <section className="space-y-8 lg:space-y-10">
      <header className="flex flex-col gap-6 sm:flex-row sm:items-center sm:justify-between lg:gap-8">
        <div className="space-y-2">
          <p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">
            Opiniones verificadas
          </p>
          <h2 className="text-3xl font-semibold text-slate-900">
            Lo que dicen nuestros clientes
          </h2>
          <p className="text-sm text-slate-500">
            {reviews.length} resena{reviews.length === 1 ? "" : "s"} publicadas
          </p>
        </div>

        <div className="flex min-w-[240px] flex-col items-center gap-2 rounded-[24px] border border-slate-200 bg-white px-6 py-5 text-center shadow-lg shadow-slate-100/60 sm:px-7 sm:py-6 lg:min-w-[260px]">
          <span className="text-4xl font-bold text-slate-900">
            {averageRating.toFixed(1)}
          </span>
          <StarRating rating={Math.round(averageRating)} size="lg" />
          <span className="text-xs font-medium text-slate-500">
            Promedio general
          </span>
        </div>
      </header>

      <div className="grid gap-8 lg:grid-cols-[minmax(0,320px),1fr] xl:gap-12">
        <div className="space-y-6 rounded-[28px] border border-slate-100 bg-white/90 p-6 shadow-lg shadow-slate-100/60 sm:p-7">
          {user ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Tu puntuacion
                </label>
                <div className="mt-2">
                  <StarRating rating={rating} setRating={setRating} editable />
                </div>
              </div>

              <div>
                <label className="text-sm font-semibold text-slate-700">
                  Comentario (opcional)
                </label>
                <textarea
                  value={comment}
                  onChange={(event) => setComment(event.target.value)}
                  placeholder="Cuéntanos tu experiencia con este producto"
                  rows={4}
                  maxLength={1000}
                  className="mt-2 w-full rounded-2xl border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 shadow-sm transition focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
                />
              </div>

              <button
                type="submit"
                disabled={submitting}
                className={`inline-flex w-full items-center justify-center rounded-full px-6 py-3 text-sm font-semibold text-white transition ${
                  submitting
                    ? "cursor-not-allowed bg-slate-400"
                    : "bg-slate-900 hover:bg-slate-800"
                }`}
              >
                {submitting
                  ? "Enviando..."
                  : userReview
                  ? "Actualizar resena"
                  : "Publicar resena"}
              </button>
            </form>
          ) : (
            <div className="rounded-2xl border border-amber-200 bg-amber-50/90 p-5 text-center text-sm font-medium text-amber-700">
              Inicia sesion para compartir tu opinion.
            </div>
          )}

          <div className="space-y-3">
            {distribution.map(({ label, count, percentage }) => (
              <RatingRow
                key={label}
                label={label}
                value={count}
                percentage={percentage}
              />
            ))}
          </div>
        </div>

        <div className="space-y-4 lg:space-y-5">
          {reviews.length === 0 ? (
            <div className="rounded-[24px] border border-slate-100 bg-white px-6 py-8 text-center text-sm text-slate-500 shadow-sm lg:px-8">
              Se el primero en opinar sobre este producto.
            </div>
          ) : (
            reviews.map((review) => (
              <article
                key={review.id}
                className="rounded-[24px] border border-slate-100 bg-white px-6 py-5 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md lg:px-7 lg:py-6"
              >
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">
                      {review.author || "Usuario"}
                    </p>
                    <div className="mt-1">
                      <StarRating rating={Number(review.rating) || 0} size="sm" />
                    </div>
                  </div>
                  {review.created_at && (
                    <span className="text-xs font-medium text-slate-400">
                      {new Date(review.created_at).toLocaleDateString("es-MX", {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })}
                    </span>
                  )}
                </div>
                {review.comment && (
                  <p className="mt-3 text-sm leading-relaxed text-slate-600">
                    {review.comment}
                  </p>
                )}
              </article>
            ))
          )}
        </div>
      </div>
    </section>
  );
};

export default ProductReviews;
