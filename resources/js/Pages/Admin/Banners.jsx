// resources/js/Pages/Admin/Banners.jsx
import React from 'react';
import { router, useForm } from '@inertiajs/react';
import Notification from './Notification';

export default function Banners({ banners }) {
  const { data, setData, post, processing, reset } = useForm({
    title: '',
    image_url: '',
  });

  const handleDelete = (banner) => {
    if (!window.confirm(`¿Eliminar el banner "${banner.title}"?`)) {
      return;
    }

    router.delete(`/admin/banners/${banner.id}`, {
      preserveScroll: true,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();

    post('/admin/banners/store', {
      preserveScroll: true,
      onSuccess: () => reset(),
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-8">
      <Notification />
      <h1 className="text-2xl font-bold mb-6">Gestión de Banners</h1>
      <form onSubmit={handleSubmit} className="mb-8 flex gap-4">
        <input
          name="title"
          placeholder="Título"
          required
          className="border px-2 py-1"
          value={data.title}
          onChange={(event) => setData('title', event.target.value)}
        />
        <input
          name="image_url"
          placeholder="URL Imagen"
          required
          className="border px-2 py-1"
          value={data.image_url}
          onChange={(event) => setData('image_url', event.target.value)}
        />
        <button type="submit" disabled={processing} className="bg-green-600 text-white px-3 py-1 rounded disabled:opacity-60">
          Crear
        </button>
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
                <button type="button" onClick={() => handleDelete(banner)} className="bg-red-500 text-white px-3 py-1 rounded">Eliminar</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
