import { CheckCircle2, CircleAlert, Info, X } from 'lucide-react';
import { useI18n } from '@/i18n';

const toneMap = {
  success: {
    icon: CheckCircle2,
    className: 'border-emerald-200 bg-emerald-50 text-emerald-900',
  },
  error: {
    icon: CircleAlert,
    className: 'border-rose-200 bg-rose-50 text-rose-900',
  },
  info: {
    icon: Info,
    className: 'border-sky-200 bg-sky-50 text-sky-900',
  },
};

export default function ProfileToastRegion({ toasts, onDismiss }) {
  const { t } = useI18n();

  return (
    <div className="pointer-events-none fixed right-4 top-4 z-[70] flex w-full max-w-sm flex-col gap-3" aria-live="polite" aria-atomic="true">
      {toasts.map((toast) => {
        const tone = toneMap[toast.type] || toneMap.info;
        const Icon = tone.icon;

        return (
          <div key={toast.id} className={`pointer-events-auto rounded-2xl border px-4 py-3 shadow-lg ${tone.className}`} role="status">
            <div className="flex items-start gap-3">
              <Icon className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
              <div className="min-w-0 flex-1">
                {toast.title ? <p className="text-sm font-semibold">{toast.title}</p> : null}
                {toast.message ? <p className="mt-1 text-sm leading-5 opacity-90">{toast.message}</p> : null}
              </div>
              <button
                type="button"
                onClick={() => onDismiss(toast.id)}
                className="rounded-full p-1 text-current/70 transition hover:bg-black/5 hover:text-current"
                aria-label={t('common.close_notification')}
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
