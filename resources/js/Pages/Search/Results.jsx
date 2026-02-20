import React from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import ProductCard from '@/Components/catalog/ProductCard.jsx';
import ProductSkeletonCard from '@/Components/ui/ProductSkeletonCard.jsx';
import ActiveFilters from '@/Components/catalog/ActiveFilters.jsx';

const flagLabels = {
  is_featured: 'Destacado',
  is_superdeal: 'Superdeal',
  is_fast_shipping: 'Envío rápido',
  is_new_arrival: 'Nuevo',
  is_seasonal: 'Temporal',
};

const Results = () => {
  const {
    products = {},
    filters = {},
    categories = [],
    recommended = [],
    hasActiveQuery,
  } = usePage().props;

  const paginated = {
    data: [],
    current_page: 1,
    last_page: 1,
    total: 0,
    ...products,
  };

  const items = paginated.data ?? [];
  const total = paginated.total ?? 0;
  const currentPage = paginated.current_page ?? 1;
  const lastPage = paginated.last_page ?? 1;

  const buildQuery = (overrides = {}) => {
    const params = new URLSearchParams();
    const merged = { ...filters, ...overrides };

    Object.entries(merged).forEach(([key, value]) => {
      if (value === undefined || value === null || value === '' || (Array.isArray(value) && value.length === 0)) {
        return;
      }

      if (Array.isArray(value)) {
        params.delete(`${key}[]`);
        value.forEach((entry) => params.append(`${key}[]`, entry));
      } else {
        params.set(key, value);
      }
    });

    const queryString = params.toString();
    window.location.search = queryString ? `?${queryString}` : '';
  };

  const toggleFlag = (flag) => {
    const current = new Set(Array.isArray(filters.flags) ? filters.flags : []);
    current.has(flag) ? current.delete(flag) : current.add(flag);
    buildQuery({ flags: Array.from(current), page: 1 });
  };

  const updateFilter = (name, value) => buildQuery({ [name]: value || undefined, page: 1 });

  const resetFilters = () => {
    window.location.href = '/search';
  };

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

  return (
    <>
      <Head title="Resultados de búsqueda" />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <Header />

        <main className="flex-1">
          <section className="bg-white/80 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-semibold text-slate-900">
                {hasActiveQuery && filters.query ? `Resultados para “${filters.query}”` : 'Resultados de productos'}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                Ajusta filtros, ordena por precio o valoración y encuentra el producto ideal.
              </p>
            </div>
          </section>

          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 grid lg:grid-cols-[260px_1fr] gap-6">
            <aside className="space-y-4">
              <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold uppercase tracking-wide text-slate-600">Filtros</h2>
                  <button onClick={resetFilters} className="text-xs text-indigo-600 hover:text-indigo-700">
                    Limpiar todo
                  </button>
                </div>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                      Categoría
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-400/70 text-sm"
                      value={filters.category ?? ''}
                      onChange={(event) => updateFilter('category', event.target.value)}
                    >
                      <option value="">Todas</option>
                      {categories.map((category) => (
                        <option key={category.id} value={category.id}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                        Min
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-400/70 text-sm"
                        placeholder="0"
                        defaultValue={filters.min_price ?? ''}
                        onBlur={(event) => updateFilter('min_price', event.target.value)}
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                        Máx
                      </label>
                      <input
                        type="number"
                        min="0"
                        className="w-full rounded-xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-400/70 text-sm"
                        placeholder="9999"
                        defaultValue={filters.max_price ?? ''}
                        onBlur={(event) => updateFilter('max_price', event.target.value)}
                      />
                    </div>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                      Ordenar por
                    </label>
                    <select
                      className="w-full rounded-xl border border-slate-200 shadow-sm focus:border-indigo-500 focus:ring-indigo-400/70 text-sm"
                      value={filters.sort ?? 'relevance'}
                      onChange={(event) => updateFilter('sort', event.target.value)}
                    >
                      <option value="relevance">Relevancia</option>
                      <option value="rating">Mejor valoración</option>
                      <option value="price_asc">Precio: menor a mayor</option>
                      <option value="price_desc">Precio: mayor a menor</option>
                      <option value="recent">Más recientes</option>
                    </select>
                  </div>

                  <div>
                    <span className="block text-xs font-semibold uppercase text-slate-500 mb-2">
                      Etiquetas rápidas
                    </span>
                    <div className="flex flex-wrap gap-2">
                      {Object.entries(flagLabels).map(([flag, label]) => {
                        const active = (filters.flags ?? []).includes(flag);
                        return (
                          <button
                            key={flag}
                            type="button"
                            onClick={() => toggleFlag(flag)}
                            className={`px-3 py-1 rounded-full text-xs font-medium transition ${
                              active
                                ? 'bg-indigo-600 text-white shadow'
                                : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                            }`}
                          >
                            {label}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                </div>
              </div>

              {!!recommended.length && (
                <div className="bg-white shadow-sm border border-slate-200 rounded-2xl p-5 space-y-4">
                  <h3 className="text-sm font-semibold text-slate-700">Quizá te interese</h3>
                  <ul className="space-y-3">
                    {recommended.map((item) => (
                      <li key={item.id} className="flex gap-3 text-sm">
                        <img
                          src={item.image_url}
                          alt={item.name}
                          className="w-12 h-12 rounded-lg object-cover border border-slate-200"
                        />
                        <div>
                          <Link href={`/product/${item.id}`} className="font-medium text-slate-700 hover:text-indigo-600">
                            {item.name}
                          </Link>
                          <p className="text-xs text-slate-500">{formatCurrency(item.price)}</p>
                        </div>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </aside>

            <section className="space-y-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                <div>
                  <p className="text-sm text-slate-600">
                    {total ? `${total} productos encontrados` : 'Sin coincidencias por ahora.'}
                  </p>
                  {hasActiveQuery && filters.query && (
                    <p className="text-xs text-slate-500 mt-1">
                      Consejo: prueba palabras clave más específicas o ajusta los filtros.
                    </p>
                  )}
                </div>

                <ActiveFilters
                  selectedCategory={filters.category}
                  minPrice={filters.min_price}
                  maxPrice={filters.max_price}
                  categories={categories}
                  onClear={resetFilters}
                />
              </div>

              {total === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl px-6 py-12 text-center text-slate-500 shadow-sm">
                  <p className="text-lg font-semibold text-slate-700 mb-2">No encontramos coincidencias</p>
                  <p className="text-sm">
                    Comprueba la ortografía, intenta una categoría relacionada o elimina algunos filtros.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5">
                  {!items.length
                    ? Array.from({ length: 8 }).map((_, index) => <ProductSkeletonCard key={index} />)
                    : items.map((product) => (
                        <ProductCard key={product.id} product={product} />
                      ))}
                </div>
              )}

              {lastPage > 1 && (
                <div className="flex items-center justify-center gap-2 mt-8">
                  {Array.from({ length: lastPage }, (_, index) => {
                    const page = index + 1;
                    const active = Number(currentPage) === page;

                    return (
                      <button
                        key={page}
                        type="button"
                        onClick={() => buildQuery({ page })}
                        className={`px-3 py-2 rounded-full border text-sm font-medium transition ${
                          active
                            ? 'bg-indigo-600 text-white border-indigo-600 shadow'
                            : 'bg-white border-slate-200 text-slate-600 hover:border-indigo-400 hover:text-indigo-600'
                        }`}
                      >
                        {page}
                      </button>
                    );
                  })}
                </div>
              )}
            </section>
          </div>
        </main>
      </div>
    </>
  );
};

export default Results;