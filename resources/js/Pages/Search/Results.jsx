import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Link, Head, usePage } from '@inertiajs/react';
import ProductCard from '@/Components/catalog/ProductCard.jsx';
import ProductSkeletonCard from '@/Components/ui/ProductSkeletonCard.jsx';
import ActiveFilters from '@/Components/catalog/ActiveFilters.jsx';
import CatalogAsideLayout from '@/Components/catalog/CatalogAsideLayout.jsx';
import CatalogFilterPanel from '@/Components/catalog/CatalogFilterPanel.jsx';
import StorefrontLayout from '@/Layouts/StorefrontLayout.jsx';
import { CATALOG_STICKY_TOP } from '@/config/catalogLayout.js';
import { useI18n } from '@/i18n';

const Results = () => {
  const {
    products = {},
    filters = {},
    categories = [],
    recommended = [],
    hasActiveQuery,
  } = usePage().props;
  const { t } = useI18n();

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
  const initialQuery = filters.query ?? '';
  const initialCategory = filters.category ? String(filters.category) : 'all';
  const initialMinPrice = filters.min_price ?? '';
  const initialMaxPrice = filters.max_price ?? '';
  const initialSort = filters.sort ?? 'relevance';
  const activeFlags = Array.isArray(filters.flags) ? filters.flags : [];

  const [searchTerm, setSearchTerm] = useState(initialQuery);
  const [selectedCategory, setSelectedCategory] = useState(initialCategory);
  const [minPrice, setMinPrice] = useState(initialMinPrice);
  const [maxPrice, setMaxPrice] = useState(initialMaxPrice);
  const [sortOrder, setSortOrder] = useState(initialSort);
  const [isInlineFiltersOpen, setIsInlineFiltersOpen] = useState(false);
  const [isAsideFiltersExpanded, setIsAsideFiltersExpanded] = useState(false);
  const hasMountedRef = useRef(false);

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

  const resetFilters = () => {
    setSearchTerm('');
    setSelectedCategory('all');
    setMinPrice('');
    setMaxPrice('');
    setSortOrder('relevance');
    setIsInlineFiltersOpen(false);
    buildQuery({ query: undefined, category: undefined, min_price: undefined, max_price: undefined, sort: undefined, flags: [], page: 1 });
  };

  useEffect(() => {
    setSearchTerm(initialQuery);
    setSelectedCategory(initialCategory);
    setMinPrice(initialMinPrice);
    setMaxPrice(initialMaxPrice);
    setSortOrder(initialSort);
  }, [initialCategory, initialMaxPrice, initialMinPrice, initialQuery, initialSort]);

  useEffect(() => {
    if (!hasMountedRef.current) {
      hasMountedRef.current = true;
      return undefined;
    }

    const timeoutId = window.setTimeout(() => {
      buildQuery({
        query: searchTerm.trim() || undefined,
        category: selectedCategory !== 'all' ? selectedCategory : undefined,
        min_price: minPrice || undefined,
        max_price: maxPrice || undefined,
        sort: sortOrder !== 'relevance' ? sortOrder : undefined,
        page: 1,
      });
    }, 220);

    return () => window.clearTimeout(timeoutId);
  }, [searchTerm, selectedCategory, minPrice, maxPrice, sortOrder]);

  const formatCurrency = (value) =>
    new Intl.NumberFormat('es-MX', { style: 'currency', currency: 'MXN' }).format(value);

  const activeFilterCount = [
    Boolean(searchTerm.trim()),
    selectedCategory !== 'all',
    Boolean(minPrice),
    Boolean(maxPrice),
  ].filter(Boolean).length + activeFlags.length;

  const selectedCategoryName = useMemo(() => {
    if (selectedCategory === 'all') return t('catalog.filter.all_categories');

    return (
      categories.find((category) => String(category.id ?? category.slug ?? category.name) === String(selectedCategory))?.name ??
      selectedCategory
    );
  }, [categories, selectedCategory, t]);

  const flagLabels = useMemo(
    () => ({
      is_featured: t('catalog.flags.is_featured'),
      is_superdeal: t('catalog.flags.is_superdeal'),
      is_fast_shipping: t('catalog.flags.is_fast_shipping'),
      is_new_arrival: t('catalog.flags.is_new_arrival'),
      is_seasonal: t('catalog.flags.is_seasonal'),
    }),
    [t],
  );

  const quickFilterOptions = useMemo(
    () =>
      Object.entries(flagLabels).map(([flag, label]) => ({
        key: flag,
        label,
        active: activeFlags.includes(flag),
        onSelect: () => toggleFlag(flag),
      })),
    [activeFlags],
  );

  const sortOptions = useMemo(
    () => [
      { value: 'relevance', label: t('catalog.filter.sort_relevance') },
      { value: 'rating', label: t('catalog.filter.sort_rating') },
      { value: 'price_asc', label: t('catalog.filter.sort_price_asc') },
      { value: 'price_desc', label: t('catalog.filter.sort_price_desc') },
      { value: 'recent', label: t('catalog.filter.sort_recent') },
    ],
    [t],
  );

  return (
    <>
      <Head title="Resultados de búsqueda" />
      <div className="min-h-screen flex flex-col bg-slate-50 text-slate-800">
        <StorefrontLayout showTopNav />

        <main className="flex-1">
          <section className="bg-white/80 border-b border-slate-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6">
              <h1 className="text-2xl font-semibold text-slate-900">
                {hasActiveQuery && filters.query ? t('catalog.results.title_with_query', { query: filters.query }) : t('catalog.results.title')}
              </h1>
              <p className="mt-1 text-sm text-slate-500">
                {t('catalog.results.subtitle')}
              </p>
            </div>
          </section>

          <div className="mx-auto grid w-full max-w-[120rem] gap-6 px-4 py-8 sm:px-6 lg:grid-cols-[minmax(0,1fr)_minmax(28rem,34rem)] lg:gap-8 lg:px-8">
            <aside className="order-2 lg:order-2 lg:-mr-8 lg:h-full xl:-mr-10 2xl:-mr-12">
              <div className="lg:hidden">
                <CatalogFilterPanel
                  mode="inline"
                  searchTerm={searchTerm}
                  setSearchTerm={setSearchTerm}
                  selectedCategory={selectedCategory}
                  setSelectedCategory={setSelectedCategory}
                  minPrice={minPrice}
                  setMinPrice={setMinPrice}
                  maxPrice={maxPrice}
                  setMaxPrice={setMaxPrice}
                  sortOrder={sortOrder}
                  setSortOrder={setSortOrder}
                  categories={categories}
                  quickFilterOptions={quickFilterOptions}
                  activeFilterCount={activeFilterCount}
                  resultCount={total}
                  resetFilters={resetFilters}
                  selectedCategoryName={selectedCategoryName}
                  isOpen={isInlineFiltersOpen}
                  setIsOpen={setIsInlineFiltersOpen}
                  sortOptions={sortOptions}
                  searchPlaceholder={t('catalog.filter.search_placeholder')}
                  categoryAllLabel={t('catalog.filter.all_categories')}
                  renderActiveFilters={({ className }) => (
                    <ActiveFilters
                      searchTerm={searchTerm}
                      selectedCategory={selectedCategory === 'all' ? null : selectedCategory}
                      minPrice={minPrice}
                      maxPrice={maxPrice}
                      categories={categories}
                      extraTags={activeFlags.map((flag) => flagLabels[flag] ?? flag)}
                      className={className}
                      showClearAction={false}
                      onClear={resetFilters}
                    />
                  )}
                />
              </div>

              <CatalogAsideLayout
                isExpanded={isAsideFiltersExpanded}
                stickyTop={CATALOG_STICKY_TOP}
                edge="right"
                filterContent={
                  <CatalogFilterPanel
                    mode="aside"
                    searchTerm={searchTerm}
                    setSearchTerm={setSearchTerm}
                    selectedCategory={selectedCategory}
                    setSelectedCategory={setSelectedCategory}
                    minPrice={minPrice}
                    setMinPrice={setMinPrice}
                    maxPrice={maxPrice}
                    setMaxPrice={setMaxPrice}
                    sortOrder={sortOrder}
                    setSortOrder={setSortOrder}
                    categories={categories}
                    quickFilterOptions={quickFilterOptions}
                    activeFilterCount={activeFilterCount}
                    resultCount={total}
                    resetFilters={resetFilters}
                    selectedCategoryName={selectedCategoryName}
                    isOpen={isAsideFiltersExpanded}
                    setIsOpen={setIsAsideFiltersExpanded}
                    sortOptions={sortOptions}
                    searchPlaceholder={t('catalog.filter.search_placeholder')}
                    categoryAllLabel={t('catalog.filter.all_categories')}
                    stickyOffset={CATALOG_STICKY_TOP}
                    edge="right"
                    renderActiveFilters={({ className }) => (
                      <ActiveFilters
                        searchTerm={searchTerm}
                        selectedCategory={selectedCategory === 'all' ? null : selectedCategory}
                        minPrice={minPrice}
                        maxPrice={maxPrice}
                        categories={categories}
                        extraTags={activeFlags.map((flag) => flagLabels[flag] ?? flag)}
                        className={className}
                        showClearAction={false}
                        onClear={resetFilters}
                      />
                    )}
                  />
                }
                secondaryContent={
                  !!recommended.length ? (
                    <div className="relative z-0 bg-white shadow-sm border border-slate-200 rounded-2xl p-5 space-y-4">
                      <h3 className="text-sm font-semibold text-slate-700">{t('catalog.results.recommended_title')}</h3>
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
                  ) : <div />
                }
              />
            </aside>

            <section className="order-1 space-y-6 lg:order-1">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white border border-slate-200 rounded-2xl px-5 py-4 shadow-sm">
                <div>
                  <p className="text-sm text-slate-600">
                    {total ? t('catalog.results.count_found', { count: total }) : t('catalog.results.count_empty')}
                  </p>
                  {hasActiveQuery && filters.query && (
                    <p className="text-xs text-slate-500 mt-1">
                      {t('catalog.results.tip')}
                    </p>
                  )}
                </div>

                <ActiveFilters
                  searchTerm={searchTerm}
                  selectedCategory={selectedCategory === 'all' ? null : selectedCategory}
                  minPrice={minPrice}
                  maxPrice={maxPrice}
                  categories={categories}
                  extraTags={activeFlags.map((flag) => flagLabels[flag] ?? flag)}
                  onClear={resetFilters}
                />
              </div>

              {total === 0 ? (
                <div className="bg-white border border-slate-200 rounded-2xl px-6 py-12 text-center text-slate-500 shadow-sm">
                  <p className="text-lg font-semibold text-slate-700 mb-2">{t('catalog.results.empty_title')}</p>
                  <p className="text-sm">
                    {t('catalog.results.empty_body')}
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
