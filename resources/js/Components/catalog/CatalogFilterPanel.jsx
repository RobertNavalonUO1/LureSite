import React from 'react';
import { ChevronDown, ChevronRight, ChevronUp, Search, SlidersHorizontal } from 'lucide-react';
import { useI18n } from '@/i18n';

const getDefaultSortOptions = (t) => [
  { value: 'featured', label: t('catalog.filter.sort_featured') },
  { value: 'newest', label: t('catalog.filter.sort_newest') },
  { value: 'lowest-price', label: t('catalog.filter.sort_lowest_price') },
  { value: 'highest-price', label: t('catalog.filter.sort_highest_price') },
];

const normalizeQuickFilter = (filter, selectedCategory) => {
  const value = filter?.value ?? filter?.key ?? filter?.id ?? filter?.slug ?? filter?.name;
  const label = filter?.label ?? filter?.name ?? String(value ?? '');

  return {
    ...filter,
    value,
    label,
    active: typeof filter?.active === 'boolean' ? filter.active : String(selectedCategory) === String(value),
  };
};

export default function CatalogFilterPanel({
  searchTerm,
  setSearchTerm,
  selectedCategory,
  setSelectedCategory,
  minPrice,
  setMinPrice,
  maxPrice,
  setMaxPrice,
  sortOrder,
  setSortOrder,
  categories = [],
  quickFilterOptions = [],
  activeFilterCount = 0,
  resultCount = 0,
  resetFilters,
  selectedCategoryName,
  isOpen = true,
  setIsOpen,
  mode = 'aside',
  renderActiveFilters,
  sortOptions,
  quickFilterLabel,
  panelTitle,
  searchPlaceholder,
  categoryAllLabel,
  priceCurrency = 'EUR',
  compactLabel,
  stickyOffset,
  edge = 'left',
}) {
  const { t } = useI18n();
  const hasActiveFilters = activeFilterCount > 0;
  const isInline = mode === 'inline';
  const isAside = mode === 'aside';
  const compactSummaryId = React.useId();

  const resolvedPanelTitle = panelTitle ?? t('catalog.filter.panel_title');
  const resolvedQuickFilterLabel = quickFilterLabel ?? t('catalog.filter.quick_filters_label');
  const resolvedSearchPlaceholder = searchPlaceholder ?? t('catalog.filter.search_placeholder');
  const resolvedCategoryAllLabel = categoryAllLabel ?? t('catalog.filter.all_categories');
  const resolvedCompactLabel = compactLabel ?? t('catalog.filter.compact_label');
  const resolvedSelectedCategoryName = selectedCategoryName ?? resolvedCategoryAllLabel;
  const resolvedSortOptions = sortOptions?.length ? sortOptions : getDefaultSortOptions(t);
  const isRightEdge = edge === 'right';
  const selectedSortLabel =
    resolvedSortOptions.find((option) => option.value === sortOrder)?.label ?? t('catalog.filter.custom_sort');
  const resultCountLabel = t(
    resultCount === 1 ? 'catalog.filter.result_count_one' : 'catalog.filter.result_count_other',
    { count: resultCount },
  );
  const summaryText = hasActiveFilters
    ? t(
        activeFilterCount === 1
          ? 'catalog.filter.active_count_one'
          : 'catalog.filter.active_count_other',
        { count: activeFilterCount },
      )
    : t('catalog.filter.no_active_filters');
  const compactSummaryText = hasActiveFilters
    ? summaryText
    : `${resolvedSelectedCategoryName === resolvedCategoryAllLabel ? t('catalog.filter.unrestricted') : resolvedSelectedCategoryName} · ${selectedSortLabel}`;
  const compactStatusText = hasActiveFilters
    ? t(
        activeFilterCount === 1
          ? 'catalog.filter.status_active_one'
          : 'catalog.filter.status_active_other',
        { count: activeFilterCount },
      )
    : t('catalog.filter.status_free');
  const quickFilters = quickFilterOptions.map((filter) => normalizeQuickFilter(filter, selectedCategory));
  const compactAsideStyle = isAside ? { minHeight: '34rem' } : undefined;
  const openPanel = () => setIsOpen?.(true);
  const closePanel = () => setIsOpen?.(false);
  const handleCompactKeyDown = (event) => {
    if (event.key === 'Enter' || event.key === ' ') {
      event.preventDefault();
      openPanel();
    }
  };

  if (!isOpen) {
    if (isAside) {
      return (
        <div
          id="filtros"
          className={[
            'group relative isolate w-full overflow-hidden border border-slate-200/90 bg-gradient-to-b from-white via-stone-50/90 to-stone-100/80 transition duration-300 hover:border-slate-300 hover:from-white hover:to-amber-50/60 hover:shadow-[-12px_20px_44px_-32px_rgba(15,23,42,0.22)]',
            isRightEdge ? 'rounded-l-[22px] rounded-r-none border-r-0' : 'rounded-[22px]',
          ].join(' ')}
          style={compactAsideStyle}
          role="button"
          tabIndex={0}
          aria-expanded={false}
          aria-controls={compactSummaryId}
          onClick={openPanel}
          onKeyDown={handleCompactKeyDown}
        >
          <div className="flex h-full min-h-0 flex-col justify-between">
            <div className="border-b border-slate-200/80 px-4 py-5">
              <div className="inline-flex h-11 w-11 items-center justify-center rounded-[18px] border border-slate-200 bg-white text-slate-700 shadow-sm transition group-hover:border-amber-200 group-hover:text-amber-700">
                <SlidersHorizontal className="h-4 w-4" aria-hidden="true" />
              </div>

              <div className="mt-8 space-y-3">
                <div className="text-[10px] font-semibold uppercase tracking-[0.26em] text-slate-400">
                  {resolvedPanelTitle}
                </div>
                <div className="text-[2.2rem] font-semibold leading-none text-slate-950">{resultCount}</div>
                <div className="text-xs font-medium text-slate-500">{resultCountLabel}</div>
              </div>

              <div className="mt-8 rounded-[18px] border border-white/80 bg-white/70 px-3 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.8)] backdrop-blur-sm">
                <div className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {resolvedCompactLabel}
                </div>
                <div className="mt-2 text-sm font-medium leading-6 text-slate-800">{compactStatusText}</div>
                <div className="mt-2 line-clamp-6 text-xs leading-5 text-slate-500">{compactSummaryText}</div>
              </div>
            </div>

            <div className="space-y-4 px-4 py-5">
              {typeof renderActiveFilters === 'function' ? (
                <div id={compactSummaryId} className="sr-only">
                  {renderActiveFilters({
                    className: 'flex-wrap gap-1.5 text-xs text-slate-500 [&>span:first-child]:hidden',
                    variant: 'compact',
                  })}
                </div>
              ) : null}

              <div className="inline-flex w-full items-center justify-between rounded-[18px] border border-slate-200/90 bg-slate-950 px-3 py-3 text-sm font-medium text-white shadow-sm transition group-hover:border-slate-900 group-hover:bg-slate-900">
                <span className="leading-tight text-left">
                  <span className="block text-[10px] uppercase tracking-[0.18em] text-white/45">{t('catalog.filter.enter')}</span>
                  <span className="mt-1 block">{t('catalog.filter.open_filters')}</span>
                </span>
                <ChevronRight className="h-4 w-4 text-white/70 transition group-hover:translate-x-0.5" aria-hidden="true" />
              </div>
            </div>
          </div>
        </div>
      );
    }

    return (
      <div
        id={isAside ? 'filtros' : undefined}
        className={[
          'relative isolate overflow-hidden rounded-[22px] border border-slate-200/80 bg-white/96 shadow-sm transition hover:border-slate-300',
          isInline ? 'p-3.5 lg:hidden' : 'p-3.5',
        ].join(' ')}
        role="button"
        tabIndex={0}
        aria-expanded={false}
        aria-controls={compactSummaryId}
        onClick={openPanel}
        onKeyDown={handleCompactKeyDown}
      >
        <div className="flex items-center justify-between gap-3">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2 text-[13px] font-semibold text-slate-800">
              <span className="inline-flex h-8 w-8 items-center justify-center rounded-full bg-slate-100 text-slate-600">
                <SlidersHorizontal className="h-3.5 w-3.5" aria-hidden="true" />
              </span>
              <span>{resolvedPanelTitle}</span>
              {isAside ? (
                <span className="text-[10px] font-semibold uppercase tracking-[0.22em] text-slate-400">
                  {resolvedCompactLabel}
                </span>
              ) : null}
            </div>

            <div className="mt-2 flex flex-wrap items-center gap-x-2 gap-y-1 text-sm text-slate-600">
              <span className="font-semibold text-slate-900">{resultCountLabel}</span>
              <span className="text-slate-300">•</span>
              <span className="truncate">{compactSummaryText}</span>
            </div>

            {typeof renderActiveFilters === 'function' ? (
              <div id={compactSummaryId} className="sr-only">
                {renderActiveFilters({
                  className: 'flex-wrap gap-1.5 text-xs text-slate-500 [&>span:first-child]:hidden',
                  variant: 'compact',
                })}
              </div>
            ) : null}
          </div>
          <div className="inline-flex shrink-0 items-center gap-2 rounded-full border border-slate-900 bg-slate-900 px-3.5 py-2 text-sm font-medium text-white shadow-sm">
            {t('catalog.filter.open_filters')}
            <ChevronDown className="h-4 w-4" aria-hidden="true" />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div
      id={isAside ? 'filtros' : undefined}
      className={[
        'relative isolate w-full overflow-hidden border border-slate-200/90 bg-[linear-gradient(180deg,rgba(255,255,255,0.98)_0%,rgba(248,250,252,0.96)_100%)] backdrop-blur-sm',
        isAside
          ? (isRightEdge
            ? 'rounded-l-[22px] rounded-r-none border-r-0 shadow-[-12px_18px_40px_-30px_rgba(15,23,42,0.22)]'
            : 'rounded-[22px] shadow-[0_18px_40px_-30px_rgba(15,23,42,0.18)]')
          : 'rounded-[20px] shadow-sm',
      ].join(' ')}
    >
      <div className="flex h-full min-h-0 flex-col">
        <div className={isAside ? 'border-b border-slate-200/80 bg-[radial-gradient(circle_at_top_left,rgba(251,191,36,0.14),transparent_38%)] px-5 py-5 sm:px-6' : 'border-b border-slate-200 px-4 py-4 sm:px-5'}>
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <div className="flex flex-wrap items-center gap-2">
                <span className="inline-flex items-center rounded-full border border-amber-200 bg-amber-50 px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-amber-700">
                  {t('catalog.filter.badge')}
                </span>
                {isAside ? (
                  <span className="text-[11px] font-medium text-slate-400">
                    {t('catalog.filter.caption')}
                  </span>
                ) : null}
              </div>
              <h2 className="mt-3 text-xl font-semibold text-slate-950">{resolvedPanelTitle}</h2>
              <p className="mt-1 max-w-md text-sm leading-6 text-slate-500">
                {t('catalog.filter.description')}
              </p>
              <div className="mt-4 flex flex-wrap items-center gap-2 text-sm text-slate-500">
                <span className="inline-flex items-center rounded-full bg-white px-3 py-1.5 text-sm font-semibold text-slate-900 shadow-sm">
                  {resultCountLabel}
                </span>
                <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1.5 text-sm font-medium text-slate-600">
                  {summaryText}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {typeof resetFilters === 'function' && hasActiveFilters ? (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center rounded-full px-3 py-2 text-sm font-medium text-slate-500 transition hover:bg-white hover:text-slate-900"
                >
                  {t('catalog.filter.clear')}
                </button>
              ) : null}
              {isAside || isInline ? (
                <button
                  type="button"
                  onClick={() => setIsOpen?.(false)}
                  className="inline-flex items-center gap-2 rounded-full border border-slate-200 bg-white px-3.5 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:border-slate-300 hover:bg-slate-50"
                  aria-label={t('catalog.filter.back_to_summary')}
                >
                  {t('catalog.filter.close_filters')}
                  <ChevronUp className="h-4 w-4" aria-hidden="true" />
                </button>
              ) : null}
            </div>
          </div>
        </div>

        <div>
          <div className={isAside ? 'space-y-0' : 'space-y-4 px-4 py-4 sm:px-5'}>
            <section className={isAside ? 'px-5 py-5 sm:px-6 sm:py-6' : ''}>
              <label className="space-y-2">
                <span className="text-sm font-medium text-slate-700">{t('catalog.filter.search_label')}</span>
                <div className="relative">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" aria-hidden="true" />
                  <input
                    id={isInline ? 'catalog-search-inline' : 'catalog-search'}
                    type="search"
                    value={searchTerm}
                    onChange={(event) => setSearchTerm?.(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white py-3 pl-11 pr-4 text-sm text-slate-700 shadow-[inset_0_1px_0_rgba(255,255,255,0.9)] transition focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100/80"
                    placeholder={resolvedSearchPlaceholder}
                  />
                </div>
              </label>
            </section>

            <section className={isAside ? 'border-t border-slate-200 px-5 py-5 sm:px-6 sm:py-6' : ''}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{t('catalog.filter.category_label')}</span>
                  <select
                    id={isInline ? 'catalog-category-inline' : 'catalog-category'}
                    value={selectedCategory}
                    onChange={(event) => setSelectedCategory?.(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100/80"
                  >
                    <option value="all">{resolvedCategoryAllLabel}</option>
                    {categories.map((category) => {
                      const optionValue =
                        category.id !== undefined && category.id !== null
                          ? String(category.id)
                          : category.slug ?? category.name;
                      const optionKey = category.id ?? category.slug ?? category.name;

                      return (
                        <option key={optionKey} value={optionValue}>
                          {category.name}
                        </option>
                      );
                    })}
                  </select>
                </label>

                <label className="space-y-2">
                  <span className="text-sm font-medium text-slate-700">{t('catalog.filter.sort_label')}</span>
                  <select
                    id={isInline ? 'catalog-sort-inline' : 'catalog-sort'}
                    value={sortOrder}
                    onChange={(event) => setSortOrder?.(event.target.value)}
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100/80"
                  >
                    {resolvedSortOptions.map((option) => (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    ))}
                  </select>
                </label>
              </div>
            </section>

            <section className={isAside ? 'border-t border-slate-200 px-5 py-5 sm:px-6 sm:py-6' : ''}>
              <div className="space-y-2">
                <div className="flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-slate-700">{t('catalog.filter.price_label')}</span>
                  <span className="text-xs font-medium text-slate-400">{priceCurrency}</span>
                </div>
                <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-center">
                  <input
                    id={isInline ? 'catalog-min-price-inline' : 'catalog-min-price'}
                    type="number"
                    min="0"
                    value={minPrice}
                    onChange={(event) => setMinPrice?.(event.target.value)}
                    placeholder={t('catalog.filter.min_placeholder')}
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100/80"
                  />
                  <span className="justify-self-center text-sm text-slate-300">—</span>
                  <input
                    id={isInline ? 'catalog-max-price-inline' : 'catalog-max-price'}
                    type="number"
                    min="0"
                    value={maxPrice}
                    onChange={(event) => setMaxPrice?.(event.target.value)}
                    placeholder={t('catalog.filter.max_placeholder')}
                    className="w-full rounded-[18px] border border-slate-200 bg-white px-4 py-3 text-sm text-slate-700 transition focus:border-amber-300 focus:outline-none focus:ring-4 focus:ring-amber-100/80"
                  />
                </div>
              </div>
            </section>

            {typeof renderActiveFilters === 'function' ? (
              <section className={isAside ? 'border-t border-slate-200 px-5 py-4 sm:px-6 sm:py-5' : ''}>
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700">{t('catalog.filter.active_filters_label')}</span>
                  {renderActiveFilters({ className: 'flex-wrap gap-2 text-sm text-slate-600' })}
                </div>
              </section>
            ) : null}

            {quickFilters.length > 0 ? (
              <section className={isAside ? 'border-t border-slate-200 px-5 py-4 sm:px-6 sm:py-5' : ''}>
                <div className="space-y-3">
                  <span className="text-sm font-medium text-slate-700">{resolvedQuickFilterLabel}</span>
                  <div className="flex flex-wrap gap-2">
                    {quickFilters.map((filter) => (
                      <button
                        key={filter.value ?? filter.label}
                        type="button"
                        onClick={() => {
                          if (typeof filter.onSelect === 'function') {
                            filter.onSelect(filter);
                            return;
                          }

                          setSelectedCategory?.(String(filter.value));
                        }}
                        className={[
                          'rounded-full border px-3 py-2 text-xs font-medium transition',
                          filter.active
                            ? 'border-slate-900 bg-slate-900 text-white shadow-sm'
                            : 'border-slate-200 bg-white text-slate-600 hover:border-amber-200 hover:bg-amber-50/70 hover:text-slate-900',
                        ].join(' ')}
                      >
                        {filter.label}
                      </button>
                    ))}
                  </div>
                </div>
              </section>
            ) : null}
          </div>
        </div>

        <div className={isAside ? 'flex items-center justify-between border-t border-slate-200 bg-gradient-to-r from-stone-50 to-white px-5 py-4 text-sm text-slate-500 sm:px-6' : 'mt-5 flex items-center justify-between border-t border-slate-200 px-4 py-4 text-sm text-slate-500 sm:px-5'}>
          <div className="min-w-0 pr-4">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-400">
              {t('catalog.filter.summary_label')}
            </div>
            <span className="mt-1 block truncate">{resolvedSelectedCategoryName}</span>
          </div>
          <span className="shrink-0 text-right">{selectedSortLabel}</span>
        </div>
      </div>
    </div>
  );
}
