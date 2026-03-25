import { Check, MapPin, Pencil, Star, Trash2 } from 'lucide-react';
import { useI18n } from '@/i18n';

export default function AddressCard({
  address,
  onEdit,
  onDelete,
  onSetDefault,
  isBusy = false,
  isSettingDefault = false,
  selected = false,
  onSelect = null,
}) {
  const { t } = useI18n();

  return (
    <article className={`flex h-full flex-col rounded-[24px] border p-5 transition ${selected ? 'border-amber-300 bg-amber-50/80 ring-2 ring-amber-100' : 'border-slate-200 bg-slate-50 hover:border-amber-200 hover:bg-white'}`}>
      <div className="flex items-start justify-between gap-3">
        <div>
          <div className="flex items-center gap-2">
            <MapPin className="mt-0.5 h-4 w-4 text-slate-500" />
            <h3 className="text-base font-semibold text-slate-900">{address.street}</h3>
          </div>
          <p className="mt-2 text-sm leading-6 text-slate-600">
            {address.city}, {address.province}
            <br />
            {address.zip_code}, {address.country}
          </p>
        </div>

        {address.is_default ? (
          <span className="inline-flex items-center gap-1 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1 text-xs font-semibold text-emerald-700">
            <Check className="h-3.5 w-3.5" />
            {t('profile.address_book.default_badge')}
          </span>
        ) : null}
      </div>

      <div className="mt-5 flex flex-wrap gap-2">
        {onSelect ? (
          <button
            type="button"
            onClick={onSelect}
            disabled={isBusy}
            className={`inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium transition disabled:cursor-not-allowed disabled:opacity-60 ${selected ? 'border border-amber-200 bg-amber-600 text-white hover:bg-amber-700' : 'border border-amber-200 bg-amber-50 text-amber-800 hover:bg-amber-100'}`}
          >
            <Check className="h-4 w-4" />
            {selected ? t('profile.address_book.selected_for_checkout') : t('profile.address_book.select_for_checkout')}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onEdit}
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-xl border border-slate-300 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Pencil className="h-4 w-4" />
          {t('profile.address_book.edit')}
        </button>

        {!address.is_default ? (
          <button
            type="button"
            onClick={onSetDefault}
            disabled={isBusy}
            className="inline-flex items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-3 py-2 text-sm font-medium text-amber-800 transition hover:bg-amber-100 disabled:cursor-not-allowed disabled:opacity-60"
          >
            <Star className="h-4 w-4" />
            {isSettingDefault ? t('profile.address_book.updating') : t('profile.address_book.set_default')}
          </button>
        ) : null}

        <button
          type="button"
          onClick={onDelete}
          disabled={isBusy}
          className="inline-flex items-center gap-2 rounded-xl border border-rose-200 bg-rose-50 px-3 py-2 text-sm font-medium text-rose-700 transition hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-60"
        >
          <Trash2 className="h-4 w-4" />
          {t('profile.address_book.delete')}
        </button>
      </div>
    </article>
  );
}
