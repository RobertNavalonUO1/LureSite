import InputError from '@/Components/ui/InputError.jsx';
import TextInput from '@/Components/ui/TextInput.jsx';
import { useForm } from '@inertiajs/react';
import { useEffect, useRef, useState } from 'react';
import { useI18n } from '@/i18n';
import ConfirmActionModal from '@/Pages/Profile/components/ConfirmActionModal.jsx';

export default function DeleteAccountSection({ onSuccess }) {
  const { t } = useI18n();
  const passwordInput = useRef(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const form = useForm({
    password: '',
  });

  useEffect(() => {
    if (showConfirm && passwordInput.current) {
      passwordInput.current.focus();
    }
  }, [showConfirm]);

  const closeModal = () => {
    setShowConfirm(false);
    form.clearErrors();
    form.reset();
  };

  const handleDelete = () => {
    form.delete(route('profile.destroy'), {
      preserveScroll: true,
      onSuccess: () => {
        onSuccess?.(t('profile.delete_panel.delete_success'));
        closeModal();
      },
      onError: () => {
        passwordInput.current?.focus();
      },
      onFinish: () => {
        form.reset('password');
      },
    });
  };

  return (
    <div className="space-y-4">
      <div className="rounded-[28px] border border-rose-200 bg-[linear-gradient(135deg,_rgba(254,226,226,0.9),_rgba(255,255,255,0.95))] p-6">
        <p className="text-sm font-semibold uppercase tracking-[0.22em] text-rose-600">{t('profile.delete_panel.sensitive_kicker')}</p>
        <h3 className="mt-3 text-xl font-semibold text-slate-950">{t('profile.delete_title')}</h3>
        <p className="mt-2 max-w-2xl text-sm leading-6 text-slate-600">
          {t('profile.delete_panel.body')}
        </p>
        <button
          type="button"
          onClick={() => setShowConfirm(true)}
          className="mt-5 inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white transition hover:bg-rose-700"
        >
          {t('profile.delete_account')}
        </button>
      </div>

      <ConfirmActionModal
        show={showConfirm}
        onClose={closeModal}
        title={t('profile.delete_confirm_title')}
        description={t('profile.delete_confirm_desc')}
        confirmLabel={t('profile.delete_panel.confirm_button')}
        confirmTone="danger"
        onConfirm={handleDelete}
        processing={form.processing}
      >
        <div>
          <TextInput
            id="delete-account-password"
            ref={passwordInput}
            type="password"
            value={form.data.password}
            onChange={(event) => form.setData('password', event.target.value)}
            className="mt-1 block w-full"
            placeholder={t('profile.delete_panel.password_placeholder')}
            autoComplete="current-password"
          />
          <InputError message={form.errors.password} className="mt-2" />
        </div>
      </ConfirmActionModal>
    </div>
  );
}
