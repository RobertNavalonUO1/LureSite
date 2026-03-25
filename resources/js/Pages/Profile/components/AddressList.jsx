import { Plus } from 'lucide-react';
import { useI18n } from '@/i18n';
import AddressCard from '@/Pages/Profile/components/AddressCard.jsx';

export default function AddressList({
  addresses,
  busyAddressId,
  busyAction,
  onCreate,
  onEdit,
  onDelete,
  onSetDefault,
}) {
  const { t } = useI18n();

  if (addresses.length === 0) {
    return (
      <div className="rounded-[24px] border border-dashed border-slate-300 bg-slate-50 p-8 text-center">
        <p className="text-base font-semibold text-slate-900">{t('profile.address_book.empty_title')}</p>
        <p className="mt-2 text-sm leading-6 text-slate-500">{t('profile.address_book.empty_body')}</p>
        <button
          type="button"
          onClick={onCreate}
          className="mt-5 inline-flex items-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          {t('profile.address_book.add_first')}
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium uppercase tracking-[0.22em] text-slate-500">{t('profile.address_book.list_kicker')}</p>
          <p className="mt-2 text-sm text-slate-600">{t('profile.address_book.list_body')}</p>
        </div>

        <button
          type="button"
          onClick={onCreate}
          className="inline-flex items-center justify-center gap-2 rounded-2xl bg-slate-950 px-4 py-3 text-sm font-semibold text-white transition hover:bg-slate-800"
        >
          <Plus className="h-4 w-4" />
          {t('profile.address_book.new_address')}
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2">
        {addresses.map((address) => {
          const isBusy = Number(busyAddressId) === Number(address.id);

          return (
            <AddressCard
              key={address.id}
              address={address}
              isBusy={isBusy}
              isSettingDefault={isBusy && busyAction === 'default'}
              onEdit={() => onEdit(address)}
              onDelete={() => onDelete(address)}
              onSetDefault={() => onSetDefault(address)}
            />
          );
        })}
      </div>
    </div>
  );
}
