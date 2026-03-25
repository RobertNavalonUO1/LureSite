import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import TopNavMenu from '@/Components/navigation/TopNavMenu.jsx';
import { useI18n } from '@/i18n';

export default function Terms() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Head title={t('static.terms.head_title')} />
      <Header />
      <TopNavMenu />
      <main className="mx-auto flex-grow max-w-3xl p-6">
        <h1 className="mb-6 text-center text-3xl font-bold text-indigo-700">{t('static.terms.title')}</h1>
        <div className="space-y-4 rounded-xl bg-white p-6 text-sm text-gray-700 shadow">
          <p>{t('static.terms.intro')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.terms.sections.use_site.title')}</h2>
          <p>{t('static.terms.sections.use_site.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.terms.sections.purchases.title')}</h2>
          <p>{t('static.terms.sections.purchases.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.terms.sections.shipping_returns.title')}</h2>
          <p>{t('static.terms.sections.shipping_returns.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.terms.sections.intellectual_property.title')}</h2>
          <p>{t('static.terms.sections.intellectual_property.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.terms.sections.modifications.title')}</h2>
          <p>{t('static.terms.sections.modifications.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.terms.sections.contact.title')}</h2>
          <p>
            {t('static.terms.sections.contact.body_prefix')}{' '}
            <Link href="/contact" className="text-indigo-600 underline">{t('static.terms.sections.contact.body_link')}</Link>
            {t('static.terms.sections.contact.body_suffix')}
          </p>
        </div>
      </main>
    </div>
  );
}
