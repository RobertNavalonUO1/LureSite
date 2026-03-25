import InputError from '@/Components/ui/InputError.jsx';
import { Link, useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { validateProfileForm } from '@/Pages/Profile/utils/validation.js';

const fieldBaseClassName =
  'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500';

function ProfileField({ id, label, error, children, hint }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      {hint ? <p className="mt-2 text-xs text-slate-500">{hint}</p> : null}
      <InputError message={error} className="mt-2" />
    </label>
  );
}

export default function ProfileForm({ user, addresses, paymentMethods, onSuccess }) {
  const { t } = useI18n();
  const form = useForm({
    name: user.name || '',
    lastname: user.lastname || '',
    email: user.email || '',
    phone: user.phone || '',
    avatar: user.avatar || '',
    default_address_id: user.default_address_id || '',
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    form.setData({
      name: user.name || '',
      lastname: user.lastname || '',
      email: user.email || '',
      phone: user.phone || '',
      avatar: user.avatar || '',
      default_address_id: user.default_address_id || '',
    });
  }, [user]);

  const clientErrors = useMemo(() => validateProfileForm(form.data, t), [form.data, t]);
  const visibleErrors = useMemo(() => {
    const inlineErrors = Object.entries(clientErrors).reduce((acc, [key, value]) => {
      if (submitted || touched[key]) acc[key] = value;
      return acc;
    }, {});

    return { ...inlineErrors, ...form.errors };
  }, [clientErrors, form.errors, submitted, touched]);

  const handleBlur = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const handleChange = (field, value) => {
    form.setData(field, value);

    if (form.errors[field]) {
      form.clearErrors(field);
    }
  };

  const handleSubmit = (event) => {
    event.preventDefault();
    setSubmitted(true);

    if (Object.keys(clientErrors).length > 0) {
      form.setError(clientErrors);
      return;
    }

    form.clearErrors();
    form.patch(route('profile.update'), {
      preserveScroll: true,
      onSuccess: () => {
        onSuccess?.(t('profile.profile_updated'));
      },
    });
  };

  const hasVisibleErrors = Object.keys(visibleErrors).length > 0;

  return (
    <form onSubmit={handleSubmit} className="space-y-6" noValidate>
      {hasVisibleErrors ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">
          {t('profile.form.validation_summary')}
        </div>
      ) : null}

      <div className="grid gap-5 md:grid-cols-2">
        <ProfileField id="profile-name" label={t('profile.field_name')} error={visibleErrors.name}>
          <input
            id="profile-name"
            type="text"
            value={form.data.name}
            onChange={(event) => handleChange('name', event.target.value)}
            onBlur={() => handleBlur('name')}
            className={`${fieldBaseClassName} ${visibleErrors.name ? 'border-rose-300' : 'border-slate-200'}`}
            autoComplete="given-name"
          />
        </ProfileField>

        <ProfileField id="profile-lastname" label={t('profile.field_lastname')} error={visibleErrors.lastname}>
          <input
            id="profile-lastname"
            type="text"
            value={form.data.lastname}
            onChange={(event) => handleChange('lastname', event.target.value)}
            onBlur={() => handleBlur('lastname')}
            className={`${fieldBaseClassName} ${visibleErrors.lastname ? 'border-rose-300' : 'border-slate-200'}`}
            autoComplete="family-name"
          />
        </ProfileField>

        <ProfileField id="profile-email" label={t('profile.field_email')} error={visibleErrors.email}>
          <input
            id="profile-email"
            type="email"
            value={form.data.email}
            onChange={(event) => handleChange('email', event.target.value)}
            onBlur={() => handleBlur('email')}
            className={`${fieldBaseClassName} ${visibleErrors.email ? 'border-rose-300' : 'border-slate-200'}`}
            autoComplete="email"
          />
        </ProfileField>

        <ProfileField
          id="profile-phone"
          label={t('profile.phone')}
          error={visibleErrors.phone}
          hint={t('profile.form.phone_hint')}
        >
          <input
            id="profile-phone"
            type="tel"
            value={form.data.phone}
            onChange={(event) => handleChange('phone', event.target.value)}
            onBlur={() => handleBlur('phone')}
            className={`${fieldBaseClassName} ${visibleErrors.phone ? 'border-rose-300' : 'border-slate-200'}`}
            autoComplete="tel"
          />
        </ProfileField>

        <ProfileField
          id="profile-default-address"
          label={t('profile.form.default_address_label')}
          error={visibleErrors.default_address_id}
          hint={t('profile.form.default_address_hint')}
        >
          <select
            id="profile-default-address"
            value={form.data.default_address_id}
            onChange={(event) => handleChange('default_address_id', event.target.value)}
            onBlur={() => handleBlur('default_address_id')}
            className={`${fieldBaseClassName} ${visibleErrors.default_address_id ? 'border-rose-300' : 'border-slate-200'}`}
            disabled={addresses.length === 0}
          >
            <option value="">{t('profile.form.select_address')}</option>
            {addresses.map((address) => (
              <option key={address.id} value={address.id}>
                {address.street}, {address.city}
              </option>
            ))}
          </select>
        </ProfileField>

        <div className="rounded-3xl border border-slate-200 bg-slate-50 p-5">
          <p className="text-sm font-medium text-slate-700">{t('profile.form.payment_methods_title')}</p>
          <p className="mt-1 text-xs uppercase tracking-[0.18em] text-slate-500">
            {t('profile.form.available_methods_label')}
          </p>
          <div className="mt-3 flex flex-wrap gap-2">
            {paymentMethods.available.map((method) => (
              <span
                key={method}
                className="rounded-full border border-slate-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.2em] text-slate-600"
              >
                {method === 'stripe' ? t('profile.payment_method_stripe') : t('profile.payment_method_paypal')}
              </span>
            ))}
          </div>
          <p className="mt-3 text-sm leading-6 text-slate-500">{t('profile.form.payment_methods_body')}</p>
        </div>
      </div>

      {user.email_verified_at === null ? (
        <div className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          {t('profile.form.email_unverified_notice')}
          <Link href={route('verification.send')} method="post" as="button" className="ml-2 font-semibold underline underline-offset-4">
            {t('profile.resend_verification')}
          </Link>
        </div>
      ) : null}

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <p className="text-sm text-slate-500">{t('profile.form.save_notice')}</p>
        <button
          type="submit"
          disabled={form.processing}
          className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-5 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 focus:outline-none focus:ring-2 focus:ring-slate-500 focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-70"
        >
          {form.processing ? t('profile.form.saving') : t('profile.save_changes')}
        </button>
      </div>
    </form>
  );
}
