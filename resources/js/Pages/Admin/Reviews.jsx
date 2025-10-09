import React from 'react';

export default function Reviews({ reviews }) {
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
                <form method="POST" action={`/admin/reviews/${review.id}/delete`}>
                  <button type="submit" className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
                </form>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}