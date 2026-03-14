import Modal from '@/Components/ui/Modal.jsx';
import { useI18n } from '@/i18n';

export default function ConfirmActionModal({
  show,
  onClose,
  title,
  description,
  confirmLabel,
  cancelLabel,
  confirmTone = 'danger',
  onConfirm,
  processing = false,
  children,
}) {
  const { t } = useI18n();
  const resolvedConfirmLabel = confirmLabel || t('profile.delete_account');
  const resolvedCancelLabel = cancelLabel || t('profile.cancel');
  const confirmClassName = confirmTone === 'danger'
    ? 'bg-rose-600 text-white hover:bg-rose-700 focus:ring-rose-500'
    : 'bg-slate-900 text-white hover:bg-slate-700 focus:ring-slate-500';

  return (
    <Modal show={show} onClose={onClose} maxWidth="lg">
      <div className="p-6 sm:p-7">
        <div className="space-y-3">
          <h3 className="text-xl font-semibold text-slate-950">{title}</h3>
          {description ? <p className="text-sm leading-6 text-slate-600">{description}</p> : null}
        </div>

        {children ? <div className="mt-5">{children}</div> : null}

        <div className="mt-7 flex flex-col-reverse gap-3 sm:flex-row sm:justify-end">
          <button
            type="button"
            onClick={onClose}
            className="inline-flex items-center justify-center rounded-xl border border-slate-300 px-4 py-2.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50"
          >
            {resolvedCancelLabel}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={processing}
            className={`inline-flex items-center justify-center rounded-xl px-4 py-2.5 text-sm font-medium transition focus:outline-none focus:ring-2 focus:ring-offset-2 ${confirmClassName} ${processing ? 'cursor-not-allowed opacity-70' : ''}`}
          >
            {processing ? t('common.processing') : resolvedConfirmLabel}
          </button>
        </div>
      </div>
    </Modal>
  );
}
