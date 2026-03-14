import React from 'react';
import { Head, Link } from '@inertiajs/react';
import Header from '@/Components/navigation/Header.jsx';
import TopNavMenu from '@/Components/navigation/TopNavMenu.jsx';
import { useI18n } from '@/i18n';

const FAQ_KEYS = [
  'create_account',
  'payment_methods',
  'order_tracking',
  'returns',
  'support_contact',
];

export default function Faq() {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Head title={t('static.faq.head_title')} />
      <Header />
      <TopNavMenu />
      <main className="mx-auto flex-grow max-w-3xl p-6">
        <h1 className="mb-6 text-center text-3xl font-bold text-indigo-700">{t('static.faq.title')}</h1>
        <div className="space-y-6">
          {FAQ_KEYS.map((key) => (
            <div key={key} className="rounded-xl bg-white p-5 shadow">
              <h2 className="mb-2 text-lg font-semibold text-indigo-600">{t(`static.faq.items.${key}.question`)}</h2>
              <p className="text-gray-700">{t(`static.faq.items.${key}.answer`)}</p>
            </div>
          ))}
        </div>
        <div className="mt-10 text-center text-sm text-gray-500">
          {t('static.faq.no_answer_prefix')}{' '}
          <Link href="/contact" className="text-indigo-600 underline">
            {t('static.faq.no_answer_link')}
          </Link>
          {t('static.faq.no_answer_suffix')}
        </div>
      </main>
    </div>
  );
}
