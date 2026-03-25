import InputError from '@/Components/ui/InputError.jsx';
import Modal from '@/Components/ui/Modal.jsx';
import { useForm } from '@inertiajs/react';
import { useEffect, useMemo, useState } from 'react';
import { useI18n } from '@/i18n';
import { validateAddressForm } from '@/Pages/Profile/utils/validation.js';

const fieldClassName =
  'mt-2 w-full rounded-2xl border bg-white px-4 py-3 text-sm text-slate-900 shadow-sm transition placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-sky-500';

function AddressField({ id, label, error, children }) {
  return (
    <label htmlFor={id} className="block">
      <span className="text-sm font-medium text-slate-700">{label}</span>
      {children}
      <InputError message={error} className="mt-2" />
    </label>
  );
}

export default function AddressFormModal({ show, mode = 'create', address = null, onClose, onSubmit }) {
  const { t } = useI18n();
  const isEdit = mode === 'edit' && address;
  const form = useForm({
    street: '',
    city: '',
    province: '',
    zip_code: '',
    country: t('profile.address_form.default_country'),
    make_default: false,
  });
  const [touched, setTouched] = useState({});
  const [submitted, setSubmitted] = useState(false);
  const [globalError, setGlobalError] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!show) return;

    form.setData({
      street: address?.street || '',
      city: address?.city || '',
      province: address?.province || '',
      zip_code: address?.zip_code || '',
      country: address?.country || t('profile.address_form.default_country'),
      make_default: Boolean(address?.is_default),
    });
    form.clearErrors();
    setTouched({});
    setSubmitted(false);
    setGlobalError('');
    setSubmitting(false);
  }, [show, address, t]);

  const clientErrors = useMemo(() => validateAddressForm(form.data, t), [form.data, t]);
  const visibleErrors = useMemo(() => {
    const inlineErrors = Object.entries(clientErrors).reduce((acc, [key, value]) => {
      if (submitted || touched[key]) acc[key] = value;
      return acc;
    }, {});

    return { ...inlineErrors, ...form.errors };
  }, [clientErrors, form.errors, submitted, touched]);

  const handleChange = (field, value) => {
    form.setData(field, value);
    setGlobalError('');

    if (form.errors[field]) {
      form.clearErrors(field);
    }
  };

  const submit = async (event) => {
    event.preventDefault();
    setSubmitted(true);
    setGlobalError('');

    if (Object.keys(clientErrors).length > 0) {
      form.setError(clientErrors);
      return;
    }

    form.clearErrors();
    setSubmitting(true);

    try {
      await onSubmit(form.data);
      onClose();
    } catch (error) {
      if (error.type === 'validation') {
        form.setError(error.errors);
      } else {
        setGlobalError(error.message || t('profile.address_form.error_generic'));
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Modal show={show} onClose={onClose} maxWidth="2xl">
      <div className="p-6 sm:p-7">
        <div>
          <h3 className="text-xl font-semibold text-slate-950">
            {isEdit ? t('profile.address_form.edit_title') : t('profile.address_form.create_title')}
          </h3>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {isEdit ? t('profile.address_form.edit_description') : t('profile.address_form.create_description')}
          </p>
        </div>

        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          {globalError ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800">{globalError}</div>
          ) : null}

          <div className="grid gap-4 sm:grid-cols-2">
            <AddressField id="address-street" label={t('profile.address_field_street')} error={visibleErrors.street}>
              <input
                id="address-street"
                type="text"
                value={form.data.street}
                onChange={(event) => handleChange('street', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, street: true }))}
                className={`${fieldClassName} ${visibleErrors.street ? 'border-rose-300' : 'border-slate-200'}`}
                autoComplete="address-line1"
              />
            </AddressField>

            <AddressField id="address-city" label={t('profile.address_field_city')} error={visibleErrors.city}>
              <input
                id="address-city"
                type="text"
                value={form.data.city}
                onChange={(event) => handleChange('city', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, city: true }))}
                className={`${fieldClassName} ${visibleErrors.city ? 'border-rose-300' : 'border-slate-200'}`}
                autoComplete="address-level2"
              />
            </AddressField>

            <AddressField id="address-province" label={t('profile.address_field_province')} error={visibleErrors.province}>
              <input
                id="address-province"
                type="text"
                value={form.data.province}
                onChange={(event) => handleChange('province', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, province: true }))}
                className={`${fieldClassName} ${visibleErrors.province ? 'border-rose-300' : 'border-slate-200'}`}
                autoComplete="address-level1"
              />
            </AddressField>

            <AddressField id="address-zip" label={t('profile.address_field_zip_code')} error={visibleErrors.zip_code}>
              <input
                id="address-zip"
                type="text"
                value={form.data.zip_code}
                onChange={(event) => handleChange('zip_code', event.target.value)}
                onBlur={() => setTouched((current) => ({ ...current, zip_code: true }))}
                className={`${fieldClassName} ${visibleErrors.zip_code ? 'border-rose-300' : 'border-slate-200'}`}
                autoComplete="postal-code"
              />
            </AddressField>
          </div>

          <AddressField id="address-country" label={t('profile.address_field_country')} error={visibleErrors.country}>
            <input
              id="address-country"
              type="text"
              value={form.data.country}
              onChange={(event) => handleChange('country', event.target.value)}
              onBlur={() => setTouched((current) => ({ ...current, country: true }))}
              className={`${fieldClassName} ${visibleErrors.country ? 'border-rose-300' : 'border-slate-200'}`}
              autoComplete="country-name"
            />
          </AddressField>

          <label className="flex items-start gap-3 rounded-2xl border border-slate-200 bg-slate-50 px-4 py-3 text-sm text-slate-700">
            <input
              type="checkbox"
              checked={Boolean(form.data.make_default)}
              onChange={(event) => handleChange('make_default', event.target.checked)}
              className="mt-1 h-4 w-4 rounded border-slate-300 text-slate-900 focus:ring-sky-500"
            />
            <span>
              <span className="block font-medium text-slate-900">{t('profile.address_form.make_default_title')}</span>
              <span className="mt-1 block text-slate-500">{t('profile.address_form.make_default_body')}</span>
            </span>
          </label>

          <div className="flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
            <button
              type="button"
              onClick={onClose}
              className="inline-flex items-center justify-center rounded-2xl border border-slate-300 px-4 py-3 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
            >
              {t('profile.cancel')}
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center justify-center rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800 disabled:cursor-not-allowed disabled:opacity-70"
            >
              {submitting ? t('profile.address_form.saving') : (isEdit ? t('profile.address_form.save_edit') : t('profile.address_form.save_create'))}
            </button>
          </div>
        </form>
      </div>
    </Modal>
  );
}
