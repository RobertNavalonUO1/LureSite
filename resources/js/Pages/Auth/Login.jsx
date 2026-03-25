import React from 'react';
import { Head, Link, useForm, usePage } from '@inertiajs/react';
import Checkbox from '@/Components/ui/Checkbox.jsx';
import InputError from '@/Components/ui/InputError.jsx';
import InputLabel from '@/Components/ui/InputLabel.jsx';
import PrimaryButton from '@/Components/ui/PrimaryButton.jsx';
import TextInput from '@/Components/ui/TextInput.jsx';

import Header from '@/Components/navigation/Header.jsx';
import Footer from '@/Components/navigation/Footer.jsx';
import site from '@/config/site';
import { useI18n } from '@/i18n';

import { FcGoogle } from 'react-icons/fc';
import { FaFacebookF } from 'react-icons/fa';

export default function Login({ status, canResetPassword }) {
  const { t } = useI18n();
  const { data, setData, post, processing, errors, reset } = useForm({
    email: '',
    password: '',
    remember: false,
  });

  const { props } = usePage();
  const serverError = props?.flash?.error || props?.errors?.default;
  const serverSuccess = props?.flash?.success;

  const submit = (e) => {
    e.preventDefault();
    post(route('login'), {
      onFinish: () => reset('password'),
    });
  };

  const goSocial = (provider) => {
    window.location.href = route('auth.social.redirect', { provider });
  };

  return (
    <>
      <Head title={t('auth.login_title')} />

      <Header />

      <div className="storefront-shell px-4 py-12 sm:px-6">
        <div className="mx-auto mb-20 max-w-md rounded-[28px] border border-white/70 bg-white/92 p-8 shadow-[0_30px_80px_-48px_rgba(15,23,42,0.42)] backdrop-blur">
          <div className="mb-6 flex items-center gap-3 rounded-3xl bg-amber-50 px-4 py-3">
            <img src={site.brand.logoSrc} alt={site.brand.logoAlt} className="h-12 w-12 rounded-full border border-amber-100 bg-white object-cover p-1" />
            <div>
              <p className="text-[11px] font-semibold uppercase tracking-[0.28em] text-amber-700">{site.brand.name}</p>
              <p className="text-sm text-slate-600">{t('auth.login_brand_blurb')}</p>
            </div>
          </div>

          <h2 className="mb-6 text-center text-2xl font-bold text-slate-900">{t('auth.login_heading')}</h2>

          {serverSuccess && (
            <div className="mb-4 text-center text-sm font-medium text-green-600">
              {serverSuccess}
            </div>
          )}

          {serverError && (
            <div className="mb-4 rounded border border-red-400 bg-red-100 p-3 text-red-700">
              {serverError}
            </div>
          )}

          {status && (
            <div className="mb-4 text-center text-sm font-medium text-green-600">
              {status}
            </div>
          )}

          <form onSubmit={submit} className="space-y-4">
          <div>
            <InputLabel htmlFor="email" value={t('auth.email')} />
            <TextInput
              id="email"
              type="email"
              name="email"
              value={data.email}
              className="mt-1 block w-full"
              autoComplete="username"
              isFocused={true}
              onChange={(e) => setData('email', e.target.value)}
              required
            />
            <InputError message={errors.email} className="mt-2" />
          </div>

          <div>
            <InputLabel htmlFor="password" value={t('auth.password')} />
            <TextInput
              id="password"
              type="password"
              name="password"
              value={data.password}
              className="mt-1 block w-full"
              autoComplete="current-password"
              onChange={(e) => setData('password', e.target.value)}
              required
            />
            <InputError message={errors.password} className="mt-2" />
          </div>

          <div className="flex items-center justify-between">
            <label className="flex items-center text-sm">
              <Checkbox
                name="remember"
                checked={data.remember}
                onChange={(e) => setData('remember', e.target.checked)}
              />
              <span className="ml-2 text-gray-600">{t('auth.remember')}</span>
            </label>

            {canResetPassword && (
              <Link
                href={route('password.request')}
                className="text-sm text-indigo-600 hover:underline"
              >
                {t('auth.forgot_password')}
              </Link>
            )}
          </div>

          <PrimaryButton className="storefront-primary-button mt-4 w-full bg-amber-600 hover:bg-amber-700" disabled={processing}>
            {t('auth.login_submit')}
          </PrimaryButton>
        </form>

        <div className="flex items-center gap-4 my-6">
          <div className="flex-grow h-px bg-gray-300" />
          <span className="text-sm text-gray-500">{t('auth.or_continue_with')}</span>
          <div className="flex-grow h-px bg-gray-300" />
        </div>

        <div className="grid grid-cols-1 gap-3">
          <button
            type="button"
            onClick={() => goSocial('google')}
            className="flex items-center justify-center gap-3 bg-white border border-gray-300 hover:bg-gray-50 text-gray-800 font-semibold py-2 rounded-lg shadow-sm transition"
          >
            <FcGoogle size={20} />
            {t('auth.social_google')}
          </button>

          <button
            type="button"
            onClick={() => goSocial('facebook')}
            className="flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2 rounded-lg shadow transition"
          >
            <FaFacebookF size={18} />
            {t('auth.social_facebook')}
          </button>
        </div>

        <p className="text-center text-sm text-gray-600 mt-6">
          {t('auth.no_account')}{' '}
          <Link href={route('register')} className="text-indigo-600 hover:underline">
            {t('auth.sign_up')}
          </Link>
        </p>
        </div>
      </div>

      <Footer />
    </>
  );
}
