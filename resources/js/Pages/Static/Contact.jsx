import React, { useEffect, useState } from 'react';
import Footer from '@/Components/navigation/Footer.jsx';
import { useForm, usePage, Head } from '@inertiajs/react';
import StorefrontLayout from '@/Layouts/StorefrontLayout.jsx';
import { useI18n } from '@/i18n';

const Contact = () => {
  const { flash } = usePage().props;
  const { t } = useI18n();
  const successMessage = flash?.success || flash?.message;
  const [showFlash, setShowFlash] = useState(Boolean(successMessage));

  const { data, setData, post, processing, errors, reset } = useForm({
    name: '',
    email: '',
    message: '',
  });

  useEffect(() => {
    if (successMessage) {
      setShowFlash(true);
      const timeout = setTimeout(() => setShowFlash(false), 4000);
      return () => clearTimeout(timeout);
    }
  }, [successMessage]);

  const handleSubmit = (event) => {
    event.preventDefault();
    post('/contact', {
      onSuccess: () => reset(),
    });
  };

  return (
    <div className="flex min-h-screen flex-col bg-slate-50 text-slate-800">
      <Head title={t('static.contact.head_title')} />
      <StorefrontLayout showTopNav />
      <main className="flex-grow px-4 py-8 sm:px-6 lg:px-8">
        <div className="mx-auto grid w-full max-w-6xl gap-8 lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]">
          <section className="overflow-hidden rounded-[32px] border border-slate-200/80 bg-gradient-to-br from-slate-950 via-slate-900 to-indigo-900 text-white shadow-[0_25px_70px_-35px_rgba(15,23,42,0.45)]">
            <div className="px-6 py-8 sm:px-8 sm:py-10">
              <p className="text-xs font-semibold uppercase tracking-[0.35em] text-indigo-200/90">{t('static.contact.support_kicker')}</p>
              <h1 className="mt-4 text-3xl font-bold tracking-tight sm:text-5xl">{t('static.contact.title')}</h1>
              <p className="mt-4 max-w-lg text-sm leading-relaxed text-slate-200 sm:text-base">{t('static.contact.support_body')}</p>

              <div className="mt-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-1">
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">{t('static.contact.response_label')}</p>
                  <p className="mt-2 text-lg font-semibold">{t('static.contact.response_title')}</p>
                  <p className="mt-2 text-sm text-white/75">{t('static.contact.response_body')}</p>
                </div>
                <div className="rounded-3xl border border-white/10 bg-white/10 p-5 backdrop-blur-sm">
                  <p className="text-xs font-semibold uppercase tracking-[0.3em] text-white/55">{t('static.contact.channel_label')}</p>
                  <p className="mt-2 text-lg font-semibold">{t('static.contact.channel_title')}</p>
                  <p className="mt-2 text-sm text-white/75">{t('static.contact.channel_body')}</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-[32px] border border-slate-200/80 bg-white/95 p-6 shadow-[0_20px_60px_-35px_rgba(15,23,42,0.35)] sm:p-8">
            <div className="flex flex-wrap items-start justify-between gap-4 border-b border-slate-200 pb-5">
              <div>
                <h2 className="text-2xl font-bold text-slate-900">{t('static.contact.form_title')}</h2>
                <p className="mt-2 text-sm text-slate-500">{t('static.contact.form_body')}</p>
              </div>
              {showFlash ? (
                <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-medium text-emerald-700 shadow-sm">
                  {successMessage}
                </div>
              ) : null}
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-5">
              <div className="grid gap-5 sm:grid-cols-2">
                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('static.contact.name_label')}</label>
                  <input
                    type="text"
                    value={data.name}
                    onChange={(event) => setData('name', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                  {errors.name && <p className="mt-2 text-sm text-red-600">{errors.name}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-slate-700">{t('static.contact.email_label')}</label>
                  <input
                    type="email"
                    value={data.email}
                    onChange={(event) => setData('email', event.target.value)}
                    className="mt-2 w-full rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                    required
                  />
                  {errors.email && <p className="mt-2 text-sm text-red-600">{errors.email}</p>}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">{t('static.contact.message_label')}</label>
                <textarea
                  value={data.message}
                  onChange={(event) => setData('message', event.target.value)}
                  rows="7"
                  className="mt-2 w-full rounded-[24px] border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-800 shadow-sm transition focus:border-indigo-300 focus:bg-white focus:outline-none focus:ring-2 focus:ring-indigo-200"
                  required
                />
                {errors.message && <p className="mt-2 text-sm text-red-600">{errors.message}</p>}
              </div>

              <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 pt-5">
                <p className="text-sm text-slate-500">{t('static.contact.footer_help')}</p>
                <button
                  type="submit"
                  disabled={processing}
                  className="inline-flex items-center justify-center rounded-full bg-indigo-600 px-6 py-3 text-sm font-semibold text-white shadow-lg transition hover:bg-indigo-500 disabled:cursor-not-allowed disabled:opacity-70"
                >
                  {processing ? t('static.contact.submit_loading') : t('static.contact.submit')}
                </button>
              </div>
            </form>
          </section>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Contact;
