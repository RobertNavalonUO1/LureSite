import React, { useState } from 'react';

const StarRating = ({ rating, setRating, editable = false }) => (
  <div className="flex items-center gap-1">
    {[1, 2, 3, 4, 5].map((star) => (
      <button
        key={star}
        type="button"
        disabled={!editable}
        onClick={() => editable && setRating(star)}
        className={`text-2xl transition-colors ${
          star <= rating ? 'text-yellow-400' : 'text-gray-300'
        } ${editable ? 'hover:text-yellow-500 focus:outline-none' : ''}`}
        aria-label={`Puntuación ${star} estrella${star > 1 ? 's' : ''}`}
        tabIndex={editable ? 0 : -1}
      >
        ★
      </button>
    ))}
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
  const [comment, setComment] = useState(userReview?.comment || '');

  const handleSubmit = (e) => {
    e.preventDefault();
    if (onSubmit) onSubmit({ rating, comment });
  };

  return (
    <section className="mt-10 border-t pt-8">
      <h2 className="text-2xl font-bold mb-4 text-slate-800 flex items-center gap-2">
        Opiniones de clientes
        <span className="text-base font-normal text-gray-500">
          ({reviews.length} reseña{reviews.length !== 1 ? 's' : ''})
        </span>
      </h2>

      {/* Formulario para dejar reseña */}
      {user ? (
        <form
          onSubmit={handleSubmit}
          className="mb-8 bg-indigo-50 rounded-lg p-6 shadow flex flex-col gap-4 max-w-xl"
        >
          <div>
            <label className="block text-sm font-semibold mb-1 text-indigo-700">
              Tu puntuación
            </label>
            <StarRating rating={rating} setRating={setRating} editable />
          </div>
          <div>
            <label className="block text-sm font-semibold mb-1 text-indigo-700">
              Comentario (opcional)
            </label>
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="¿Qué te ha parecido este producto?"
              className="w-full p-3 border border-indigo-200 rounded-lg focus:ring-2 focus:ring-indigo-400 transition"
              rows={3}
              maxLength={1000}
            />
          </div>
          <button
            type="submit"
            disabled={submitting}
            className={`self-start px-6 py-2 rounded-lg font-semibold text-white transition ${
              submitting
                ? 'bg-gray-400 cursor-not-allowed'
                : 'bg-indigo-600 hover:bg-indigo-700'
            }`}
          >
            {submitting ? 'Enviando...' : userReview ? 'Actualizar reseña' : 'Enviar reseña'}
          </button>
        </form>
      ) : (
        <div className="mb-8 text-indigo-700 bg-indigo-50 rounded-lg p-4 shadow text-center">
          <span>Inicia sesión para dejar tu reseña.</span>
        </div>
      )}

      {/* Lista de reseñas */}
      <ul className="space-y-6">
        {reviews.length === 0 && (
          <li className="text-gray-500 italic">Sé el primero en opinar sobre este producto.</li>
        )}
        {reviews.map((review) => (
          <li
            key={review.id}
            className="bg-white rounded-lg shadow p-5 border border-indigo-100"
          >
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <StarRating rating={review.rating} setRating={() => {}} />
                <span className="font-semibold text-slate-800">{review.author}</span>
              </div>
              <span className="text-xs text-gray-400">
                {new Date(review.created_at).toLocaleDateString()}
              </span>
            </div>
            {review.comment && (
              <p className="text-gray-700 text-sm mt-1">{review.comment}</p>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
};

export default ProductReviews;