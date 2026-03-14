import React from 'react';
import { router } from '@inertiajs/react';

export default function Reviews({ reviews }) {
  const handleDelete = (review) => {
    if (!window.confirm(`¿Eliminar la review #${review.id}?`)) {
      return;
    }

    router.delete(`/admin/reviews/${review.id}`, {
      preserveScroll: true,
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Reviews</h1>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Producto</th>
            <th>Usuario</th>
            <th>Rating</th>
            <th>Comentario</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {reviews.map(review => (
            <tr key={review.id} className="border-b">
              <td>{review.id}</td>
              <td>{review.product?.name}</td>
              <td>{review.user?.name}</td>
              <td>{review.rating}</td>
              <td>{review.comment}</td>
              <td>
                <button type="button" onClick={() => handleDelete(review)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
