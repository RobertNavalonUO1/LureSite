import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import { ORDER_FILTER_META } from '@/Components/orders/orderUi.jsx';
import { useI18n } from '@/i18n';

const OrdersDashboardLayout = ({ title, subtitle, filters = [], activeFilter = 'all', heroStats = [], children }) => {
  const { t } = useI18n();
  const currentMeta = ORDER_FILTER_META[activeFilter] || ORDER_FILTER_META.all;
  const currentDescription = t(currentMeta.descriptionKey);

  return (
    <div className="min-h-screen bg-stone-100 text-slate-900">
      <Head title={title} />
      <Header />

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <section className="overflow-hidden rounded-[2rem] border border-slate-200 bg-[radial-gradient(circle_at_top_left,_rgba(15,23,42,0.05),_transparent_40%),linear-gradient(135deg,_#ffffff,_#f8fafc_45%,_#eef2ff)] shadow-[0_30px_70px_rgba(15,23,42,0.08)]">
          <div className="border-b border-slate-200/80 px-6 py-6 sm:px-8">
            <div className="flex flex-col gap-6 lg:flex-row lg:items-end lg:justify-between">
              <div className="max-w-2xl space-y-3">
                <div className="inline-flex rounded-full border border-slate-300 bg-white/80 px-3 py-1 text-xs font-semibold uppercase tracking-[0.24em] text-slate-500">
                  {t('orders.module.kicker')}
                </div>
                <div>
                  <h1 className="text-3xl font-semibold tracking-tight text-slate-900 sm:text-4xl">{title}</h1>
                  <p className="mt-2 text-sm leading-6 text-slate-600 sm:text-base">{subtitle || currentDescription}</p>
                </div>
              </div>

              {heroStats.length > 0 ? (
                <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">
                  {heroStats.map((stat) => (
                    <div key={stat.label} className="rounded-2xl border border-white/80 bg-white/80 p-4 shadow-sm backdrop-blur">
                      <div className="text-xs font-semibold uppercase tracking-[0.18em] text-slate-500">{stat.label}</div>
                      <div className="mt-2 text-2xl font-semibold text-slate-900">{stat.value}</div>
                      {stat.help ? <div className="mt-1 text-xs text-slate-500">{stat.help}</div> : null}
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>

          <div className="grid gap-6 px-4 py-5 lg:grid-cols-[10%_minmax(0,1fr)] lg:px-6 lg:py-6">
            <aside className="rounded-[1.75rem] border border-slate-200 bg-slate-950 px-2 py-3 text-white shadow-xl lg:min-h-[70vh]">
              <nav className="flex gap-2 overflow-x-auto lg:flex-col lg:overflow-visible">
                {filters.map((filter) => {
                  const meta = ORDER_FILTER_META[filter.key] || ORDER_FILTER_META.all;
                  const Icon = meta.icon;
                  const isActive = filter.key === activeFilter;

                  return (
                    <Link
                      key={filter.key}
                      href={filter.href}
                      title={t(meta.labelKey)}
                      className={`group inline-flex min-w-[64px] flex-1 items-center justify-center rounded-2xl border px-3 py-3 transition lg:flex-none lg:px-0 ${
                        isActive
                          ? 'border-white/20 bg-white text-slate-950 shadow-lg'
                          : 'border-transparent bg-white/5 text-white/70 hover:border-white/10 hover:bg-white/10 hover:text-white'
                      }`}
                    >
                      <div className="flex flex-col items-center gap-1.5">
                        <Icon className="h-5 w-5" />
                        <span className="hidden text-[10px] font-semibold uppercase tracking-[0.18em] lg:block">{filter.count}</span>
                        <span className="sr-only">{t(meta.labelKey)}</span>
                      </div>
                    </Link>
                  );
                })}
              </nav>
            </aside>

            <section className="space-y-5 rounded-[1.75rem] border border-slate-200 bg-white/90 p-4 shadow-[0_20px_50px_rgba(15,23,42,0.08)] backdrop-blur sm:p-6 lg:p-8">
              <div className="flex flex-wrap items-center gap-3 border-b border-slate-100 pb-4">
                {filters.map((filter) => {
                  const meta = ORDER_FILTER_META[filter.key] || ORDER_FILTER_META.all;
                  const isActive = filter.key === activeFilter;

                  return (
                    <Link
                      key={filter.key}
                      href={filter.href}
                      className={`inline-flex items-center gap-2 rounded-full px-3 py-2 text-sm font-medium transition ${
                        isActive
                          ? 'bg-slate-950 text-white shadow-lg'
                          : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                      }`}
                    >
                      <span>{t(meta.shortLabelKey)}</span>
                      {filter.count !== null && filter.count !== '' && filter.count !== undefined ? (
                        <span className={`rounded-full px-2 py-0.5 text-xs ${isActive ? 'bg-white/15 text-white' : 'bg-white text-slate-500'}`}>
                          {filter.count}
                        </span>
                      ) : null}
                    </Link>
                  );
                })}
              </div>

              {children}
            </section>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default OrdersDashboardLayout;