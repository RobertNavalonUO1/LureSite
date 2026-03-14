import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import TopNavMenu from '@/Components/navigation/TopNavMenu.jsx';
import { useI18n } from '@/i18n';

export default function Privacy() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Head title={t('static.privacy.head_title')} />
      <Header />
      <TopNavMenu />
      <main className="mx-auto flex-grow max-w-3xl p-6">
        <h1 className="mb-6 text-center text-3xl font-bold text-indigo-700">{t('static.privacy.title')}</h1>
        <div className="space-y-4 rounded-xl bg-white p-6 text-sm text-gray-700 shadow">
          <p>{t('static.privacy.intro')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.privacy.sections.collected.title')}</h2>
          <p>{t('static.privacy.sections.collected.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.privacy.sections.usage.title')}</h2>
          <p>{t('static.privacy.sections.usage.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.privacy.sections.protection.title')}</h2>
          <p>{t('static.privacy.sections.protection.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.privacy.sections.sharing.title')}</h2>
          <p>{t('static.privacy.sections.sharing.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.privacy.sections.cookies.title')}</h2>
          <p>{t('static.privacy.sections.cookies.body')}</p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.privacy.sections.rights.title')}</h2>
          <p>
            {t('static.privacy.sections.rights.body_prefix')}{' '}
            <Link href="/contact" className="text-indigo-600 underline">{t('static.privacy.sections.rights.body_link')}</Link>
            {t('static.privacy.sections.rights.body_suffix')}
          </p>
          <h2 className="mt-4 font-semibold text-indigo-600">{t('static.privacy.sections.changes.title')}</h2>
          <p>{t('static.privacy.sections.changes.body')}</p>
        </div>
      </main>
    </div>
  );
}
