import React from 'react';

const ActiveFilters = ({
  selectedCategory,
  minPrice,
  maxPrice,
  searchTerm,
  extraTags = [],
  categories = [],
  onClear,
  showClearAction = true,
  className = '',
}) => {
  const hasFilters = Boolean(selectedCategory || minPrice || maxPrice || searchTerm || extraTags.length);

  if (!hasFilters) return null;

  const selectedCategoryLabel = selectedCategory
    ? categories.find((category) => String(category.id ?? category.slug ?? category.name) === String(selectedCategory))?.name
    : null;

  const resolvedTags = extraTags
    .map((tag) => (typeof tag === 'string' ? { key: tag, label: tag } : { key: tag.key ?? tag.label, label: tag.label ?? String(tag.key ?? '') }))
    .filter((tag) => tag.label);

  return (
    <div className={`flex flex-wrap items-center gap-2 text-sm text-slate-600 ${className}`.trim()}>
      <span className="font-medium text-slate-500">Activos:</span>

      {searchTerm ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          “{searchTerm}”
        </span>
      ) : null}

      {selectedCategoryLabel ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {selectedCategoryLabel}
        </span>
      ) : null}

      {minPrice ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Min {minPrice} EUR
        </span>
      ) : null}

      {maxPrice ? (
        <span className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          Max {maxPrice} EUR
        </span>
      ) : null}

      {resolvedTags.map((tag) => (
        <span key={tag.key} className="inline-flex items-center rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-700">
          {tag.label}
        </span>
      ))}

      {showClearAction && typeof onClear === 'function' ? (
        <button
          type="button"
          onClick={onClear}
          className="text-xs font-medium text-slate-500 transition hover:text-slate-900"
        >
          Limpiar
        </button>
      ) : null}
    </div>
  );
};

export default ActiveFilters;
