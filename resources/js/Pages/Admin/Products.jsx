﻿import React, { useState } from 'react';
import { Link, router, usePage } from '@inertiajs/react';
import AdminWorkspaceLayout from '@/Layouts/AdminWorkspaceLayout.jsx';
import Notification from './Notification';

export default function Products({ products, filters = {}, categories = [] }) {
  const { flash } = usePage().props;
  const [search, setSearch] = useState(filters.search || '');
  const [categoryId, setCategoryId] = useState(filters.category_id ? String(filters.category_id) : '');
  const [perPage, setPerPage] = useState(String(filters.per_page || 20));

  const items = Array.isArray(products?.data) ? products.data : [];
  const meta = products?.meta || {};

  const applyFilters = (page = 1, overrides = {}) => {
    router.get('/admin/products', {
      search,
      category_id: categoryId || undefined,
      per_page: Number(perPage || 20),
      page,
      ...overrides,
    }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    applyFilters(1);
  };

  const handleReset = () => {
    setSearch('');
    setCategoryId('');
    setPerPage('20');
    router.get('/admin/products', { per_page: 20 }, {
      preserveScroll: true,
      preserveState: true,
      replace: true,
    });
  };

  const handleDelete = (product) => {
    if (!window.confirm(`¿Eliminar el producto "${product.name}"?`)) {
      return;
    }

    router.delete(`/admin/products/${product.id}`, {
      preserveScroll: true,
    });
  };

  return (
    <AdminWorkspaceLayout
      title="Productos publicados"
      description="Esta ruta conserva un listado administrativo estable. Añade búsqueda, filtro y paginación, pero mantiene separado el editor completo de base de datos."
      actions={(
        <>
          <Link
            href="/admin/products/create"
            className="inline-flex items-center rounded-full bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
          >
            Crear producto
          </Link>
          <Link
            href="/admin/productsedit"
            className="inline-flex items-center rounded-full border border-slate-200 px-5 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
          >
            Abrir inventario editable
          </Link>
        </>
      )}
    >
      <Notification flash={flash} />

      <div className="mb-6 rounded-[1.75rem] border border-slate-200 bg-white p-5 shadow-sm">
        <form onSubmit={handleSubmit} className="grid gap-3 lg:grid-cols-[1.4fr,1fr,160px,auto]">
          <input
            type="text"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Buscar por nombre, descripción o categoría"
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          />
          <select
            value={categoryId}
            onChange={(event) => setCategoryId(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category.id} value={category.id}>{category.name}</option>
            ))}
          </select>
          <select
            value={perPage}
            onChange={(event) => setPerPage(event.target.value)}
            className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm focus:border-amber-400 focus:outline-none focus:ring-2 focus:ring-amber-200"
          >
            {[20, 40, 60, 100].map((size) => (
              <option key={size} value={size}>{size} por página</option>
            ))}
          </select>
          <div className="flex gap-2">
            <button
              type="submit"
              className="rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
            >
              Buscar
            </button>
            <button
              type="button"
              onClick={handleReset}
              className="rounded-2xl border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
            >
              Limpiar
            </button>
          </div>
        </form>
      </div>

      <div className="rounded-[1.75rem] border border-slate-200 bg-white shadow-sm">
        <div className="flex items-center justify-between border-b border-slate-100 px-6 py-4">
          <div>
            <h2 className="text-lg font-semibold text-slate-900">Listado actual</h2>
            <p className="text-sm text-slate-500">{meta.from || 0}-{meta.to || 0} de {meta.total || 0} producto(s) visibles en el catálogo administrativo.</p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-slate-200 text-sm">
            <thead className="bg-slate-50/80 text-left text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">
              <tr>
                <th className="px-6 py-4">ID</th>
                <th className="px-6 py-4">Nombre</th>
                <th className="px-6 py-4">Categoría</th>
                <th className="px-6 py-4">Precio</th>
                <th className="px-6 py-4">Stock</th>
                <th className="px-6 py-4">Creado</th>
                <th className="px-6 py-4 text-right">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 bg-white">
              {items.map((product) => (
                <tr key={product.id} className="transition hover:bg-slate-50/80">
                  <td className="px-6 py-4 font-medium text-slate-600">{product.id}</td>
                  <td className="px-6 py-4">
                    <div className="font-semibold text-slate-900">{product.name}</div>
                  </td>
                  <td className="px-6 py-4 text-slate-600">{product.category?.name || 'Sin categoría'}</td>
                  <td className="px-6 py-4 text-slate-600">{new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(product.price || 0)}</td>
                  <td className="px-6 py-4">
                    <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${Number(product.stock) > 0 ? 'bg-emerald-100 text-emerald-700' : 'bg-rose-100 text-rose-700'}`}>
                      {product.stock}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-slate-500">{product.created_at || '-'}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/productsedit`}
                        className="rounded-xl border border-slate-200 px-3 py-2 text-xs font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50"
                      >
                        Editar a fondo
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(product)}
                        className="rounded-xl bg-rose-500 px-3 py-2 text-xs font-semibold text-white transition hover:bg-rose-400"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {items.length === 0 ? (
          <div className="border-t border-slate-100 px-6 py-10 text-center text-sm text-slate-500">
            No hay productos que coincidan con los filtros activos.
          </div>
        ) : null}

        <div className="flex flex-col gap-3 border-t border-slate-100 px-6 py-4 sm:flex-row sm:items-center sm:justify-between">
          <p className="text-sm text-slate-500">
            Página {meta.current_page || 1} de {meta.last_page || 1}
          </p>
          <div className="flex gap-2">
            <button
              type="button"
              onClick={() => applyFilters((meta.current_page || 1) - 1)}
              disabled={(meta.current_page || 1) <= 1}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Anterior
            </button>
            <button
              type="button"
              onClick={() => applyFilters((meta.current_page || 1) + 1)}
              disabled={(meta.current_page || 1) >= (meta.last_page || 1)}
              className="rounded-full border border-slate-200 px-4 py-2 text-sm font-semibold text-slate-700 transition hover:border-slate-300 hover:bg-slate-50 disabled:cursor-not-allowed disabled:text-slate-400"
            >
              Siguiente
            </button>
          </div>
        </div>
      </div>
    </AdminWorkspaceLayout>
  );
}
