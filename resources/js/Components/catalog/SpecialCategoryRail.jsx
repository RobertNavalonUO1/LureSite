import React from 'react';
import { ChevronDown, Grid3X3, Layers3 } from 'lucide-react';

const THEMES = {
  amber: {
    shell: 'border-orange-200 bg-white/90 shadow-sm backdrop-blur',
    frame: 'border-orange-200/80 bg-gradient-to-r from-white via-orange-50/70 to-white',
    allIdle: 'bg-orange-50 text-orange-700 hover:bg-orange-100',
    allActive: 'bg-orange-500 text-white shadow',
    chipIdle: 'border-orange-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50 hover:text-orange-700',
    chipActive: 'border-orange-500 bg-orange-500 text-white shadow',
    action: 'border-orange-200 bg-white text-slate-600 hover:border-orange-300 hover:bg-orange-50',
    panel: 'border-orange-200',
    indicator: 'bg-orange-100 text-orange-700',
    muted: 'text-orange-700/75',
  },
  blue: {
    shell: 'border-blue-100 bg-white/90 shadow-sm backdrop-blur',
    frame: 'border-blue-100/80 bg-gradient-to-r from-white via-blue-50/70 to-white',
    allIdle: 'bg-blue-50 text-blue-600 hover:bg-blue-100',
    allActive: 'bg-blue-600 text-white shadow',
    chipIdle: 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50 hover:text-blue-700',
    chipActive: 'border-blue-600 bg-blue-600 text-white shadow',
    action: 'border-blue-100 bg-white text-slate-600 hover:border-blue-200 hover:bg-blue-50',
    panel: 'border-blue-100',
    indicator: 'bg-blue-100 text-blue-700',
    muted: 'text-blue-700/75',
  },
  indigo: {
    shell: 'border-indigo-100 bg-white/90 shadow-sm backdrop-blur',
    frame: 'border-indigo-100/80 bg-gradient-to-r from-white via-indigo-50/70 to-white',
    allIdle: 'bg-indigo-50 text-indigo-600 hover:bg-indigo-100',
    allActive: 'bg-indigo-600 text-white shadow',
    chipIdle: 'border-indigo-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50 hover:text-indigo-700',
    chipActive: 'border-indigo-600 bg-indigo-600 text-white shadow',
    action: 'border-indigo-100 bg-white text-slate-600 hover:border-indigo-200 hover:bg-indigo-50',
    panel: 'border-indigo-100',
    indicator: 'bg-indigo-100 text-indigo-700',
    muted: 'text-indigo-700/75',
  },
  lime: {
    shell: 'border-lime-200 bg-white/90 shadow-sm backdrop-blur',
    frame: 'border-lime-200/80 bg-gradient-to-r from-white via-lime-50/70 to-white',
    allIdle: 'bg-lime-50 text-lime-700 hover:bg-lime-100',
    allActive: 'bg-lime-600 text-white shadow',
    chipIdle: 'border-lime-200 bg-white text-slate-600 hover:border-lime-300 hover:bg-lime-50 hover:text-lime-700',
    chipActive: 'border-lime-600 bg-lime-600 text-white shadow',
    action: 'border-lime-200 bg-white text-slate-600 hover:border-lime-300 hover:bg-lime-50',
    panel: 'border-lime-200',
    indicator: 'bg-lime-100 text-lime-700',
    muted: 'text-lime-700/75',
  },
};

const DEFAULT_MAX_VISIBLE = 8;

const buildVisibleCategories = (categories, activeCategory) => {
  const normalized = categories.filter(Boolean);
  const initial = normalized.slice(0, DEFAULT_MAX_VISIBLE);

  if (!activeCategory || activeCategory === 'all' || initial.includes(activeCategory)) {
    return initial;
  }

  return [activeCategory, ...initial.filter((item) => item !== activeCategory)].slice(0, DEFAULT_MAX_VISIBLE);
};

export default function SpecialCategoryRail({
  categories = [],
  activeCategory = 'all',
  onCategoryChange,
  theme = 'blue',
  allLabel = 'Todas las categorías',
  eyebrowLabel = 'Explorar',
  toggleLabel = 'Ver categorías',
  badgeLabel = 'Colecciones',
  helperText = 'Vista rápida con la categoría activa siempre visible y acceso al listado completo cuando haga falta.',
  panelTitle = 'Explorar categorías',
  panelDescription = 'Accede a todo el catálogo sin saturar la navegación principal.',
  countLabel = 'disponibles',
  controls = null,
  className = '',
  style,
}) {
  const palette = THEMES[theme] || THEMES.blue;
  const [isExpanded, setIsExpanded] = React.useState(false);

  const visibleCategories = React.useMemo(
    () => buildVisibleCategories(categories, activeCategory),
    [activeCategory, categories]
  );
  const hiddenCategories = React.useMemo(
    () => categories.filter((category) => !visibleCategories.includes(category)),
    [categories, visibleCategories]
  );

  const selectedLabel = activeCategory === 'all' ? allLabel : activeCategory;

  React.useEffect(() => {
    setIsExpanded(false);
  }, [activeCategory]);

  const handleCategorySelect = (value) => {
    onCategoryChange?.(value);
    setIsExpanded(false);
  };

  return (
    <div className={`sticky z-30 border-b ${palette.shell} ${className}`.trim()} style={style}>
      <div className="mx-auto w-full max-w-[1500px] px-3 py-3 sm:px-4 lg:px-5">
        <div className={`rounded-[28px] border px-4 py-4 shadow-sm ${palette.frame}`}>
          <div className="flex flex-col gap-4 lg:gap-5">
            <div className="flex items-start justify-between gap-3 lg:hidden">
              <div className="min-w-0">
                <p className={`text-[11px] font-semibold uppercase tracking-[0.22em] ${palette.muted}`}>{eyebrowLabel}</p>
                <button
                  type="button"
                  onClick={() => handleCategorySelect('all')}
                  className={`mt-2 max-w-[72vw] truncate rounded-full px-4 py-2 text-sm font-semibold transition ${
                    activeCategory === 'all' ? palette.allActive : palette.allIdle
                  }`}
                >
                  {selectedLabel}
                </button>
              </div>

              <button
                type="button"
                onClick={() => setIsExpanded((value) => !value)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-full border px-4 py-2 text-sm font-semibold transition ${palette.action}`}
                aria-expanded={isExpanded}
                aria-haspopup="dialog"
              >
                <Grid3X3 className="h-4 w-4" aria-hidden="true" />
                <span>{toggleLabel}</span>
                <ChevronDown className={`h-4 w-4 transition ${isExpanded ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </div>

            <div className="hidden lg:grid lg:grid-cols-[minmax(0,1fr)_auto] lg:items-start lg:gap-6">
              <div className="min-w-0">
                <div className="mb-3 flex items-center gap-3">
                  <span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold ${palette.indicator}`}>
                    <Layers3 className="h-3.5 w-3.5" aria-hidden="true" />
                    {badgeLabel}
                  </span>
                  <p className="truncate text-sm text-slate-500">
                    {helperText}
                  </p>
                </div>

                <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin scrollbar-track-transparent scrollbar-thumb-slate-200">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('all')}
                    className={`shrink-0 rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === 'all' ? palette.allActive : palette.allIdle
                    }`}
                  >
                    {allLabel}
                  </button>

                  {visibleCategories.map((category) => (
                    <button
                      key={category}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        activeCategory === category ? palette.chipActive : palette.chipIdle
                      }`}
                      title={category}
                    >
                      {category}
                    </button>
                  ))}

                  {hiddenCategories.length > 0 ? (
                    <button
                      type="button"
                      onClick={() => setIsExpanded((value) => !value)}
                      className={`shrink-0 rounded-full border px-4 py-2 text-sm font-semibold transition ${palette.action}`}
                      aria-expanded={isExpanded}
                      aria-haspopup="dialog"
                    >
                      + {hiddenCategories.length} más
                    </button>
                  ) : null}
                </div>
              </div>

              {controls ? <div className="flex items-center gap-3">{controls}</div> : <div />}
            </div>

            <div className="grid gap-3 lg:hidden">
              {controls ? <div className="flex flex-col gap-3">{controls}</div> : null}
            </div>

            {isExpanded ? (
              <div className={`rounded-3xl border bg-white p-3 shadow-lg ${palette.panel}`}>
                <div className="mb-3 flex items-center justify-between gap-3 px-1">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">{panelTitle}</p>
                    <p className="text-xs text-slate-500">{panelDescription}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-semibold ${palette.indicator}`}>
                    {categories.length} {countLabel}
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <button
                    type="button"
                    onClick={() => handleCategorySelect('all')}
                    className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
                      activeCategory === 'all' ? palette.allActive : palette.allIdle
                    }`}
                  >
                    {allLabel}
                  </button>
                  {categories.map((category) => (
                    <button
                      key={`panel-${category}`}
                      type="button"
                      onClick={() => handleCategorySelect(category)}
                      className={`rounded-full border px-4 py-2 text-sm font-semibold transition ${
                        activeCategory === category ? palette.chipActive : palette.chipIdle
                      }`}
                    >
                      {category}
                    </button>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        </div>
      </div>
    </div>
  );
}
