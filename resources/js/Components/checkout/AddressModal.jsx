import React, { useEffect, useMemo, useState } from 'react';

const validateAddress = (values) => {
  const errs = {};
  if (!values.street?.trim()) errs.street = 'La calle es requerida';
  if (!values.city?.trim()) errs.city = 'La ciudad es requerida';
  if (!values.province?.trim()) errs.province = 'La provincia es requerida';
  if (!values.country?.trim()) errs.country = 'El país es requerido';
  if (!values.zip_code?.trim()) errs.zip_code = 'El código postal es requerido';
  else if (!/^\w[\w\-\s]{2,10}$/.test(values.zip_code.trim())) errs.zip_code = 'Código postal inválido';
  return errs;
};

const emptyForm = {
  street: '',
  city: '',
  province: '',
  zip_code: '',
  country: '',
  make_default: true,
};

const Field = ({ name, label, value, onChange, error, type = 'text', placeholder, autoComplete }) => (
  <div>
    <label htmlFor={name} className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
    <input
      id={name}
      type={type}
      name={name}
      placeholder={placeholder || label}
      value={value}
      onChange={onChange}
      className={`w-full px-3 py-2 rounded-lg border focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 transition ${error ? 'border-red-400' : 'border-gray-300'}`}
      aria-invalid={Boolean(error)}
      aria-describedby={error ? `${name}-error` : undefined}
      autoComplete={autoComplete}
    />
    {error && (
      <p id={`${name}-error`} className="mt-1 text-red-500 text-xs">{error}</p>
    )}
  </div>
);

export default function AddressModal({ closeModal, onAddressSaved, mode = 'create', initialValues = null }) {
  const isEdit = mode === 'edit' && initialValues;
  const initialState = isEdit
    ? { ...emptyForm, ...initialValues, make_default: Boolean(initialValues?.make_default) }
    : emptyForm;

  const [form, setForm] = useState(initialState);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (isEdit) {
      setForm({ ...emptyForm, ...initialValues, make_default: Boolean(initialValues?.make_default) });
    } else {
      setForm(emptyForm);
    }
  }, [isEdit, initialValues]);

  const hasErrors = useMemo(() => Object.keys(errors).length > 0, [errors]);

  const handleChange = (e) => {
    const { name, type, checked, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const clientErrors = validateAddress(form);
    setErrors(clientErrors);
    if (Object.keys(clientErrors).length > 0) return;

    setSubmitting(true);
    const url = isEdit ? `/addresses/${initialValues.id}` : '/addresses';
    const method = isEdit ? 'PATCH' : 'POST';

    fetch(url, {
      method,
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
        'X-Requested-With': 'XMLHttpRequest',
        'X-CSRF-TOKEN': document.querySelector('meta[name="csrf-token"]')?.getAttribute('content') ?? '',
      },
      credentials: 'same-origin',
      body: JSON.stringify(form),
    })
      .then(async (response) => {
        const payload = await response.json().catch(() => ({}));

        if (!response.ok) {
          setErrors(payload.errors || {});
          throw new Error(payload.message || 'No se pudo guardar la dirección.');
        }

        onAddressSaved?.(payload);
        closeModal();
      })
      .catch(() => {})
      .finally(() => setSubmitting(false));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="relative bg-white dark:bg-gray-900 w-full max-w-lg rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-800">
        <div className="px-6 pt-6 pb-2">
          <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 tracking-tight">
            {isEdit ? 'Editar dirección' : 'Agregar nueva dirección'}
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">Completa los campos para gestionar tu dirección de envío.</p>
        </div>
        <form onSubmit={handleSubmit} className="px-6 pb-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <Field name="street" label="Calle" value={form.street} onChange={handleChange} error={errors.street} placeholder="Calle" autoComplete="address-line1" />
            <Field name="city" label="Ciudad" value={form.city} onChange={handleChange} error={errors.city} placeholder="Ciudad" autoComplete="address-level2" />
            <Field name="province" label="Provincia" value={form.province} onChange={handleChange} error={errors.province} placeholder="Provincia" autoComplete="address-level1" />
            <Field name="zip_code" label="Código postal" value={form.zip_code} onChange={handleChange} error={errors.zip_code} placeholder="Código postal" autoComplete="postal-code" />
            <Field name="country" label="País" value={form.country} onChange={handleChange} error={errors.country} placeholder="País" autoComplete="country-name" />
          </div>

          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300 select-none">
            <input
              type="checkbox"
              name="make_default"
              checked={Boolean(form.make_default)}
              onChange={handleChange}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-500"
            />
            <span>Marcar como dirección predeterminada</span>
          </label>

          <div className="flex justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={closeModal}
              className="px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={submitting}
              className={`px-4 py-2 rounded-lg text-white shadow ${submitting ? 'bg-indigo-300 cursor-not-allowed' : 'bg-indigo-600 hover:bg-indigo-700'}`}
              aria-disabled={submitting}
            >
              {submitting ? 'Guardando…' : (isEdit ? 'Guardar cambios' : 'Guardar')}
            </button>
          </div>

          {hasErrors && (
            <p className="text-xs text-gray-500 dark:text-gray-400">Revisa los campos marcados en rojo.</p>
          )}
        </form>
      </div>
    </div>
  );
}
