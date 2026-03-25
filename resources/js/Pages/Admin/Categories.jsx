// resources/js/Pages/Admin/Categories.jsx
import React from 'react';
import { router, useForm } from '@inertiajs/react';
import Notification from './Notification';

export default function Categories({ categories }) {
  const { data, setData, post, processing, reset } = useForm({
    name: '',
    slug: '',
    description: '',
  });

  const handleDelete = (category) => {
    if (!window.confirm(`¿Eliminar la categoría "${category.name}"?`)) {
      return;
    }

    router.delete(`/admin/categories/${category.id}`, {
      preserveScroll: true,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    post('/admin/categories/store', {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Notification />
      <h1 className="text-2xl font-bold mb-6">Gestión de Categorías</h1>
      <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
        <input
          name="name"
          placeholder="Nombre"
          required
          className="border px-2 py-1"
          value={data.name}
          onChange={(event) => setData('name', event.target.value)}
        />
        <input
          name="slug"
          placeholder="Slug"
          required
          className="border px-2 py-1"
          value={data.slug}
          onChange={(event) => setData('slug', event.target.value)}
        />
        <input
          name="description"
          placeholder="Descripción"
          className="border px-2 py-1"
          value={data.description}
          onChange={(event) => setData('description', event.target.value)}
        />
        <button type="submit" disabled={processing} className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-60">
          Crear
        </button>
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
                <button type="button" onClick={() => handleDelete(cat)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
