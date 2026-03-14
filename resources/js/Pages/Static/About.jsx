import React from 'react';
import { Head } from '@inertiajs/react';
import Footer from '@/Components/navigation/Footer.jsx';
import StorefrontLayout from '@/Layouts/StorefrontLayout.jsx';
import { useI18n } from '@/i18n';

const About = () => {
  const { t } = useI18n();

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Head title={t('static.about.head_title')} />

      <StorefrontLayout showTopNav />

      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto w-full max-w-4xl overflow-hidden rounded-[32px] border border-slate-200/80 bg-white/95 shadow-[0_25px_70px_-35px_rgba(15,23,42,0.35)]">
          <div className="border-b border-slate-200 bg-gradient-to-r from-slate-950 via-slate-900 to-indigo-900 px-6 py-10 text-white sm:px-10">
            <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200/90">Limoneo</p>
            <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{t('static.about.title')}</h1>
            <p className="mt-4 max-w-2xl text-sm leading-relaxed text-slate-200 sm:text-base">
              {t('static.about.intro_1')} {t('static.about.intro_2')}
            </p>
          </div>

          <div className="space-y-8 px-6 py-8 sm:px-10 sm:py-10">
            <section className="grid gap-6 lg:grid-cols-[minmax(0,1.3fr)_minmax(0,0.9fr)] lg:items-start">
              <div className="rounded-[28px] border border-slate-200 bg-slate-50 p-6 text-left shadow-sm">
                <h2 className="text-2xl font-bold text-slate-900">{t('static.about.why_title')}</h2>
                <ul className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600 sm:text-base">
                  <li><span className="font-semibold text-slate-900">{t('static.about.why.items.clear_nav.label')}</span> {t('static.about.why.items.clear_nav.body')}</li>
                  <li><span className="font-semibold text-slate-900">{t('static.about.why.items.simple_checkout.label')}</span> {t('static.about.why.items.simple_checkout.body')}</li>
                  <li><span className="font-semibold text-slate-900">{t('static.about.why.items.security_privacy.label')}</span> {t('static.about.why.items.security_privacy.body')}</li>
                  <li><span className="font-semibold text-slate-900">{t('static.about.why.items.fast_support.label')}</span> {t('static.about.why.items.fast_support.body')}</li>
                  <li><span className="font-semibold text-slate-900">{t('static.about.why.items.deals_news.label')}</span> {t('static.about.why.items.deals_news.body')}</li>
                </ul>
              </div>

              <section className="rounded-[28px] border border-indigo-100 bg-gradient-to-br from-indigo-50 via-white to-slate-50 p-6 shadow-sm">
                <p className="text-xs font-semibold uppercase tracking-[0.3em] text-indigo-500">{t('static.about.experience_kicker')}</p>
                <h3 className="mt-3 text-xl font-bold text-slate-900">{t('static.about.ux_note.title')}</h3>
                <p className="mt-3 text-sm leading-relaxed text-slate-600">
                  {t('static.about.ux_note.body_1')} {t('static.about.ux_note.body_2')}
                </p>
                <div className="mt-6 rounded-2xl border border-slate-200 bg-white px-4 py-4 text-left shadow-sm">
                  <p className="text-sm font-semibold text-slate-900">{t('static.about.thanks')}</p>
                  <p className="mt-2 text-sm text-slate-500">{t('static.about.final_note')}</p>
                </div>
              </section>
            </section>

            <div className="rounded-[28px] border border-slate-200 bg-slate-50 px-5 py-4 text-sm text-slate-500 shadow-sm sm:px-6">
              {t('static.about.thanks')}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default About;
