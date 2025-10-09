// resources/js/Pages/Admin/Banners.jsx
import React from 'react';

export default function Banners({ banners }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Banners</h1>
      <form method="POST" action="/admin/banners/store" className="mb-8 flex gap-4">
        <input name="title" placeholder="Título" required className="border px-2 py-1" />
        <input name="image_url" placeholder="URL Imagen" required className="border px-2 py-1" />
        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">Crear</button>
      </form>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Título</th>
            <th>Imagen</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {banners.map(banner => (
            <tr key={banner.id} className="border-b">
              <td>{banner.id}</td>
              <td>{banner.title}</td>
              <td>
                <img src={banner.image_url} alt={banner.title} className="w-32 h-16 object-cover" />
              </td>
              <td>
                <form method="POST" action={`/admin/banners/${banner.id}/delete`}>
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