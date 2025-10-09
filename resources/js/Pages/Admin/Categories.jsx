// resources/js/Pages/Admin/Categories.jsx
import React from 'react';

export default function Categories({ categories }) {
  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <h1 className="text-2xl font-bold mb-6">Gestión de Categorías</h1>
      <form method="POST" action="/admin/categories/store" className="mb-8 flex gap-4">
        <input name="name" placeholder="Nombre" required className="border px-2 py-1" />
        <input name="slug" placeholder="Slug" required className="border px-2 py-1" />
        <input name="description" placeholder="Descripción" className="border px-2 py-1" />
        <button type="submit" className="bg-green-600 text-white px-3 py-1 rounded">Crear</button>
      </form>
      <table className="w-full bg-white rounded shadow">
        <thead>
          <tr>
            <th>ID</th>
            <th>Nombre</th>
            <th>Slug</th>
            <th>Descripción</th>
            <th>Acciones</th>
          </tr>
        </thead>
        <tbody>
          {categories.map(cat => (
            <tr key={cat.id} className="border-b">
              <td>{cat.id}</td>
              <td>{cat.name}</td>
              <td>{cat.slug}</td>
              <td>{cat.description}</td>
              <td>
                <form method="POST" action={`/admin/categories/${cat.id}/delete`}>
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